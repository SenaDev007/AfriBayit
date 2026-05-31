// POST /api/academy/certificates/generate — Générer un certificat

import { NextRequest, NextResponse } from 'next/server';
import { generateCertificate } from '@/lib/certificates';
import type { CertificateType } from '@/lib/certificates/templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId, enrollmentId, type } = body as {
      userId: string;
      courseId: string;
      enrollmentId?: string;
      type?: CertificateType;
    };

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'userId et courseId sont requis.' },
        { status: 400 }
      );
    }

    const result = await generateCertificate({
      userId,
      courseId,
      enrollmentId,
      type,
    });

    return NextResponse.json({
      success: true,
      certificateId: result.certificateId,
      existing: result.existing,
      // On ne retourne pas le base64 complet dans la réponse JSON
      // Le client doit télécharger le PDF séparément
      downloadUrl: `/api/academy/certificates/verify/${result.certificateId}?download=true`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération du certificat.';
    console.error('Erreur génération certificat:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
