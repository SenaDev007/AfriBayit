// AfriBayit — Rate Limiting Middleware
// Redis-backed rate limiting with in-memory fallback
// Supports distributed rate limiting when Upstash Redis is configured

import { isRedisAvailable } from '@/lib/cache/redis';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of limits) {
      if (now > entry.resetAt) {
        limits.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number; // seconds until reset if not allowed
}

/**
 * Check if a request should be rate limited (in-memory backend)
 */
function rateLimitMemory(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = limits.get(key);

  if (!entry || now > entry.resetAt) {
    // New window or expired
    const resetAt = now + windowMs;
    limits.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Check if a request should be rate limited (Redis backend)
 * Uses Redis INCR + EXPIRE for distributed rate limiting
 */
async function rateLimitRedis(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const { getRedisClient } = await import('@/lib/cache/redis');
  const redis = getRedisClient();

  if (!redis) {
    return rateLimitMemory(key, maxRequests, windowSeconds * 1000);
  }

  const redisKey = `ratelimit:${key}`;
  const now = Date.now();
  const resetAt = now + windowSeconds * 1000;

  try {
    // Use Redis pipeline for atomic INCR + EXPIRE
    const count = await redis.incr(redisKey);

    // Set expiry on first request in window
    if (count === 1) {
      await redis.expire(redisKey, windowSeconds);
    }

    // Get remaining TTL to calculate resetAt
    const ttl = await redis.ttl(redisKey);
    const actualResetAt = ttl > 0 ? now + ttl * 1000 : resetAt;

    if (count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: actualResetAt,
        retryAfter: ttl > 0 ? ttl : Math.ceil(windowSeconds),
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - count,
      resetAt: actualResetAt,
    };
  } catch (error) {
    console.error('Redis rate limit error, falling back to memory:', error);
    return rateLimitMemory(key, maxRequests, windowSeconds * 1000);
  }
}

/**
 * Check if a request should be rate limited.
 * Uses Redis when available, falls back to in-memory.
 */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (isRedisAvailable()) {
    return rateLimitRedis(key, maxRequests, Math.ceil(windowMs / 1000));
  }
  return rateLimitMemory(key, maxRequests, windowMs);
}

/**
 * Synchronous rate limit check (in-memory only, for backwards compatibility)
 * @deprecated Use the async rateLimit() function instead
 */
export function rateLimitSync(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  return rateLimitMemory(key, maxRequests, windowMs);
}

/**
 * Rate limit configurations per route type
 */
export const RATE_LIMIT_CONFIGS = {
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },       // 5 per 15 min
  api: { maxRequests: 100, windowMs: 60 * 1000 },            // 100 per min
  search: { maxRequests: 30, windowMs: 60 * 1000 },          // 30 per min
  payment: { maxRequests: 10, windowMs: 60 * 1000 },         // 10 per min
  admin: { maxRequests: 200, windowMs: 60 * 1000 },          // 200 per min
  upload: { maxRequests: 20, windowMs: 60 * 1000 },          // 20 per min
  messaging: { maxRequests: 30, windowMs: 60 * 1000 },       // 30 per min
  notification: { maxRequests: 60, windowMs: 60 * 1000 },    // 60 per min
  checkin: { maxRequests: 20, windowMs: 60 * 1000 },         // 20 per min (QR check-in)
  payout: { maxRequests: 5, windowMs: 60 * 1000 },           // 5 per min (payout operations)
} as const;

/**
 * Get rate limit key from request
 */
export function getRateLimitKey(
  request: Request,
  userId?: string
): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  return userId ? `user:${userId}` : `ip:${ip}`;
}

/**
 * Determine rate limit config based on route path
 */
export function getRateLimitConfigForPath(path: string): {
  maxRequests: number;
  windowMs: number;
} {
  if (path.startsWith('/api/auth')) return RATE_LIMIT_CONFIGS.auth;
  if (path.startsWith('/api/escrow') || path.startsWith('/api/wallet') || path.startsWith('/api/transactions')) return RATE_LIMIT_CONFIGS.payment;
  if (path.startsWith('/api/payouts')) return RATE_LIMIT_CONFIGS.payout;
  if (path.startsWith('/api/checkin')) return RATE_LIMIT_CONFIGS.checkin;
  if (path.startsWith('/api/properties') && path.includes('search')) return RATE_LIMIT_CONFIGS.search;
  if (path.startsWith('/api/admin')) return RATE_LIMIT_CONFIGS.admin;
  if (path.startsWith('/api/messages') || path.startsWith('/api/chat')) return RATE_LIMIT_CONFIGS.messaging;
  if (path.startsWith('/api/notifications')) return RATE_LIMIT_CONFIGS.notification;
  if (path.includes('upload')) return RATE_LIMIT_CONFIGS.upload;
  return RATE_LIMIT_CONFIGS.api;
}

/**
 * Middleware helper that wraps an API handler with rate limiting
 */
export function withRateLimit(
  handler: (request: Request, context?: unknown) => Promise<Response>,
  maxRequests?: number,
  windowMs?: number
) {
  return async (request: Request, context?: unknown): Promise<Response> => {
    const path = new URL(request.url).pathname;
    const config = maxRequests && windowMs
      ? { maxRequests, windowMs }
      : getRateLimitConfigForPath(path);

    const key = getRateLimitKey(request);
    const result = await rateLimit(
      `rate:${key}:${path}`,
      config.maxRequests,
      config.windowMs
    );

    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Trop de requêtes. Veuillez réessayer plus tard.',
          code: 'RATE_LIMITED',
          retryAfter: result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
            'Retry-After': String(result.retryAfter),
          },
        }
      );
    }

    const response = await handler(request, context);

    // Add rate limit headers to response
    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Remaining', String(result.remaining));
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
    }

    return response;
  };
}
