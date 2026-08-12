// AfriBayit — OAuth Provider Availability API
// GET /api/auth/oauth-status
//
// For UNAUTHENTICATED users: returns which OAuth providers are CONFIGURED
//   → { google: boolean, facebook: boolean }
// This lets the login form know which OAuth buttons to display.
//
// For AUTHENTICATED users: returns which OAuth providers are LINKED
//   → { google: { linked: boolean }, facebook: { linked: boolean }, hasPassword: boolean, canUnlink: boolean }

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, oauthProviders } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Unauthenticated user → return provider availability (for login form buttons)
    if (!session?.user) {
      return NextResponse.json({
        google: oauthProviders.google,
        facebook: oauthProviders.facebook,
      });
    }

    // Authenticated user → return linked provider details
    const userId = (session.user as Record<string, unknown>).id as string;

    const oauthAccounts = await db.oAuthAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        createdAt: true,
      },
    });

    const linkedProviders = oauthAccounts.map((acc) => acc.provider);

    // Check if user has a password set (can unlink OAuth only if they have a password)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    const hasPassword = !!user?.password;

    return NextResponse.json({
      google: {
        linked: linkedProviders.includes('google'),
        linkedAt: oauthAccounts.find((a) => a.provider === 'google')?.createdAt || null,
      },
      facebook: {
        linked: linkedProviders.includes('facebook'),
        linkedAt: oauthAccounts.find((a) => a.provider === 'facebook')?.createdAt || null,
      },
      hasPassword,
      // Can unlink only if at least one other auth method exists
      canUnlink: hasPassword || linkedProviders.length > 1,
      // Also include provider availability for the ConnectedAccounts component
      providersAvailable: {
        google: oauthProviders.google,
        facebook: oauthProviders.facebook,
      },
    });
  } catch (error) {
    console.error('[oauth-status] Error:', error);
    // Fallback: return env-based availability even on error
    return NextResponse.json({
      google: oauthProviders.google,
      facebook: oauthProviders.facebook,
    });
  }
}
