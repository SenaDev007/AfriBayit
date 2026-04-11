/**
 * In-memory rate limiter (§10.2.1 CDC)
 * Single-instance safe — upgrade to Redis (Upstash) for multi-instance prod
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Prune old entries every 5 minutes to avoid memory leak
setInterval(() => {
  const now = Date.now();
  store.forEach((v, k) => {
    if (now > v.resetAt) store.delete(k);
  });
}, 5 * 60 * 1000);

export type RateLimitResult =
  | { success: true }
  | { success: false; retryAfter: number };

/**
 * @param key      Unique key (e.g. "auth:1.2.3.4")
 * @param limit    Max requests per window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  entry.count++;
  if (entry.count > limit) {
    return { success: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  return { success: true };
}

/**
 * Pre-defined rate limit profiles matching CDC §10.2.1
 */
export const RATE_LIMITS = {
  /** Auth endpoints: 5 req/min */
  auth: (ip: string) => rateLimit(`auth:${ip}`, 5, 60_000),
  /** Anonymous API: 30 req/min */
  public: (ip: string) => rateLimit(`pub:${ip}`, 30, 60_000),
  /** Authenticated user: 100 req/min */
  user: (userId: string) => rateLimit(`usr:${userId}`, 100, 60_000),
  /** Sensitive endpoints (escrow, KYC): 10 req/hour */
  sensitive: (userId: string) => rateLimit(`sen:${userId}`, 10, 3_600_000),
  /** Premium agents: 200 req/min */
  premium: (userId: string) => rateLimit(`prm:${userId}`, 200, 60_000),
} as const;
