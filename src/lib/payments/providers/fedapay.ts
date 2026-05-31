// AfriBayit — FedaPay Payment Provider Adapter
// Supports Mobile Money (MTN, Moov, Orange, Wave) and card payments
// API Docs: https://fedapay.com/docs/api

import type {
  InitPaymentRequest,
  InitPaymentResponse,
  VerifyPaymentResponse,
  RefundResponse,
  WebhookEvent,
  PaymentStatus,
} from '../types';
import { FEDAPAY_COUNTRY_SUFFIX, FEDAPAY_COUNTRIES, MOBILE_MONEY_METHODS } from '../types';
import { PaymentProviderBase } from './base-provider';

const FEDAPAY_API_BASE = 'https://api.fedapay.com/v1';

/** Map FedaPay status strings to our PaymentStatus */
function mapFedaPayStatus(status: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    pending: 'pending',
    processing: 'processing',
    approved: 'completed',
    completed: 'completed',
    declined: 'failed',
    failed: 'failed',
    refunded: 'refunded',
    cancelled: 'cancelled',
    canceled: 'cancelled',
  };
  return map[status] || 'pending';
}

export class FedaPayProvider extends PaymentProviderBase {
  name = 'fedapay' as const;
  private apiKey: string;
  private publicKey: string;

  constructor() {
    super();
    this.apiKey = process.env.FEDAPAY_API_KEY || '';
    this.publicKey = process.env.FEDAPAY_PUBLIC_KEY || '';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /** Resolve the FedaPay method name based on country + method */
  private resolveMethod(method: string, countryCode: string): string {
    const countryMethods = FEDAPAY_COUNTRY_SUFFIX[countryCode];
    if (countryMethods && countryMethods[method]) {
      return countryMethods[method];
    }
    // Card payments use 'card' regardless of country
    if (method === 'card_visa' || method === 'card_mastercard') {
      return 'card';
    }
    // Fallback
    return method;
  }

  supportsMethod(method: string, countryCode: string): boolean {
    // FedaPay is available in WAEMU countries
    if (!FEDAPAY_COUNTRIES.includes(countryCode)) {
      // Still supports cards outside WAEMU
      if (method !== 'card_visa' && method !== 'card_mastercard') {
        return false;
      }
    }
    // FedaPay supports Mobile Money and cards
    return MOBILE_MONEY_METHODS.includes(method as typeof MOBILE_MONEY_METHODS[number])
      || method === 'card_visa'
      || method === 'card_mastercard';
  }

  async initiatePayment(request: InitPaymentRequest): Promise<InitPaymentResponse> {
    const { amount, currency, method, reference, metadata, customerEmail, customerPhone, countryCode, description } = request;

    const fedapayMethod = this.resolveMethod(method, countryCode);

    const payload = {
      amount: Math.round(amount), // FedaPay expects integer amounts
      currency: currency.toLowerCase(),
      description: description || `AfriBayit - Transaction ${reference}`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/fedapay`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback?ref=${reference}`,
      metadata: {
        reference,
        country: countryCode,
        method: fedapayMethod,
        ...metadata,
      },
      customer: {
        email: customerEmail,
        phone_number: customerPhone || undefined,
        country: countryCode,
      },
      payment_method: fedapayMethod,
    };

    const response = await fetch(`${FEDAPAY_API_BASE}/transactions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'FedaPay API error' }));
      throw new Error(
        `FedaPay initiation failed: ${error.message || response.statusText}`
      );
    }

    const data = await response.json();
    const transaction = data.transaction || data;
    const transactionId = transaction.id?.toString() || '';

    // Generate payment token/URL for redirect
    let redirectUrl: string | undefined;
    try {
      const tokenResponse = await fetch(
        `${FEDAPAY_API_BASE}/transactions/${transactionId}/token`,
        {
          method: 'POST',
          headers: this.getHeaders(),
        }
      );
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        const token = tokenData.token || tokenData.url;
        if (token) {
          redirectUrl = `https://fedapay.com/checkout/${token}`;
        }
      }
    } catch {
      // Token generation is optional — some flows use direct charge
    }

    return {
      success: true,
      paymentId: transactionId,
      providerRef: transactionId,
      redirectUrl,
      status: 'pending',
    };
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    const response = await fetch(`${FEDAPAY_API_BASE}/transactions/${reference}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`FedaPay verification failed: ${response.statusText}`);
    }

    const data = await response.json();
    const transaction = data.transaction || data;

    return {
      status: mapFedaPayStatus(transaction.status),
      providerRef: transaction.id?.toString() || reference,
      amount: transaction.amount || 0,
      currency: (transaction.currency || 'XOF').toUpperCase(),
      metadata: transaction.metadata,
    };
  }

  async processRefund(reference: string, amount?: number): Promise<RefundResponse> {
    const payload: Record<string, unknown> = {};
    if (amount) {
      payload.amount = Math.round(amount);
    }

    const response = await fetch(
      `${FEDAPAY_API_BASE}/transactions/${reference}/refund`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Refund failed' }));
      throw new Error(`FedaPay refund failed: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    const refund = data.refund || data;

    return {
      success: true,
      refundRef: refund.id?.toString() || reference,
      amount: refund.amount || amount || 0,
      status: 'refunded',
    };
  }

  async handleWebhook(payload: unknown, headers: Record<string, string>): Promise<WebhookEvent> {
    // FedaPay webhook signature verification
    const signature = headers['x-fedaPay-signature'] || headers['x-fedapay-signature'] || '';

    if (!signature && process.env.NODE_ENV === 'production') {
      throw new Error('Missing FedaPay webhook signature');
    }

    // Verify signature using HMAC-SHA256
    if (signature && this.publicKey) {
      const crypto = await import('crypto');
      const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expectedSig = crypto
        .createHmac('sha256', this.publicKey)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSig) {
        throw new Error('Invalid FedaPay webhook signature');
      }
    }

    const body = typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)
      : (JSON.parse(typeof payload === 'string' ? payload : '{}') as Record<string, unknown>);

    const event = body.event as string || 'unknown';
    const transaction = (body.transaction || body.data || {}) as Record<string, unknown>;

    return {
      provider: 'fedapay',
      event,
      reference: transaction.id?.toString() || body.reference?.toString() || '',
      status: mapFedaPayStatus(transaction.status as string || 'pending'),
      amount: (transaction.amount as number) || 0,
      metadata: (transaction.metadata || body.metadata) as Record<string, unknown> | undefined,
    };
  }
}
