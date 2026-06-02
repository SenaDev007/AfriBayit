// AfriBayit — API Middleware Layer
// Composable middleware chain for consistent API request/response handling

import { NextRequest, NextResponse } from 'next/server';

// ─── Types ─────────────────────────────────────────────────────────────────

type MiddlewareHandler = (
  request: NextRequest,
  context: Record<string, unknown>
) => Promise<NextResponse | null>; // null = pass to next

// ─── Middleware Composition ────────────────────────────────────────────────

/**
 * Compose multiple middleware handlers into a single chain.
 * Each handler runs in order; if any returns a NextResponse, the chain short-circuits.
 * If all pass (return null), the final result is null, meaning the route handler should proceed.
 */
export function composeMiddleware(...handlers: MiddlewareHandler[]) {
  return async (request: NextRequest, context: Record<string, unknown> = {}) => {
    for (const handler of handlers) {
      const result = await handler(request, context);
      if (result) return result; // Short-circuit if middleware returns response
    }
    return null; // All passed
  };
}

// ─── CORS Middleware ───────────────────────────────────────────────────────

/**
 * CORS middleware for cross-origin API access.
 * Handles preflight OPTIONS requests and sets CORS headers on responses.
 */
export function corsMiddleware(allowedOrigins: string[] = ['*']): MiddlewareHandler {
  return async (request) => {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigins.includes('*') ? '*' : allowedOrigins[0],
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    return null;
  };
}

// ─── Request ID Middleware ─────────────────────────────────────────────────

/**
 * Attaches a unique request ID to the context for tracing and logging.
 * Uses X-Request-ID header if provided, otherwise generates a UUID.
 */
export function requestIdMiddleware(): MiddlewareHandler {
  return async (request, context) => {
    const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
    context.requestId = requestId;
    return null;
  };
}

// ─── Rate Limit Middleware ─────────────────────────────────────────────────

/**
 * Simple in-memory rate limiter middleware.
 * Tracks requests per IP within a time window.
 * For production, use Redis-backed rate limiting.
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimitMiddleware(options?: {
  maxRequests?: number;
  windowMs?: number;
}): MiddlewareHandler {
  const maxRequests = options?.maxRequests ?? 60;
  const windowMs = options?.windowMs ?? 60_000; // 1 minute

  return async (request) => {
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const now = Date.now();

    const entry = rateLimitStore.get(ip);
    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
      return null;
    }

    entry.count++;
    if (entry.count > maxRequests) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Too many requests. Please try again later.',
            code: 'RATE_LIMITED',
            status: 429,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      );
    }

    return null;
  };
}

// ─── Auth Validation Middleware ────────────────────────────────────────────

/**
 * Validates that the request includes a valid Authorization header.
 * This is a basic check — extend with JWT verification as needed.
 */
export function authMiddleware(): MiddlewareHandler {
  return async (request) => {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Authentication required. Provide a valid Bearer token.',
            code: 'UNAUTHORIZED',
            status: 401,
          },
          meta: { timestamp: new Date().toISOString() },
        },
        { status: 401 }
      );
    }
    return null;
  };
}

// ─── Logging Middleware ────────────────────────────────────────────────────

/**
 * Logs API requests with method, path, and timing information.
 */
export function loggingMiddleware(): MiddlewareHandler {
  return async (request, context) => {
    const start = Date.now();
    const method = request.method;
    const url = new URL(request.url);
    context._loggingStart = start;

    // We can't easily wrap the response here, but we log the request
    console.log(
      `[API] ${method} ${url.pathname}${url.search} — requestId: ${context.requestId || 'n/a'}`
    );

    return null;
  };
}

// ─── Response Wrappers ────────────────────────────────────────────────────

/**
 * Wrap successful data in a consistent API response format.
 */
export function apiResponse<T>(data: T, status = 200, meta?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: status < 400,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: meta?.requestId,
        ...meta,
      },
    },
    { status }
  );
}

/**
 * Wrap error information in a consistent API error format.
 */
export function apiError(message: string, status = 400, code?: string) {
  return NextResponse.json(
    {
      success: false,
      error: { message, code, status },
      meta: { timestamp: new Date().toISOString() },
    },
    { status }
  );
}

/**
 * Create a paginated API response with metadata.
 */
export function apiPaginatedResponse<T>(
  data: T[],
  pagination: { page: number; limit: number; total: number; pages: number },
  meta?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      success: true,
      data,
      pagination,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: meta?.requestId,
        ...meta,
      },
    },
    { status: 200 }
  );
}
