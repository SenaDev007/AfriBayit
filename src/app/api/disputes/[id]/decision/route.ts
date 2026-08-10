// AfriBayit — POST /api/disputes/[id]/decision
// Admin submits arbitration decision

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { decidedBy, buyerPercentage, sellerPercentage, reasoning } = body as {
      decidedBy: string;
      buyerPercentage: number;
      sellerPercentage: number;
      reasoning: string;
    };

    if (!decidedBy || buyerPercentage === undefined || sellerPercentage === undefined || !reasoning) {
      return NextResponse.json(
        { error: 'decidedBy, buyerPercentage, sellerPercentage et reasoning sont requis' },
        { status: 400 }
      );
    }

    // Verify the dispute exists
    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        escrowAccount: true,
      },
    });

    if (!transaction || !transaction.disputeReason) {
      return NextResponse.json({ error: 'Litige non trouvé' }, { status: 404 });
    }

    const escrowAccount = transaction.escrowAccount;
    if (!escrowAccount) {
      return NextResponse.json(
        { error: 'Compte escrow non trouvé pour cette transaction' },
        { status: 400 }
      );
    }

    const now = new Date();
    const totalAmount = escrowAccount.heldAmount;
    const buyerAmount = Math.round(totalAmount * (buyerPercentage / 100) * 100) / 100;
    const sellerAmount = Math.round(totalAmount * (sellerPercentage / 100) * 100) / 100;

    // Determine final status
    const finalStatus = buyerPercentage === 100 ? 'REFUNDED' : 'DISPUTED_RESOLVED';

    // Use a Prisma transaction for atomicity
    await db.$transaction([
      // 1. Update Transaction status
      db.transaction.update({
        where: { id },
        data: {
          status: finalStatus,
          escrowReleasedAt: now,
          conditions: JSON.stringify({
            disputeResolution: {
              decidedBy,
              buyerPercentage,
              sellerPercentage,
              reasoning,
              decidedAt: now.toISOString(),
            },
          }),
        },
      }),

      // 2. Create EscrowLedger entry for buyer refund
      db.escrowLedger.create({
        data: {
          escrowAccountId: escrowAccount.id,
          entryType: 'REFUND',
          amount: buyerAmount,
          balanceAfter: escrowAccount.balance - buyerAmount,
          currency: escrowAccount.currency,
          reference: `dispute_refund_buyer_${id}`,
          metadata: JSON.stringify({
            reason: 'Dispute resolution — buyer refund',
            percentage: buyerPercentage,
            decidedBy,
          }),
        },
      }),

      // 3. Create EscrowLedger entry for seller release
      db.escrowLedger.create({
        data: {
          escrowAccountId: escrowAccount.id,
          entryType: 'RELEASE',
          amount: sellerAmount,
          balanceAfter: escrowAccount.balance - buyerAmount - sellerAmount,
          currency: escrowAccount.currency,
          reference: `dispute_release_seller_${id}`,
          metadata: JSON.stringify({
            reason: 'Dispute resolution — seller release',
            percentage: sellerPercentage,
            decidedBy,
          }),
        },
      }),

      // 4. Update EscrowAccount
      db.escrowAccount.update({
        where: { id: escrowAccount.id },
        data: {
          releasedAmount: escrowAccount.releasedAmount + sellerAmount,
          refundedAmount: escrowAccount.refundedAmount + buyerAmount,
          heldAmount: 0,
          balance: 0,
          status: buyerPercentage === 100 ? 'REFUNDED' : 'PARTIAL_RELEASE',
          releasedAt: now,
          refundedAt: now,
        },
      }),

      // 5. Create timeline entry for the decision
      db.transactionTimeline.create({
        data: {
          transactionId: id,
          fromStatus: transaction.status,
          toStatus: finalStatus,
          actorType: 'admin',
          actorId: decidedBy,
          description: `Arbitration decision: ${buyerPercentage}% buyer / ${sellerPercentage}% seller — ${reasoning}`,
          metadata: JSON.stringify({
            type: 'arbitration_decision',
            decidedBy,
            buyerPercentage,
            sellerPercentage,
            reasoning,
            buyerAmount,
            sellerAmount,
          }),
        },
      }),

      // 6. Create AuditLog entry
      db.auditLog.create({
        data: {
          actorId: decidedBy,
          actorRole: 'admin',
          action: 'dispute.decision',
          targetType: 'transaction',
          targetId: id,
          details: JSON.stringify({
            buyerPercentage,
            sellerPercentage,
            reasoning,
            buyerAmount,
            sellerAmount,
            escrowAccountId: escrowAccount.id,
          }),
        },
      }),
    ]);

    const decision = {
      decidedBy,
      buyerPercentage,
      sellerPercentage,
      reasoning,
      buyerAmount,
      sellerAmount,
      decidedAt: now.toISOString(),
      finalStatus,
    };

    return NextResponse.json({
      success: true,
      decision,
      disputeId: id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit decision';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
