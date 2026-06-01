// AfriBayit — POST /api/payouts/request
// Request a payout — validates wallet balance and creates payout request

import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { validatePayoutEligibility, processPayout, calculateCommission } from '@/lib/payments/payout';
import type { PaymentMethod } from '@/lib/payments/types';

export async function POST(request: Request) {
  try {
    const auth = await authGuard({ requireKycLevel: 2 });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { amount, currency = 'XOF', method, destination } = body as {
      amount: number;
      currency?: string;
      method: PaymentMethod;
      destination: string;
    };

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    if (!method) {
      return NextResponse.json({ error: 'Moyen de paiement requis' }, { status: 400 });
    }

    if (!destination) {
      return NextResponse.json(
        { error: 'Destination requise (numéro Mobile Money ou référence bancaire)' },
        { status: 400 }
      );
    }

    // Get user's country
    const user = await (await import('@/lib/db')).db.user.findUnique({
      where: { id: auth.userId },
      select: { country: true },
    });

    const countryCode = user?.country || 'BJ';

    // Validate payout eligibility
    const validation = await validatePayoutEligibility(auth.userId, amount);
    if (!validation.eligible) {
      return NextResponse.json(
        { error: validation.reason, eligible: false },
        { status: 422 }
      );
    }

    // Calculate fees
    const commission = calculateCommission(amount);

    // Process the payout
    const result = await processPayout({
      userId: auth.userId,
      amount,
      currency,
      method,
      destination,
      countryCode,
    });

    return NextResponse.json({
      success: result.success,
      payoutId: result.payoutId,
      providerRef: result.providerRef,
      status: result.status,
      fees: commission,
    }, { status: 201 });
  } catch (error) {
    console.error('Payout request error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process payout request';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
