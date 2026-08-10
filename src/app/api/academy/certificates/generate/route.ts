// POST /api/academy/certificates/generate — Générer un certificat PDF téléchargeable
// CDC §5.6.4 — Certificate PDF Generation with QR Code

import { NextRequest, NextResponse } from 'next/server';
import { generateCertificate } from '@/lib/certificates';
import { generateCertificatePDF } from '@/lib/certificates/generator';
import { buildVerificationUrl } from '@/lib/certificates/generator';
import type { CertificateType } from '@/lib/certificates/templates';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId, enrollmentId, type, download } = body as {
      userId: string;
      courseId: string;
      enrollmentId?: string;
      type?: CertificateType;
      download?: boolean;
    };

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'userId et courseId sont requis.' },
        { status: 400 }
      );
    }

    // Générer ou récupérer le certificat
    const result = await generateCertificate({
      userId,
      courseId,
      enrollmentId,
      type,
    });

    // Si le client demande un téléchargement direct du PDF
    if (download) {
      const verificationUrl = buildVerificationUrl(result.certificateId);

      // Re-générer le PDF buffer pour le download (évite de décoder le base64)
      const pdfBuffer = await generateCertificatePDF({
        certificateId: result.certificateId,
        recipientName: '', // sera rempli par le generator
        courseName: '',
        instructorName: '',
        date: '',
        type: type || 'course_completion',
        verificationUrl,
      });

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="certificat-afribayit-${result.certificateId}.pdf"`,
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      });
    }

    // Réponse JSON par défaut avec metadata
    return NextResponse.json({
      success: true,
      certificateId: result.certificateId,
      existing: result.existing,
      downloadUrl: `/api/academy/certificates/generate?download=true&certificateId=${result.certificateId}`,
      verificationUrl: buildVerificationUrl(result.certificateId),
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

/**
 * GET — Télécharger un certificat existant par son ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const certificateId = searchParams.get('certificateId');
    const download = searchParams.get('download') === 'true';

    if (!certificateId || !download) {
      return NextResponse.json(
        { error: 'certificateId et download=true sont requis.' },
        { status: 400 }
      );
    }

    // Récupérer le certificat depuis la base
    const { db } = await import('@/lib/db');
    const certificate = await db.certificate.findUnique({
      where: { certificateId },
      include: {
        user: { select: { name: true } },
        course: { select: { title: true, instructor: true } },
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificat introuvable.' },
        { status: 404 }
      );
    }

    // Générer le PDF
    const verificationUrl = buildVerificationUrl(certificateId);
    const pdfBuffer = await generateCertificatePDF({
      certificateId: certificate.certificateId,
      recipientName: certificate.recipientName,
      courseName: certificate.courseName,
      instructorName: certificate.instructorName,
      date: certificate.issuedAt.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      type: (certificate.type as CertificateType) || 'course_completion',
      verificationUrl,
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificat-afribayit-${certificateId}.pdf"`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Erreur téléchargement certificat:', error);
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement du certificat.' },
      { status: 500 }
    );
  }
}
