import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/security/rate-limiter';

// In-memory error log for debugging OAuth issues (last 10 errors)
const oauthErrorLog: Array<{ timestamp: string; url: string; method: string; error: string }> = [];

// Create the NextAuth handler with custom logger to capture OAuth errors
const handler = NextAuth({
  ...authOptions,
  logger: {
    error(code, ...meta) {
      console.error('[NextAuth ERROR]', code, ...meta);
      // Capture the error for our debug endpoint
      const errorMsg = meta.map(m => {
        if (m instanceof Error) return `${m.name}: ${m.message}`;
        if (typeof m === 'string') return m;
        try { return JSON.stringify(m); } catch { return String(m); }
      }).join(' | ');
      oauthErrorLog.push({
        timestamp: new Date().toISOString(),
        url: 'auth-handler',
        method: code,
        error: `${code}: ${errorMsg}`,
      });
      // Keep only last 10 entries
      if (oauthErrorLog.length > 10) oauthErrorLog.shift();
    },
    warn(code, ...meta) {
      console.warn('[NextAuth WARN]', code, ...meta);
    },
    debug(code, ...meta) {
      // Uncomment for verbose debugging:
      // console.debug('[NextAuth DEBUG]', code, ...meta);
    },
  },
});

// Wrap with login rate limiting: 20 attempts per IP per 15 minutes
async function rateLimitedHandler(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  // Only rate limit POST requests (sign-in attempts)
  // Exclude OAuth callback paths from rate limiting
  const url = new URL(req.url);
  const isOAuthCallback = url.pathname.includes('/callback/');

  // Special debug endpoint: /api/auth/oauth-errors
  if (url.pathname === '/api/auth/oauth-errors') {
    return new Response(JSON.stringify({ errors: oauthErrorLog }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

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

  try {
    const result = await handler(req, ctx);
    return result;
  } catch (err) {
    // Capture unhandled errors from NextAuth
    const errorMsg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    oauthErrorLog.push({
      timestamp: new Date().toISOString(),
      url: url.pathname,
      method: req.method,
      error: `UNHANDLED: ${errorMsg}`,
    });
    if (oauthErrorLog.length > 10) oauthErrorLog.shift();
    throw err;
  }
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };
