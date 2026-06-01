import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * AfriBayit Platform Middleware
 *
 * Handles:
 * 1. Subdomain-based tenant routing (bj.afribayit.com → country "BJ")
 * 2. Query param tenant override (?country=BJ)
 * 3. Country cookie management (afribayit_country)
 * 4. Authentication & authorization
 * 5. Route protection
 */

// ─── Tenant Configuration ─────────────────────────────────────────────────────────

// Supported subdomain-to-country mappings
const SUBDOMAIN_COUNTRY_MAP: Record<string, string> = {
  bj: 'BJ',
  ci: 'CI',
  bf: 'BF',
  tg: 'TG',
  sn: 'SN',
};

// Valid country codes
const VALID_COUNTRIES = new Set(['BJ', 'CI', 'BF', 'TG', 'SN']);

// Root domain (no subdomain) — landing page
const ROOT_DOMAINS = new Set([
  'afribayit.com',
  'www.afribayit.com',
  'localhost',
  '127.0.0.1',
]);

// ─── Route Protection ─────────────────────────────────────────────────────────────

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
  '/short-term',
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

// ─── Tenant Detection ─────────────────────────────────────────────────────────────

/**
 * Extracts the country code from the request's subdomain.
 * e.g., bj.afribayit.com → "BJ"
 *       localhost → null (no subdomain on localhost)
 */
function extractCountryFromSubdomain(hostname: string): string | null {
  // Handle localhost with port
  const host = hostname.split(':')[0];

  // Check if it's a root domain (no subdomain)
  if (ROOT_DOMAINS.has(host)) {
    return null;
  }

  // Check for subdomain pattern: xx.afribayit.com or xx.localhost
  const parts = host.split('.');

  // Need at least 3 parts for a subdomain (e.g., bj.afribayit.com)
  if (parts.length >= 3) {
    const subdomain = parts[0].toLowerCase();
    if (SUBDOMAIN_COUNTRY_MAP[subdomain]) {
      return SUBDOMAIN_COUNTRY_MAP[subdomain];
    }
  }

  // Handle localhost subdomains: bj.localhost, ci.localhost
  if (parts.length === 2 && parts[1] === 'localhost') {
    const subdomain = parts[0].toLowerCase();
    if (SUBDOMAIN_COUNTRY_MAP[subdomain]) {
      return SUBDOMAIN_COUNTRY_MAP[subdomain];
    }
  }

  return null;
}

/**
 * Extracts the country code from a query parameter.
 * e.g., ?country=BJ → "BJ"
 */
function extractCountryFromQuery(url: URL): string | null {
  const country = url.searchParams.get('country');
  if (country && VALID_COUNTRIES.has(country.toUpperCase())) {
    return country.toUpperCase();
  }
  return null;
}

/**
 * Extracts the country code from a cookie.
 */
function extractCountryFromCookie(request: NextRequest): string | null {
  const cookie = request.cookies.get('afribayit_country');
  if (cookie?.value && VALID_COUNTRIES.has(cookie.value.toUpperCase())) {
    return cookie.value.toUpperCase();
  }
  return null;
}

// ─── Auth Middleware ───────────────────────────────────────────────────────────────

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

// ─── Main Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // ─── Step 1: Tenant Detection ────────────────────────────────────────────

  // Priority: subdomain > query param > cookie > default (none)
  let country: string | null = extractCountryFromSubdomain(hostname);

  // Query param override (for testing)
  const queryCountry = extractCountryFromQuery(request.nextUrl);
  if (queryCountry) {
    country = queryCountry;
  }

  // Cookie fallback
  if (!country) {
    country = extractCountryFromCookie(request);
  }

  // ─── Step 2: Set Tenant Context ──────────────────────────────────────────

  const response = await (async () => {
    // Check if NEXTAUTH_SECRET is available
    const hasSecret = !!process.env.NEXTAUTH_SECRET;

    if (!hasSecret) {
      return fallbackMiddleware(request);
    }

    try {
      return await authMiddleware(request);
    } catch (error) {
      console.warn(
        '[AfriBayit] Auth middleware failed, using fallback. Error:',
        error instanceof Error ? error.message : error
      );
      return fallbackMiddleware(request);
    }
  })();

  // ─── Step 3: Inject Tenant Context into Response ─────────────────────────

  if (country && VALID_COUNTRIES.has(country)) {
    // Set/update the country cookie (1 year expiry)
    response.cookies.set('afribayit_country', country, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // Set the tenant header for API routes to read
    response.headers.set('x-tenant-country', country);
  }

  return response;
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
    // Tenant-related routes - need cookie/header injection
    '/search/:path*',
    '/property/:path*',
    '/artisans/:path*',
    '/hospitality/:path*',
    '/guesthouse/:path*',
    '/api/properties/:path*',
    '/api/artisans/:path*',
    '/api/hotels/:path*',
    '/api/guesthouses/:path*',
    '/api/notaries/:path*',
    '/api/courses/:path*',
    '/api/stats/:path*',
    '/api/search/:path*',
    '/api/short-term/:path*',
    // Home page
    '/',
  ],
};
