import { PrismaClient } from '@prisma/client'

// ─── Serverless connection tuning (Neon + Vercel) ──────────────────────────
// Neon's pooled endpoint (-pooler hostname) runs PgBouncer in TRANSACTION
// mode. Prisma uses prepared statements by default, which are incompatible
// with transaction pooling: under load this surfaces as intermittent
// "prepared statement does not exist" / "connection terminated" errors —
// i.e. random 500s on otherwise healthy routes. The fix (per Prisma + Neon
// docs) is `pgbouncer=true` (disables prepared statements) combined with a
// strict per-function connection budget.
//
// This is applied programmatically so production is resilient regardless of
// how DATABASE_URL was pasted into the Vercel dashboard. Idempotent: params
// are only added when missing, and local dev (no VERCEL) is untouched.

function tuneDatabaseUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl || !process.env.VERCEL) return rawUrl
  try {
    const url = new URL(rawUrl)
    const isNeon = url.hostname.endsWith('.neon.tech')
    if (!isNeon) return rawUrl

    const isPooled = url.hostname.includes('-pooler')
    if (isPooled) {
      // Pooled endpoint (transaction mode): disable prepared statements and
      // cap each serverless function instance at a single server connection.
      if (!url.searchParams.has('pgbouncer')) url.searchParams.set('pgbouncer', 'true')
      if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', '1')
    } else {
      // Direct endpoint: bound the pool so concurrent function instances
      // cannot exhaust the compute's max_connections, and give cold connects
      // enough time to survive the Neon resume (it can take several seconds).
      if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', '5')
      if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '15')
    }
    // Fail fast instead of hanging when the pool is saturated or Neon is
    // resuming after auto-suspend — the route's error path then answers
    // quickly and the browser retry (see api-client.ts) absorbs it.
    if (!url.searchParams.has('pool_timeout')) url.searchParams.set('pool_timeout', '10')
    return url.toString()
  } catch {
    // Malformed URL — leave it exactly as configured.
    return rawUrl
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const datasourceUrl = tuneDatabaseUrl(process.env.DATABASE_URL)

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: datasourceUrl ? { db: { url: datasourceUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
