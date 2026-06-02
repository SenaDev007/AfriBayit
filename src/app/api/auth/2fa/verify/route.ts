import { NextResponse } from 'next/server';
import { verify2FALogin } from '@/lib/twofa';
import { db } from '@/lib/db';
import { rateLimit, getRateLimitKey } from '@/lib/security/rate-limiter';
import { z } from 'zod';

const verify2FASchema = z.object({
  userId: z.string().min(1, 'ID utilisateur requis'),
  token: z.string().length(6, 'Le code TOTP doit contenir 6 chiffres'),
});

/**
 * POST /api/auth/2fa/verify
 * Verify 2FA TOTP code during login flow
 * This is called as a second step after password verification when user has 2FA enabled
 */
export async function POST(request: Request) {
  try {
    // Rate limit: 5 TOTP verification attempts per IP per 15 minutes
    const rlKey = getRateLimitKey(request);
    // CRITICAL: rateLimit is async, MUST be awaited!
    const rlResult = await rateLimit(`2fa-verify:${rlKey}`, 5, 15 * 60 * 1000);
    if (!rlResult.allowed) {
      return NextResponse.json(
        {
          error: 'Trop de tentatives de vérification 2FA. Veuillez réessayer plus tard.',
          code: 'RATE_LIMITED',
          retryAfter: rlResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rlResult.retryAfter),
          },
        }
      );
    }

    const body = await request.json();
    const validation = verify2FASchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userId, token } = validation.data;

    // Verify the user exists and has 2FA enabled
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        country: true,
        kycLevel: true,
        twoFactorEnabled: true,
      },
    });

    if (!user || !user.twoFactorEnabled) {
      return NextResponse.json(
        { error: '2FA non configuré pour cet utilisateur' },
        { status: 400 }
      );
    }

    const result = await verify2FALogin(userId, token);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Return user data for session creation
    return NextResponse.json({
      verified: true,
      message: result.message,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        country: user.country,
        kycLevel: user.kycLevel,
      },
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification 2FA' },
      { status: 500 }
    );
  }
}
