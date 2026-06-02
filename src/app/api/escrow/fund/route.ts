// AfriBayit — POST /api/escrow/fund
// Fund escrow for a transaction — transitions CREATED → FUNDED

import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { db } from '@/lib/db';
import { transition } from '@/lib/payments/escrow-engine';

export async function POST(request: Request) {
  try {
    const auth = await authGuard({ requireKycLevel: 1 });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { transactionId, paymentProvider, paymentRef } = body as {
      transactionId: string;
      paymentProvider?: string;
      paymentRef?: string;
    };

    if (!transactionId) {
      return NextResponse.json(
        { error: 'ID de transaction requis' },
        { status: 400 }
      );
    }

    // Verify the transaction exists and belongs to the buyer
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
      include: { escrowAccount: true },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      );
    }

    // Only the buyer or admin can fund
    if (transaction.buyerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json(
        { error: 'Seul l\'acheteur peut financer cette transaction' },
        { status: 403 }
      );
    }

    // Verify transaction is in CREATED state
    if (transaction.status !== 'CREATED') {
      return NextResponse.json(
        { error: `La transaction doit être en état CREATED pour être financée. État actuel: ${transaction.status}` },
        { status: 422 }
      );
    }

    // Create escrow account if it doesn't exist
    if (!transaction.escrowAccount) {
      await db.escrowAccount.create({
        data: {
          transactionId,
          balance: 0,
          heldAmount: 0,
          releasedAmount: 0,
          refundedAmount: 0,
          currency: transaction.currency,
          status: 'EMPTY',
        },
      });
    }

    // Update transaction with payment info
    if (paymentProvider || paymentRef) {
      await db.transaction.update({
        where: { id: transactionId },
        data: {
          paymentProvider: paymentProvider || transaction.paymentProvider,
          paymentRef: paymentRef || transaction.paymentRef,
        },
      });
    }

    // Perform the transition to FUNDED
    const result = await transition(
      transactionId,
      'FUNDED',
      auth.userId,
      'Escrow financé par l\'acheteur',
      { paymentProvider, paymentRef }
    );

    return NextResponse.json({
      success: true,
      transition: result,
    });
  } catch (error) {
    console.error('Escrow fund error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fund escrow';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
