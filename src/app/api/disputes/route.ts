// AfriBayit — GET /api/disputes
// List disputes (Transactions where disputeReason is NOT null)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Map transaction status to dispute step number
function statusToStep(status: string): number {
  const map: Record<string, number> = {
    DISPUTED: 1,
    DISPUTED_EVIDENCE: 2,
    DISPUTED_MEDIATION: 3,
    DISPUTED_ADMIN: 4,
    DISPUTED_DECIDED: 5,
    DISPUTED_RESOLVED: 6,
  };
  return map[status] ?? 1;
}

// Map transaction status to a human-readable dispute status
function statusToDisputeStatus(status: string): string {
  const map: Record<string, string> = {
    DISPUTED: 'open',
    DISPUTED_EVIDENCE: 'evidence',
    DISPUTED_MEDIATION: 'mediation',
    DISPUTED_ADMIN: 'admin_review',
    DISPUTED_DECIDED: 'decided',
    DISPUTED_RESOLVED: 'resolved',
  };
  return map[status] ?? 'open';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const country = searchParams.get('country');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    const where: Record<string, unknown> = {
      disputeReason: { not: null },
    };

    if (status) {
      where.status = status;
    }
    if (country) {
      where.country = country;
    }

    const [total, transactions] = await Promise.all([
      db.transaction.count({ where }),
      db.transaction.findMany({
        where,
        include: {
          property: { select: { id: true, title: true, country: true } },
          buyer: { select: { id: true, name: true, email: true } },
          escrowAccount: { select: { id: true, balance: true, heldAmount: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Fetch sellers in a second query (no seller relation on Transaction)
    const sellerIds = [...new Set(transactions.map((t) => t.sellerId))];
    const sellers = await db.user.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, name: true, email: true },
    });
    const sellerMap = new Map(sellers.map((s) => [s.id, s]));

    const disputes = transactions.map((txn) => {
      const seller = sellerMap.get(txn.sellerId);
      return {
        id: txn.id,
        transactionId: txn.id,
        transactionRef: txn.escrowReference || `TXN-${txn.id.slice(-6)}`,
        amount: txn.amount,
        currency: txn.currency,
        buyerId: txn.buyerId,
        buyerName: txn.buyer.name,
        sellerId: txn.sellerId,
        sellerName: seller?.name || 'Inconnu',
        currentStep: statusToStep(txn.status),
        status: statusToDisputeStatus(txn.status),
        reason: txn.disputeReason,
        createdAt: txn.createdAt,
        updatedAt: txn.updatedAt,
      };
    });

    return NextResponse.json({
      disputes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch disputes';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
