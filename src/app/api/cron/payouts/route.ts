// AfriBayit — GET /api/cron/payouts
// Cron endpoint to process scheduled payouts
// Protected by CRON_SECRET to prevent unauthorized access
// Can be called by Vercel Cron or external scheduler

import { NextResponse } from 'next/server';
import { processScheduledPayouts } from '@/lib/payments/payout-cron';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const providedSecret = authHeader?.replace('Bearer ', '') ||
        new URL(request.url).searchParams.get('secret');

      if (providedSecret !== cronSecret) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'INVALID_CRON_SECRET' },
          { status: 401 }
        );
      }
    }

    // Process scheduled payouts
    const result = await processScheduledPayouts();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error('Payout cron error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process payouts';
    return NextResponse.json(
      { error: message, code: 'CRON_ERROR' },
      { status: 500 }
    );
  }
}
