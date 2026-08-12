// AfriBayit — Stripe Payment Provider Adapter
// Supports international card payments (Visa, Mastercard)
// API Docs: https://docs.stripe.com/api

import Stripe from 'stripe';
import type {
  InitPaymentRequest,
  InitPaymentResponse,
  VerifyPaymentResponse,
  RefundResponse,
  WebhookEvent,
  PayoutRequest,
  PayoutResponse,
  PaymentStatus,
} from '../types';
import { CARD_METHODS } from '../types';
import { PaymentProviderBase } from './base-provider';

/** Map Stripe PaymentIntent status to our PaymentStatus */
function mapStripeStatus(status: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    requires_payment_method: 'pending',
    requires_confirmation: 'pending',
    requires_action: 'pending',
    processing: 'processing',
    requires_capture: 'processing',
    canceled: 'cancelled',
    succeeded: 'completed',
    partially_funded: 'processing',
  };
  return map[status] || 'pending';
}

/** Map Stripe Charge status for refunds */
function mapStripeRefundStatus(status: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    pending: 'processing',
    succeeded: 'refunded',
    failed: 'failed',
    canceled: 'cancelled',
  };
  return map[status] || 'processing';
}

export class StripeProvider extends PaymentProviderBase {
  name = 'stripe' as const;
  private client: Stripe;
  private webhookSecret: string;

  constructor() {
    super();
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    this.client = new Stripe(secretKey, {
      typescript: true,
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
  }

  supportsMethod(method: string, _countryCode: string): boolean {
    // Stripe supports card payments globally
    return CARD_METHODS.includes(method as typeof CARD_METHODS[number])
      || method === 'bank_transfer';
  }

  async initiatePayment(request: InitPaymentRequest): Promise<InitPaymentResponse> {
    const { amount, currency, reference, metadata, customerEmail, description } = request;

    // Stripe expects amounts in smallest currency unit (cents)
    // XOF and EUR are already in cents (no decimal), multiply by 100 for EUR
    const unitMultiplier = currency.toUpperCase() === 'EUR' ? 100 : 1;
    const stripeAmount = Math.round(amount * unitMultiplier);

    const paymentIntent = await this.client.paymentIntents.create({
      amount: stripeAmount,
      currency: currency.toLowerCase(),
      metadata: {
        reference,
        ...metadata,
      },
      receipt_email: customerEmail,
      description: description || `AfriBayit - Transaction ${reference}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      paymentId: paymentIntent.id,
      providerRef: paymentIntent.id,
      redirectUrl: undefined, // Stripe uses client_secret for frontend confirmation
      status: mapStripeStatus(paymentIntent.status),
    };
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    const paymentIntent = await this.client.paymentIntents.retrieve(reference);

    return {
      status: mapStripeStatus(paymentIntent.status),
      providerRef: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: (paymentIntent.currency || 'eur').toUpperCase(),
      metadata: paymentIntent.metadata as Record<string, unknown>,
    };
  }

  async processRefund(reference: string, amount?: number): Promise<RefundResponse> {
    // Find the charge associated with this PaymentIntent
    const paymentIntent = await this.client.paymentIntents.retrieve(reference, {
      expand: ['latest_charge'],
    });

    const charge = paymentIntent.latest_charge as Stripe.Charge | null;
    if (!charge) {
      throw new Error('No charge found for this payment intent');
    }

    const refundParams: Stripe.RefundCreateParams = {
      charge: charge.id,
    };

    if (amount) {
      const currency = (paymentIntent.currency || 'eur').toUpperCase();
      const unitMultiplier = currency === 'EUR' ? 100 : 1;
      refundParams.amount = Math.round(amount * unitMultiplier);
    }

    const refund = await this.client.refunds.create(refundParams);

    return {
      success: refund.status === 'succeeded' || refund.status === 'pending',
      refundRef: refund.id,
      amount: refund.amount,
      status: mapStripeRefundStatus(refund.status || 'pending'),
    };
  }

  async handleWebhook(payload: unknown, headers: Record<string, string>): Promise<WebhookEvent> {
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const sig = headers['stripe-signature'] || '';

    if (!sig) {
      throw new Error('Missing Stripe webhook signature');
    }

    // Verify webhook signature
    const event = this.client.webhooks.constructEvent(
      body,
      sig,
      this.webhookSecret
    );

    // Extract payment data from the event
    let reference = '';
    let paymentStatus: PaymentStatus = 'pending';
    let amount = 0;
    let eventMetadata: Record<string, unknown> | undefined;

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        reference = pi.id;
        paymentStatus = 'completed';
        amount = pi.amount;
        eventMetadata = pi.metadata as Record<string, unknown>;
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        reference = pi.id;
        paymentStatus = 'failed';
        amount = pi.amount;
        eventMetadata = pi.metadata as Record<string, unknown>;
        break;
      }
      case 'payment_intent.processing': {
        const pi = event.data.object as Stripe.PaymentIntent;
        reference = pi.id;
        paymentStatus = 'processing';
        amount = pi.amount;
        eventMetadata = pi.metadata as Record<string, unknown>;
        break;
      }
      case 'payment_intent.canceled': {
        const pi = event.data.object as Stripe.PaymentIntent;
        reference = pi.id;
        paymentStatus = 'cancelled';
        amount = pi.amount;
        eventMetadata = pi.metadata as Record<string, unknown>;
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        reference = charge.payment_intent?.toString() || charge.id;
        paymentStatus = 'refunded';
        amount = charge.amount_refunded;
        eventMetadata = charge.metadata as Record<string, unknown>;
        break;
      }
      default: {
        // For other event types, try to extract what we can
        const obj = event.data.object as unknown as Record<string, unknown> | null;
        reference = (obj?.id as string) || '';
        amount = (obj?.amount as number) || 0;
        eventMetadata = (obj?.metadata as Record<string, unknown>) || undefined;
      }
    }

    return {
      provider: 'stripe',
      event: event.type,
      reference,
      status: paymentStatus,
      amount,
      metadata: eventMetadata,
    };
  }

  /**
   * Process a payout via Stripe Connect.
   * Used for disbursing escrow funds to sellers.
   */
  async processPayout(request: PayoutRequest): Promise<PayoutResponse> {
    const { amount, currency, destination } = request;

    // Stripe expects amounts in smallest currency unit
    const unitMultiplier = currency.toUpperCase() === 'EUR' ? 100 : 1;
    const stripeAmount = Math.round(amount * unitMultiplier);

    const payout = await this.client.payouts.create({
      amount: stripeAmount,
      currency: currency.toLowerCase(),
      destination: destination || undefined,
      metadata: {
        userId: request.userId,
        method: request.method,
        country: request.countryCode,
      },
    });

    return {
      success: payout.status === 'pending' || payout.status === 'paid',
      payoutId: payout.id,
      providerRef: payout.id,
      status: payout.status === 'paid' ? 'completed' : 'pending',
    };
  }

  /**
   * Get the client secret for a PaymentIntent (used for frontend confirmation).
   */
  async getClientSecret(paymentIntentId: string): Promise<string | null> {
    try {
      const pi = await this.client.paymentIntents.retrieve(paymentIntentId);
      return pi.client_secret || null;
    } catch {
      return null;
    }
  }
}
