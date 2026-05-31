import { NextRequest, NextResponse } from 'next/server';
import { confirmSignature, trackSignatureStatus } from '@/lib/notary/e-signature';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, signerId, signatureData, ipAddress, userAgent } = body as {
      documentId: string;
      signerId: string;
      signatureData: string;
      ipAddress?: string;
      userAgent?: string;
    };

    if (!documentId || !signerId || !signatureData) {
      return NextResponse.json(
        { error: 'documentId, signerId et signatureData sont requis' },
        { status: 400 }
      );
    }

    const confirmation = confirmSignature(
      documentId,
      signerId,
      signatureData,
      ipAddress || '127.0.0.1',
      userAgent || 'AfriBayit-Web'
    );

    // Get updated status
    const status = trackSignatureStatus(documentId);

    return NextResponse.json({
      success: true,
      confirmation: {
        signerId: confirmation.signerId,
        documentId: confirmation.documentId,
        timestamp: confirmation.timestamp,
        isValid: confirmation.isValid,
      },
      progress: status.progress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la confirmation de signature';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
