import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/security/rate-limiter';

// Create the NextAuth handler
const handler = NextAuth(authOptions);

// Wrap with login rate limiting: 20 attempts per IP per 15 minutes
async function rateLimitedHandler(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  // Only rate limit POST requests (sign-in attempts)
  // Exclude OAuth callback paths from rate limiting
  const url = new URL(req.url);
  const isOAuthCallback = url.pathname.includes('/callback/');

  if (req.method === 'POST' && !isOAuthCallback) {
    const rlKey = getRateLimitKey(req);
    const rlResult = rateLimit(`login:${rlKey}`, 20, 15 * 60 * 1000);
    if (!rlResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
          code: 'RATE_LIMITED',
          retryAfter: rlResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rlResult.retryAfter),
          },
        }
      );
    }
  }

  return handler(req, ctx);
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };
