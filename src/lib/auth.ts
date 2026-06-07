import { NextAuthOptions } from 'next-auth';
import type { JWT as NextAuthJWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import FacebookProvider from 'next-auth/providers/facebook';
import { db } from '@/lib/db';
import argon2 from 'argon2';
import bcryptjs from 'bcryptjs';
import {
  generateTokenPair,
  verifyRefreshToken,
} from '@/lib/security/jwt-security';
import { verify2FALogin } from '@/lib/twofa';

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
      totpCode: { label: 'Code 2FA', type: 'text' },
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

      // Check if user has 2FA enabled
      if (user.twoFactorEnabled) {
        // If totpCode is provided, verify it inline
        if (credentials.totpCode) {
          const totpResult = await verify2FALogin(user.id, credentials.totpCode);
          if (!totpResult.success) {
            throw new Error('2FA_INVALID:' + totpResult.message);
          }
          // TOTP verified, proceed with login
        } else {
          // Return partial auth to trigger 2FA verification
          throw new Error('2FA_REQUIRED:' + user.id);
        }
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
  // CRITICAL: We use a custom OAuth provider instead of the built-in FacebookProvider
  // because next-auth v4's FacebookProvider always includes 'email' in the default
  // scope, and the override mechanisms (top-level 'scope' and 'authorization.params.scope')
  // don't reliably override the default due to how NextAuth merges authorization objects.
  // Our Facebook app (ID: 921931210715530) has NOT completed App Review for the 'email'
  // permission, so sending 'email' scope causes Facebook to reject the authorization with
  // "Invalid Scopes: email".
  // By using a generic OAuth provider, we have full control over the authorization URL
  // and can guarantee only 'public_profile' is sent.
  // Once Facebook approves the email permission through App Review, switch back to:
  // FacebookProvider({ clientId, clientSecret }) and add 'email' to the scope.
  providers.push({
    id: 'facebook',
    name: 'Facebook',
    type: 'oauth',
    clientId: process.env.FACEBOOK_CLIENT_ID!,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    wellKnown: 'https://www.facebook.com/.well-known/openid-configuration/',
    authorization: {
      url: 'https://www.facebook.com/v18.0/dialog/oauth',
      params: {
        scope: 'public_profile',
        auth_type: 'rerequest',
      },
    },
    token: 'https://graph.facebook.com/v18.0/oauth/access_token',
    userinfo: {
      url: 'https://graph.facebook.com/me',
      params: { fields: 'id,name,first_name,last_name,picture.width(200).height(200)' },
    },
    profile(profile: Record<string, unknown>) {
      return {
        id: String(profile.id),
        name: (profile.name as string) || (profile.first_name as string) || '',
        email: null, // Facebook won't return email without 'email' scope
        image: (profile as Record<string, unknown>).picture
          ? ((profile.picture as Record<string, Record<string, string>>)?.data?.url) || null
          : null,
      };
    },
  } as unknown as NextAuthOptions['providers'][number]);
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
    async jwt({ token, user, trigger }) {
      // On sign-in, populate token with user data
      if (user) {
        token.id = user.id;
        token.sub = user.id;
        token.role = (user as unknown as { role?: string }).role || 'buyer';
        token.country = (user as unknown as { country?: string | null }).country || null;
        token.kycLevel = (user as unknown as { kycLevel?: number }).kycLevel || 0;
        token.needsProfileCompletion = (user as unknown as { needsProfileCompletion?: boolean }).needsProfileCompletion || false;
      }

      // On session update (e.g. after profile completion), refresh user data from DB
      if (trigger === 'update') {
        try {
          const userId = (token.id as string) || (token.sub as string);
          if (userId) {
            const freshUser = await db.user.findUnique({
              where: { id: userId },
              select: { id: true, role: true, country: true, kycLevel: true, name: true, email: true },
            });
            if (freshUser) {
              token.role = freshUser.role;
              token.country = freshUser.country;
              token.kycLevel = freshUser.kycLevel;
              token.needsProfileCompletion = !freshUser.country || freshUser.email.endsWith('@placeholder.afribayit.com');
              token.email = freshUser.email;
            }
          }
        } catch (error) {
          console.error('[JWT] Error refreshing user data on update:', error);
        }
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
        (session.user as Record<string, unknown>).needsProfileCompletion = token.needsProfileCompletion || false;
        // Expose the short-lived access token for API Bearer auth
        (session.user as Record<string, unknown>).accessToken = (token as Record<string, unknown>).accessToken;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Handle OAuth sign-in: create user record if new, with tenant-scoped country
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        try {
          // Facebook may not return email if the 'email' scope isn't approved yet.
          // In that case, we still allow sign-in with public_profile data and
          // the user will be asked to provide their email during profile completion.
          if (!user.email && account.provider !== 'facebook') {
            console.error('[OAuth] No email returned from provider:', account.provider, '| user.id:', user.id);
            return '/auth/login?error=OAuthCallback';
          }
          if (!user.email && account.provider === 'facebook') {
            console.warn('[OAuth] Facebook did not return email (scope not approved). User will complete email during profile completion. ProviderAccountId:', account.providerAccountId);
          }

          console.log(`[OAuth] Sign-in attempt via ${account.provider} for email: ${user.email || 'no-email'} | providerAccountId: ${account.providerAccountId}`);

          // Step 1: Look up existing user by email or OAuth account link
          let existingUser: Awaited<ReturnType<typeof db.user.findUnique>> = null;

          // Try finding user by email first
          if (user.email) {
            try {
              existingUser = await db.user.findUnique({ where: { email: user.email } });
            } catch (error) {
              console.error('[OAuth] Error finding user by email:', error);
            }
          }

          // If no email (Facebook without email scope), try finding user via OAuth link
          if (!existingUser && !user.email) {
            try {
              const oauthAccount = await db.oAuthAccount.findUnique({
                where: { provider_providerId: { provider: account.provider, providerId: account.providerAccountId } },
                include: { user: true },
              });
              if (oauthAccount) {
                existingUser = oauthAccount.user;
              }
            } catch (error) {
              console.error('[OAuth] Error finding user via OAuthAccount:', error);
            }
          }

          // Determine email to use for user creation
          const userEmail = user.email || `fb_${account.providerAccountId}@placeholder.afribayit.com`;

          // Check if placeholder email already exists (Facebook re-register edge case)
          if (!existingUser && userEmail.endsWith('@placeholder.afribayit.com')) {
            try {
              const existingPlaceholder = await db.user.findUnique({ where: { email: userEmail } });
              if (existingPlaceholder) {
                console.log('[OAuth] Found existing user with placeholder email:', userEmail);
                existingUser = existingPlaceholder;
              }
            } catch (error) {
              console.error('[OAuth] Error checking placeholder email:', error);
            }
          }

          // Step 2: Create new user if not found
          if (!existingUser) {
            let newUser;
            try {
              newUser = await db.user.create({
                data: {
                  email: userEmail,
                  name: user.name || 'Utilisateur',
                  firstName: user.name?.split(' ')[0] || null,
                  lastName: user.name?.split(' ').slice(1).join(' ') || null,
                  avatar: user.image || null,
                  role: 'buyer',
                  country: null,
                  kycLevel: 0,
                  verified: false,
                  verificationStatus: 'PENDING',
                },
              });
            } catch (error) {
              console.error('[OAuth] Error creating user record:', error);
              // Handle unique constraint violation (race condition)
              if (error instanceof Error && (error.message?.includes('Unique constraint') || error.message?.includes('unique'))) {
                try {
                  existingUser = await db.user.findUnique({ where: { email: userEmail } });
                  if (existingUser) {
                    console.log('[OAuth] Found existing user after constraint violation:', existingUser.id);
                  }
                } catch (findError) {
                  console.error('[OAuth] Error finding user after constraint violation:', findError);
                }
              }
              if (!existingUser) {
                return '/auth/login?error=OAuthCallback';
              }
            }

            if (newUser) {
              // Create OAuth account record (non-fatal)
              try {
                await db.oAuthAccount.create({
                  data: {
                    provider: account.provider as 'google' | 'facebook',
                    providerId: account.providerAccountId,
                    userId: newUser.id,
                    accessToken: account.access_token || null,
                    refreshToken: account.refresh_token || null,
                  },
                });
              } catch (error) {
                console.error('[OAuth] Error creating OAuthAccount link (non-fatal):', error);
              }

              user.id = newUser.id;
              (user as unknown as Record<string, unknown>).role = newUser.role;
              (user as unknown as Record<string, unknown>).country = newUser.country;
              (user as unknown as Record<string, unknown>).kycLevel = newUser.kycLevel;
              (user as unknown as Record<string, unknown>).needsProfileCompletion = true;
              user.email = userEmail;

              console.log('[OAuth] New user created:', newUser.id, 'via', account.provider, '| needsProfileCompletion: true', '| email:', userEmail);
              return true;
            }
          }

          // Step 2b: Existing user — link OAuth account if not already linked (non-fatal)
          if (existingUser) {
            try {
              const existingOAuth = await db.oAuthAccount.findFirst({
                where: { provider: account.provider, userId: existingUser.id },
              });

              if (!existingOAuth) {
                try {
                  await db.oAuthAccount.create({
                    data: {
                      provider: account.provider as 'google' | 'facebook',
                      providerId: account.providerAccountId,
                      userId: existingUser.id,
                      accessToken: account.access_token || null,
                      refreshToken: account.refresh_token || null,
                    },
                  });
                } catch (error) {
                  console.error('[OAuth] Error creating OAuthAccount link for existing user (non-fatal):', error);
                }
              } else {
                try {
                  await db.oAuthAccount.update({
                    where: { id: existingOAuth.id },
                    data: {
                      accessToken: account.access_token || null,
                      refreshToken: account.refresh_token || null,
                    },
                  });
                } catch (error) {
                  console.error('[OAuth] Error updating OAuthAccount tokens (non-fatal):', error);
                }
              }
            } catch (error) {
              console.error('[OAuth] Error looking up existing OAuthAccount (non-fatal):', error);
            }

            // Update avatar if provided by OAuth and not already set (non-fatal)
            if (user.image && !existingUser.avatar) {
              try {
                await db.user.update({
                  where: { id: existingUser.id },
                  data: { avatar: user.image },
                });
              } catch (error) {
                console.error('[OAuth] Error updating user avatar (non-fatal):', error);
              }
            }

            user.id = existingUser.id;
            (user as unknown as Record<string, unknown>).role = existingUser.role;
            (user as unknown as Record<string, unknown>).country = existingUser.country;
            (user as unknown as Record<string, unknown>).kycLevel = existingUser.kycLevel;
            const hasPlaceholderEmail = existingUser.email.endsWith('@placeholder.afribayit.com');
            (user as unknown as Record<string, unknown>).needsProfileCompletion = !existingUser.country || hasPlaceholderEmail;

            console.log('[OAuth] Existing user signed in:', existingUser.id, 'via', account.provider, '| needsProfileCompletion:', !existingUser.country || hasPlaceholderEmail);
          }
        } catch (error) {
          console.error('[OAuth] Unhandled error in signIn callback:', error);
          return '/auth/login?error=OAuthCallback';
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // After OAuth sign-in, redirect to:
      // 1. The callbackUrl if provided and valid
      // 2. /dashboard as default
      // Note: If the user needs profile completion (no country set), the dashboard
      // page will detect this and redirect to /auth/complete-profile

      // If the url is relative, make it absolute
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // If url is on the same origin, it's safe to redirect there
      if (new URL(url).origin === baseUrl) return url;

      // Default redirect after sign-in
      return baseUrl + '/dashboard';
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
