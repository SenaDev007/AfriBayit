// AfriBayit — Payout Cron Processor
// Processes scheduled payouts that are due for execution
// Called by /api/cron/payouts endpoint (Vercel Cron or external scheduler)

import { db } from '@/lib/db';
import { processPayout } from './payout-engine';

export interface CronProcessResult {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  details: Array<{
    payoutId: string;
    status: 'completed' | 'failed' | 'skipped';
    error?: string;
  }>;
}

/**
 * Process all scheduled payouts that are due.
 * Called by the cron endpoint on a schedule (every hour or every 15 minutes).
 */
export async function processScheduledPayouts(): Promise<CronProcessResult> {
  const now = new Date();

  const result: CronProcessResult = {
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  // Find all due scheduled payouts
  const duePayouts = await db.scheduledPayout.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: 'asc' },
    take: 50,
  });

  result.total = duePayouts.length;

  for (const payout of duePayouts) {
    try {
      if (payout.retryCount >= payout.maxRetries) {
        await db.scheduledPayout.update({
          where: { id: payout.id },
          data: { status: 'failed', failureReason: 'Max retries exceeded' },
        });
        result.skipped++;
        result.details.push({ payoutId: payout.id, status: 'skipped', error: 'Max retries exceeded' });
        continue;
      }

      const processResult = await processPayout(payout.id);
      result.processed++;

      if (processResult.success) {
        result.succeeded++;
        result.details.push({ payoutId: payout.id, status: 'completed' });
      } else {
        result.failed++;
        result.details.push({ payoutId: payout.id, status: 'failed', error: processResult.error });
      }
    } catch (error) {
      result.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.details.push({ payoutId: payout.id, status: 'failed', error: errorMessage });
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  // Also sync processing payouts (in case webhooks were missed)
  await syncProcessingPayouts();

  return result;
}

/**
 * Sync the status of payouts that are in 'processing' state.
 * Queries FedaPay API for the current status and updates the DB.
 * This is a safety net in case webhook delivery fails.
 */
async function syncProcessingPayouts(): Promise<void> {
  try {
    const processingPayouts = await db.scheduledPayout.findMany({
      where: {
        status: 'processing',
        providerRef: { not: null },
      },
      take: 20, // Limit per run
    });

    if (processingPayouts.length === 0) return;

    // Dynamically import to avoid circular deps
    const { getProvider } = await import('./index');
    const provider = getProvider('fedapay');

    for (const payout of processingPayouts) {
      try {
        if (!payout.providerRef) continue;

        // Use the verifyPayout method if available
        const fedapayProvider = provider as unknown as Record<string, unknown>;
        if (typeof fedapayProvider.verifyPayout !== 'function') continue;

        const statusResult = await fedapayProvider.verifyPayout(payout.providerRef);

        if (statusResult.status === 'completed') {
          // Payout was confirmed via API (webhook may have been missed)
          await db.scheduledPayout.update({
            where: { id: payout.id },
            data: {
              status: 'completed',
              processedAt: new Date(),
              confirmationRef: payout.providerRef,
              updatedAt: new Date(),
            },
          });
          console.info(`[Payout Sync] Payout ${payout.id} confirmed as completed via API`);
        } else if (statusResult.status === 'failed') {
          // Payout failed
          const newRetryCount = payout.retryCount + 1;
          await db.scheduledPayout.update({
            where: { id: payout.id },
            data: {
              status: newRetryCount >= payout.maxRetries ? 'failed' : 'scheduled',
              retryCount: newRetryCount,
              failureReason: 'FedaPay API reported failure',
              updatedAt: new Date(),
            },
          });
          console.info(`[Payout Sync] Payout ${payout.id} confirmed as failed via API`);
        }
        // If still pending/processing, leave as-is — will be checked again next run
      } catch (error) {
        // Non-critical — log and continue
        console.warn(`[Payout Sync] Failed to verify payout ${payout.id}:`, error instanceof Error ? error.message : error);
      }

      // Small delay between API calls
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  } catch (error) {
    console.error('[Payout Sync] Error syncing processing payouts:', error);
  }
}
