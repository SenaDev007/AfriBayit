// AfriBayit — Reset Password API
// POST /api/auth/reset-password — Verify OTP and set new password

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyOTP } from '@/lib/otp';
import { hashPassword } from '@/lib/auth';
import { rateLimit, getRateLimitKey } from '@/lib/security/rate-limiter';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
  code: z.string().length(6, 'Le code doit contenir 6 chiffres'),
  newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export async function POST(request: Request) {
  try {
    // Rate limit: 5 reset attempts per IP per 15 minutes
    const rlKey = getRateLimitKey(request);
    const rlResult = await rateLimit(`reset-password:${rlKey}`, 5, 15 * 60 * 1000);
    if (!rlResult.allowed) {
      return NextResponse.json(
        {
          error: 'Trop de tentatives de réinitialisation. Veuillez réessayer plus tard.',
          code: 'RATE_LIMITED',
          retryAfter: rlResult.retryAfter,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rlResult.retryAfter) },
        }
      );
    }

    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, code, newPassword } = validation.data;

    // Verify the OTP
    const otpResult = await verifyOTP(email, code);

    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.message || 'Code de vérification invalide ou expiré' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Compte non trouvé' },
        { status: 404 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update the user's password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
    });
  } catch (error) {
    console.error('[reset-password] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation du mot de passe' },
      { status: 500 }
    );
  }
}
