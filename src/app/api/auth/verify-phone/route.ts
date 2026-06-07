// AfriBayit — Verify Phone API
// GET  /api/auth/verify-phone?phone=... — Send a new verification code
// POST /api/auth/verify-phone — Verify phone using OTP code

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendOTP, verifyOTP } from '@/lib/otp';
import { rateLimit, getRateLimitKey } from '@/lib/security/rate-limiter';
import { z } from 'zod';

const verifyPhoneSchema = z.object({
  phone: z.string().min(1, 'Numéro de téléphone requis'),
  code: z.string().length(6, 'Le code doit contenir 6 chiffres'),
});

// GET: Send verification SMS
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Numéro de téléphone requis' }, { status: 400 });
    }

    // Rate limit
    const rlKey = getRateLimitKey(request);
    const rlResult = await rateLimit(`verify-phone:${rlKey}`, 3, 60 * 60 * 1000);
    if (!rlResult.allowed) {
      return NextResponse.json(
        { error: 'Trop de demandes. Veuillez réessayer plus tard.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(rlResult.retryAfter) } }
      );
    }

    try {
      await sendOTP(phone);
    } catch (otpError) {
      console.error('[verify-phone] OTP send error:', otpError);
    }

    return NextResponse.json({
      message: 'Code de vérification envoyé.',
      ...(process.env.NODE_ENV === 'development' && { devHint: 'Check server console for OTP code' }),
    });
  } catch (error) {
    console.error('[verify-phone] GET error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi du code' }, { status: 500 });
  }
}

// POST: Verify phone with OTP code
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const body = await request.json();
    const validation = verifyPhoneSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { phone, code } = validation.data;

    // Verify the OTP
    const otpResult = await verifyOTP(phone, code);

    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.message || 'Code invalide ou expiré' },
        { status: 400 }
      );
    }

    // Mark phone as verified
    await db.user.update({
      where: { id: userId },
      data: { phoneVerified: new Date(), phone },
    });

    return NextResponse.json({
      success: true,
      message: 'Numéro de téléphone vérifié avec succès.',
    });
  } catch (error) {
    console.error('[verify-phone] POST error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
