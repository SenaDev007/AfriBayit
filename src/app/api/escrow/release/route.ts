// AfriBayit — POST /api/escrow/release
// Release escrow funds — transitions ANDF_REGISTERED → RELEASED
// Validates all release conditions and initiates payout to seller

import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { db } from '@/lib/db';
import { transition, checkReleaseConditions } from '@/lib/payments/escrow-engine';
import { processSellerPayout } from '@/lib/payments/payout';

export async function POST(request: Request) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin', 'notary'] });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { transactionId, reason } = body as {
      transactionId: string;
      reason?: string;
    };

    if (!transactionId) {
      return NextResponse.json(
        { error: 'ID de transaction requis' },
        { status: 400 }
      );
    }

    // Verify the transaction exists
    const transaction = await db.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      );
    }

    // Check release conditions
    const releaseCheck = await checkReleaseConditions(transactionId);

    if (!releaseCheck.canRelease) {
      return NextResponse.json(
        {
          error: 'Les conditions de libération ne sont pas toutes remplies',
          conditions: releaseCheck.conditions,
          missing: releaseCheck.missing,
        },
        { status: 422 }
      );
    }

    // Perform the transition to RELEASED
    const result = await transition(
      transactionId,
      'RELEASED',
      auth.userId,
      reason || 'Fonds libérés — toutes conditions remplies'
    );

    // Process seller payout
    try {
      await processSellerPayout(transactionId);
    } catch (payoutError) {
      console.error('Seller payout failed (funds released but payout pending):', payoutError);
      // The escrow is released; payout can be retried
    }

    return NextResponse.json({
      success: true,
      transition: result,
      payoutInitiated: true,
    });
  } catch (error) {
    console.error('Escrow release error:', error);
    const message = error instanceof Error ? error.message : 'Failed to release escrow';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
