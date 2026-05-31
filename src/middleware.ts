import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for AfriBayit platform.
 *
 * Uses next-auth/middleware with withAuth when NEXTAUTH_SECRET is available.
 * If NEXTAUTH_SECRET is missing (e.g. on Vercel without env vars configured),
 * the middleware falls back to a simple public-route check that lets
 * unauthenticated users through to public pages only.
 */

// Public routes that never require authentication
const PUBLIC_ROUTES = [
  '/',
  '/search',
  '/auth/',
  '/property/',
  '/artisans',
  '/academy',
  '/hospitality',
  '/guesthouse',
  '/geotrust',
  '/community',
  '/notary',
];

// Routes that work in guest/demo mode (no auth redirect)
const GUEST_ACCESSIBLE_ROUTES = [
  '/dashboard',
  '/wallet',
  '/escrow',
  '/analytics',
];

// Protected route prefixes that require authentication
const PROTECTED_ROUTE_PREFIXES = [
  '/agent-dashboard',
  '/publish',
];

// Admin route prefixes that require admin role
const ADMIN_ROUTE_PREFIXES = [
  '/admin',
];

// Protected API route prefixes
const PROTECTED_API_PREFIXES = [
  '/api/wallet',
  '/api/escrow',
  '/api/subscriptions',
  '/api/transactions',
  '/api/chat',
  '/api/messages',
  '/api/favorites',
  '/api/kyc',
  '/api/notifications',
  '/api/profiles',
];

const ADMIN_API_PREFIXES = [
  '/api/admin',
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route.endsWith('/')) return pathname.startsWith(route);
    return pathname === route || pathname.startsWith(route + '/');
  });
}

function isProtectedRoute(pathname: string): boolean {
  return (
    PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

function isAdminRoute(pathname: string): boolean {
  return (
    ADMIN_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    ADMIN_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

/**
 * Lightweight middleware that runs when NEXTAUTH_SECRET is not available.
 * Allows public routes through, redirects protected routes to login.
 */
function fallbackMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes are always accessible
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // API routes that aren't in the protected list are public
  if (pathname.startsWith('/api/') && !isProtectedRoute(pathname) && !isAdminRoute(pathname)) {
    return NextResponse.next();
  }

  // Guest-accessible routes: allow through (pages handle guest mode internally)
  if (GUEST_ACCESSIBLE_ROUTES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Protected and admin routes: redirect to login (page routes) or return 401 (API routes)
  if (isAdminRoute(pathname) || isProtectedRoute(pathname)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Unknown routes: allow through (Next.js will 404 if they don't exist)
  return NextResponse.next();
}

// Try to use withAuth when NEXTAUTH_SECRET is available
async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dynamically import next-auth middleware
  const { withAuth } = await import('next-auth/middleware');

  return withAuth({
    pages: {
      signIn: '/auth/login',
    },
    callbacks: {
      authorized({ token, req }) {
        const path = req.nextUrl.pathname;

        // Admin routes require admin role or accreditation
        if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
          if (token?.role === 'admin') return true;
          const accreditationRole = (token as Record<string, unknown>)?.accreditationRole as string;
          if (accreditationRole === 'SUPER_ADMIN' || accreditationRole === 'COUNTRY_ADMIN') {
            return true;
          }
          return token?.role === 'admin';
        }

        // Guest-accessible routes: allow through even without token
        if (GUEST_ACCESSIBLE_ROUTES.some((prefix) => path.startsWith(prefix))) {
          return true;
        }

        // Other protected routes just require authentication
        return !!token;
      },
    },
  })(request as unknown as Parameters<ReturnType<typeof withAuth>>[0]) as NextResponse;
}

export async function middleware(request: NextRequest) {
  // Check if NEXTAUTH_SECRET is available
  const hasSecret = !!process.env.NEXTAUTH_SECRET;

  if (!hasSecret) {
    // Fall back to simple route-based middleware
    return fallbackMiddleware(request);
  }

  try {
    return await authMiddleware(request);
  } catch (error) {
    // If withAuth fails for any reason, fall back to simple middleware
    console.warn(
      '[AfriBayit] Auth middleware failed, using fallback. Error:',
      error instanceof Error ? error.message : error
    );
    return fallbackMiddleware(request);
  }
}

export const config = {
  matcher: [
    // Admin routes - require admin role
    '/admin/:path*',
    '/api/admin/:path*',
    // Protected routes - require authentication
    '/dashboard/:path*',
    '/agent-dashboard/:path*',
    '/wallet/:path*',
    '/publish/:path*',
    '/escrow/:path*',
    '/analytics/:path*',
    // API routes that need protection
    '/api/wallet/:path*',
    '/api/escrow/:path*',
    '/api/subscriptions/:path*',
    '/api/transactions/:path*',
    '/api/chat/:path*',
    '/api/messages/:path*',
    '/api/favorites/:path*',
    '/api/kyc/:path*',
    '/api/notifications/:path*',
    '/api/profiles/:path*',
  ],
};
