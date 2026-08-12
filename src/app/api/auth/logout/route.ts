// POST /api/auth/logout — Revoke the current JWT + refresh token.
// CDC §4.1 — P0 critical endpoint.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { blacklistToken } from '@/lib/security/jwt-security';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ success: true }); // Already logged out
    }

    // Get the JWT ID from the session token
    const token = (session as any)?.accessToken;
    const jti = (session as any)?.jti;
    const exp = (session as any)?.exp;

    // Blacklist the access token
    if (jti && exp) {
      await blacklistToken(jti, exp, 'logout');
    }

    // TODO: Revoke refresh tokens in the database
    // await db.refreshToken.updateMany({
    //   where: { userId: session.user.id, revoked: false },
    //   data: { revoked: true },
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[auth/logout] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
  }
}
