import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/auth/login',
  },
});

export const config = {
  matcher: [
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
