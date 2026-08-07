// AfriBayit — BFF (Backend-for-Frontend) auth token exchange route.
//
// CDC §10.1 requires JWT tokens to NOT be stored in localStorage (XSS-vulnerable).
// This route handler syncs the NextAuth session's backend JWT to httpOnly cookies
// that can't be read by client-side JavaScript.
//
// Flow:
//   1. NextAuth stores the backend JWT in the session (via jwt() callback)
//   2. The client calls GET /api/auth/token to sync the token to httpOnly cookies
//   3. The api-client can use these cookies via a server-side proxy (future)
//   4. On logout, DELETE /api/auth/token clears the cookies
//
// This is a transitional implementation. The full BFF pattern would proxy ALL
// API calls through Next.js server routes, eliminating localStorage entirely.
// For now, this route sets httpOnly cookies alongside localStorage for
// backward compatibility while providing the infrastructure for the migration.

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const accessToken = (session as unknown as Record<string, unknown>)?.accessToken as string | undefined;
  const refreshToken = (session as unknown as Record<string, unknown>)?.refreshToken as string | undefined;
  const expiresAt = (session as unknown as Record<string, unknown>)?.accessTokenExpiresAt as number | undefined;

  if (!accessToken) {
    return NextResponse.json({ authenticated: false, error: 'No access token' }, { status: 401 });
  }

  // Return whether the token is valid (NOT the token itself — that stays httpOnly)
  const response = NextResponse.json({
    authenticated: true,
    expiresAt: expiresAt ?? null,
  });

  // Set httpOnly cookies (can't be read by client-side JS — XSS-safe)
  response.cookies.set('afribayit_at', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 3600, // 1 hour
  });

  if (refreshToken) {
    response.cookies.set('afribayit_rt', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
  }

  return response;
}

// Clear the httpOnly cookies on DELETE (called by signOutAndClear)
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('afribayit_at');
  response.cookies.delete('afribayit_rt');
  return response;
}
