import { NextResponse } from 'next/server';
import { sendOTP } from '@/lib/otp';
import { z } from 'zod';

const sendOTPSchema = z.object({
  identifier: z.string().min(1, 'Numéro de téléphone ou email requis'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = sendOTPSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { identifier } = validation.data;

    // Basic format validation
    const isEmail = identifier.includes('@');
    const isPhone = /^\+?[1-9]\d{6,14}$/.test(identifier.replace(/[\s-]/g, ''));

    if (!isEmail && !isPhone) {
      return NextResponse.json(
        { error: 'Format invalide. Utilisez un email ou numéro de téléphone valide.' },
        { status: 400 }
      );
    }

    const result = await sendOTP(identifier);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      message: result.message,
      // In development, include hint for testing
      ...(process.env.NODE_ENV === 'development' && { devHint: 'Check server console for OTP code' }),
    });
  } catch (error) {
    console.error('OTP send error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du code de vérification' },
      { status: 500 }
    );
  }
}
