// AfriBayit — POST /api/payouts/process
// Process a pending payout (admin only) — validates KYC and initiates transfer

import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { payoutId, action } = body as {
      payoutId: string;
      action: 'approve' | 'reject';
    };

    if (!payoutId) {
      return NextResponse.json({ error: 'ID du paiement requis' }, { status: 400 });
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action invalide. Utilisez "approve" ou "reject"' },
        { status: 400 }
      );
    }

    // Find the pending wallet transaction
    const walletTx = await db.walletTransaction.findUnique({
      where: { id: payoutId },
    });

    if (!walletTx) {
      return NextResponse.json({ error: 'Paiement non trouvé' }, { status: 404 });
    }

    if (walletTx.status !== 'pending') {
      return NextResponse.json(
        { error: `Ce paiement n'est plus en attente (statut: ${walletTx.status})` },
        { status: 422 }
      );
    }

    if (walletTx.type !== 'payout' && walletTx.type !== 'withdrawal') {
      return NextResponse.json(
        { error: 'Ce n\'est pas une demande de paiement' },
        { status: 400 }
      );
    }

    if (action === 'reject') {
      // Reject the payout and refund the wallet
      await db.$transaction(async (tx) => {
        // Update wallet transaction
        await tx.walletTransaction.update({
          where: { id: payoutId },
          data: { status: 'failed' },
        });

        // Refund the user's wallet
        const metadata = walletTx.metadata
          ? JSON.parse(walletTx.metadata as string) as Record<string, unknown>
          : {};
        const userId = walletTx.userId;
        const refundAmount = Math.abs(walletTx.amount);

        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { walletBalance: true, pendingPayout: true },
        });

        if (user) {
          await tx.user.update({
            where: { id: userId },
            data: {
              walletBalance: user.walletBalance + refundAmount,
              pendingPayout: Math.max(0, user.pendingPayout - refundAmount),
            },
          });
        }
      });

      return NextResponse.json({
        success: true,
        action: 'rejected',
        payoutId,
      });
    }

    // Approve: validate KYC level
    const user = await db.user.findUnique({
      where: { id: walletTx.userId },
      select: { kycLevel: true, name: true, email: true },
    });

    if (!user || user.kycLevel < 2) {
      return NextResponse.json(
        { error: 'KYC niveau 2 requis pour approuver ce paiement' },
        { status: 422 }
      );
    }

    // Mark as completed (actual transfer would happen via provider)
    await db.walletTransaction.update({
      where: { id: payoutId },
      data: {
        status: 'completed',
        metadata: JSON.stringify({
          ...(walletTx.metadata ? JSON.parse(walletTx.metadata as string) as Record<string, unknown> : {}),
          approvedBy: auth.userId,
          approvedAt: new Date().toISOString(),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      action: 'approved',
      payoutId,
    });
  } catch (error) {
    console.error('Payout process error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process payout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
