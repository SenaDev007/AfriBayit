// AfriBayit — POST /api/payments/verify
// Verify payment status with provider and update records

import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { verifyPayment } from '@/lib/payments';
import { db } from '@/lib/db';
import type { PaymentProvider } from '@/lib/payments/types';

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { providerRef, provider } = body as {
      providerRef: string;
      provider: PaymentProvider;
    };

    if (!providerRef || !provider) {
      return NextResponse.json(
        { error: 'providerRef et provider sont requis' },
        { status: 400 }
      );
    }

    // Verify with the payment provider
    const result = await verifyPayment(provider, providerRef);

    // Update the wallet transaction record
    const walletTx = await db.walletTransaction.findFirst({
      where: { providerRef },
    });

    if (walletTx) {
      await db.walletTransaction.update({
        where: { id: walletTx.id },
        data: {
          status: result.status === 'completed' ? 'completed'
            : result.status === 'failed' ? 'failed'
            : 'pending',
          metadata: JSON.stringify({
            ...((walletTx.metadata ? JSON.parse(walletTx.metadata as string) : {}) as Record<string, unknown>),
            verificationStatus: result.status,
            verifiedAt: new Date().toISOString(),
          }),
        },
      });

      // If payment completed, trigger escrow funding
      if (result.status === 'completed' && walletTx.type === 'escrow_fund') {
        const metadata = walletTx.metadata
          ? JSON.parse(walletTx.metadata as string) as Record<string, unknown>
          : {};
        const transactionId = metadata.reference as string | undefined;

        if (transactionId) {
          const { transition } = await import('@/lib/payments/escrow-engine');
          await transition(transactionId, 'FUNDED', auth.userId, 'Paiement vérifié et confirmé');
        }
      }
    }

    return NextResponse.json({
      status: result.status,
      providerRef: result.providerRef,
      amount: result.amount,
      currency: result.currency,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify payment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
