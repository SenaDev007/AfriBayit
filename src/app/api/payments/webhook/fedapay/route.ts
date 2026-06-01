// AfriBayit — POST /api/payments/webhook/fedapay
// FedaPay webhook endpoint — receives payment status updates

import { NextResponse } from 'next/server';
import { handleFedaPayWebhook } from '@/lib/payments/webhooks/fedapay';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const result = await handleFedaPayWebhook(payload, headers);

    return NextResponse.json(result);
  } catch (error) {
    console.error('FedaPay webhook error:', error);
    const message = error instanceof Error ? error.message : 'Webhook processing failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
