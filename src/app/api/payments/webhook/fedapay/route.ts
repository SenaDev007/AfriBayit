// AfriBayit — POST /api/payments/webhook/fedapay
// FedaPay webhook endpoint — receives payment status updates
// Uses raw body for HMAC signature verification

import { NextResponse } from 'next/server';
import { handleFedaPayWebhook } from '@/lib/payments/webhooks/fedapay';

export async function POST(request: Request) {
  try {
    // Get the raw body text for HMAC signature verification
    // FedaPay requires the raw body for signature verification
    const rawBody = await request.text();

    // Parse headers for signature verification
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Pass the raw body string to the webhook handler
    // The FedaPayProvider will use it for HMAC verification and parse it for event data
    const result = await handleFedaPayWebhook(rawBody, headers);

    // Always return 200 to acknowledge receipt (FedaPay will retry on non-200)
    return NextResponse.json(result);
  } catch (error) {
    console.error('[FedaPay Webhook] Error:', error);

    // For webhook signature failures, return 401 so FedaPay knows it's invalid
    if (error instanceof Error && error.message.includes('signature')) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // For other errors, still return 200 to prevent FedaPay from retrying endlessly
    return NextResponse.json({ error: 'Processing failed', processed: false }, { status: 200 });
  }
}
