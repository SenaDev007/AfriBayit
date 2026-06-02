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
 *
 * Flow:
 * 1. Find all payouts with status 'scheduled' and scheduledAt <= now
 * 2. Process each one via the appropriate payment provider
 * 3. Update status and record confirmation
 * 4. Retry failed payouts that haven't exceeded max retries
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
      scheduledAt: {
        lte: now,
      },
    },
    orderBy: {
      scheduledAt: 'asc',
    },
    take: 50, // Process max 50 per run to avoid timeout
  });

  result.total = duePayouts.length;

  for (const payout of duePayouts) {
    try {
      // Skip if retry count exceeded
      if (payout.retryCount >= payout.maxRetries) {
        await db.scheduledPayout.update({
          where: { id: payout.id },
          data: { status: 'failed', failureReason: 'Max retries exceeded' },
        });
        result.skipped++;
        result.details.push({
          payoutId: payout.id,
          status: 'skipped',
          error: 'Max retries exceeded',
        });
        continue;
      }

      // Process the payout
      const processResult = await processPayout(payout.id);
      result.processed++;

      if (processResult.success) {
        result.succeeded++;
        result.details.push({
          payoutId: payout.id,
          status: 'completed',
        });
      } else {
        result.failed++;
        result.details.push({
          payoutId: payout.id,
          status: 'failed',
          error: processResult.error,
        });
      }
    } catch (error) {
      result.failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.details.push({
        payoutId: payout.id,
        status: 'failed',
        error: errorMessage,
      });
    }

    // Add a small delay between payouts to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return result;
}
