// AfriBayit — AI Document Analysis API
// POST /api/ai/analyze-document — Analyze a document image using VLM

import { NextResponse } from 'next/server';
import { analyzeDocument, type DocumentType } from '@/lib/ai/document-analyzer';
import { checkLegalDocument, type PropertyData } from '@/lib/ai/legal-doc-checker';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let imageBase64: string;
    let documentType: string;
    let countryCode: string;
    let propertyData: PropertyData | undefined;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('image') as File | null;
      documentType = (formData.get('documentType') as string) || 'UNKNOWN';
      countryCode = (formData.get('countryCode') as string) || 'BJ';
      const propertyDataStr = formData.get('propertyData') as string | null;

      if (!file) {
        return NextResponse.json(
          { error: 'Image file is required (field "image")' },
          { status: 400 }
        );
      }

      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageBase64 = buffer.toString('base64');

      if (propertyDataStr) {
        try {
          propertyData = JSON.parse(propertyDataStr);
        } catch {
          // Ignore invalid propertyData
        }
      }
    } else {
      // Handle JSON body with base64 image
      const body = await request.json();
      imageBase64 = body.imageBase64 || body.image || '';
      documentType = body.documentType || 'UNKNOWN';
      countryCode = body.countryCode || body.country || 'BJ';
      propertyData = body.propertyData;
    }

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'imageBase64 or image file is required' },
        { status: 400 }
      );
    }

    const validDocTypes: DocumentType[] = [
      'ID_CARD', 'PASSPORT', 'DRIVER_LICENSE', 'BUSINESS_REG',
      'NOTARY_CERT', 'LAND_TITLE', 'ACD', 'BUILDING_PERMIT',
      'ACTE_CESSION', 'CERTIFICAT_ANDF', 'PUH', 'ATTESTATION_VILLAGEOISE',
      'UNKNOWN',
    ];

    if (!validDocTypes.includes(documentType as DocumentType)) {
      return NextResponse.json(
        { error: `Invalid documentType. Must be one of: ${validDocTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if this is a legal document that needs country-specific validation
    const legalDocTypes = ['LAND_TITLE', 'ACD', 'BUILDING_PERMIT', 'ACTE_CESSION', 'CERTIFICAT_ANDF', 'PUH', 'ATTESTATION_VILLAGEOISE'];
    const isLegalDoc = legalDocTypes.includes(documentType);

    if (isLegalDoc && propertyData) {
      // Run legal document check with country-specific validation
      const docTypeKey = mapDocTypeToKey(documentType);
      const result = await checkLegalDocument(
        imageBase64,
        propertyData,
        countryCode,
        docTypeKey
      );

      return NextResponse.json({
        success: true,
        analysisType: 'legal_document',
        ...result,
      });
    }

    // Standard document analysis
    const result = await analyzeDocument(
      imageBase64,
      documentType as DocumentType,
      countryCode
    );

    return NextResponse.json({
      success: true,
      analysisType: 'standard',
      ...result,
    });
  } catch (error) {
    console.error('[analyze-document] API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse du document' },
      { status: 500 }
    );
  }
}

/**
 * Map DocumentType enum to legal-doc-checker key format.
 */
function mapDocTypeToKey(documentType: string): string {
  const mapping: Record<string, string> = {
    LAND_TITLE: 'titre_foncier',
    ACD: 'acd',
    BUILDING_PERMIT: 'permis_construire',
    ACTE_CESSION: 'acte_cession',
    CERTIFICAT_ANDF: 'certificat_andf',
    PUH: 'puh',
    ATTESTATION_VILLAGEOISE: 'attestation_villagéoise',
  };
  return mapping[documentType] || documentType.toLowerCase();
}
