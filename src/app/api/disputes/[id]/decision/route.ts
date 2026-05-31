// AfriBayit — POST /api/disputes/[id]/decision
// Admin submits arbitration decision

import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, buyerPercentage, sellerPercentage, reason } = body as {
      type: 'total_release' | 'partial_release' | 'full_refund';
      buyerPercentage: number;
      sellerPercentage: number;
      reason: string;
    };

    if (!reason || !type) {
      return NextResponse.json({ error: 'Type et raison requis' }, { status: 400 });
    }

    const decision = {
      type,
      buyerPercentage,
      sellerPercentage,
      reason,
      decidedAt: new Date().toISOString(),
      decidedBy: 'admin_demo',
      executionHash: `sha256:${Buffer.from(JSON.stringify({ id, type, buyerPercentage, sellerPercentage, reason, ts: Date.now() })).toString('base64').slice(0, 40)}`,
      immutable: true,
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
