// POST /api/auth/refresh — Exchange a refresh token for a new access token.
// CDC §4.1 — P0 critical endpoint.

import { NextRequest, NextResponse } from 'next/server';
import { rotateRefreshToken } from '@/lib/security/jwt-security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token requis' },
        { status: 400 }
      );
    }

    const newPair = await rotateRefreshToken(refreshToken);

    if (!newPair) {
      return NextResponse.json(
        { success: false, error: 'Token de rafraîchissement invalide ou expiré' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      accessToken: newPair.accessToken,
      refreshToken: newPair.refreshToken,
      expiresInSeconds: Math.floor((newPair.accessExpiry - Date.now() / 1000)),
    });
  } catch (error) {
    console.error('[auth/refresh] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du rafraîchissement du token' },
      { status: 500 }
    );
  }
}
