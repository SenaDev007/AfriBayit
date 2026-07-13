// NextAuth route handler (P0-1 fix).
//
// Wires NextAuth's CredentialsProvider up to the NestJS backend
// `/auth/login` and `/auth/login/2fa` endpoints. The backend returns a
// JWT (`accessToken`) plus the user object; we surface the JWT through
// the NextAuth session so the AppShell can sync it to localStorage via
// `setAccessToken()` — which is what the api-client reads to send the
// `Authorization: Bearer <token>` header on every API request.
//
// 2FA flow:
//   1. User submits email + password → backend returns `{ requires2FA: true, user }`
//      We translate that to a `2FA_REQUIRED:<userId>` error so the frontend
//      can route the user to the 2FA form.
//   2. User submits the 6-digit TOTP code → frontend calls `signIn` again,
//      this time with `userId` + `totpCode`, and we hit `/auth/login/2fa`.

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();

// Re-normalize (handles missing protocol like the api-client does)
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
    country: string | null;
    kycLevel: number;
  };
  accessToken?: string;
  refreshToken?: string;
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

  // The backend always responds with JSON for these endpoints, but guard
  // against a non-JSON reply (e.g. 502 from the gateway) so we don't crash.
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    return {
      success: false,
      error: text || `Backend returned ${res.status} ${res.statusText}`,
    };
  }

  return (await res.json()) as BackendAuthResponse;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        // Used for the second leg of the 2FA login flow
        userId: { label: 'UserId', type: 'text' },
        totpCode: { label: 'TOTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        const email = credentials.email?.trim();
        const password = credentials.password;

        if (!email || !password) return null;

        // ─── 2FA second leg ────────────────────────────────────────────
        // If the frontend passes a userId + totpCode, we verify the 2FA
        // code against the backend instead of doing a fresh login.
        if (credentials.totpCode && credentials.userId) {
          const data = await callBackend('/auth/login/2fa', {
            userId: credentials.userId,
            otpCode: credentials.totpCode,
          });

          if (!data.success || !data.accessToken || !data.user) {
            throw new Error('2FA_INVALID');
          }

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            role: data.user.role,
            country: data.user.country,
            kycLevel: data.user.kycLevel,
            accessToken: data.accessToken,
          } as any;
        }

        // ─── Regular login ─────────────────────────────────────────────
        const data = await callBackend('/auth/login', { email, password });

        if (!data.success) {
          // Translate backend error into a NextAuth error.
          // The backend returns `requires2FA: true` with the user object
          // when 2FA is enabled — we encode the userId into the error
          // string so the frontend can route the user to the 2FA form.
          if (data.requires2FA && data.user) {
            throw new Error(`2FA_REQUIRED:${data.user.id}`);
          }
          return null;
        }

        if (!data.accessToken || !data.user) {
          return null;
        }

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          country: data.user.country,
          kycLevel: data.user.kycLevel,
          accessToken: data.accessToken,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // `user` is only present on the first sign-in call; persist its
      // fields onto the JWT so they survive across requests.
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.role = u.role;
        token.country = u.country;
        token.kycLevel = u.kycLevel;
        if (u.accessToken) token.accessToken = u.accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || session.user.id;
        session.user.role = (token.role as string) || session.user.role;
        session.user.country =
          (token.country as string | null) ?? session.user.country ?? null;
        session.user.kycLevel =
          (token.kycLevel as number) ?? session.user.kycLevel ?? 0;
      }
      // Expose the backend JWT so the AppShell can sync it to localStorage
      // for the api-client to send as the `Authorization: Bearer` header.
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
  // Fall back to a dev secret so the route handler always initializes.
  // In production, NEXTAUTH_SECRET must be set.
  secret: process.env.NEXTAUTH_SECRET || 'afribayit-dev-only-secret-change-me',
  debug: false,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
