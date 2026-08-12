// AfriBayit — POST /api/escrow/dispute
// Initiate a dispute for a transaction — transitions to DISPUTED

import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { db } from '@/lib/db';
import { initDispute } from '@/lib/payments/escrow-engine';

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { transactionId, reason } = body as {
      transactionId: string;
      reason: string;
    };

    if (!transactionId) {
      return NextResponse.json(
        { error: 'ID de transaction requis' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'La raison du litige est requise' },
        { status: 400 }
      );
    }

    // Verify the transaction exists and user is involved
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      );
    }

    // Only buyer, seller, or admin can dispute
    if (
      transaction.buyerId !== auth.userId &&
      transaction.sellerId !== auth.userId &&
      auth.role !== 'admin'
    ) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à signaler un litige pour cette transaction' },
        { status: 403 }
      );
    }

    // Check if already in terminal or disputed state
    if (['RELEASED', 'REFUNDED', 'CANCELLED', 'DISPUTED'].includes(transaction.status)) {
      return NextResponse.json(
        { error: `Impossible de signaler un litige depuis l'état ${transaction.status}` },
        { status: 422 }
      );
    }

    // Initiate the dispute
    const result = await initDispute(transactionId, reason, auth.userId);

    return NextResponse.json({
      success: true,
      transition: result,
    });
  } catch (error) {
    console.error('Escrow dispute error:', error);
    const message = error instanceof Error ? error.message : 'Failed to initiate dispute';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
