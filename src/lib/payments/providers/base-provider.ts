// AfriBayit — Payment Provider Base Class
// Abstract base class that all payment providers must implement

import type {
  InitPaymentRequest,
  InitPaymentResponse,
  VerifyPaymentResponse,
  RefundResponse,
  WebhookEvent,
  PaymentProvider,
} from '../types';

export abstract class PaymentProviderBase {
  abstract name: PaymentProvider;

  /**
   * Initiate a new payment through this provider.
   * Returns a response with payment ID, provider reference, and optional redirect URL.
   */
  abstract initiatePayment(request: InitPaymentRequest): Promise<InitPaymentResponse>;

  /**
   * Verify the current status of a payment with the provider.
   * Used for polling and webhook fallback verification.
   */
  abstract verifyPayment(reference: string): Promise<VerifyPaymentResponse>;

  /**
   * Process a refund for a previously completed payment.
   * If amount is provided, performs a partial refund; otherwise, full refund.
   */
  abstract processRefund(reference: string, amount?: number): Promise<RefundResponse>;

  /**
   * Handle and validate an incoming webhook from the provider.
   * Returns a normalized WebhookEvent if valid, throws on invalid signatures.
   */
  abstract handleWebhook(payload: unknown, headers: Record<string, string>): Promise<WebhookEvent>;

  /**
   * Check if this provider supports a given payment method and country.
   */
  abstract supportsMethod(method: string, countryCode: string): boolean;
}
