// AfriBayit — KYC OCR API Endpoint
// POST /api/kyc/ocr — Analyze a KYC document using the OCR/AI pipeline
// Accepts multipart form data with a document image, returns structured OCR result

import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { analyzeDocument, determineValidationAction, type OCRResult } from '@/lib/ocr/pipeline';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('document') as File | null;
    const documentType = (formData.get('type') as string) || undefined;
    const country = (formData.get('country') as string) || auth.country || undefined;

    if (!file) {
      return NextResponse.json(
        { error: 'Document file is required' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');

    // Run OCR pipeline
    const ocrResult: OCRResult = await analyzeDocument(base64, documentType, country);

    // Determine validation action based on OCR result
    const validationAction = determineValidationAction(ocrResult);

    // Store the KYC document with OCR results in the database
    let kycDocument = null;
    try {
      // Store the file URL as a placeholder — in production this would be uploaded to R2/S3
      const docUrl = `kyc-upload:${auth.userId}/${Date.now()}/${file.name}`;

      const aiScore = Math.round(ocrResult.confidence * 100);
      const status = validationAction.action === 'auto_approve'
        ? 'ai_validated'
        : 'pending';

      kycDocument = await db.kycDocument.create({
        data: {
          userId: auth.userId,
          docType: ocrResult.documentType === 'unknown'
            ? (documentType || 'unknown')
            : ocrResult.documentType,
          docUrl,
          ocrResult: JSON.stringify({
            extractedText: ocrResult.extractedText,
            documentType: ocrResult.documentType,
            confidence: ocrResult.confidence,
            fields: ocrResult.fields,
            country: ocrResult.country,
            flaggedIssues: ocrResult.flaggedIssues,
            metadata: ocrResult.metadata,
          }),
          ocrValid: validationAction.action === 'auto_approve',
          aiScore,
          status,
          country: ocrResult.country || country || null,
        },
      });

      // If auto-approved, also update user KYC level
      if (validationAction.action === 'auto_approve') {
        await db.user.update({
          where: { id: auth.userId },
          data: {
            kycLevel: Math.max(auth.kycLevel, 1),
            verified: true,
          },
        });
      }
    } catch (dbError) {
      console.error('[KYC OCR] Database error:', dbError);
      // Continue even if DB write fails — return OCR result anyway
    }

    return NextResponse.json({
      success: true,
      ocr: {
        documentType: ocrResult.documentType,
        confidence: ocrResult.confidence,
        fields: ocrResult.fields,
        country: ocrResult.country,
        flaggedIssues: ocrResult.flaggedIssues,
        processingTimeMs: ocrResult.metadata.processingTimeMs,
      },
      validation: {
        action: validationAction.action,
        reason: validationAction.reason,
      },
      documentId: kycDocument?.id || null,
      status: kycDocument?.status || 'pending',
    });
  } catch (error) {
    console.error('[KYC OCR] API error:', error);
    return NextResponse.json(
      { error: 'OCR processing failed. Please try again.' },
      { status: 500 }
    );
  }
}
