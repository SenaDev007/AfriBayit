import { NextRequest, NextResponse } from 'next/server';
import { requestSignature, type Signer } from '@/lib/notary/e-signature';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, deedId, transactionId, signers, expiresInDays } = body as {
      documentId: string;
      deedId: string;
      transactionId: string;
      signers: Omit<Signer, 'status' | 'notifiedAt' | 'viewedAt' | 'signedAt' | 'signatureData' | 'ipAddress' | 'userAgent' | 'rejectionReason'>[];
      expiresInDays?: number;
    };

    if (!documentId || !transactionId || !signers?.length) {
      return NextResponse.json(
        { error: 'documentId, transactionId et signers sont requis' },
        { status: 400 }
      );
    }

    const signatureRequest = requestSignature(
      documentId,
      deedId || documentId,
      transactionId,
      signers,
      expiresInDays
    );

    return NextResponse.json({
      success: true,
      requestId: signatureRequest.id,
      status: signatureRequest.status,
      signers: signatureRequest.signers.map(s => ({
        id: s.id,
        fullName: s.fullName,
        role: s.role,
        status: s.status,
        notifiedAt: s.notifiedAt,
      })),
      expiresAt: signatureRequest.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la demande de signature';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
