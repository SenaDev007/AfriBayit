// AfriBayit — FedaPay Webhook Handler
// Processes incoming webhook events from FedaPay

import { processWebhook } from '../index';
import { db } from '@/lib/db';
import type { PaymentProvider } from '../types';

/**
 * Process a FedaPay webhook event.
 * Updates the payment record and triggers escrow actions if needed.
 */
export async function handleFedaPayWebhook(
  payload: unknown,
  headers: Record<string, string>
) {
  // Parse and validate the webhook event
  const event = await processWebhook('fedapay' as PaymentProvider, payload, headers);

  // Find the payment record by provider reference
  const providerRef = event.reference;
  if (!providerRef) {
    console.warn('FedaPay webhook: No reference in event');
    return { processed: false, reason: 'No reference' };
  }

  // Update the payment record (using wallet transactions as proxy)
  try {
    const walletTx = await db.walletTransaction.findFirst({
      where: { providerRef },
    });

    if (walletTx) {
      await db.walletTransaction.update({
        where: { id: walletTx.id },
        data: {
          status: mapPaymentStatusToWalletStatus(event.status),
          metadata: JSON.stringify({
            ...((walletTx.metadata ? JSON.parse(walletTx.metadata as string) : {}) as Record<string, unknown>),
            webhookEvent: event.event,
            webhookStatus: event.status,
            processedAt: new Date().toISOString(),
          }),
        },
      });

      // Trigger escrow funding if payment completed
      if (event.status === 'completed' && walletTx.type === 'escrow_fund') {
        const metadata = walletTx.metadata
          ? JSON.parse(walletTx.metadata as string) as Record<string, unknown>
          : {};
        const transactionId = metadata.transactionId as string | undefined;

        if (transactionId) {
          // Import escrow engine dynamically to avoid circular deps
          const { transition } = await import('../escrow-engine');
          await transition(transactionId, 'FUNDED', walletTx.userId, 'Paiement FedaPay confirmé');
        }
      }
    }
  } catch (error) {
    console.error('FedaPay webhook processing error:', error);
  }

  return { processed: true, event };
}

function mapPaymentStatusToWalletStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'pending',
    processing: 'pending',
    completed: 'completed',
    failed: 'failed',
    refunded: 'completed',
    cancelled: 'failed',
  };
  return map[status] || 'pending';
}
