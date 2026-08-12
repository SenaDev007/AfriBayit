// AfriBayit — GET/PATCH /api/disputes/[id]
// Get dispute details and advance step

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

// Map action to new transaction status
function actionToStatus(action: string): string {
  const map: Record<string, string> = {
    open_evidence: 'DISPUTED_EVIDENCE',
    start_mediation: 'DISPUTED_MEDIATION',
    escalate: 'DISPUTED_ADMIN',
    resolve: 'DISPUTED_RESOLVED',
  };
  return map[action] ?? 'DISPUTED';
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, title: true, type: true, country: true, city: true, images: true } },
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        escrowAccount: {
          include: {
            ledger: { orderBy: { createdAt: 'asc' } },
          },
        },
        timelineEvents: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!transaction || !transaction.disputeReason) {
      return NextResponse.json({ error: 'Litige non trouvé' }, { status: 404 });
    }

    // Fetch seller separately (no seller relation on Transaction)
    const seller = await db.user.findUnique({
      where: { id: transaction.sellerId },
      select: { id: true, name: true, email: true, phone: true },
    });

    const dispute = {
      id: transaction.id,
      transactionId: transaction.id,
      transactionRef: transaction.escrowReference || `TXN-${transaction.id.slice(-6)}`,
      amount: transaction.amount,
      currency: transaction.currency,
      country: transaction.country,
      buyerId: transaction.buyerId,
      buyerName: transaction.buyer.name,
      sellerId: transaction.sellerId,
      sellerName: seller?.name || 'Inconnu',
      currentStep: statusToStep(transaction.status),
      status: statusToDisputeStatus(transaction.status),
      reason: transaction.disputeReason,
      property: transaction.property,
      buyer: transaction.buyer,
      seller: seller ? { id: seller.id, name: seller.name, email: seller.email } : null,
      escrowAccount: transaction.escrowAccount,
      escrowLedger: transaction.escrowAccount?.ledger || [],
      timeline: transaction.timelineEvents,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };

    return NextResponse.json({ dispute });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch dispute';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, resolution, splitBuyer, splitSeller } = body as {
      action: 'open_evidence' | 'start_mediation' | 'escalate' | 'resolve';
      resolution?: string;
      splitBuyer?: number;
      splitSeller?: number;
    };

    if (!action) {
      return NextResponse.json({ error: 'Action requise' }, { status: 400 });
    }

    const transaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!transaction || !transaction.disputeReason) {
      return NextResponse.json({ error: 'Litige non trouvé' }, { status: 404 });
    }

    const oldStatus = transaction.status;
    const newStatus = actionToStatus(action);

    // Update the transaction and create audit log + timeline entry
    const [updatedTxn] = await db.$transaction([
      db.transaction.update({
        where: { id },
        data: {
          status: newStatus,
          ...(action === 'resolve' && resolution ? { conditions: JSON.stringify({ resolution, splitBuyer, splitSeller }) } : {}),
        },
      }),
      db.transactionTimeline.create({
        data: {
          transactionId: id,
          fromStatus: oldStatus,
          toStatus: newStatus,
          actorType: 'admin',
          description: `Dispute action: ${action}${resolution ? ` — ${resolution}` : ''}`,
          metadata: JSON.stringify({ action, resolution, splitBuyer, splitSeller }),
        },
      }),
      db.auditLog.create({
        data: {
          action: `dispute.${action}`,
          targetType: 'transaction',
          targetId: id,
          details: JSON.stringify({ fromStatus: oldStatus, toStatus: newStatus, resolution, splitBuyer, splitSeller }),
        },
      }),
    ]);

    // Re-fetch with relations for the response
    const fullTxn = await db.transaction.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, title: true } },
        buyer: { select: { id: true, name: true, email: true } },
        escrowAccount: true,
        timelineEvents: { orderBy: { createdAt: 'asc' } },
      },
    });

    const seller = fullTxn?.sellerId
      ? await db.user.findUnique({
          where: { id: fullTxn.sellerId },
          select: { id: true, name: true, email: true },
        })
      : null;

    const dispute = {
      id: updatedTxn.id,
      transactionId: updatedTxn.id,
      transactionRef: updatedTxn.escrowReference || `TXN-${updatedTxn.id.slice(-6)}`,
      amount: updatedTxn.amount,
      currency: updatedTxn.currency,
      buyerId: updatedTxn.buyerId,
      buyerName: fullTxn?.buyer.name,
      sellerId: updatedTxn.sellerId,
      sellerName: seller?.name || 'Inconnu',
      currentStep: statusToStep(newStatus),
      status: statusToDisputeStatus(newStatus),
      reason: updatedTxn.disputeReason,
      property: fullTxn?.property,
      escrowAccount: fullTxn?.escrowAccount,
      timeline: fullTxn?.timelineEvents,
      createdAt: updatedTxn.createdAt,
      updatedAt: updatedTxn.updatedAt,
    };

    return NextResponse.json({ success: true, dispute });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update dispute';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
