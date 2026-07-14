// NextAuth route handler.
//
// Wires up:
//   - CredentialsProvider (email + password → backend /auth/login)
//   - GoogleProvider (OAuth → backend /auth/oauth)
//   - FacebookProvider (OAuth → backend /auth/oauth)
//
// For OAuth providers, the signIn callback calls the backend /auth/oauth
// endpoint to either log in an existing user (linked via OAuthAccount) or
// create a new user. The backend returns a JWT that we store in the
// NextAuth session for the api-client to use.

import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim();

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

// Build the providers array — OAuth providers are only added if their
// env vars are configured, so the app doesn't crash if they're missing.
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
        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          roles: data.user.roles || [data.user.role],
          country: data.user.country,
          kycLevel: data.user.kycLevel,
          accessToken: data.accessToken,
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
      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        roles: data.user.roles || [data.user.role],
        country: data.user.country,
        kycLevel: data.user.kycLevel,
        accessToken: data.accessToken,
      } as any;
    },
  }),
];

// Add Google provider if configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    allowDangerousEmailAccountLinking: true,
  }));
}

// Add Facebook provider if configured
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(FacebookProvider({
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    allowDangerousEmailAccountLinking: true,
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

      // For OAuth providers (google, facebook), call the backend
      // /auth/oauth endpoint to create/link the user and get a JWT.
      if (account.provider === 'google' || account.provider === 'facebook') {
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
          (user as any).id = data.user.id;
          (user as any).role = data.user.role;
          (user as any).roles = data.user.roles || [data.user.role];
          (user as any).country = data.user.country;
          (user as any).kycLevel = data.user.kycLevel;
          (user as any).accessToken = data.accessToken;

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
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'afribayit-dev-only-secret-change-me',
  debug: false,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
