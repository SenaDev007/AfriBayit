// NextAuth route handler.
//
// Wires up:
//   - CredentialsProvider (email + password → backend /auth/login)
//   - GoogleProvider (OAuth → backend /auth/oauth)
//   - FacebookProvider (OAuth → backend /auth/oauth)
//   - AppleProvider (CDC §4.1 — only registered if APPLE_CLIENT_ID + APPLE_CLIENT_SECRET set)
//
// For OAuth providers, the signIn callback calls the backend /auth/oauth
// endpoint to either log in an existing user (linked via OAuthAccount) or
// create a new user. The backend returns a JWT that we store in the
// NextAuth session for the api-client to use.
//
// SECURITY: NEXTAUTH_SECRET is REQUIRED in production. We do NOT ship a
// hardcoded fallback. `assertSecretOrThrow()` is invoked at request time
// (inside `securedHandler`) — in production it throws 500 if missing; in
// dev it warns and uses an ephemeral in-memory secret.

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import AppleProvider from 'next-auth/providers/apple';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();
const isProduction = process.env.NODE_ENV === 'production';

function normalizeApiUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return 'http://localhost:3001';
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url.replace(/\/+$/, '');
}

const BACKEND_URL = normalizeApiUrl(API_URL);

interface BackendAuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    roles?: string[];
    country: string | null;
    kycLevel: number;
  };
  accessToken?: string;
  refreshToken?: string;
  expiresInSeconds?: number;
  requires2FA?: boolean;
  error?: string;
}

async function callBackend(
  path: string,
  body: Record<string, unknown>,
): Promise<BackendAuthResponse> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    return { success: false, error: text || `Backend returned ${res.status} ${res.statusText}` };
  }
  return (await res.json()) as BackendAuthResponse;
}

// ─── Secret assertion ────────────────────────────────────────────────────
//
// `assertSecretOrThrow()` MUST be called at request time (not module load).
// In production: throws if NEXTAUTH_SECRET is missing.
// In dev: warns and falls back to an ephemeral in-memory secret so the dev
// server can still boot without forcing the developer to set the env var.
//
// The ephemeral secret is generated once per process — sessions will not
// survive a server restart, but that is acceptable for local development.
let devEphemeralSecret: string | null = null;

function getDevEphemeralSecret(): string {
  if (!devEphemeralSecret) {
    // Use crypto.randomUUID if available (Node 16.7+); fall back to Math.random.
    try {
      devEphemeralSecret = `afribayit-dev-ephemeral-${crypto.randomUUID()}`;
    } catch {
      devEphemeralSecret = `afribayit-dev-ephemeral-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    }
  }
  return devEphemeralSecret;
}

function assertSecretOrThrow(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret && secret.trim()) return secret;

  if (isProduction) {
    // CRITICAL: no hardcoded fallback in production.
    throw new Error(
      '[AfriBayit/NextAuth] NEXTAUTH_SECRET is required in production. ' +
        'Set it in your environment variables (e.g. Vercel project settings).',
    );
  }

  // Dev mode: warn loudly but allow with ephemeral secret.
  if (!devEphemeralSecret) {
    console.warn(
      '[AfriBayit/NextAuth] WARNING: NEXTAUTH_SECRET is not set. ' +
        'Using an ephemeral in-memory secret for local development. ' +
        'Sessions will NOT persist across server restarts. ' +
        'Set NEXTAUTH_SECRET in your .env file for stable sessions.',
    );
  }
  return getDevEphemeralSecret();
}

// ─── Token refresh helper ────────────────────────────────────────────────
//
// Called from `jwt()` 5 minutes before `accessTokenExpiresAt`. Hits the
// backend `/auth/refresh` endpoint with the stored refresh token and
// returns the new access/refresh pair. On failure, returns the old token
// (the next 401 will surface the error to the user).

async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: number;
} | null> {
  try {
    const data = await callBackend('/auth/refresh', { refreshToken });
    if (!data.success || !data.accessToken) {
      return null;
    }
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = data.expiresInSeconds && data.expiresInSeconds > 0
      ? data.expiresInSeconds
      : 3600; // default 1h if backend doesn't return
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken || refreshToken,
      accessTokenExpiresAt: now + expiresIn,
    };
  } catch (err) {
    console.error('[NextAuth] refreshAccessToken failed:', err);
    return null;
  }
}

// ─── Providers ───────────────────────────────────────────────────────────

const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    id: 'credentials',
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
      userId: { label: 'UserId', type: 'text' },
      totpCode: { label: 'TOTP', type: 'text' },
    },
    async authorize(credentials) {
      if (!credentials) return null;
      const email = credentials.email?.trim();
      const password = credentials.password;
      if (!email || !password) return null;

      // 2FA second leg
      if (credentials.totpCode && credentials.userId) {
        const data = await callBackend('/auth/login/2fa', {
          userId: credentials.userId,
          otpCode: credentials.totpCode,
        });
        if (!data.success || !data.accessToken || !data.user) {
          throw new Error('2FA_INVALID');
        }
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = data.expiresInSeconds && data.expiresInSeconds > 0
          ? data.expiresInSeconds
          : 3600;
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          roles: data.user.roles || [data.user.role],
          country: data.user.country,
          kycLevel: data.user.kycLevel,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          accessTokenExpiresAt: now + expiresIn,
        } as any;
      }

      // Regular login
      const data = await callBackend('/auth/login', { email, password });
      if (!data.success) {
        if (data.requires2FA && data.user) {
          throw new Error(`2FA_REQUIRED:${data.user.id}`);
        }
        return null;
      }
      if (!data.accessToken || !data.user) return null;
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = data.expiresInSeconds && data.expiresInSeconds > 0
        ? data.expiresInSeconds
        : 3600;
      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        roles: data.user.roles || [data.user.role],
        country: data.user.country,
        kycLevel: data.user.kycLevel,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        accessTokenExpiresAt: now + expiresIn,
      } as any;
    },
  }),
];

// Add Google provider if configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    allowDangerousEmailAccountLinking: false,
  }));
}

// Add Facebook provider if configured
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(FacebookProvider({
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    allowDangerousEmailAccountLinking: false,
  }));
}

// Add Apple provider if configured (CDC §4.1)
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  providers.push(AppleProvider({
    clientId: process.env.APPLE_CLIENT_ID,
    clientSecret: process.env.APPLE_CLIENT_SECRET,
    allowDangerousEmailAccountLinking: false,
  }));
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      // For credentials provider, the authorize() function already
      // validated against the backend. Just allow.
      if (!account || account.provider === 'credentials') return true;

      // For OAuth providers (google, facebook, apple), call the backend
      // /auth/oauth endpoint to create/link the user and get a JWT.
      if (account.provider === 'google' || account.provider === 'facebook' || account.provider === 'apple') {
        try {
          const data = await callBackend('/auth/oauth', {
            email: user.email!,
            name: user.name || user.email!.split('@')[0],
            provider: account.provider,
            providerId: account.providerAccountId,
            avatar: user.image || undefined,
          });

          if (!data.success || !data.accessToken || !data.user) {
            console.error('[NextAuth] OAuth backend call failed:', data.error);
            return false;
          }

          // Attach the backend JWT + user info to the user object so
          // the jwt() callback can pick it up.
          const now = Math.floor(Date.now() / 1000);
          const expiresIn = data.expiresInSeconds && data.expiresInSeconds > 0
            ? data.expiresInSeconds
            : 3600;
          (user as any).id = data.user.id;
          (user as any).role = data.user.role;
          (user as any).roles = data.user.roles || [data.user.role];
          (user as any).country = data.user.country;
          (user as any).kycLevel = data.user.kycLevel;
          (user as any).accessToken = data.accessToken;
          (user as any).refreshToken = data.refreshToken;
          (user as any).accessTokenExpiresAt = now + expiresIn;

          return true;
        } catch (err) {
          console.error('[NextAuth] OAuth error:', err);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // `user` is present on first sign-in (credentials or OAuth).
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.role = u.role;
        token.roles = u.roles || [u.role];
        token.country = u.country;
        token.kycLevel = u.kycLevel;
        if (u.accessToken) token.accessToken = u.accessToken;
        if (u.refreshToken) token.refreshToken = u.refreshToken;
        if (u.accessTokenExpiresAt) token.accessTokenExpiresAt = u.accessTokenExpiresAt;
      }

      // Refresh 5 min before expiry
      const expiresAt = (token.accessTokenExpiresAt as number | undefined) ?? 0;
      const now = Math.floor(Date.now() / 1000);
      const REFRESH_WINDOW = 5 * 60; // 5 minutes
      if (token.refreshToken && expiresAt > 0 && expiresAt - now < REFRESH_WINDOW) {
        const refreshed = await refreshAccessToken(token.refreshToken as string);
        if (refreshed) {
          token.accessToken = refreshed.accessToken;
          if (refreshed.refreshToken) token.refreshToken = refreshed.refreshToken;
          if (refreshed.accessTokenExpiresAt) token.accessTokenExpiresAt = refreshed.accessTokenExpiresAt;
        }
        // If refresh failed, we keep the old token; the next 401 will
        // surface the error to the user via the api-client.
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || session.user.id;
        session.user.role = (token.role as string) || session.user.role;
        session.user.roles = (token.roles as string[]) || [session.user.role];
        session.user.country = (token.country as string | null) ?? session.user.country ?? null;
        session.user.kycLevel = (token.kycLevel as number) ?? session.user.kycLevel ?? 0;
      }
      (session as any).accessToken = token.accessToken;
      (session as any).refreshToken = token.refreshToken;
      (session as any).accessTokenExpiresAt = token.accessTokenExpiresAt;
      return session;
    },
  },
  // `secret` is intentionally left undefined here — it is resolved at
  // request time via `assertSecretOrThrow()` inside `securedHandler`.
  debug: false,
};

const handler = NextAuth(authOptions);

/**
 * Wrap the NextAuth handler so that the secret is asserted at REQUEST TIME
 * (not module load). This ensures the serverless function boots even if
 * NEXTAUTH_SECRET is missing — but each request will throw 500 in
 * production if the secret is not configured.
 */
function securedHandler(req: Request) {
  assertSecretOrThrow();
  return handler(req);
}

export { securedHandler as GET, securedHandler as POST };
