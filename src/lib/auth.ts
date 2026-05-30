import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'placeholder-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder-google-client-secret',
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || 'placeholder-facebook-client-id',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || 'placeholder-facebook-client-secret',
    }),
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

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Identifiants invalides');
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
  ],
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // 15 min access token
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days refresh
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as Record<string, unknown>).role || 'buyer';
        token.country = (user as Record<string, unknown>).country || null;
        token.kycLevel = (user as Record<string, unknown>).kycLevel || 0;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).country = token.country;
        (session.user as Record<string, unknown>).kycLevel = token.kycLevel;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Handle OAuth sign-in: create user record if new
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        if (!user.email) return false;

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
          (user as Record<string, unknown>).role = newUser.role;
          (user as Record<string, unknown>).country = newUser.country;
          (user as Record<string, unknown>).kycLevel = newUser.kycLevel;
        } else {
          user.id = existingUser.id;
          (user as Record<string, unknown>).role = existingUser.role;
          (user as Record<string, unknown>).country = existingUser.country;
          (user as Record<string, unknown>).kycLevel = existingUser.kycLevel;
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
