import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Keep-warm endpoint for Neon auto-suspend mitigation.
//
// Neon's free tier suspends the compute after ~5 minutes of inactivity; the
// next query then pays a ~10s wake-up. This route executes the cheapest
// possible statement (SELECT 1) so that:
//   1. external uptime pingers (cron-job.org, UptimeRobot…) can keep the
//      database awake with a scheduled GET every ~4 minutes,
//   2. the in-session beacon (src/components/providers/KeepWarmBeacon.tsx)
//      keeps the DB awake while a visitor browses the site.
//
// Contract:
//   - ALWAYS responds 200: a waking database is not an outage — the request
//     itself has done its job (it triggered the wake-up), and uptime monitors
//     must not page anyone over it. The body distinguishes awake vs waking.
//   - NEVER cached (no-store + force-dynamic): a cached keep-warm ping would
//     not touch the database and would keep nothing warm.
//   - No auth: the middleware only guards protected/admin API prefixes.

export const dynamic = 'force-dynamic'

export async function GET() {
  const startedAt = Date.now()
  try {
    await db.$queryRaw`SELECT 1`
    return NextResponse.json(
      { ok: true, db: 'awake', ms: Date.now() - startedAt },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    // The failed connection attempt still triggered the Neon wake-up; the
    // next ping will confirm. Report success so pingers stay quiet.
    return NextResponse.json(
      { ok: true, db: 'waking', ms: Date.now() - startedAt },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
