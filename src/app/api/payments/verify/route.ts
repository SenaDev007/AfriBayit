// AfriBayit — POST /api/payments/verify
// Verify payment status with provider and update records
// On successful payment, triggers escrow funding

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

    console.log(`[Payment Verify] providerRef=${providerRef}, status=${result.status}, amount=${result.amount} ${result.currency}`);

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
            verifiedAmount: result.amount,
            verifiedCurrency: result.currency,
          }),
        },
      });

      // If payment completed, trigger escrow funding
      if (result.status === 'completed' && walletTx.type === 'escrow_fund') {
        const metadata = walletTx.metadata
          ? JSON.parse(walletTx.metadata as string) as Record<string, unknown>
          : {};
        const transactionId = (metadata.transactionId as string) || (metadata.reference as string | undefined);

        if (transactionId) {
          try {
            // Import escrow engine dynamically to avoid circular deps
            const { transition } = await import('@/lib/payments/escrow-engine');
            await transition(transactionId, 'FUNDED', auth.userId, 'Paiement vérifié et confirmé — Fonds déposés en escrow');

            console.log(`[Payment Verify] Escrow FUNDED for transaction ${transactionId}`);

            // Update the Transaction record's payment reference
            await db.transaction.update({
              where: { id: transactionId },
              data: {
                status: 'FUNDED',
                escrowFundedAt: new Date(),
                paymentRef: providerRef,
              },
            }).catch(() => {
              // Transaction record might not exist for non-property payments
            });
          } catch (escrowError) {
            console.error('[Payment Verify] Escrow funding failed:', escrowError);
            // Don't fail the verification — the webhook will handle it
          }
        }
      }

      // If payment failed, update transaction status
      if (result.status === 'failed') {
        const metadata = walletTx.metadata
          ? JSON.parse(walletTx.metadata as string) as Record<string, unknown>
          : {};
        const transactionId = (metadata.transactionId as string) || (metadata.reference as string | undefined);

        if (transactionId) {
          await db.transaction.update({
            where: { id: transactionId },
            data: {
              status: 'CREATED', // Reset to CREATED so buyer can retry
              paymentRef: providerRef,
            },
          }).catch(() => {
            // Transaction record might not exist
          });
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
