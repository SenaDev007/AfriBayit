// AfriBayit — Stripe Client SDK Wrapper
// Wraps the Stripe SDK for international card payments, bank transfers, and refunds
// Supports: PaymentIntents, confirmation, refunds, and balance retrieval

import Stripe from 'stripe';

// ============ Singleton Client ============

let stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY || '';
    stripeClient = new Stripe(secretKey, {
      typescript: true,
      apiVersion: '2026-05-27.dahlia' as any,
    });
  }
  return stripeClient;
}

// ============ Types ============

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  description?: string;
  customerEmail?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  returnUrl?: string;
}

export interface PaymentIntentResult {
  success: boolean;
  paymentIntentId: string;
  clientSecret?: string;
  status: string;
  error?: string;
}

export interface ConfirmPaymentParams {
  paymentIntentId: string;
  paymentMethodId?: string;
  returnUrl?: string;
}

export interface ConfirmPaymentResult {
  success: boolean;
  status: string;
  error?: string;
}

export interface RefundParams {
  paymentIntentId: string;
  amount?: number; // partial refund if specified
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'expired_uncaptured_charge';
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
  error?: string;
}

// ============ Core Functions ============

/**
 * Create a Stripe PaymentIntent.
 * Returns the client_secret for frontend confirmation.
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResult> {
  try {
    const client = getStripeClient();
    const currency = params.currency.toLowerCase();

    // Stripe expects amounts in smallest currency unit
    // XOF is zero-decimal, EUR/USD need ×100
    const multiplier = ['xof', 'fcfa'].includes(currency) ? 1 : 100;
    const stripeAmount = Math.round(params.amount * multiplier);

    const paymentIntent = await client.paymentIntents.create({
      amount: stripeAmount,
      currency,
      description: params.description,
      receipt_email: params.customerEmail,
      metadata: {
        customerId: params.customerId || '',
        ...params.metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret || undefined,
      status: paymentIntent.status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe PaymentIntent creation failed';
    console.error('Stripe createPaymentIntent error:', message);
    return {
      success: false,
      paymentIntentId: '',
      status: 'failed',
      error: message,
    };
  }
}

/**
 * Confirm a Stripe PaymentIntent.
 * Used for server-side confirmation after client-side payment method collection.
 */
export async function confirmPayment(
  params: ConfirmPaymentParams
): Promise<ConfirmPaymentResult> {
  try {
    const client = getStripeClient();

    const confirmParams: Stripe.PaymentIntentConfirmParams = {};
    if (params.returnUrl) {
      confirmParams.return_url = params.returnUrl;
    }

    const paymentIntent = await client.paymentIntents.confirm(
      params.paymentIntentId,
      {
        payment_method: params.paymentMethodId,
        return_url: params.returnUrl,
      }
    );

    return {
      success: paymentIntent.status === 'succeeded',
      status: paymentIntent.status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe confirmation failed';
    console.error('Stripe confirmPayment error:', message);
    return {
      success: false,
      status: 'failed',
      error: message,
    };
  }
}

/**
 * Process a refund for a Stripe PaymentIntent.
 * If amount is specified, performs a partial refund.
 */
export async function processRefund(params: RefundParams): Promise<RefundResult> {
  try {
    const client = getStripeClient();

    // Retrieve the payment intent to find the charge
    const paymentIntent = await client.paymentIntents.retrieve(
      params.paymentIntentId,
      { expand: ['latest_charge'] }
    );

    const charge = paymentIntent.latest_charge as Stripe.Charge | null;
    if (!charge) {
      return {
        success: false,
        refundId: '',
        amount: 0,
        status: 'failed',
        error: 'No charge found for this PaymentIntent',
      };
    }

    const refundParams: Stripe.RefundCreateParams = {
      charge: charge.id,
      reason: params.reason as Stripe.RefundCreateParams.Reason,
    };

    if (params.amount) {
      const currency = (paymentIntent.currency || 'eur').toLowerCase();
      const multiplier = ['xof', 'fcfa'].includes(currency) ? 1 : 100;
      refundParams.amount = Math.round(params.amount * multiplier);
    }

    const refund = await client.refunds.create(refundParams);

    return {
      success: refund.status === 'succeeded' || refund.status === 'pending',
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status || 'pending',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stripe refund failed';
    console.error('Stripe processRefund error:', message);
    return {
      success: false,
      refundId: '',
      amount: 0,
      status: 'failed',
      error: message,
    };
  }
}

/**
 * Retrieve a PaymentIntent's current status.
 */
export async function getPaymentIntentStatus(
  paymentIntentId: string
): Promise<{ status: string; amount: number; currency: string; metadata: Record<string, string> } | null> {
  try {
    const client = getStripeClient();
    const pi = await client.paymentIntents.retrieve(paymentIntentId);
    return {
      status: pi.status,
      amount: pi.amount,
      currency: pi.currency.toUpperCase(),
      metadata: pi.metadata as Record<string, string>,
    };
  } catch (error) {
    console.error('Stripe getPaymentIntentStatus error:', error);
    return null;
  }
}

/**
 * Verify a Stripe webhook signature.
 * Returns the parsed event or null if verification fails.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  const client = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  try {
    return client.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return null;
  }
}
