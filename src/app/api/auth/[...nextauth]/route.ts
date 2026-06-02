import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/security/rate-limiter';

// Global error log that persists across requests within the same function instance
// On Vercel, this only works within the same serverless function invocation
globalThis.__afribayit_oauth_log = globalThis.__afribayit_oauth_log || [];
const oauthLog = globalThis.__afribayit_oauth_log;

function logOAuth(entry: { timestamp: string; url: string; method: string; error: string; details?: string }) {
  oauthLog.push(entry);
  if (oauthLog.length > 20) oauthLog.shift();
  console.error('[OAuth Debug]', JSON.stringify(entry));
}

// Create the NextAuth handler with verbose debug logging
const handler = NextAuth({
  ...authOptions,
  debug: true, // Enable NextAuth's built-in debug logging
  logger: {
    error(code, ...meta) {
      const errorMsg = meta.map(m => {
        if (m instanceof Error) return `${m.name}: ${m.message}\n${m.stack?.substring(0, 500) || ''}`;
        if (typeof m === 'string') return m;
        try { return JSON.stringify(m); } catch { return String(m); }
      }).join(' | ');
      logOAuth({
        timestamp: new Date().toISOString(),
        url: 'nextauth-logger',
        method: code,
        error: `${code}: ${errorMsg}`,
      });
    },
    warn(code, ...meta) {
      console.warn('[NextAuth WARN]', code, ...meta);
    },
    debug(code, ...meta) {
      const msg = meta.map(m => {
        if (typeof m === 'string') return m;
        try { return JSON.stringify(m); } catch { return String(m); }
      }).join(' | ');
      logOAuth({
        timestamp: new Date().toISOString(),
        url: 'nextauth-debug',
        method: code,
        error: `[DEBUG] ${code}: ${msg.substring(0, 500)}`,
      });
    },
  },
});

// Wrap with login rate limiting: 20 attempts per IP per 15 minutes
async function rateLimitedHandler(req: Request, ctx: { params: Promise<{ nextauth: string[] }> }) {
  const url = new URL(req.url);
  const isOAuthCallback = url.pathname.includes('/callback/');

  // Special debug endpoint: /api/auth/oauth-errors
  if (url.pathname === '/api/auth/oauth-errors') {
    return new Response(JSON.stringify({ errors: oauthLog, count: oauthLog.length }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Log all auth requests for debugging
  logOAuth({
    timestamp: new Date().toISOString(),
    url: url.pathname + url.search,
    method: req.method,
    error: `[REQUEST] Incoming auth request`,
    details: `Action: ${url.pathname.replace('/api/auth/', '')}`,
  });

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

    // Log the response for OAuth requests
    const location = result.headers.get('location');
    if (location) {
      logOAuth({
        timestamp: new Date().toISOString(),
        url: url.pathname,
        method: req.method,
        error: `[RESPONSE] Redirect to: ${location}`,
      });
    }

    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? `${err.name}: ${err.message}\n${err.stack?.substring(0, 500) || ''}` : String(err);
    logOAuth({
      timestamp: new Date().toISOString(),
      url: url.pathname,
      method: req.method,
      error: `UNHANDLED: ${errorMsg}`,
    });
    throw err;
  }
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST };
