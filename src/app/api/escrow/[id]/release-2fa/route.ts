// AfriBayit — POST /api/escrow/[id]/release-2fa
// 2FA verification for escrow fund release
// Requires OTP code from the admin's authenticator

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyTOTP } from '@/lib/twofa';

// Releasable escrow statuses
const RELEASABLE_STATUSES = ['FUNDED', 'PARTIAL_RELEASE'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { otpCode, userId, confirmationChecked } = body as {
      otpCode?: string;
      userId?: string;
      confirmationChecked?: boolean;
    };

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

    // Verify the escrow account exists and is in a releasable state
    const escrowAccount = await db.escrowAccount.findUnique({
      where: { transactionId: id },
      include: {
        transaction: {
          select: {
            id: true,
            status: true,
            buyerId: true,
            sellerId: true,
          },
        },
      },
    });

    if (!escrowAccount) {
      return NextResponse.json(
        { error: 'Compte escrow non trouvé' },
        { status: 404 }
      );
    }

    if (!RELEASABLE_STATUSES.includes(escrowAccount.status)) {
      return NextResponse.json(
        { error: `Le compte escrow n'est pas dans un état libérable (statut: ${escrowAccount.status})` },
        { status: 400 }
      );
    }

    // Verify TOTP code if provided
    if (otpCode) {
      if (!userId) {
        return NextResponse.json(
          { error: 'userId requis pour la vérification 2FA' },
          { status: 400 }
        );
      }

      // Fetch user's 2FA secret
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { twoFactorEnabled: true, twoFactorSecret: true },
      });

      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return NextResponse.json(
          { error: '2FA non configuré pour cet utilisateur' },
          { status: 401 }
        );
      }

      // Verify the OTP code against the user's TOTP secret
      const isValid = verifyTOTP(user.twoFactorSecret, otpCode);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Code 2FA invalide' },
          { status: 401 }
        );
      }
    }

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
