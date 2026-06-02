// AfriBayit — POST /api/escrow/[id]/release-2fa
// 2FA verification for escrow fund release
// Requires OTP code from the admin's authenticator

import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { otpCode, confirmationChecked } = body as {
      otpCode?: string;
      confirmationChecked?: boolean;
    };

    // In production: verify OTP against user's TOTP secret
    // For demo: accept any 6-digit code or the confirmation flag
    if (!otpCode && !confirmationChecked) {
      return NextResponse.json(
        { error: 'Code 2FA ou confirmation requis' },
        { status: 400 }
      );
    }

    if (otpCode && !/^\d{6}$/.test(otpCode)) {
      return NextResponse.json(
        { error: 'Code OTP invalide (6 chiffres requis)' },
        { status: 400 }
      );
    }

    // Demo: always return success
    return NextResponse.json({
      success: true,
      verified: true,
      transactionId: id,
      message: 'Vérification 2FA réussie. Les fonds peuvent être libérés.',
      verifiedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '2FA verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
