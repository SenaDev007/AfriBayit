// AfriBayit — POST /api/payments/webhook/fedapay
// FedaPay webhook handler — verifies signature, updates transaction status

import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/payments/fedapay-client';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-fedaPay-signature') ||
                      request.headers.get('x-fedapay-signature') || '';

    // Verify webhook signature
    const event = verifyWebhookSignature(rawBody, signature);

    if (!event && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse the payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }

    const eventType = payload.event || event?.event || 'unknown';
    const transaction = payload.transaction || payload.data || event?.transaction || {};
    const transactionRef = transaction.reference || transaction.id?.toString() || '';
    const transactionStatus = transaction.status || 'unknown';
    const transactionAmount = parseFloat(transaction.amount) || 0;
    const transactionCurrency = (transaction.currency || 'XOF').toUpperCase();
    const metadata = transaction.metadata || payload.metadata || {};

    console.log(`FedaPay webhook: event=${eventType}, ref=${transactionRef}, status=${transactionStatus}`);

    // Process the event
    if (transactionRef) {
      await processFedaPayEvent(
        eventType,
        transactionRef,
        transactionStatus,
        transactionAmount,
        transactionCurrency,
        metadata
      );
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true, event: eventType });
  } catch (error) {
    console.error('POST /api/payments/webhook/fedapay error:', error);

    // Still return 200 to prevent retries
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

/**
 * Process a FedaPay webhook event.
 * Updates transaction status and triggers escrow actions.
 */
async function processFedaPayEvent(
  eventType: string,
  transactionRef: string,
  transactionStatus: string,
  amount: number,
  currency: string,
  metadata: Record<string, unknown>
): Promise<void> {
  // Map FedaPay status to our internal status
  const mappedStatus = mapFedaPayStatus(transactionStatus);

  // Find the wallet transaction by provider reference
  const walletTx = await db.walletTransaction.findFirst({
    where: { providerRef: transactionRef },
  });

  if (walletTx) {
    await db.walletTransaction.update({
      where: { id: walletTx.id },
      data: {
        status: mappedStatus === 'completed' ? 'completed' :
                mappedStatus === 'failed' ? 'failed' : 'pending',
        metadata: JSON.stringify({
          ...((walletTx.metadata ? JSON.parse(walletTx.metadata as string) : {}) as Record<string, unknown>),
          webhookEvent: eventType,
          webhookStatus: mappedStatus,
          fedapayStatus: transactionStatus,
          processedAt: new Date().toISOString(),
        }),
      },
    });

    // If payment completed and this is an escrow_fund type, trigger escrow transition
    if (mappedStatus === 'completed' && walletTx.type === 'escrow_fund') {
      const txMetadata = walletTx.metadata
        ? JSON.parse(walletTx.metadata as string) as Record<string, unknown>
        : {};
      const transactionId = (txMetadata.transactionId || metadata.transactionId) as string | undefined;

      if (transactionId) {
        try {
          const { transition } = await import('@/lib/payments/escrow-engine');
          await transition(
            transactionId,
            'FUNDED',
            walletTx.userId,
            'Paiement FedaPay confirmé via webhook'
          );
        } catch (error) {
          console.error('Escrow transition error in FedaPay webhook:', error);
        }
      }
    }
  }

  // Also try to find a Transaction record by paymentRef
  const transaction = await db.transaction.findFirst({
    where: { paymentRef: transactionRef },
  });

  if (transaction) {
    if (mappedStatus === 'completed' && transaction.status === 'CREATED') {
      try {
        const { transition } = await import('@/lib/payments/escrow-engine');
        await transition(
          transaction.id,
          'FUNDED',
          transaction.buyerId,
          'Paiement FedaPay confirmé via webhook'
        );
      } catch (error) {
        console.error('Escrow transition error in FedaPay webhook:', error);
      }
    }

    // Update the transaction payment provider info
    await db.transaction.update({
      where: { id: transaction.id },
      data: {
        paymentProvider: 'fedapay',
        paymentRef: transactionRef,
      },
    });
  }
}

/** Map FedaPay status to our internal PaymentStatus */
function mapFedaPayStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'pending',
    processing: 'processing',
    approved: 'completed',
    completed: 'completed',
    declined: 'failed',
    failed: 'failed',
    refunded: 'refunded',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    partially_refunded: 'refunded',
  };
  return map[status] || 'pending';
}
