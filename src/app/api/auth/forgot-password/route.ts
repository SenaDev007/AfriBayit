// AfriBayit — Forgot Password API
// POST /api/auth/forgot-password — Send a password reset OTP to user's email

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendOTP } from '@/lib/otp';
import { rateLimit, getRateLimitKey } from '@/lib/security/rate-limiter';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

export async function POST(request: Request) {
  try {
    // Rate limit: 3 password reset requests per IP per hour
    const rlKey = getRateLimitKey(request);
    const rlResult = await rateLimit(`forgot-password:${rlKey}`, 3, 60 * 60 * 1000);
    if (!rlResult.allowed) {
      return NextResponse.json(
        {
          error: 'Trop de demandes de réinitialisation. Veuillez réessayer plus tard.',
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
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Email invalide', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if user exists — but don't reveal whether the email exists for security
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      // Return success anyway to prevent email enumeration
      return NextResponse.json({
        message: 'Si un compte existe avec cet email, un code de vérification a été envoyé.',
      });
    }

    // Send OTP to the user's email
    try {
      await sendOTP(email);
    } catch (otpError) {
      console.error('[forgot-password] OTP send error:', otpError);
      // Still return success to prevent email enumeration
    }

    return NextResponse.json({
      message: 'Si un compte existe avec cet email, un code de vérification a été envoyé.',
      // In development, provide a hint
      ...(process.env.NODE_ENV === 'development' && { devHint: 'Check server console for OTP code' }),
    });
  } catch (error) {
    console.error('[forgot-password] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la demande de réinitialisation' },
      { status: 500 }
    );
  }
}
