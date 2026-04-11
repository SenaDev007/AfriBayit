/**
 * PAL Factory — Sélectionne le bon adaptateur selon le moyen de paiement
 * CDC §7B : FedaPay (Mobile Money) | Stripe (cartes inter)
 */

import { fedapayAdapter } from "./fedapay";
import { stripeAdapter } from "./stripe";
import type { PaymentAdapter, CreatePaymentInput, PaymentIntent } from "./types";

export * from "./types";

/** Returns the right adapter for a payment method */
export function getPaymentAdapter(method: "mobile_money" | "card"): PaymentAdapter {
  return method === "mobile_money" ? fedapayAdapter : stripeAdapter;
}

/**
 * Convenience: initiate a payment and return a normalized PaymentIntent.
 * Call this from escrow API routes — never call provider SDKs directly.
 */
export async function initiatePayment(input: CreatePaymentInput): Promise<PaymentIntent> {
  const adapter = getPaymentAdapter(input.method);
  return adapter.createPayment(input);
}

/**
 * Refund a payment.
 * @param method   Original payment method (to pick correct adapter)
 * @param providerRef Provider-specific transaction/session ID
 * @param amount   Amount to refund in XOF (optional, full refund if omitted)
 */
export async function refundPayment(
  method: "mobile_money" | "card",
  providerRef: string,
  amount?: number
): Promise<{ ok: boolean; refundRef: string }> {
  const adapter = getPaymentAdapter(method);
  return adapter.refund(providerRef, amount);
}
