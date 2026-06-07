// AfriBayit — Email Verification API
// POST /api/auth/verify-email — Verify email using OTP code
// GET  /api/auth/verify-email?email=... — Send a new verification code

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendOTP, verifyOTP } from '@/lib/otp';
import { rateLimit, getRateLimitKey } from '@/lib/security/rate-limiter';
import { z } from 'zod';

const verifyEmailSchema = z.object({
  email: z.string().email('Email invalide'),
  code: z.string().length(6, 'Le code doit contenir 6 chiffres'),
});

// GET: Send verification email
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    // Rate limit: 3 verification emails per IP per hour
    const rlKey = getRateLimitKey(request);
    const rlResult = await rateLimit(`verify-email:${rlKey}`, 3, 60 * 60 * 1000);
    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: 'Trop de demandes. Veuillez réessayer plus tard.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(rlResult.retryAfter) } }
      );
    }

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ message: 'Code de vérification envoyé si le compte existe.' });
    }

    if (user.verified) {
      return NextResponse.json({ message: 'Cet email est déjà vérifié.' });
    }

    try {
      await sendOTP(email);
    } catch (otpError) {
      console.error('[verify-email] OTP send error:', otpError);
    }

    return NextResponse.json({
      message: 'Code de vérification envoyé.',
      ...(process.env.NODE_ENV === 'development' && { devHint: 'Check server console for OTP code' }),
    });
  } catch (error) {
    console.error('[verify-email] GET error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du code' }, { status: 500 });
  }
}

// POST: Verify email with OTP code
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = verifyEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, code } = validation.data;

    // Verify the OTP
    const otpResult = await verifyOTP(email, code);

    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.message || 'Code invalide ou expiré' },
        { status: 400 }
      );
    }

    // Mark email as verified
    const user = await db.user.update({
      where: { email },
      data: { verified: true },
      select: { id: true, email: true, verified: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Email vérifié avec succès.',
      user: { id: user.id, email: user.email, verified: user.verified },
    });
  } catch (error) {
    console.error('[verify-email] POST error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
