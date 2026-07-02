// SECURITY FIX (P1.2 — juillet 2026) :
// - IDOR fix : `signerId` est désormais ignoré du body et remplacé par authGuard().userId
// - Un utilisateur ne peut plus signer au nom de n'importe qui
// - Ajout de authGuard() pour exiger une session authentifiée

import { NextRequest, NextResponse } from 'next/server';
import { confirmSignature, trackSignatureStatus } from '@/lib/notary/e-signature';
import { authGuard } from '@/lib/auth-guard';

export async function POST(request: NextRequest) {
  try {
    // 🔒 Auth: require authenticated session
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;
    // `signerId` is now derived from the authenticated session (IDOR fix)
    const signerId = auth.userId!;

    const body = await request.json();
    const { requestId, signatureData, ipAddress, userAgent } = body as {
      requestId: string;
      signatureData: string;
      ipAddress?: string;
      userAgent?: string;
    };

    if (!requestId || !signatureData) {
      return NextResponse.json(
        { error: 'requestId et signatureData sont requis' },
        { status: 400 }
      );
    }

    const confirmation = await confirmSignature(
      requestId,
      signerId,
      signatureData,
      ipAddress || '127.0.0.1',
      userAgent || 'AfriBayit-Web'
    );

    // Get updated status
    const status = await trackSignatureStatus(requestId);

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
