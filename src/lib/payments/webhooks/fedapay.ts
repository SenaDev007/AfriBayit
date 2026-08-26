// AfriBayit — FedaPay Webhook Handler
// Processes incoming webhook events from FedaPay
// Handles: transaction.approved/declined/failed (payments IN)
//          payout.approved/failed/processing (payouts OUT)
// Uses WebhookEvent table for event-id idempotency (CDC §7B.5)

import { processWebhook } from '../index';
import { db } from '@/lib/db';
import type { PaymentProvider, PaymentStatus } from '../types';

/**
 * Process a FedaPay webhook event.
 * Implements event-id idempotency: if the same event has been processed
 * before, it returns the previous result without re-processing.
 */
export async function handleFedaPayWebhook(
  payload: unknown,
  headers: Record<string, string>
) {
  // Parse and validate the webhook event
  const event = await processWebhook('fedapay' as PaymentProvider, payload, headers);

  // Extract event ID for idempotency (FedaPay uses the transaction/payout ID + event type)
  const providerRef = event.reference;
  if (!providerRef) {
    console.warn('[FedaPay Webhook] No reference in event');
    return { processed: false, reason: 'No reference' };
  }

  // Build a unique event ID: provider + ref + event type
  const externalEventId = `fedapay_${event.event}_${providerRef}`;

  // ---- IDEMPOTENCY CHECK (CDC §7B.5) ----
  // Check if this event has already been processed
  const existingEvent = await db.webhookEvent.findUnique({
    where: { externalEventId },
  });

  if (existingEvent && existingEvent.status === 'processed') {
    console.info(`[FedaPay Webhook] Event ${externalEventId} already processed — skipping`);
    return { processed: true, duplicate: true, event: event.event, status: event.status, reference: providerRef };
  }

  // Store the event in the WebhookEvent table (or update if it exists but wasn't processed)
  const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const signature = headers['x-fedapay-signature'] || headers['x-fedaPay-signature'] || headers['x-feda-pay-signature'] || null;

  await db.webhookEvent.upsert({
    where: { externalEventId },
    create: {
      provider: 'fedapay',
      externalEventId,
      eventType: event.event,
      payload: rawBody.substring(0, 10000), // Truncate to avoid DB bloat
      signature,
      status: 'received',
    },
    update: {
      status: 'received',
      errorMessage: null,
    },
  });

  console.info(`[FedaPay Webhook] Processing event: ${event.event}, ref: ${providerRef}, status: ${event.status}`);

  try {
    // Route to the correct handler based on event type
    if (event.event.startsWith('transaction.')) {
      await handleTransactionEvent(event, providerRef);
    } else if (event.event.startsWith('payout.')) {
      await handlePayoutEvent(event, providerRef);
    } else {
      console.info(`[FedaPay Webhook] Unhandled event type: ${event.event}`);
    }

    // Mark as processed
    await db.webhookEvent.update({
      where: { externalEventId },
      data: { status: 'processed', processedAt: new Date() },
    });

    return { processed: true, event: event.event, status: event.status, reference: providerRef };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Mark as failed
    await db.webhookEvent.update({
      where: { externalEventId },
      data: { status: 'failed', errorMessage },
    });

    console.error(`[FedaPay Webhook] Event processing failed: ${errorMessage}`);
    throw error; // Re-throw so the route handler can decide the response
  }
}

// ============ TRANSACTION EVENTS (payments IN) ============

/**
 * Handle transaction.* events — buyer payments (escrow funding, bookings, etc.)
 */
async function handleTransactionEvent(
  event: { event: string; reference: string; status: PaymentStatus; amount: number; metadata?: Record<string, unknown> },
  providerRef: string
) {
  // Find the wallet transaction by provider reference
  const walletTx = await db.walletTransaction.findFirst({
    where: { providerRef },
  });

  if (!walletTx) {
    console.warn(`[FedaPay Webhook] No wallet transaction found for providerRef: ${providerRef}`);
    return;
  }

  const existingMetadata = walletTx.metadata
    ? (walletTx.metadata as Record<string, unknown>)
    : {};
  const transactionId = (existingMetadata.transactionId as string) || (existingMetadata.reference as string | undefined);
  const propertyId = existingMetadata.propertyId as string | undefined;

  // Update the wallet transaction status
  const walletStatus = mapPaymentStatusToWalletStatus(event.status);
  await db.walletTransaction.update({
    where: { id: walletTx.id },
    data: {
      status: walletStatus,
      metadata: {
        ...existingMetadata,
        webhookEvent: event.event,
        webhookStatus: event.status,
        processedAt: new Date().toISOString(),
      } as any,
    },
  });

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
      // Fallback: if status is completed, fund escrow
      if (event.status === 'completed' && walletTx.type === 'escrow_fund' && transactionId) {
        await fundEscrow(transactionId, walletTx.userId);
      }
      break;
  }
}

// ============ PAYOUT EVENTS (payouts OUT) ============

/**
 * Handle payout.* events — seller/agent/artisan payouts via Mobile Money
 * Updates the ScheduledPayout record and credits/adjusts the wallet.
 */
async function handlePayoutEvent(
  event: { event: string; reference: string; status: PaymentStatus; amount: number; metadata?: Record<string, unknown> },
  providerRef: string
) {
  console.info(`[FedaPay Webhook] Payout event: ${event.event}, ref: ${providerRef}, status: ${event.status}`);

  // Find the scheduled payout by provider reference
  const payout = await db.scheduledPayout.findFirst({
    where: { providerRef },
  });

  if (!payout) {
    console.warn(`[FedaPay Webhook] No scheduled payout found for providerRef: ${providerRef}`);
    return;
  }

  switch (event.event) {
    case 'payout.approved':
    case 'payout.completed':
      await handlePayoutApproved(payout, event);
      break;
    case 'payout.failed':
    case 'payout.declined':
      await handlePayoutFailed(payout, event);
      break;
    case 'payout.processing':
    case 'payout.pending':
      await handlePayoutProcessing(payout, event);
      break;
    default:
      console.info(`[FedaPay Webhook] Unhandled payout event: ${event.event}`);
      break;
  }
}

/**
 * Handle payout.approved — the seller received the Mobile Money transfer.
 */
async function handlePayoutApproved(
  payout: { id: string; recipientId: string; amount: number; currency: string; transactionId: string | null },
  event: { event: string; reference: string; status: PaymentStatus; amount: number }
) {
  console.info(`[FedaPay Webhook] Payout APPROVED — payoutId: ${payout.id}, recipient: ${payout.recipientId}`);

  // Update the scheduled payout record
  await db.scheduledPayout.update({
    where: { id: payout.id },
    data: {
      status: 'completed',
      processedAt: new Date(),
      confirmationRef: event.reference,
      updatedAt: new Date(),
    },
  });

  // Create a wallet transaction for the debit (money left the wallet)
  await db.walletTransaction.create({
    data: {
      userId: payout.recipientId,
      type: 'payout',
      amount: -Math.abs(payout.amount),
      balanceAfter: 0, // Will be updated below
      currency: payout.currency,
      status: 'completed',
      providerRef: event.reference,
      metadata: {
        payoutId: payout.id,
        event: event.event,
        confirmedViaWebhook: true,
      } as any,
    },
  });

  // Notify the recipient
  await sendPaymentNotification(
    payout.recipientId,
    'Virement reçu',
    `Votre virement de ${Math.abs(payout.amount).toLocaleString('fr-FR')} ${payout.currency} a été reçu sur votre compte Mobile Money.`,
    'transaction',
    'wallet',
    '/wallet'
  );
}

/**
 * Handle payout.failed — the Mobile Money transfer failed.
 * Refund the amount back to the seller's wallet and allow retry.
 */
async function handlePayoutFailed(
  payout: { id: string; recipientId: string; amount: number; currency: string; retryCount: number; maxRetries: number },
  event: { event: string; reference: string; status: PaymentStatus }
) {
  console.error(`[FedaPay Webhook] Payout FAILED — payoutId: ${payout.id}, recipient: ${payout.recipientId}`);

  const newRetryCount = payout.retryCount + 1;
  const canRetry = newRetryCount < payout.maxRetries;

  // Update the scheduled payout record
  await db.scheduledPayout.update({
    where: { id: payout.id },
    data: {
      status: canRetry ? 'scheduled' : 'failed',
      retryCount: newRetryCount,
      failureReason: `FedaPay payout failed: ${event.event}`,
      updatedAt: new Date(),
    },
  });

  // If no more retries, refund the amount back to the wallet
  if (!canRetry) {
    const user = await db.user.findUnique({
      where: { id: payout.recipientId },
      select: { walletBalance: true },
    });

    if (user) {
      const newBalance = Number(user.walletBalance) + Math.abs(payout.amount);
      await db.$transaction([
        db.user.update({
          where: { id: payout.recipientId },
          data: { walletBalance: newBalance },
        }),
        db.walletTransaction.create({
          data: {
            userId: payout.recipientId,
            type: 'payout_refund',
            amount: Math.abs(payout.amount),
            balanceAfter: newBalance,
            currency: payout.currency,
            status: 'completed',
            metadata: {
              originalPayoutId: payout.id,
              reason: 'Payout failed — amount refunded to wallet',
              retryCount: newRetryCount,
            } as any,
          },
        }),
      ]);
    }

    // Notify the recipient
    await sendPaymentNotification(
      payout.recipientId,
      'Virement échoué',
      `Votre virement de ${Math.abs(payout.amount).toLocaleString('fr-FR')} ${payout.currency} a échoué. Le montant a été recrédité sur votre wallet. Veuillez vérifier votre numéro Mobile Money et réessayer.`,
      'alert',
      'wallet',
      '/wallet'
    );
  }
}

/**
 * Handle payout.processing — the payout is in transit.
 */
async function handlePayoutProcessing(
  payout: { id: string; recipientId: string; amount: number; currency: string },
  event: { event: string; reference: string; status: PaymentStatus }
) {
  console.info(`[FedaPay Webhook] Payout PROCESSING — payoutId: ${payout.id}`);

  await db.scheduledPayout.update({
    where: { id: payout.id },
    data: {
      status: 'processing',
      providerRef: event.reference,
      updatedAt: new Date(),
    },
  });
}

// ============ TRANSACTION EVENT HANDLERS ============

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
  console.info(`[FedaPay Webhook] Transaction APPROVED — funding escrow for tx: ${transactionId || 'N/A'}`);

  if (walletTx.type === 'escrow_fund' && transactionId) {
    await fundEscrow(transactionId, walletTx.userId);
  }

  await sendPaymentNotification(
    walletTx.userId,
    'Paiement confirmé',
    `Votre paiement de ${Math.abs(walletTx.amount).toLocaleString('fr-FR')} ${walletTx.currency} a été confirmé. Les fonds sont maintenant en escrow.`,
    'transaction',
    'transactions',
    '/escrow'
  );

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
 */
async function handleTransactionDeclined(
  walletTx: { id: string; userId: string; type: string; amount: number; currency: string },
  _event: { amount: number; status: PaymentStatus },
  transactionId: string | undefined
) {
  console.info(`[FedaPay Webhook] Transaction DECLINED for tx: ${transactionId || 'N/A'}`);

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
 */
async function handleTransactionFailed(
  walletTx: { id: string; userId: string; type: string; amount: number; currency: string },
  _event: { amount: number; status: PaymentStatus },
  transactionId: string | undefined
) {
  console.info(`[FedaPay Webhook] Transaction FAILED for tx: ${transactionId || 'N/A'}`);

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

  await sendPaymentNotification(
    walletTx.userId,
    'Paiement échoué',
    `Votre paiement de ${Math.abs(walletTx.amount).toLocaleString('fr-FR')} ${walletTx.currency} a échoué pour des raisons techniques. Veuillez réessayer.`,
    'alert',
    'transactions',
    '/payment/retry'
  );
}

// ============ HELPERS ============

/**
 * Fund the escrow account for a transaction.
 */
async function fundEscrow(transactionId: string, userId: string) {
  try {
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      select: { status: true },
    });

    if (!transaction) {
      console.warn(`[FedaPay Webhook] Transaction ${transactionId} not found for escrow funding`);
      return;
    }

    // Check if already funded (idempotency at the transaction level)
    const activeStates = ['FUNDED', 'DOCS_VALIDATED', 'GEOTRUST_VALIDATED', 'NOTARY_ASSIGNED', 'NOTARY_IN_PROGRESS', 'DEED_SIGNED', 'ANDF_REGISTERED', 'RELEASED'];
    if (activeStates.includes(transaction.status) || transaction.status === 'GEO_VERIFIED') {
      console.info(`[FedaPay Webhook] Transaction ${transactionId} already at status ${transaction.status}, skipping escrow funding`);
      return;
    }

    const { transition } = await import('../escrow-engine');
    await transition(transactionId, 'FUNDED', userId, 'Paiement FedaPay confirmé — Fonds déposés en escrow');

    console.info(`[FedaPay Webhook] Escrow FUNDED for transaction ${transactionId}`);
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
        channels: ['push', 'email'] as any,
      },
    });
  } catch (error) {
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
