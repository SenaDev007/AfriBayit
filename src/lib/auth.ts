import { NextAuthOptions } from 'next-auth';
import type { JWT as NextAuthJWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { db } from '@/lib/db';
import argon2 from 'argon2';
import bcryptjs from 'bcryptjs';
import {
  generateTokenPair,
  verifyRefreshToken,
} from '@/lib/security/jwt-security';

// Check if RS256 JWT keys are available (required for custom JWT encoding)
// If not, NextAuth uses its default JWT encoding (HMAC-SHA256 with NEXTAUTH_SECRET)
// IMPORTANT: On Vercel serverless, each cold start generates a new RSA key pair
// unless JWT_PRIVATE_KEY/JWT_PUBLIC_KEY env vars are set. Without them, custom
// encoding will break because different function instances use different keys.
const hasRSAKeys = !!(process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY);

// Build the authOptions object — conditionally include custom JWT encode/decode
// only when RSA keys are available. Otherwise, NextAuth uses its default.
const jwtConfig: NextAuthOptions['jwt'] = {
  maxAge: 7 * 24 * 60 * 60, // 7 days
};

if (hasRSAKeys) {
  jwtConfig.encode = async ({ token }) => {
    if (!token) throw new Error('No token to encode');

    const userId = (token.id as string) || (token.sub as string) || '';
    const email = (token.email as string) || '';
    const role = (token.role as string) || 'buyer';
    const country = (token.country as string) || undefined;
    const kycLevel = (token.kycLevel as number) || 0;

    const pair = generateTokenPair(userId, email, role, { country, kycLevel });
    return pair.refreshToken;
  };

  jwtConfig.decode = async ({ token }) => {
    if (!token) return null;
    const result = verifyRefreshToken(token);
    if (!result.valid || !result.payload) return null;
    const payload = result.payload;
    // Return as JWT type expected by NextAuth
    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role as string,
      country: payload.country as string | null,
      kycLevel: payload.kycLevel as number,
      iat: payload.iat,
      exp: payload.exp,
      jti: payload.jti,
    } as unknown as NextAuthJWT;
  };
}

// Only include OAuth providers when valid credentials are configured
// This prevents "placeholder" errors on Vercel when env vars are not set
const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Mot de passe', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Email et mot de passe requis');
      }

      const user = await db.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user || !user.password) {
        throw new Error('Identifiants invalides');
      }

      // Verify password with Argon2id, falling back to bcrypt for legacy hashes
      const isValid = await verifyPassword(credentials.password, user.password);

      if (!isValid) {
        throw new Error('Identifiants invalides');
      }

      // Auto-upgrade legacy bcrypt hashes to Argon2id on successful login
      if (needsRehash(user.password)) {
        // Fire-and-forget rehash — don't block the login flow
        rehashPasswordIfNeeded(user.id, credentials.password, user.password).catch(() => {});
      }

      // Check if user has 2FA enabled — handled in separate 2FA verify flow
      if (user.twoFactorEnabled) {
        // Return partial auth to trigger 2FA verification
        throw new Error('2FA_REQUIRED');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        country: user.country,
        kycLevel: user.kycLevel,
      };
    },
  }),
];

// Conditionally add Google provider
const hasGoogle =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== 'placeholder-google-client-id' &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_SECRET !== 'placeholder-google-client-secret';

if (hasGoogle) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}

// Conditionally add Facebook provider
const hasFacebook =
  process.env.FACEBOOK_CLIENT_ID &&
  process.env.FACEBOOK_CLIENT_ID !== 'placeholder-facebook-client-id' &&
  process.env.FACEBOOK_CLIENT_SECRET &&
  process.env.FACEBOOK_CLIENT_SECRET !== 'placeholder-facebook-client-secret';

if (hasFacebook) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    })
  );
}

// Export OAuth availability for frontend consumption
export const oauthProviders = {
  google: !!hasGoogle,
  facebook: !!hasFacebook,
};

export const authOptions: NextAuthOptions = {
  providers,
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // 15 min — how often the session is re-fetched
  },
  jwt: jwtConfig,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id;
        token.role = (user as unknown as { role?: string }).role || 'buyer';
        token.country = (user as unknown as { country?: string | null }).country || null;
        token.kycLevel = (user as unknown as { kycLevel?: number }).kycLevel || 0;
      }

      // Generate a fresh access token on every JWT refresh (for API Bearer auth)
      // Only do this when RSA keys are available (otherwise default encoding handles it)
      if (hasRSAKeys) {
        const userId = (token.id as string) || (token.sub as string) || '';
        const email = (token.email as string) || '';
        const role = (token.role as string) || 'buyer';
        const country = (token.country as string) || undefined;
        const kycLevel = (token.kycLevel as number) || 0;

        if (userId && email) {
          const pair = generateTokenPair(userId, email, role, { country, kycLevel });
          (token as Record<string, unknown>).accessToken = pair.accessToken;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id || token.sub;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).country = token.country;
        (session.user as Record<string, unknown>).kycLevel = token.kycLevel;
        // Expose the short-lived access token for API Bearer auth
        (session.user as Record<string, unknown>).accessToken = (token as Record<string, unknown>).accessToken;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Handle OAuth sign-in: create user record if new
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        if (!user.email) {
          console.error('[OAuth] No email returned from provider:', account.provider);
          return false;
        }

        try {
          const existingUser = await db.user.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            // Create new user from OAuth
            const newUser = await db.user.create({
              data: {
                email: user.email,
                name: user.name || 'Utilisateur',
                avatar: user.image || null,
                role: 'buyer',
                kycLevel: 0,
                verified: false,
              },
            });

            // Create OAuth account record
            await db.oAuthAccount.create({
              data: {
                provider: account.provider,
                providerId: account.providerAccountId,
                userId: newUser.id,
                accessToken: account.access_token || null,
                refreshToken: account.refresh_token || null,
              },
            });

            user.id = newUser.id;
            (user as unknown as Record<string, unknown>).role = newUser.role;
            (user as unknown as Record<string, unknown>).country = newUser.country;
            (user as unknown as Record<string, unknown>).kycLevel = newUser.kycLevel;

            console.log('[OAuth] New user created:', newUser.id, 'via', account.provider);
          } else {
            // Update OAuth account link if not exists
            const existingOAuth = await db.oAuthAccount.findFirst({
              where: { provider: account.provider, userId: existingUser.id },
            });

            if (!existingOAuth) {
              await db.oAuthAccount.create({
                data: {
                  provider: account.provider,
                  providerId: account.providerAccountId,
                  userId: existingUser.id,
                  accessToken: account.access_token || null,
                  refreshToken: account.refresh_token || null,
                },
              });
            } else {
              // Update tokens
              await db.oAuthAccount.update({
                where: { id: existingOAuth.id },
                data: {
                  accessToken: account.access_token || null,
                  refreshToken: account.refresh_token || null,
                },
              });
            }

            // Update avatar if provided by OAuth and not already set
            if (user.image && !existingUser.avatar) {
              await db.user.update({
                where: { id: existingUser.id },
                data: { avatar: user.image },
              });
            }

            user.id = existingUser.id;
            (user as unknown as Record<string, unknown>).role = existingUser.role;
            (user as unknown as Record<string, unknown>).country = existingUser.country;
            (user as unknown as Record<string, unknown>).kycLevel = existingUser.kycLevel;

            console.log('[OAuth] Existing user signed in:', existingUser.id, 'via', account.provider);
          }
        } catch (error) {
          console.error('[OAuth] Error during sign-in:', error);
          return false;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/auth/login',
    newUser: '/auth/register',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Hash a password using Argon2id
 * Industry-standard KDF with resistance against GPU/ASIC attacks
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,  // 64 MB
    timeCost: 3,        // 3 iterations
    parallelism: 4,     // 4 threads
  });
}

/**
 * Verify a password against a stored hash.
 * Supports Argon2id (new) and bcrypt (legacy) for backward compatibility.
 * Argon2 hashes start with "$argon2", bcrypt hashes start with "$2a$", "$2b$", or "$2y$".
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Detect hash type by prefix
  if (hash.startsWith('$argon2')) {
    return argon2.verify(hash, password);
  }

  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    // Legacy bcrypt hash — verify with bcryptjs
    return bcryptjs.compare(password, hash);
  }

  // Unknown hash format — try argon2 as default
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Check if a password hash needs rehashing (i.e., it's a legacy bcrypt hash).
 * After successful login, callers should rehash with Argon2id if this returns true.
 */
export function needsRehash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
}

/**
 * Rehash a password with Argon2id if it was stored with bcrypt.
 * Call this after a successful login when needsRehash() returns true.
 */
export async function rehashPasswordIfNeeded(userId: string, password: string, currentHash: string): Promise<void> {
  if (needsRehash(currentHash)) {
    const newHash = await hashPassword(password);
    await db.user.update({
      where: { id: userId },
      data: { password: newHash },
    });
  }
}
