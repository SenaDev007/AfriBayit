// AfriBayit — POST /api/disputes/[id]/mediation
// Submit or respond to a mediation proposal

import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { buyerPercentage, sellerPercentage, message } = body as {
      buyerPercentage: number;
      sellerPercentage: number;
      message: string;
    };

    if (buyerPercentage + sellerPercentage !== 100) {
      return NextResponse.json(
        { error: 'La somme des pourcentages doit être égale à 100' },
        { status: 400 }
      );
    }

    const proposal = {
      proposedBy: 'system',
      buyerPercentage,
      sellerPercentage,
      message,
      status: 'pending',
      proposedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      mediationProposal: proposal,
      disputeId: id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit mediation';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
