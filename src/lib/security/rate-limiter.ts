// AfriBayit — Rate Limiting Middleware
// Redis-based rate limiting with in-memory fallback
// Uses Upstash Redis REST API for serverless-compatible distributed rate limiting

import { redis, isRedisConfigured } from '@/lib/redis';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number; // seconds until reset if not allowed
}

// ─── In-Memory Fallback (used when Redis is not configured) ──────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryLimits = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryLimits) {
      if (now > entry.resetAt) {
        memoryLimits.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

/**
 * Check if a request should be rate limited.
 * Uses Redis sliding window when available, in-memory fixed window as fallback.
 */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (isRedisConfigured) {
    return redisRateLimit(key, maxRequests, windowMs);
  }
  return memoryRateLimit(key, maxRequests, windowMs);
}

/**
 * Redis-based sliding window rate limiter using INCR + EXPIRE.
 * Distributed across all instances — works in serverless.
 */
async function redisRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redisKey = `ratelimit:${key}`;
  const windowSec = Math.ceil(windowMs / 1000);
  const now = Date.now();

  try {
    // Use INCR to atomically increment the counter
    const count = await redis.incr(redisKey);

    // Set expiry only on first request in this window
    if (count === 1) {
      await redis.expire(redisKey, windowSec);
    }

    // Get the TTL to calculate resetAt
    const ttl = await redis.ttl(redisKey);
    const resetAt = ttl > 0 ? now + ttl * 1000 : now + windowMs;

    if (count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1000)),
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - count,
      resetAt,
    };
  } catch (error) {
    // If Redis fails, fall back to in-memory
    console.warn('[rate-limiter] Redis error, falling back to in-memory:', error);
    return memoryRateLimit(key, maxRequests, windowMs);
  }
}

/**
 * In-memory fixed window rate limiter.
 * Used as fallback when Redis is not configured or fails.
 */
function memoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = memoryLimits.get(key);

  if (!entry || now > entry.resetAt) {
    // New window or expired
    const resetAt = now + windowMs;
    memoryLimits.set(key, { count: 1, resetAt });
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
 * Rate limit configurations per route type
 */
export const RATE_LIMIT_CONFIGS = {
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },       // 5 per 15 min
  authRegister: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
  authLogin: { maxRequests: 10, windowMs: 15 * 60 * 1000 },   // 10 per 15 min
  authPasswordReset: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
  api: { maxRequests: 100, windowMs: 60 * 1000 },            // 100 per min
  search: { maxRequests: 30, windowMs: 60 * 1000 },          // 30 per min
  payment: { maxRequests: 10, windowMs: 60 * 1000 },         // 10 per min
  admin: { maxRequests: 200, windowMs: 60 * 1000 },          // 200 per min
  upload: { maxRequests: 20, windowMs: 60 * 1000 },          // 20 per min
  messaging: { maxRequests: 30, windowMs: 60 * 1000 },       // 30 per min
  notification: { maxRequests: 60, windowMs: 60 * 1000 },    // 60 per min
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
  if (path.startsWith('/api/auth/register')) return RATE_LIMIT_CONFIGS.authRegister;
  if (path.startsWith('/api/auth/otp') || path.includes('password-reset') || path.includes('reset-password')) return RATE_LIMIT_CONFIGS.authPasswordReset;
  if (path.startsWith('/api/auth') && path.includes('callback')) return RATE_LIMIT_CONFIGS.authLogin;
  if (path.startsWith('/api/auth')) return RATE_LIMIT_CONFIGS.auth;
  if (path.startsWith('/api/escrow') || path.startsWith('/api/wallet') || path.startsWith('/api/transactions')) return RATE_LIMIT_CONFIGS.payment;
  if (path.startsWith('/api/properties') && path.includes('search')) return RATE_LIMIT_CONFIGS.search;
  if (path.startsWith('/api/admin')) return RATE_LIMIT_CONFIGS.admin;
  if (path.startsWith('/api/messages') || path.startsWith('/api/chat')) return RATE_LIMIT_CONFIGS.messaging;
  if (path.startsWith('/api/notifications')) return RATE_LIMIT_CONFIGS.notification;
  if (path.includes('upload')) return RATE_LIMIT_CONFIGS.upload;
  return RATE_LIMIT_CONFIGS.api;
}

/**
 * Middleware helper that wraps an API handler with rate limiting.
 * Now async to support Redis-based rate limiting.
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
      `${key}:${path}`,
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
