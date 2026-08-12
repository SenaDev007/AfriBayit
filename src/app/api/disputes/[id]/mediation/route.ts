// AfriBayit — POST /api/disputes/[id]/mediation
// Submit or respond to a mediation proposal

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { proposedBy, buyerPercentage, sellerPercentage, message } = body as {
      proposedBy: 'buyer' | 'seller' | 'system';
      buyerPercentage: number;
      sellerPercentage: number;
      message: string;
    };

    if (!proposedBy || buyerPercentage === undefined || sellerPercentage === undefined) {
      return NextResponse.json(
        { error: 'proposedBy, buyerPercentage et sellerPercentage sont requis' },
        { status: 400 }
      );
    }

    if (buyerPercentage + sellerPercentage !== 100) {
      return NextResponse.json(
        { error: 'La somme des pourcentages doit être égale à 100' },
        { status: 400 }
      );
    }

    // Verify the dispute exists
    const transaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!transaction || !transaction.disputeReason) {
      return NextResponse.json({ error: 'Litige non trouvé' }, { status: 404 });
    }

    const now = new Date();

    // Create a timeline entry for the mediation proposal
    const timelineEntry = await db.transactionTimeline.create({
      data: {
        transactionId: id,
        fromStatus: transaction.status,
        toStatus: 'DISPUTED_MEDIATION',
        actorType: proposedBy,
        description: `Mediation proposal by ${proposedBy}: ${buyerPercentage}% buyer / ${sellerPercentage}% seller${message ? ` — ${message}` : ''}`,
        metadata: JSON.stringify({
          type: 'mediation_proposal',
          proposedBy,
          buyerPercentage,
          sellerPercentage,
          message,
          status: 'pending',
          proposedAt: now.toISOString(),
        }),
      },
    });

    // Update transaction status to DISPUTED_MEDIATION if not already
    if (transaction.status !== 'DISPUTED_MEDIATION') {
      await db.transaction.update({
        where: { id },
        data: { status: 'DISPUTED_MEDIATION' },
      });
    }

    const proposal = {
      proposedBy,
      buyerPercentage,
      sellerPercentage,
      message,
      status: 'pending',
      proposedAt: now.toISOString(),
    };

    return NextResponse.json({
      success: true,
      proposal,
      disputeId: id,
      timelineEntryId: timelineEntry.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit mediation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
