// AfriBayit — FedaPay Webhook Handler
// Processes incoming webhook events from FedaPay
// Handles: transaction.approved, transaction.declined, transaction.failed
// Triggers escrow funding, notifications, and status updates

import { processWebhook } from '../index';
import { db } from '@/lib/db';
import type { PaymentProvider, PaymentStatus } from '../types';

/**
 * Process a FedaPay webhook event.
 * Updates the payment record, triggers escrow actions, and sends notifications.
 */
export async function handleFedaPayWebhook(
  payload: unknown,
  headers: Record<string, string>
) {
  // Parse and validate the webhook event
  // Pass the payload (raw string or parsed object) to the provider for signature verification
  const event = await processWebhook('fedapay' as PaymentProvider, payload, headers);

  // Find the payment record by provider reference
  const providerRef = event.reference;
  if (!providerRef) {
    console.warn('[FedaPay Webhook] No reference in event');
    return { processed: false, reason: 'No reference' };
  }

  console.log(`[FedaPay Webhook] Processing event: ${event.event}, ref: ${providerRef}, status: ${event.status}`);

  // Find the wallet transaction by provider reference
  const walletTx = await db.walletTransaction.findFirst({
    where: { providerRef },
  });

  if (!walletTx) {
    console.warn(`[FedaPay Webhook] No wallet transaction found for providerRef: ${providerRef}`);
    return { processed: false, reason: 'Wallet transaction not found' };
  }

  const existingMetadata = walletTx.metadata
    ? JSON.parse(walletTx.metadata as string) as Record<string, unknown>
    : {};
  const transactionId = (existingMetadata.transactionId as string) || (existingMetadata.reference as string | undefined);
  const propertyId = existingMetadata.propertyId as string | undefined;

  // Update the wallet transaction status
  const walletStatus = mapPaymentStatusToWalletStatus(event.status);
  await db.walletTransaction.update({
    where: { id: walletTx.id },
    data: {
      status: walletStatus,
      metadata: JSON.stringify({
        ...existingMetadata,
        webhookEvent: event.event,
        webhookStatus: event.status,
        processedAt: new Date().toISOString(),
      }),
    },
  });

  // Handle each event type
  switch (event.event) {
    case 'transaction.approved':
      await handleTransactionApproved(walletTx, event, transactionId, propertyId);
      break;

    case 'transaction.declined':
      await handleTransactionDeclined(walletTx, event, transactionId);
      break;

    case 'transaction.failed':
      await handleTransactionFailed(walletTx, event, transactionId);
      break;

    default:
      console.log(`[FedaPay Webhook] Unhandled event type: ${event.event}, status: ${event.status}`);
      // For other statuses (pending, processing), just update the wallet tx
      if (event.status === 'completed' && walletTx.type === 'escrow_fund' && transactionId) {
        // Fallback: if status is completed but event wasn't 'approved', still fund escrow
        await fundEscrow(transactionId, walletTx.userId);
      }
      break;
  }

  return { processed: true, event: event.event, status: event.status, reference: providerRef };
}

/**
 * Handle transaction.approved — Payment was successful.
 * Fund the escrow account and notify buyer/seller.
 */
async function handleTransactionApproved(
  walletTx: { id: string; userId: string; type: string; amount: number; currency: string },
  event: { amount: number; status: PaymentStatus },
  transactionId: string | undefined,
  propertyId: string | undefined
) {
  console.log(`[FedaPay Webhook] Transaction APPROVED — funding escrow for tx: ${transactionId || 'N/A'}`);

  if (walletTx.type === 'escrow_fund' && transactionId) {
    await fundEscrow(transactionId, walletTx.userId);
  }

  // Send notification to buyer
  await sendPaymentNotification(
    walletTx.userId,
    'Paiement confirmé',
    `Votre paiement de ${Math.abs(walletTx.amount).toLocaleString('fr-FR')} ${walletTx.currency} a été confirmé. Les fonds sont maintenant en escrow.`,
    'transaction',
    'transactions',
    '/escrow'
  );

  // Notify the seller if we have a transaction record
  if (transactionId) {
    try {
      const transaction = await db.transaction.findUnique({
        where: { id: transactionId },
        select: { sellerId: true },
      });

      if (transaction && transaction.sellerId !== walletTx.userId) {
        await sendPaymentNotification(
          transaction.sellerId,
          'Fonds reçus en escrow',
          `Un paiement de ${Math.abs(walletTx.amount).toLocaleString('fr-FR')} ${walletTx.currency} a été déposé en escrow pour votre propriété.`,
          'transaction',
          'transactions',
          '/escrow'
        );
      }
    } catch {
      // Non-critical
    }
  }
}

/**
 * Handle transaction.declined — Payment was declined by the provider.
 * Notify buyer and update transaction status.
 */
async function handleTransactionDeclined(
  walletTx: { id: string; userId: string; type: string; amount: number; currency: string },
  _event: { amount: number; status: PaymentStatus },
  transactionId: string | undefined
) {
  console.log(`[FedaPay Webhook] Transaction DECLINED for tx: ${transactionId || 'N/A'}`);

  // Reset the transaction status so buyer can retry
  if (transactionId) {
    try {
      const transaction = await db.transaction.findUnique({
        where: { id: transactionId },
        select: { status: true },
      });

      if (transaction && !['RELEASED', 'REFUNDED', 'CANCELLED'].includes(transaction.status)) {
        await db.transaction.update({
          where: { id: transactionId },
          data: { status: 'CREATED' },
        });
      }
    } catch {
      // Non-critical
    }
  }

  // Notify buyer
  await sendPaymentNotification(
    walletTx.userId,
    'Paiement refusé',
    `Votre paiement de ${Math.abs(walletTx.amount).toLocaleString('fr-FR')} ${walletTx.currency} a été refusé. Veuillez vérifier vos informations et réessayer.`,
    'alert',
    'transactions',
    '/payment/retry'
  );
}

/**
 * Handle transaction.failed — Payment failed (technical error, timeout, etc.).
 * Notify buyer and update transaction status.
 */
async function handleTransactionFailed(
  walletTx: { id: string; userId: string; type: string; amount: number; currency: string },
  _event: { amount: number; status: PaymentStatus },
  transactionId: string | undefined
) {
  console.log(`[FedaPay Webhook] Transaction FAILED for tx: ${transactionId || 'N/A'}`);

  // Reset the transaction status so buyer can retry
  if (transactionId) {
    try {
      const transaction = await db.transaction.findUnique({
        where: { id: transactionId },
        select: { status: true },
      });

      if (transaction && !['RELEASED', 'REFUNDED', 'CANCELLED'].includes(transaction.status)) {
        await db.transaction.update({
          where: { id: transactionId },
          data: { status: 'CREATED' },
        });
      }
    } catch {
      // Non-critical
    }
  }

  // Notify buyer
  await sendPaymentNotification(
    walletTx.userId,
    'Paiement échoué',
    `Votre paiement de ${Math.abs(walletTx.amount).toLocaleString('fr-FR')} ${walletTx.currency} a échoué pour des raisons techniques. Veuillez réessayer.`,
    'alert',
    'transactions',
    '/payment/retry'
  );
}

/**
 * Fund the escrow account for a transaction.
 * Called when payment is confirmed as successful.
 */
async function fundEscrow(transactionId: string, userId: string) {
  try {
    // Check if already funded to prevent duplicate funding
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      select: { status: true },
    });

    if (!transaction) {
      console.warn(`[FedaPay Webhook] Transaction ${transactionId} not found for escrow funding`);
      return;
    }

    if (transaction.status === 'FUNDED' || transaction.status === 'NOTARY_ASSIGNED'
      || transaction.status === 'GEO_VERIFIED' || transaction.status === 'DEED_SIGNED'
      || transaction.status === 'ANDF_REGISTERED' || transaction.status === 'RELEASED') {
      console.log(`[FedaPay Webhook] Transaction ${transactionId} already at status ${transaction.status}, skipping escrow funding`);
      return;
    }

    // Import escrow engine dynamically to avoid circular deps
    const { transition } = await import('../escrow-engine');
    await transition(transactionId, 'FUNDED', userId, 'Paiement FedaPay confirmé — Fonds déposés en escrow');

    console.log(`[FedaPay Webhook] Escrow FUNDED for transaction ${transactionId}`);
  } catch (error) {
    console.error(`[FedaPay Webhook] Escrow funding failed for transaction ${transactionId}:`, error);
  }
}

/**
 * Send a notification to a user about a payment event.
 */
async function sendPaymentNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  category: string,
  actionUrl: string
) {
  try {
    await db.notification.create({
      data: {
        userId,
        type,
        category,
        title,
        message,
        actionUrl,
        channels: JSON.stringify(['push', 'email']),
      },
    });
  } catch (error) {
    // Non-critical — don't fail the webhook
    console.warn('[FedaPay Webhook] Failed to send notification:', error);
  }
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
