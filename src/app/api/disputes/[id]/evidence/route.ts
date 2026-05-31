// AfriBayit — POST /api/disputes/[id]/evidence
// Upload evidence for a dispute

import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const party = formData.get('party') as string;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    // In production, upload to R2/S3 and return URL
    const evidenceId = `ev_${Date.now()}`;
    const newEvidence = {
      id: evidenceId,
      party: party === 'buyer' ? 'buyer' : 'seller',
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      type: type || 'Document',
      fileSize: file.size,
      mimeType: file.type,
    };

    return NextResponse.json({
      success: true,
      evidence: newEvidence,
      disputeId: id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload evidence';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
