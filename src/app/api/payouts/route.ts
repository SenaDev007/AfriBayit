// AfriBayit — /api/payouts
// GET: List payouts for authenticated user
// POST: Manually trigger payout for a completed transaction

import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { db } from '@/lib/db';
import { schedulePayout, schedulePayoutAfterRelease } from '@/lib/payments/payout-engine';
import type { PayoutMethod } from '@/lib/payments/payout-engine';

export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      recipientId: auth.userId,
    };

    if (status) {
      where.status = status;
    }

    const [payouts, total] = await Promise.all([
      db.scheduledPayout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.scheduledPayout.count({ where }),
    ]);

    return NextResponse.json({
      payouts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List payouts error:', error);
    const message = error instanceof Error ? error.message : 'Failed to list payouts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard({ requireKycLevel: 2 });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { transactionId, method, destination } = body as {
      transactionId: string;
      method?: PayoutMethod;
      destination?: string;
    };

    if (!transactionId) {
      return NextResponse.json(
        { error: 'ID de transaction requis' },
        { status: 400 }
      );
    }

    // Verify the transaction exists and belongs to the user
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

    // Only the seller can request a payout
    if (transaction.sellerId !== auth.userId) {
      return NextResponse.json(
        { error: 'Seul le vendeur peut demander un paiement' },
        { status: 403 }
      );
    }

    // Transaction must be released
    if (transaction.status !== 'RELEASED') {
      return NextResponse.json(
        { error: 'La transaction doit être libérée avant le paiement' },
        { status: 422 }
      );
    }

    // Check if a payout already exists for this transaction
    const existingPayout = await db.scheduledPayout.findFirst({
      where: {
        transactionId,
        recipientId: auth.userId,
        status: { in: ['scheduled', 'processing'] },
      },
    });

    if (existingPayout) {
      return NextResponse.json(
        {
          error: 'Un paiement est déjà programmé pour cette transaction',
          payoutId: existingPayout.id,
          status: existingPayout.status,
          scheduledAt: existingPayout.scheduledAt,
        },
        { status: 409 }
      );
    }

    // Schedule the payout
    const result = await schedulePayoutAfterRelease(transactionId);

    if (!result) {
      return NextResponse.json(
        { error: 'Impossible de programmer le paiement' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payout: result,
    }, { status: 201 });
  } catch (error) {
    console.error('Create payout error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create payout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
