// AfriBayit — POST /api/disputes/[id]/evidence
// Upload evidence for a dispute

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { party, fileName, fileType, fileSize, mimeType } = body as {
      party: 'buyer' | 'seller';
      fileName: string;
      fileType?: string;
      fileSize?: number;
      mimeType?: string;
    };

    if (!party || !fileName) {
      return NextResponse.json(
        { error: 'party et fileName sont requis' },
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

    // Create a timeline entry to store the evidence metadata
    const evidenceId = `ev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();

    const timelineEntry = await db.transactionTimeline.create({
      data: {
        transactionId: id,
        fromStatus: transaction.status,
        toStatus: transaction.status,
        actorType: party,
        actorId: party === 'buyer' ? transaction.buyerId : transaction.sellerId,
        description: `Evidence uploaded by ${party}: ${fileName}`,
        metadata: JSON.stringify({
          type: 'evidence',
          evidenceId,
          party,
          fileName,
          fileType: fileType || 'Document',
          fileSize: fileSize || 0,
          mimeType: mimeType || 'application/octet-stream',
          uploadedAt: now.toISOString(),
        }),
      },
    });

    const evidence = {
      id: evidenceId,
      party,
      fileName,
      uploadedAt: now.toISOString(),
      type: fileType || 'Document',
      fileSize: fileSize || 0,
      mimeType: mimeType || 'application/octet-stream',
    };

    return NextResponse.json({
      success: true,
      evidence,
      disputeId: id,
      timelineEntryId: timelineEntry.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload evidence';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
