// AfriBayit — Rate Limiting Middleware
// In-memory rate limiting with differentiated limits per route type

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of limits) {
    if (now > entry.resetAt) {
      limits.delete(key);
    }
  }
}, 10 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number; // seconds until reset if not allowed
}

/**
 * Check if a request should be rate limited
 */
export function rateLimit(
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
    const result = rateLimit(
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
