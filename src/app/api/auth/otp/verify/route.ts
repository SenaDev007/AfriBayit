import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';
import { rateLimit, getRateLimitKey } from '@/lib/security/rate-limiter';
import { z } from 'zod';

const verifyOTPSchema = z.object({
  identifier: z.string().min(1, 'Numéro de téléphone ou email requis'),
  code: z.string().length(6, 'Le code doit contenir 6 chiffres'),
});

export async function POST(request: Request) {
  try {
    // Rate limit: 10 OTP verification attempts per IP per 15 minutes
    const rlKey = getRateLimitKey(request);
    const rlResult = rateLimit(`otp-verify:${rlKey}`, 10, 15 * 60 * 1000);
    if (!rlResult.allowed) {
      return NextResponse.json(
        {
          error: 'Trop de tentatives de vérification. Veuillez réessayer plus tard.',
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
    const validation = verifyOTPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { identifier, code } = validation.data;

    const result = await verifyOTP(identifier, code);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      verified: true,
      message: result.message,
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du code' },
      { status: 500 }
    );
  }
}
