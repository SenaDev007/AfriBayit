// AfriBayit — POST /api/payments/verify
// Verifies a payment after callback/polling and updates escrow status

import { NextRequest, NextResponse } from 'next/server';
import { verifyPayment } from '@/lib/payments/provider-router';
import { db } from '@/lib/db';
import type { PaymentProvider } from '@/lib/payments/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      transactionId,   // Our internal transaction ID
      providerRef,     // Provider transaction reference
      provider,        // 'fedapay' | 'stripe'
    } = body;

    if (!providerRef) {
      return NextResponse.json(
        { error: 'providerRef is required' },
        { status: 400 }
      );
    }

    if (!provider || !['fedapay', 'stripe'].includes(provider)) {
      return NextResponse.json(
        { error: 'Valid provider (fedapay|stripe) is required' },
        { status: 400 }
      );
    }

    // Verify the payment with the provider
    const result = await verifyPayment(providerRef, provider as PaymentProvider);

    // If we have an internal transaction ID, update escrow status
    if (transactionId && result.success) {
      const transaction = await db.transaction.findUnique({
        where: { id: transactionId },
        include: { escrowAccount: true },
      });

      if (transaction) {
        // Update payment reference
        await db.transaction.update({
          where: { id: transactionId },
          data: {
            paymentProvider: provider,
            paymentRef: providerRef,
          },
        });

        // If payment completed and escrow is empty, fund the escrow
        if (result.status === 'completed' && transaction.status === 'CREATED') {
          const { transition } = await import('@/lib/payments/escrow-engine');

          try {
            await transition(
              transactionId,
              'FUNDED',
              transaction.buyerId,
              `Paiement confirmé via ${provider === 'fedapay' ? 'FedaPay' : 'Stripe'}`
            );
          } catch (transitionError) {
            console.error('Escrow transition error after payment verification:', transitionError);
            // Don't fail the verification — just log the error
          }

          // Create wallet transaction record
          const buyer = await db.user.findUnique({
            where: { id: transaction.buyerId },
          });

          if (buyer) {
            await db.walletTransaction.create({
              data: {
                userId: transaction.buyerId,
                type: 'escrow_fund',
                amount: transaction.amount,
                balanceAfter: buyer.walletBalance,
                currency: transaction.currency,
                status: 'completed',
                providerRef,
                metadata: JSON.stringify({
                  transactionId,
                  provider,
                  amount: result.amount,
                  currency: result.currency,
                }),
              },
            });
          }
        }
      }
    }

    // Also check by paymentRef if no transactionId provided
    if (!transactionId && providerRef) {
      const transaction = await db.transaction.findFirst({
        where: { paymentRef: providerRef },
      });

      if (transaction && result.success && result.status === 'completed' && transaction.status === 'CREATED') {
        const { transition } = await import('@/lib/payments/escrow-engine');

        try {
          await transition(
            transaction.id,
            'FUNDED',
            transaction.buyerId,
            `Paiement confirmé via ${provider === 'fedapay' ? 'FedaPay' : 'Stripe'}`
          );
        } catch (transitionError) {
          console.error('Escrow transition error:', transitionError);
        }
      }
    }

    return NextResponse.json({
      success: result.success,
      provider: result.provider,
      status: result.status,
      amount: result.amount,
      currency: result.currency,
      metadata: result.metadata,
      error: result.error,
    });
  } catch (error) {
    console.error('POST /api/payments/verify error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
