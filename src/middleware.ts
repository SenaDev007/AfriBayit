import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for AfriBayit platform.
 *
 * Handles two concerns:
 * 1. Subdomain-based country routing (multi-tenant isolation)
 * 2. Authentication & authorization (with next-auth when available)
 *
 * Subdomain mapping:
 *   bj.afri-bayit.vercel.app → BJ (Bénin)
 *   ci.afri-bayit.vercel.app → CI (Côte d'Ivoire)
 *   bf.afri-bayit.vercel.app → BF (Burkina Faso)
 *   tg.afri-bayit.vercel.app → TG (Togo)
 */

// ============================================================================
// Country Subdomain Configuration
// ============================================================================

const SUBDOMAIN_COUNTRY_MAP: Record<string, string> = {
  bj: 'BJ', // Bénin
  ci: 'CI', // Côte d'Ivoire
  bf: 'BF', // Burkina Faso
  tg: 'TG', // Togo
  sn: 'SN', // Sénégal (future)
};

// Hostnames that should NOT be checked for subdomains (e.g., localhost, Vercel preview)
const EXCLUDED_HOSTNAMES = ['localhost', '127.0.0.1', '0.0.0.0'];

// ============================================================================
// Route Protection Configuration
// ============================================================================

// Public routes that never require authentication
// Per CDC: the platform must be browsable without login.
// Only actions (publish, transact, admin) require auth.
const PUBLIC_ROUTES = [
  '/',
  '/search',
  '/acheter',
  '/louer',
  '/investir',
  '/auth/',
  '/property/',
  '/artisans',
  '/academy',
  '/geotrust',
  '/community',
  '/notary',
  '/short-term',
  '/booking',
  '/sejours',
  '/pro/',
  '/terms',
  '/privacy',
  '/about',
  '/help',
  '/blog',
  '/refund',
  '/partnership',
  '/delete-data',
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
  '/kyc',
  '/settings',
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
  '/api/user',
  '/api/auth/2fa',
  '/api/auth/oauth-unlink',
  '/api/auth/oauth-status',
  '/api/auth/verify-phone',
];

const ADMIN_API_PREFIXES = [
  '/api/admin',
];

// ============================================================================
// Subdomain Detection
// ============================================================================

/**
 * Detect the country from the request's subdomain, cookie, or URL parameter.
 * Priority:
 *   1. Subdomain (e.g., bj.afri-bayit.vercel.app)
 *   2. URL parameter ?country=BJ
 *   3. Existing cookie afribayit_country
 *   4. Default: null (no country override)
 */
function detectCountry(request: NextRequest): string | null {
  const hostname = request.headers.get('host') || '';

  // 1. Check subdomain
  // e.g., bj.afri-bayit.vercel.app → bj
  if (!EXCLUDED_HOSTNAMES.some((h) => hostname.startsWith(h))) {
    const parts = hostname.split('.');
    if (parts.length >= 3) {
      // Has a subdomain (e.g., bj.afri-bayit.vercel.app)
      const subdomain = parts[0].toLowerCase();
      const country = SUBDOMAIN_COUNTRY_MAP[subdomain];
      if (country) return country;
    }
  }

  // 2. Check URL parameter
  const countryParam = request.nextUrl.searchParams.get('country');
  if (countryParam) {
    const upper = countryParam.toUpperCase();
    if (Object.values(SUBDOMAIN_COUNTRY_MAP).includes(upper)) {
      return upper;
    }
  }

  // 3. Check existing cookie
  const cookieCountry = request.cookies.get('afribayit_country')?.value;
  if (cookieCountry && Object.values(SUBDOMAIN_COUNTRY_MAP).includes(cookieCountry)) {
    return cookieCountry;
  }

  // No country detected
  return null;
}

/**
 * Set the country cookie and header on the response.
 */
function setCountryContext(response: NextResponse, country: string): void {
  response.cookies.set('afribayit_country', country, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: 'lax',
  });
  response.headers.set('x-afribayit-country', country);
}

// ============================================================================
// Route Protection Helpers
// ============================================================================

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

// ============================================================================
// Fallback Auth Middleware (when NEXTAUTH_SECRET is not available)
// ============================================================================

function fallbackMiddleware(request: NextRequest): NextResponse {
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
    // Only set callbackUrl for non-admin protected routes
    // Admin routes should NOT be saved as callbackUrl since regular users
    // would be redirected back to a page they can't access
    if (!isAdminRoute(pathname)) {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // Unknown routes: allow through (Next.js will 404 if they don't exist)
  return NextResponse.next();
}

// ============================================================================
// Auth Middleware (when NEXTAUTH_SECRET is available)
// ============================================================================

async function authMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Public routes are ALWAYS accessible — skip NextAuth entirely
  // This is critical: withAuth's authorized callback redirects to login
  // when it returns false, so public routes must be handled BEFORE withAuth
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Non-protected, non-admin API routes are also public
  if (pathname.startsWith('/api/') && !isProtectedRoute(pathname) && !isAdminRoute(pathname)) {
    return NextResponse.next();
  }

  // Dynamically import next-auth middleware
  const { withAuth } = await import('next-auth/middleware');

  const authMiddleware = withAuth({
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
          return false; // Deny — not admin
        }

        // Protected routes require authentication
        if (isProtectedRoute(path)) {
          return !!token;
        }

        // Guest-accessible routes: allow through even without token
        if (GUEST_ACCESSIBLE_ROUTES.some((prefix) => path.startsWith(prefix))) {
          return true;
        }

        // All other routes: allow by default (public access per CDC)
        return true;
      },
    },
  });
  return (authMiddleware as unknown as (req: NextRequest) => NextResponse | Promise<NextResponse>)(request);
}

// ============================================================================
// Main Middleware
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Step 1: Subdomain/Country Detection ---
  const detectedCountry = detectCountry(request);

  // Skip country detection for API routes and static assets
  const isApiOrStatic =
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/auth/') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg');

  // --- Step 2: Auth/Route Protection ---
  let response: NextResponse;

  const hasSecret = !!process.env.NEXTAUTH_SECRET;

  if (!hasSecret) {
    response = fallbackMiddleware(request);
  } else {
    try {
      response = await authMiddleware(request);
    } catch (error) {
      console.warn(
        '[AfriBayit] Auth middleware failed, using fallback. Error:',
        error instanceof Error ? error.message : error
      );
      response = fallbackMiddleware(request);
    }
  }

  // --- Step 3: Set Country Context on Response ---
  // Always set the country cookie/header if we detected a country from subdomain
  // This ensures the frontend CountryContext can read it
  if (detectedCountry && !isApiOrStatic) {
    setCountryContext(response, detectedCountry);
  }

  // Also support ?country=BJ parameter on any page — set cookie and clean URL
  if (!isApiOrStatic) {
    const countryParam = request.nextUrl.searchParams.get('country');
    if (countryParam && Object.values(SUBDOMAIN_COUNTRY_MAP).includes(countryParam.toUpperCase())) {
      setCountryContext(response, countryParam.toUpperCase());
      // Optionally clean the URL by removing the country param
      // (keep other params intact)
      const cleanUrl = new URL(request.url);
      cleanUrl.searchParams.delete('country');
      // Don't redirect — just set the cookie and let the page load
      // The redirect would be a bad UX for SPA navigation
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static assets
    '/((?!_next/static|_next/image|favicon\\.ico|logo\\.png|robots\\.txt).*)',
  ],
};
