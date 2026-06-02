import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/security/rate-limiter';

// Create the NextAuth handler
const handler = NextAuth(authOptions);

// Wrap with login rate limiting: 50 attempts per IP per 15 minutes
async function rateLimitedHandler(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  // Only rate limit POST requests (sign-in attempts)
  if (req.method === 'POST') {
    const rlKey = getRateLimitKey(req);
    const rlResult = rateLimit(`login:${rlKey}`, 50, 15 * 60 * 1000);
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

  try {
    const response = await handler(req, ctx);

    // Debug: log OAuth errors for diagnosis
    const url = new URL(req.url);
    if (url.searchParams.has('error') || url.pathname.includes('signin')) {
      console.log('[NextAuth Debug]', {
        path: url.pathname,
        search: url.search,
        status: response.status,
        location: response.headers.get('location'),
      });
    }

    return response;
  } catch (error) {
    console.error('[NextAuth Handler Error]', error);
    return new Response(
      JSON.stringify({ error: 'Internal auth error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };
