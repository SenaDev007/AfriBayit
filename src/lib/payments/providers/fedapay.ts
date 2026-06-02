// AfriBayit — FedaPay Payment Provider Adapter
// Supports Mobile Money (MTN, Moov, Orange, Wave) and card payments
// FedaPay REST API v2 — https://fedapay.com/docs/api
// Sandbox: https://sandbox-api.fedapay.com/v1
// Production: https://api.fedapay.com/v1

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
import { FEDAPAY_COUNTRY_SUFFIX, FEDAPAY_COUNTRIES, MOBILE_MONEY_METHODS } from '../types';
import { PaymentProviderBase } from './base-provider';

// ============ Configuration ============

const SANDBOX_API_BASE = 'https://sandbox-api.fedapay.com/v1';
const PRODUCTION_API_BASE = 'https://api.fedapay.com/v1';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

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

/** Map our PaymentStatus to FedaPay webhook event names */
function mapStatusToFedaPayEvent(status: PaymentStatus): string {
  const map: Record<string, string> = {
    completed: 'transaction.approved',
    failed: 'transaction.declined',
    cancelled: 'transaction.failed',
    refunded: 'transaction.refunded',
    pending: 'transaction.pending',
    processing: 'transaction.processing',
  };
  return map[status] || 'transaction.unknown';
}

/** Sleep for retry backoff */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Custom error class for FedaPay API errors */
export class FedaPayApiError extends Error {
  public statusCode: number;
  public code: string;
  public detail: unknown;

  constructor(message: string, statusCode: number, code: string = 'unknown', detail?: unknown) {
    super(message);
    this.name = 'FedaPayApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.detail = detail;
  }
}

export class FedaPayProvider extends PaymentProviderBase {
  name = 'fedapay' as const;
  private apiKey: string;
  private publicKey: string;
  private isSandbox: boolean;
  private apiBase: string;

  constructor() {
    super();
    this.apiKey = process.env.FEDAPAY_SECRET_KEY || '';
    this.publicKey = process.env.FEDAPAY_PUBLIC_KEY || '';
    this.isSandbox = process.env.FEDAPAY_SANDBOX === 'true';
    this.apiBase = this.isSandbox ? SANDBOX_API_BASE : PRODUCTION_API_BASE;

    if (this.isSandbox) {
      console.log('[FedaPay] Running in SANDBOX mode');
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Make an API request with retry logic.
   * Retries on network errors and 5xx status codes with exponential backoff.
   */
  private async apiRequest<T>(
    path: string,
    options: {
      method: string;
      body?: unknown;
      retryCount?: number;
    }
  ): Promise<T> {
    const { method, body, retryCount = 0 } = options;
    const url = `${this.apiBase}${path}`;

    try {
      console.log(`[FedaPay] ${method} ${path}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);

      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      // Retry on server errors (5xx) or rate limiting (429)
      if ((response.status >= 500 || response.status === 429) && retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
        console.warn(`[FedaPay] ${response.status} on ${path}, retrying in ${delay}ms...`);
        await sleep(delay);
        return this.apiRequest(path, { method, body, retryCount: retryCount + 1 });
      }

      if (!response.ok) {
        let errorData: Record<string, unknown> = {};
        try {
          errorData = await response.json();
        } catch {
          // Ignore JSON parse error
        }

        const errorMessage =
          (errorData.message as string) ||
          (errorData.error as string) ||
          response.statusText ||
          'FedaPay API error';

        console.error(`[FedaPay] API error: ${response.status} — ${errorMessage}`, errorData);

        throw new FedaPayApiError(
          errorMessage,
          response.status,
          (errorData.code as string) || 'api_error',
          errorData
        );
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      // Re-throw FedaPayApiError as-is
      if (error instanceof FedaPayApiError) {
        throw error;
      }

      // Retry on network errors
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
        console.warn(`[FedaPay] Network error on ${path}, retrying in ${delay}ms...`, error);
        await sleep(delay);
        return this.apiRequest(path, { method, body, retryCount: retryCount + 1 });
      }

      console.error(`[FedaPay] Max retries exceeded for ${path}`, error);
      throw new FedaPayApiError(
        `FedaPay API request failed after ${MAX_RETRIES} retries: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        'network_error'
      );
    }
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

  /**
   * Format phone number for FedaPay API.
   * FedaPay expects: { number: "22990000000", country: "bj" }
   */
  private formatPhoneNumber(
    phone: string | undefined,
    countryCode: string
  ): { number: string; country: string } | undefined {
    if (!phone) return undefined;

    // Strip spaces, dashes, and leading '+'
    let cleaned = phone.replace(/[\s\-+]/g, '');

    // If it starts with '00', replace with the country code prefix
    // West African country codes
    const countryCodes: Record<string, string> = {
      BJ: '229', // Benin
      CI: '225', // Côte d'Ivoire
      BF: '226', // Burkina Faso
      TG: '228', // Togo
      SN: '221', // Senegal
      ML: '223', // Mali
      NE: '227', // Niger
      GN: '224', // Guinea
    };

    const cc = countryCodes[countryCode] || '';

    // Remove leading country code if present
    if (cc && cleaned.startsWith(cc)) {
      cleaned = cleaned.substring(cc.length);
    }

    // If the number is just the local part, prepend country code
    if (cc && !cleaned.startsWith('00')) {
      cleaned = cc + cleaned;
    }

    return {
      number: cleaned,
      country: countryCode.toLowerCase(),
    };
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
    const {
      amount,
      currency,
      method,
      reference,
      metadata,
      customerEmail,
      customerPhone,
      countryCode,
      description,
    } = request;

    const fedapayMethod = this.resolveMethod(method, countryCode);
    const isMobileMoney = MOBILE_MONEY_METHODS.includes(method as typeof MOBILE_MONEY_METHODS[number]);

    console.log(`[FedaPay] Initiating ${isMobileMoney ? 'Mobile Money' : 'Card'} payment: ${amount} ${currency} via ${fedapayMethod}`);

    // Build the FedaPay transaction payload per API v2 spec
    const payload: Record<string, unknown> = {
      description: description || `AfriBayit - Transaction ${reference}`,
      amount: Math.round(amount), // FedaPay expects integer amounts
      currency: { iso: currency.toUpperCase() }, // FedaPay expects { iso: "XOF" }
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://afri-bayit.vercel.app'}/api/payments/webhook/fedapay`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://afri-bayit.vercel.app'}/payment/callback?ref=${reference}`,
      metadata: {
        reference,
        country: countryCode,
        method: fedapayMethod,
        isMobileMoney,
        ...metadata,
      },
      customer: {
        firstname: (metadata?.customerFirstName as string) || '',
        lastname: (metadata?.customerLastName as string) || '',
        email: customerEmail,
        phone_number: this.formatPhoneNumber(customerPhone, countryCode),
      },
    };

    // Create the transaction via FedaPay API
    const data = await this.apiRequest<Record<string, unknown>>(
      '/transactions',
      { method: 'POST', body: payload }
    );

    const transaction = (data.transaction || data) as Record<string, unknown>;
    const transactionId = transaction.id?.toString() || '';

    if (!transactionId) {
      throw new FedaPayApiError(
        'FedaPay transaction creation returned no ID',
        0,
        'no_transaction_id',
        data
      );
    }

    console.log(`[FedaPay] Transaction created: ${transactionId}, status: ${transaction.status}`);

    // Generate payment token/URL for redirect
    let redirectUrl: string | undefined;
    try {
      const tokenResponse = await this.apiRequest<Record<string, unknown>>(
        `/transactions/${transactionId}/token`,
        { method: 'POST' }
      );

      const token = tokenResponse.token || tokenResponse.url;
      if (token) {
        // Use the correct checkout URL based on sandbox/production
        const checkoutBase = this.isSandbox
          ? 'https://sandbox.fedapay.com'
          : 'https://fedapay.com';
        redirectUrl = `${checkoutBase}/checkout/${token}`;
        console.log(`[FedaPay] Checkout URL generated for transaction ${transactionId}`);
      }
    } catch (error) {
      // Token generation is optional — some flows use direct charge
      console.warn(`[FedaPay] Token generation failed (non-critical):`, error instanceof Error ? error.message : error);
    }

    // For Mobile Money, attempt to send the payment prompt directly
    if (isMobileMoney && customerPhone) {
      try {
        const chargePayload: Record<string, unknown> = {
          country: countryCode.toLowerCase(),
        };

        await this.apiRequest<Record<string, unknown>>(
          `/transactions/${transactionId}/mobilemoney`,
          { method: 'POST', body: chargePayload }
        );

        console.log(`[FedaPay] Mobile Money payment prompt sent for transaction ${transactionId}`);
      } catch (error) {
        console.warn(`[FedaPay] Mobile Money prompt failed (user can still use checkout URL):`,
          error instanceof Error ? error.message : error);
      }
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
    console.log(`[FedaPay] Verifying transaction: ${reference}`);

    const data = await this.apiRequest<Record<string, unknown>>(
      `/transactions/${reference}`,
      { method: 'GET' }
    );

    const transaction = (data.transaction || data) as Record<string, unknown>;
    const status = mapFedaPayStatus(transaction.status as string || 'pending');
    const currencyData = transaction.currency as Record<string, unknown> | undefined;
    const currencyIso = typeof currencyData === 'object' && currencyData !== null
      ? (currencyData.iso as string || 'XOF')
      : (transaction.currency as string || 'XOF');

    console.log(`[FedaPay] Transaction ${reference} status: ${transaction.status} → ${status}`);

    return {
      status,
      providerRef: transaction.id?.toString() || reference,
      amount: (transaction.amount as number) || 0,
      currency: currencyIso.toUpperCase(),
      metadata: (transaction.metadata || undefined) as Record<string, unknown> | undefined,
    };
  }

  async processRefund(reference: string, amount?: number): Promise<RefundResponse> {
    console.log(`[FedaPay] Processing refund for transaction: ${reference}${amount ? ` (partial: ${amount})` : ' (full)'}`);

    const payload: Record<string, unknown> = {};
    if (amount) {
      payload.amount = Math.round(amount);
    }

    const data = await this.apiRequest<Record<string, unknown>>(
      `/transactions/${reference}/refund`,
      { method: 'POST', body: payload }
    );

    const refund = (data.refund || data) as Record<string, unknown>;

    console.log(`[FedaPay] Refund processed: ${refund.id}`);

    return {
      success: true,
      refundRef: refund.id?.toString() || reference,
      amount: (refund.amount as number) || amount || 0,
      status: 'refunded',
    };
  }

  /**
   * Process a payout to a seller's Mobile Money or bank account.
   * Uses FedaPay Payout API for disbursing funds to sellers.
   */
  async processPayout(request: PayoutRequest): Promise<PayoutResponse> {
    const { userId, amount, currency, method, destination, countryCode } = request;

    console.log(`[FedaPay] Processing payout: ${amount} ${currency} to ${destination} (${method})`);

    const isMobileMoney = MOBILE_MONEY_METHODS.includes(method as typeof MOBILE_MONEY_METHODS[number]);
    const fedapayMethod = this.resolveMethod(method, countryCode);

    // Create a payout via FedaPay
    const payload: Record<string, unknown> = {
      amount: Math.round(amount),
      currency: { iso: currency.toUpperCase() },
      method: fedapayMethod,
      destination,
      country: countryCode.toLowerCase(),
      metadata: {
        userId,
        payoutMethod: method,
        isMobileMoney,
      },
    };

    try {
      const data = await this.apiRequest<Record<string, unknown>>(
        '/payouts',
        { method: 'POST', body: payload }
      );

      const payout = (data.payout || data) as Record<string, unknown>;
      const payoutId = payout.id?.toString() || '';

      console.log(`[FedaPay] Payout created: ${payoutId}`);

      return {
        success: true,
        payoutId,
        providerRef: payoutId,
        status: mapFedaPayStatus(payout.status as string || 'pending'),
      };
    } catch (error) {
      console.error(`[FedaPay] Payout failed:`, error instanceof Error ? error.message : error);

      // If payout API isn't available in sandbox, return a simulated response
      if (this.isSandbox) {
        console.warn(`[FedaPay] Sandbox mode — returning simulated payout response`);
        return {
          success: true,
          payoutId: `payout_sandbox_${Date.now()}`,
          providerRef: `payout_sandbox_${Date.now()}`,
          status: 'pending',
        };
      }

      throw error;
    }
  }

  async handleWebhook(payload: unknown, headers: Record<string, string>): Promise<WebhookEvent> {
    // FedaPay webhook signature verification
    const signature = headers['x-fedapay-signature']
      || headers['x-fedaPay-signature']
      || headers['x-feda-pay-signature']
      || '';

    if (!signature && process.env.NODE_ENV === 'production') {
      throw new Error('Missing FedaPay webhook signature');
    }

    // Verify signature using HMAC-SHA256 with the public key
    if (signature && this.publicKey) {
      const crypto = await import('crypto');
      const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expectedSig = crypto
        .createHmac('sha256', this.publicKey)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSig) {
        console.error('[FedaPay] Webhook signature verification failed');
        throw new Error('Invalid FedaPay webhook signature');
      }

      console.log('[FedaPay] Webhook signature verified');
    } else if (!signature) {
      console.warn('[FedaPay] Webhook received without signature (development mode)');
    }

    const body = typeof payload === 'object' && payload !== null
      ? (payload as Record<string, unknown>)
      : (JSON.parse(typeof payload === 'string' ? payload : '{}') as Record<string, unknown>);

    const event = (body.event as string) || 'unknown';
    const transaction = (body.transaction || body.data || {}) as Record<string, unknown>;

    const status = mapFedaPayStatus(transaction.status as string || 'pending');

    console.log(`[FedaPay] Webhook event: ${event}, status: ${transaction.status} → ${status}, ref: ${transaction.id}`);

    return {
      provider: 'fedapay',
      event,
      reference: transaction.id?.toString() || body.reference?.toString() || '',
      status,
      amount: (transaction.amount as number) || 0,
      metadata: (transaction.metadata || body.metadata) as Record<string, unknown> | undefined,
    };
  }

  /**
   * Get the API base URL (useful for frontend checkout integration).
   */
  getApiBase(): string {
    return this.apiBase;
  }

  /**
   * Check if running in sandbox mode.
   */
  isSandboxMode(): boolean {
    return this.isSandbox;
  }
}

// Re-export the mapping utility for use in webhook handlers
export { mapFedaPayStatus, mapStatusToFedaPayEvent };
