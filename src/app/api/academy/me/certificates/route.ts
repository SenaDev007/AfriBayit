// GET /api/academy/me/certificates — Certificates of the signed-in user.
//
// Audit Manus (P0): the "Certifications" tab of the Academy was empty
// because the hook called /api/academy/me/certificates which did not exist.
// The JWT identifies the user — no userId query param (IDOR-safe by design).

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET() {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const certificates = await db.certificate.findMany({
      where: { userId: auth.userId },
      orderBy: { issuedAt: 'desc' },
      select: {
        id: true,
        certificateId: true,
        courseId: true,
        type: true,
        recipientName: true,
        courseName: true,
        instructorName: true,
        pdfUrl: true,
        issuedAt: true,
        verified: true,
        course: {
          select: { id: true, title: true, image: true, instructor: true },
        },
      },
    });

    return NextResponse.json({ certificates });
  } catch (error) {
    console.error('My certificates API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 },
    );
  }
}
