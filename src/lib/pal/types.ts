/**
 * Payment Abstraction Layer — Interfaces (CDC §7B)
 * Providers: FedaPay (Mobile Money UEMOA), Stripe (cartes internationales)
 */

export type PaymentProvider = "fedapay" | "stripe";
export type PaymentStatus = "pending" | "processing" | "succeeded" | "failed" | "refunded";
export type Currency = "XOF" | "XAF" | "EUR" | "USD" | "GHS" | "NGN";

/** Normalized payment intent — same shape regardless of provider */
export interface PaymentIntent {
  provider: PaymentProvider;
  /** Provider-specific ID (FedaPay transaction ID or Stripe PaymentIntent ID) */
  providerRef: string;
  /** AfriBayit escrow/booking reference */
  afribayitRef: string;
  /** Amount in the smallest unit (XOF: FCFA, EUR: cents) */
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  /** URL to redirect user to complete payment (FedaPay hosted page or Stripe hosted UI) */
  paymentUrl?: string;
  /** Metadata passed through */
  metadata: Record<string, string>;
  createdAt: Date;
}

/** Normalized webhook event */
export interface WebhookEvent {
  provider: PaymentProvider;
  eventType: "payment.succeeded" | "payment.failed" | "refund.succeeded";
  providerRef: string;
  afribayitRef: string;
  amount: number;
  currency: Currency;
  rawPayload: unknown;
}

/** Input to create a payment */
export interface CreatePaymentInput {
  afribayitRef: string;    // Escrow transaction ID
  amount: number;           // In FCFA (XOF) or EUR cents
  currency: Currency;
  description: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;   // Required for FedaPay Mobile Money
  metadata?: Record<string, string>;
  /** FedaPay: mobile_money | Stripe: card */
  method: "mobile_money" | "card";
  /** Redirect after payment */
  returnUrl: string;
}

/** Provider adapter interface */
export interface PaymentAdapter {
  provider: PaymentProvider;
  createPayment(input: CreatePaymentInput): Promise<PaymentIntent>;
  refund(providerRef: string, amount?: number): Promise<{ ok: boolean; refundRef: string }>;
  verifyWebhook(payload: string, signature: string): WebhookEvent | null;
}
