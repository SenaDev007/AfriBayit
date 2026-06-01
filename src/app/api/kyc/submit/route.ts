// AfriBayit — KYC Document Submission API
// POST /api/kyc/submit — Upload KYC documents with AI pre-analysis pipeline

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { analyzeKYCDocument, type KycDocumentType, type KycAnalysisResult } from '@/lib/ai/kyc-analyzer';

export const dynamic = 'force-dynamic';

interface KycSubmitBody {
  userId: string;
  documentType: KycDocumentType;
  imageBase64: string;
  docUrl?: string; // If already uploaded to storage
  country?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as KycSubmitBody;
    const { userId, documentType, imageBase64, docUrl, country } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId est requis' }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json({ error: 'documentType est requis' }, { status: 400 });
    }

    if (!imageBase64 && !docUrl) {
      return NextResponse.json(
        { error: 'imageBase64 ou docUrl est requis' },
        { status: 400 }
      );
    }

    const validDocTypes: KycDocumentType[] = [
      'ID_CARD', 'PASSPORT', 'DRIVER_LICENSE',
      'BUSINESS_REG', 'NOTARY_CERT', 'LAND_TITLE',
    ];

    if (!validDocTypes.includes(documentType)) {
      return NextResponse.json(
        { error: `documentType invalide. Valeurs acceptées: ${validDocTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Step 1: Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, kycLevel: true, country: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Step 2: Run AI analysis if image is provided
    let analysisResult: KycAnalysisResult | null = null;

    if (imageBase64) {
      try {
        analysisResult = await analyzeKYCDocument(
          imageBase64,
          userId,
          documentType
        );
      } catch (analysisError) {
        console.error('[kyc-submit] AI analysis error:', analysisError);
        // Continue with manual review if AI fails
      }
    }

    // Step 3: Determine document status based on AI analysis
    let docStatus: string;
    let aiScore: number | null = null;
    let ocrResult: string | null = null;
    let ocrValid = false;
    let rejectionReason: string | null = null;

    if (analysisResult) {
      aiScore = analysisResult.aiScore;
      ocrResult = JSON.stringify(analysisResult.extractedData);
      ocrValid = analysisResult.isValid;

      switch (analysisResult.recommendation) {
        case 'APPROVE':
          docStatus = 'ai_validated';
          break;
        case 'REJECT':
          docStatus = 'rejected';
          rejectionReason = buildRejectionReason(analysisResult);
          break;
        case 'REVIEW':
        default:
          docStatus = 'pending';
          break;
      }
    } else {
      // No AI analysis — manual review required
      docStatus = 'pending';
    }

    // Step 4: Save KYC document to database
    const kycDocument = await db.kycDocument.create({
      data: {
        userId,
        docType: mapDocTypeToKycDocType(documentType),
        docUrl: docUrl || `data:image/jpeg;base64,${imageBase64?.substring(0, 100)}...`,
        ocrResult,
        ocrValid,
        aiScore,
        status: docStatus,
        rejectionReason,
        country: country || user.country,
      },
    });

    // Step 5: Update user KYC level based on analysis
    const updatedKycLevel = calculateUpdatedKycLevel(
      user.kycLevel,
      documentType,
      analysisResult
    );

    if (updatedKycLevel > user.kycLevel) {
      await db.user.update({
        where: { id: userId },
        data: { kycLevel: updatedKycLevel },
      });
    }

    // Step 6: Create notification for the user
    try {
      const statusMessage = docStatus === 'ai_validated'
        ? 'Votre document a été validé automatiquement par notre IA.'
        : docStatus === 'rejected'
          ? `Votre document a été rejeté: ${rejectionReason || 'Veuillez soumettre un document plus lisible.'}`
          : 'Votre document est en attente de vérification manuelle.';

      await db.notification.create({
        data: {
          userId,
          type: 'system',
          category: 'certification',
          country: country || user.country,
          title: 'Document KYC soumis',
          message: statusMessage,
          metadata: JSON.stringify({
            kycDocId: kycDocument.id,
            documentType,
            aiScore,
            recommendation: analysisResult?.recommendation,
          }),
        },
      });
    } catch (notifError) {
      console.error('[kyc-submit] Notification error:', notifError);
    }

    return NextResponse.json({
      success: true,
      kycDocument: {
        id: kycDocument.id,
        docType: kycDocument.docType,
        status: kycDocument.status,
        aiScore: kycDocument.aiScore,
        ocrValid: kycDocument.ocrValid,
        rejectionReason: kycDocument.rejectionReason,
        createdAt: kycDocument.createdAt,
      },
      analysis: analysisResult ? {
        isValid: analysisResult.isValid,
        confidenceScore: analysisResult.confidenceScore,
        authenticityScore: analysisResult.authenticityScore,
        recommendation: analysisResult.recommendation,
        riskLevel: analysisResult.riskLevel,
        discrepancyCount: analysisResult.discrepancy.length,
        discrepancySummary: analysisResult.discrepancy.map((d) => ({
          field: d.field,
          severity: d.severity,
        })),
      } : null,
      kycLevel: updatedKycLevel,
    });
  } catch (error) {
    console.error('[kyc-submit] API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la soumission du document KYC' },
      { status: 500 }
    );
  }
}

/**
 * Map KycDocumentType to the doc types stored in the database.
 */
function mapDocTypeToKycDocType(documentType: KycDocumentType): string {
  const mapping: Record<KycDocumentType, string> = {
    ID_CARD: 'id_card',
    PASSPORT: 'passport',
    DRIVER_LICENSE: 'id_card', // Closest match in current schema
    BUSINESS_REG: 'business_reg',
    NOTARY_CERT: 'notary_license',
    LAND_TITLE: 'notary_license', // Will be recategorized as needed
  };
  return mapping[documentType] || 'id_card';
}

/**
 * Build a human-readable rejection reason from analysis result.
 */
function buildRejectionReason(analysis: KycAnalysisResult): string {
  const reasons: string[] = [];

  if (analysis.authenticityScore < 40) {
    reasons.push('Le document ne semble pas authentique');
  }

  if (analysis.confidenceScore < 40) {
    reasons.push('Le document est illisible ou incomplet');
  }

  const criticalDiscrepancies = analysis.discrepancy.filter((d) => d.severity === 'critical');
  if (criticalDiscrepancies.length > 0) {
    reasons.push(
      `Incohérences critiques détectées: ${criticalDiscrepancies.map((d) => d.field).join(', ')}`
    );
  }

  if (analysis.issues.length > 0) {
    reasons.push(analysis.issues.slice(0, 3).join('; '));
  }

  return reasons.length > 0 ? reasons.join('. ') : 'Document non conforme';
}

/**
 * Calculate the updated KYC level for a user based on document submission.
 *
 * KYC Levels:
 * 0 = Anonyme (no documents)
 * 1 = Standard (ID or passport submitted)
 * 2 = Avancé (ID + proof of address or business reg)
 * 3 = Pro (All required documents + professional certification)
 */
function calculateUpdatedKycLevel(
  currentLevel: number,
  documentType: KycDocumentType,
  analysis: KycAnalysisResult | null
): number {
  // If AI analysis failed or rejected, don't upgrade
  if (!analysis || !analysis.isValid) return currentLevel;

  // Level 1: ID documents
  const idDocuments: KycDocumentType[] = ['ID_CARD', 'PASSPORT', 'DRIVER_LICENSE'];
  const professionalDocuments: KycDocumentType[] = ['BUSINESS_REG', 'NOTARY_CERT', 'LAND_TITLE'];

  if (idDocuments.includes(documentType)) {
    return Math.max(currentLevel, 1);
  }

  if (professionalDocuments.includes(documentType)) {
    return Math.max(currentLevel, 2);
  }

  return currentLevel;
}
