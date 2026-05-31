import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth({
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

      // Other protected routes just require authentication
      return !!token;
    },
  },
});

// Note: Security features (rate limiting, CORS, security headers, honeypot detection)
// are applied in the following ways:
// 1. Rate limiting — via withRateLimit() wrapper in individual API routes
// 2. CORS — via getCorsHeaders() in API routes
// 3. Security headers — via getSecurityHeaders() in API routes
// 4. Honeypot detection — via checkHoneypot() in form-handling API routes
// 5. RBAC — via requirePermission() in API routes
// 6. Tenant guard — via addTenantFilter() in data-access API routes
//
// This approach is necessary because Next.js middleware with `withAuth`
// runs before the request reaches the API route, and adding additional
// response processing would conflict with the auth middleware.

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
