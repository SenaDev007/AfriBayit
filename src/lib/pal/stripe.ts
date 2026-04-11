/**
 * Stripe Adapter — Cartes bancaires internationales (CDC §7B)
 * Used for EUR/USD payments from the diaspora
 */

import Stripe from "stripe";
import type {
  PaymentAdapter,
  PaymentIntent,
  CreatePaymentInput,
  WebhookEvent,
} from "./types";

function getStripe(): Stripe {
  const key =
    process.env.STRIPE_ENV === "production"
      ? process.env.STRIPE_SECRET_LIVE!
      : process.env.STRIPE_SECRET_TEST ?? "sk_test_PLACEHOLDER";

  return new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
}

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export const stripeAdapter: PaymentAdapter = {
  provider: "stripe",

  async createPayment(input: CreatePaymentInput): Promise<PaymentIntent> {
    const stripe = getStripe();

    // XOF is not supported by Stripe — convert to EUR for international payments
    // TODO: integrate Fixer.io for live rate
    const isXOF = input.currency === "XOF";
    const stripeCurrency = isXOF ? "eur" : input.currency.toLowerCase();
    // XOF to EUR approximate rate: 1 EUR ≈ 656 FCFA
    const stripeAmount = isXOF
      ? Math.round(input.amount / 6.56) // in EUR cents
      : input.amount;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: stripeCurrency,
            unit_amount: stripeAmount,
            product_data: {
              name: input.description,
              metadata: { afribayit_ref: input.afribayitRef },
            },
          },
        },
      ],
      customer_email: input.customerEmail,
      metadata: {
        afribayit_ref: input.afribayitRef,
        ...input.metadata,
      },
      success_url: `${input.returnUrl}?session_id={CHECKOUT_SESSION_ID}&status=success`,
      cancel_url: `${input.returnUrl}?status=cancelled`,
    });

    return {
      provider: "stripe",
      providerRef: session.id,
      afribayitRef: input.afribayitRef,
      amount: input.amount,
      currency: input.currency,
      status: "pending",
      paymentUrl: session.url ?? undefined,
      metadata: input.metadata ?? {},
      createdAt: new Date(),
    };
  },

  async refund(
    providerRef: string,
    amount?: number
  ): Promise<{ ok: boolean; refundRef: string }> {
    const stripe = getStripe();
    try {
      // providerRef may be a session ID — get PaymentIntent from session
      let paymentIntentId = providerRef;
      if (providerRef.startsWith("cs_")) {
        const session = await stripe.checkout.sessions.retrieve(providerRef);
        paymentIntentId = session.payment_intent as string;
      }

      const params: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };
      if (amount) {
        // XOF → EUR cents
        params.amount = Math.round(amount / 6.56);
      }

      const refund = await stripe.refunds.create(params);
      return { ok: refund.status === "succeeded", refundRef: refund.id };
    } catch {
      return { ok: false, refundRef: "" };
    }
  },

  verifyWebhook(payload: string, signature: string): WebhookEvent | null {
    if (!STRIPE_WEBHOOK_SECRET) return null;

    const stripe = getStripe();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
    } catch {
      return null;
    }

    const eventTypeMap: Record<string, WebhookEvent["eventType"]> = {
      "checkout.session.completed": "payment.succeeded",
      "payment_intent.payment_failed": "payment.failed",
      "charge.refunded": "refund.succeeded",
    };

    const eventType = eventTypeMap[event.type];
    if (!eventType) return null;

    const obj = event.data.object as unknown as Record<string, unknown>;
    const meta = (obj.metadata as Record<string, string>) ?? {};

    return {
      provider: "stripe",
      eventType,
      providerRef: String(obj.id ?? ""),
      afribayitRef: meta.afribayit_ref ?? "",
      amount: Number(obj.amount_total ?? obj.amount ?? 0),
      currency: String(obj.currency ?? "eur").toUpperCase() as WebhookEvent["currency"],
      rawPayload: event,
    };
  },
};
