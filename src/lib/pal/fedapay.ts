/**
 * FedaPay Adapter — Mobile Money UEMOA (CDC §7B)
 * Docs: https://docs.fedapay.com/
 * Supports: MTN Money, Moov Money, Wave (Bénin / CI)
 */

import type {
  PaymentAdapter,
  PaymentIntent,
  CreatePaymentInput,
  WebhookEvent,
} from "./types";
import { createHmac } from "crypto";

const FEDAPAY_BASE_URL =
  process.env.FEDAPAY_ENV === "production"
    ? "https://api.fedapay.com/v1"
    : "https://sandbox-api.fedapay.com/v1";

const FEDAPAY_SECRET_KEY =
  process.env.FEDAPAY_ENV === "production"
    ? process.env.FEDAPAY_SECRET_LIVE!
    : process.env.FEDAPAY_SECRET_TEST ?? "sk_sandbox_PLACEHOLDER";

const FEDAPAY_WEBHOOK_SECRET = process.env.FEDAPAY_WEBHOOK_SECRET ?? "";

async function fedapayRequest(path: string, method: string, body?: unknown) {
  const res = await fetch(`${FEDAPAY_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${FEDAPAY_SECRET_KEY}`,
      "Content-Type": "application/json",
      "FedaPay-Version": "2022-07-18",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`FedaPay error ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

export const fedapayAdapter: PaymentAdapter = {
  provider: "fedapay",

  async createPayment(input: CreatePaymentInput): Promise<PaymentIntent> {
    // 1. Create FedaPay transaction
    const txPayload = {
      description: input.description,
      amount: input.amount,
      currency: { iso: input.currency },
      callback_url: input.returnUrl,
      metadata: {
        afribayit_ref: input.afribayitRef,
        ...input.metadata,
      },
      customer: {
        email: input.customerEmail,
        firstname: input.customerName?.split(" ")[0] ?? "",
        lastname: input.customerName?.split(" ").slice(1).join(" ") ?? "",
        phone_number: {
          number: input.customerPhone ?? "",
          country: "BJ", // TODO: detect from user country
        },
      },
    };

    const { v1 } = await fedapayRequest("/transactions", "POST", txPayload);
    const txId: string = v1?.transaction?.id ?? String(Math.random());
    const txRef: string = v1?.transaction?.reference ?? txId;

    // 2. Generate hosted payment URL
    const paymentUrl = `${
      process.env.FEDAPAY_ENV === "production"
        ? "https://app.fedapay.com"
        : "https://sandbox-app.fedapay.com"
    }/checkout/${txId}`;

    return {
      provider: "fedapay",
      providerRef: txRef,
      afribayitRef: input.afribayitRef,
      amount: input.amount,
      currency: input.currency,
      status: "pending",
      paymentUrl,
      metadata: input.metadata ?? {},
      createdAt: new Date(),
    };
  },

  async refund(
    providerRef: string,
    _amount?: number
  ): Promise<{ ok: boolean; refundRef: string }> {
    // FedaPay refunds: POST /v1/transactions/{id}/refund
    try {
      const data = await fedapayRequest(`/transactions/${providerRef}/refund`, "POST");
      return { ok: true, refundRef: data?.v1?.transaction?.id ?? providerRef };
    } catch {
      return { ok: false, refundRef: "" };
    }
  },

  verifyWebhook(payload: string, signature: string): WebhookEvent | null {
    if (!FEDAPAY_WEBHOOK_SECRET) return null;

    const expected = createHmac("sha256", FEDAPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (expected !== signature) return null;

    const raw = JSON.parse(payload) as Record<string, unknown>;
    const eventName = raw.name as string;
    const tx = (raw.entity as Record<string, unknown>) ?? {};

    const eventTypeMap: Record<string, WebhookEvent["eventType"]> = {
      "transaction.approved": "payment.succeeded",
      "transaction.declined": "payment.failed",
      "transaction.refunded": "refund.succeeded",
    };

    const eventType = eventTypeMap[eventName];
    if (!eventType) return null;

    return {
      provider: "fedapay",
      eventType,
      providerRef: String(tx.reference ?? tx.id ?? ""),
      afribayitRef: String((tx as any).metadata?.afribayit_ref ?? ""),
      amount: Number(tx.amount ?? 0),
      currency: ((tx as any).currency?.iso ?? "XOF") as WebhookEvent["currency"],
      rawPayload: raw,
    };
  },
};
