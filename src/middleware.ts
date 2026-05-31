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
        // Allow if user role is admin (legacy support)
        if (token?.role === 'admin') return true;

        // Allow if user has SUPER_ADMIN or COUNTRY_ADMIN accreditation
        // The accreditation check is done client-side and in API routes
        // For middleware, we check the role stored in the token
        const accreditationRole = (token as Record<string, unknown>)?.accreditationRole as string;
        if (accreditationRole === 'SUPER_ADMIN' || accreditationRole === 'COUNTRY_ADMIN') {
          return true;
        }

        // Fallback: allow admin role
        return token?.role === 'admin';
      }

      // Other protected routes just require authentication
      return !!token;
    },
  },
});

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
    '/api/favorites/:path*',
    '/api/kyc/:path*',
    '/api/notifications/:path*',
    '/api/profiles/:path*',
  ],
};
