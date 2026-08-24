import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { processScheduledPayouts } from '@/lib/payments/payout-cron';

export const dynamic = 'force-dynamic';

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try { return timingSafeEqual(Buffer.from(a), Buffer.from(b)); } catch { return a === b; }
}

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || cronSecret.length < 16) {
      console.error('[cron/payouts] CRON_SECRET missing or too short. Refusing.');
      return NextResponse.json({ error: 'CRON_SECRET not configured', code: 'CRON_NOT_CONFIGURED' }, { status: 503 });
    }
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '') || new URL(request.url).searchParams.get('secret') || '';
    if (!providedSecret || !safeEqual(providedSecret, cronSecret)) return NextResponse.json({ error: 'Unauthorized', code: 'INVALID_CRON_SECRET' }, { status: 401 });
    const result = await processScheduledPayouts();
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), ...result });
  } catch (error) { console.error('Payout cron error:', error); return NextResponse.json({ error: 'Failed', code: 'CRON_ERROR' }, { status: 500 }); }
}
