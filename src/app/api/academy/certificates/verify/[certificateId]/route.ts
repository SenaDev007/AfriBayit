// GET /api/academy/certificates/verify/[certificateId] — Vérifier un certificat

import { NextRequest, NextResponse } from 'next/server';
import { verifyCertificate } from '@/lib/certificates';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certificateId: string }> }
) {
  try {
    const { certificateId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const download = searchParams.get('download') === 'true';

    // Si téléchargement demandé, récupérer le PDF
    if (download) {
      const certificate = await db.certificate.findUnique({
        where: { certificateId },
      });

      if (!certificate || !certificate.pdfBase64) {
        return NextResponse.json(
          { error: 'Certificat introuvable.' },
          { status: 404 }
        );
      }

      const pdfBuffer = Buffer.from(certificate.pdfBase64, 'base64');

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="certificat-${certificateId}.pdf"`,
        },
      });
    }

    // Sinon, vérifier le certificat
    const result = await verifyCertificate(certificateId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur vérification certificat:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification du certificat.' },
      { status: 500 }
    );
  }
}
