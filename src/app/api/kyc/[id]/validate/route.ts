// AfriBayit — KYC Document Validation Endpoint (Enhanced with OCR Pipeline)
// POST /api/kyc/[id]/validate — Admin validates a KYC document
// Now integrates with the OCR pipeline for automated analysis

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
import { determineValidationAction, type OCRResult } from '@/lib/ocr/pipeline';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard({ requiredRoles: ['admin'] });
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    // ── Fetch the existing KYC document ──
    const existingDoc = await db.kycDocument.findUnique({
      where: { id },
    });

    if (!existingDoc) {
      return NextResponse.json({ error: 'KYC document not found' }, { status: 404 });
    }

    // ── Mode 1: Manual validation by admin ──
    const manualStatus = body.status as string; // 'ai_validated', 'human_validated', or 'rejected'

    if (manualStatus && ['ai_validated', 'human_validated', 'rejected'].includes(manualStatus)) {
      const updateData: Record<string, unknown> = {
        status: manualStatus,
        ...(body.rejectionReason && { rejectionReason: body.rejectionReason }),
        ...(body.aiScore !== undefined && { aiScore: body.aiScore }),
        ...(body.ocrValid !== undefined && { ocrValid: body.ocrValid }),
      };

      const document = await db.kycDocument.update({
        where: { id },
        data: updateData,
      });

      // If validated, update user's KYC level
      if (manualStatus === 'human_validated' || manualStatus === 'ai_validated') {
        const user = await db.user.findUnique({
          where: { id: existingDoc.userId },
          select: { kycLevel: true },
        });

        if (user) {
          // Increase KYC level based on document type
          let newKycLevel = user.kycLevel;

          // ID documents → Level 1
          if (['id_card', 'passport'].includes(existingDoc.docType)) {
            newKycLevel = Math.max(newKycLevel, 1);
          }
          // Proof of address → Level 2
          if (['proof_address'].includes(existingDoc.docType)) {
            newKycLevel = Math.max(newKycLevel, 2);
          }
          // Professional licenses → Level 3
          if (['agent_license', 'notary_license', 'geometer_license', 'business_reg'].includes(existingDoc.docType)) {
            newKycLevel = Math.max(newKycLevel, 3);
          }

          if (newKycLevel > user.kycLevel) {
            await db.user.update({
              where: { id: existingDoc.userId },
              data: {
                kycLevel: newKycLevel,
                verified: newKycLevel >= 2,
              },
            });
          }
        }
      }

      return NextResponse.json(document);
    }

    // ── Mode 2: Re-run OCR analysis on the document ──
    if (body.runOcr === true) {
      // Parse existing OCR result if any
      let existingOcr: OCRResult | null = null;
      if (existingDoc.ocrResult) {
        try {
          existingOcr = JSON.parse(existingDoc.ocrResult);
        } catch {
          // Ignore parse errors
        }
      }

      if (!existingOcr || existingOcr.metadata?.source === 'error') {
        return NextResponse.json({
          error: 'No valid OCR result available. Upload the document again via /api/kyc/ocr.',
          document: existingDoc,
        }, { status: 400 });
      }

      // Re-evaluate the OCR result with current validation logic
      const validationAction = determineValidationAction(existingOcr);
      const aiScore = Math.round(existingOcr.confidence * 100);

      const newStatus = validationAction.action === 'auto_approve'
        ? 'ai_validated'
        : validationAction.action === 'reject'
          ? 'rejected'
          : 'pending';

      const updateData: Record<string, unknown> = {
        status: newStatus,
        aiScore,
        ocrValid: validationAction.action === 'auto_approve',
        ...(validationAction.reason && { rejectionReason: validationAction.reason }),
      };

      const document = await db.kycDocument.update({
        where: { id },
        data: updateData,
      });

      // If auto-validated, update user KYC level
      if (newStatus === 'ai_validated') {
        const user = await db.user.findUnique({
          where: { id: existingDoc.userId },
          select: { kycLevel: true },
        });

        if (user) {
          let newKycLevel = user.kycLevel;
          if (['id_card', 'passport'].includes(existingDoc.docType)) {
            newKycLevel = Math.max(newKycLevel, 1);
          }
          if (['proof_address'].includes(existingDoc.docType)) {
            newKycLevel = Math.max(newKycLevel, 2);
          }
          if (['agent_license', 'notary_license', 'geometer_license', 'business_reg'].includes(existingDoc.docType)) {
            newKycLevel = Math.max(newKycLevel, 3);
          }

          if (newKycLevel > user.kycLevel) {
            await db.user.update({
              where: { id: existingDoc.userId },
              data: {
                kycLevel: newKycLevel,
                verified: newKycLevel >= 2,
              },
            });
          }
        }
      }

      return NextResponse.json({
        document,
        validation: {
          action: validationAction.action,
          reason: validationAction.reason,
        },
        ocrSummary: {
          documentType: existingOcr.documentType,
          confidence: existingOcr.confidence,
          flaggedIssues: existingOcr.flaggedIssues,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide either status or runOcr in body.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('KYC validation error:', error);
    return NextResponse.json({ error: 'Failed to validate KYC document' }, { status: 500 });
  }
}
