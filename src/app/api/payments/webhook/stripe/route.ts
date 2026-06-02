// AfriBayit — POST /api/payments/webhook/stripe
// Stripe webhook endpoint — receives payment status updates

import { NextResponse } from 'next/server';
import { handleStripeWebhook } from '@/lib/payments/webhooks/stripe';

export async function POST(request: Request) {
  try {
    // Stripe requires the raw body for signature verification
    const rawBody = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const result = await handleStripeWebhook(rawBody, headers);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Stripe webhook error:', error);
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
