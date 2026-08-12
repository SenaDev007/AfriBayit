// AfriBayit — OCR Pipeline for KYC/Legal Documents
// Uses z.ai VLM (glm-4v-flash) for image-based document analysis
// Supports: ID cards, land titles, notary deeds, tax notices
// Countries: Bénin (BJ), Côte d'Ivoire (CI), Burkina Faso (BF), Togo (TG)

import ZAI from 'z-ai-web-dev-sdk';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocumentType = 'id_card' | 'land_title' | 'notary_deed' | 'tax_notice' | 'unknown';

export interface OCRResult {
  /** The raw text extracted or AI response text */
  extractedText: string;
  /** Detected document type */
  documentType: DocumentType;
  /** Confidence score 0.0-1.0 */
  confidence: number;
  /** Extracted structured fields from the document */
  fields: Record<string, string>;
  /** Detected country code (BJ, CI, BF, TG) */
  country: string;
  /** Issues flagged by the AI analysis */
  flaggedIssues: string[];
  /** OCR processing metadata */
  metadata: {
    model: string;
    processingTimeMs: number;
    source: 'vlm' | 'fallback' | 'error';
  };
}

// ─── Country-specific ID card field mappings ──────────────────────────────────

const ID_CARD_FIELDS: Record<string, string[]> = {
  BJ: ['nom', 'prenoms', 'date_naissance', 'lieu_naissance', 'numero', 'date_delivrance', 'date_expiration', 'sexe', 'taille', 'profession'],
  CI: ['nom', 'prenoms', 'date_naissance', 'lieu_naissance', 'numero', 'date_delivrance', 'date_expiration', 'sexe', 'taille'],
  BF: ['nom', 'prenoms', 'date_naissance', 'lieu_naissance', 'numero', 'date_delivrance', 'date_expiration', 'sexe'],
  TG: ['nom', 'prenoms', 'date_naissance', 'lieu_naissance', 'numero', 'date_delivrance', 'date_expiration', 'sexe', 'profession'],
};

const LAND_TITLE_FIELDS = [
  'numero_tf', 'titulaire', 'superficie', 'unite_surface', 'adresse',
  'limites_nord', 'limites_sud', 'limites_est', 'limites_ouest',
  'charges', 'date_delivrance', 'conservation_fonciere',
];

const NOTARY_DEED_FIELDS = [
  'type_acte', 'date_acte', 'notaire_nom', 'notaire_residence',
  'partie_cedante', 'partie_cessionnaire', 'bien_description',
  'montant', 'devise', 'numero_enregistrement',
];

const TAX_NOTICE_FIELDS = [
  'contribuable_nom', 'contribuable_prenoms', 'numero_fiscal',
  'annee_imposition', 'montant_principal', 'montant_penalites',
  'montant_total', 'date_emission', 'date_limite_paiement',
  'centre_impots',
];

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildOCRPrompt(documentType?: string, country?: string): string {
  const expectedFields = getExpectedFields(documentType, country);
  const fieldsDescription = expectedFields.length > 0
    ? `\nChamps attendus: ${expectedFields.join(', ')}`
    : '';

  return `Tu es un expert en analyse de documents africains pour la plateforme AfriBayit. Analyse l'image fournie et extrais les informations structurées.

Types de documents attendus:
- Carte d'identité / passeport (Bénin, Côte d'Ivoire, Burkina Faso, Togo)
- Titre foncier / attestation de propriété
- Acte notarié
- Avis d'imposition

Pays: ${country || 'Non spécifié (déduis-le du document)'}
${fieldsDescription}

Réponds UNIQUEMENT en JSON avec cette structure exacte:
{
  "documentType": "id_card|land_title|notary_deed|tax_notice|unknown",
  "confidence": 0.0-1.0,
  "fields": {
    ${expectedFields.map(f => `"${f}": ""`).join(',\n    ')}
  },
  "country": "BJ|CI|BF|TG",
  "flaggedIssues": ["problème détecté", ...]
}

Règles de détection:
- confidence: 1.0 = document clair et complet, 0.5 = partiellement lisible, 0.0 = illisible
- Signale dans flaggedIssues: informations manquantes, incohérences de dates, falsifications potentielles, documents expirés, photos retouchées, polices incohérentes, logos suspects
- Pour les cartes d'identité, vérifie que la date d'expiration n'est pas dépassée
- Pour les titres fonciers, vérifie la présence du numéro TF et des limites
- Pour les actes notariés, vérifie la présence du nom du notaire et du numéro d'enregistrement
- Pour les avis d'imposition, vérifie le numéro fiscal et l'année`;
}

function getExpectedFields(documentType?: string, country?: string): string[] {
  switch (documentType) {
    case 'id_card':
      return ID_CARD_FIELDS[country || 'BJ'] || ID_CARD_FIELDS.BJ;
    case 'land_title':
      return LAND_TITLE_FIELDS;
    case 'notary_deed':
      return NOTARY_DEED_FIELDS;
    case 'tax_notice':
      return TAX_NOTICE_FIELDS;
    default:
      // Return a union of common fields
      return ['nom', 'prenoms', 'numero', 'date_delivrance', 'date_expiration'];
  }
}

// ─── Main OCR Pipeline ────────────────────────────────────────────────────────

/**
 * Analyze a document image using the z.ai VLM pipeline.
 *
 * @param imageBase64 Base64-encoded image of the document
 * @param documentType Optional hint about the document type
 * @param country Optional hint about the country
 * @returns Structured OCR result with extracted fields and confidence score
 */
export async function analyzeDocument(
  imageBase64: string,
  documentType?: string,
  country?: string
): Promise<OCRResult> {
  const startTime = Date.now();

  try {
    const zai = await ZAI.create();

    const systemPrompt = buildOCRPrompt(documentType, country);

    const completion = await zai.chat.completions.create({
      model: 'glm-4v-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyse ce document${documentType ? ` de type: ${documentType}` : ''}.${country ? ` Pays: ${country}` : ''}`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ] as any,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseText = completion.choices?.[0]?.message?.content || '';
    const processingTimeMs = Date.now() - startTime;

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          extractedText: responseText,
          documentType: validateDocumentType(parsed.documentType),
          confidence: clampConfidence(parsed.confidence),
          fields: parsed.fields || {},
          country: validateCountry(parsed.country) || country || '',
          flaggedIssues: Array.isArray(parsed.flaggedIssues) ? parsed.flaggedIssues : [],
          metadata: {
            model: 'glm-4v-flash',
            processingTimeMs,
            source: 'vlm',
          },
        };
      } catch (parseError) {
        console.error('[OCR] JSON parse error:', parseError);
      }
    }

    // Could not parse structured JSON — return raw text
    return {
      extractedText: responseText,
      documentType: documentType ? validateDocumentType(documentType) : 'unknown',
      confidence: 0.3,
      fields: {},
      country: country || '',
      flaggedIssues: ['Impossible de parser la réponse structurée'],
      metadata: {
        model: 'glm-4v-flash',
        processingTimeMs,
        source: 'vlm',
      },
    };
  } catch (error) {
    console.error('[OCR] Pipeline error:', error);
    const processingTimeMs = Date.now() - startTime;

    // Graceful fallback — don't fail the KYC process if OCR fails
    return {
      extractedText: '',
      documentType: documentType ? validateDocumentType(documentType) : 'unknown',
      confidence: 0,
      fields: {},
      country: country || '',
      flaggedIssues: [`Erreur lors de l'analyse OCR: ${error instanceof Error ? error.message : 'Unknown error'}`],
      metadata: {
        model: 'glm-4v-flash',
        processingTimeMs,
        source: 'error',
      },
    };
  }
}

/**
 * Batch analyze multiple documents.
 * Useful for KYC flows that require multiple document uploads.
 */
export async function analyzeDocuments(
  documents: Array<{ imageBase64: string; documentType?: string; country?: string }>
): Promise<OCRResult[]> {
  return Promise.all(
    documents.map(doc => analyzeDocument(doc.imageBase64, doc.documentType, doc.country))
  );
}

/**
 * Determine if a document should be auto-approved, flagged for review, or rejected
 * based on OCR confidence and flagged issues.
 *
 * - confidence >= 0.9 and no flagged issues → auto_approve
 * - confidence >= 0.7 but has flagged issues → manual_review
 * - confidence < 0.7 → manual_review (requires human verification)
 * - Any critical issue → requires_review
 */
export function determineValidationAction(result: OCRResult): {
  action: 'auto_approve' | 'manual_review' | 'reject';
  reason?: string;
} {
  // Check for critical flagged issues that warrant rejection
  const criticalIssues = result.flaggedIssues.filter(
    issue =>
      issue.toLowerCase().includes('falsif') ||
      issue.toLowerCase().includes('fraud') ||
      issue.toLowerCase().includes('contrefa') ||
      issue.toLowerCase().includes('expir') && result.documentType === 'id_card'
  );

  if (criticalIssues.length > 0) {
    return {
      action: 'reject',
      reason: `Problèmes critiques détectés: ${criticalIssues.join('; ')}`,
    };
  }

  // Auto-approve high-confidence documents with no issues
  if (result.confidence >= 0.9 && result.flaggedIssues.length === 0) {
    return { action: 'auto_approve' };
  }

  // Flag for manual review
  if (result.confidence < 0.7) {
    return {
      action: 'manual_review',
      reason: `Confiance faible (${(result.confidence * 100).toFixed(0)}%) — vérification manuelle requise`,
    };
  }

  return {
    action: 'manual_review',
    reason: result.flaggedIssues.length > 0
      ? `Problèmes signalés: ${result.flaggedIssues.join('; ')}`
      : `Confiance modérée (${(result.confidence * 100).toFixed(0)}%)`,
  };
}

// ─── Validation Helpers ───────────────────────────────────────────────────────

function validateDocumentType(type: string): DocumentType {
  const valid: DocumentType[] = ['id_card', 'land_title', 'notary_deed', 'tax_notice', 'unknown'];
  if (valid.includes(type as DocumentType)) return type as DocumentType;

  // Map common French terms
  const mapping: Record<string, DocumentType> = {
    'carte_identite': 'id_card',
    'carte d\'identite': 'id_card',
    'carte_d_identite': 'id_card',
    'passeport': 'id_card',
    'titre_foncier': 'land_title',
    'titre foncier': 'land_title',
    'attestation_propriete': 'land_title',
    'acte_notarie': 'notary_deed',
    'acte notarie': 'notary_deed',
    'acte_de_vente': 'notary_deed',
    'avis_imposition': 'tax_notice',
    'avis d\'imposition': 'tax_notice',
  };

  const lower = (type || '').toLowerCase().trim();
  return mapping[lower] || 'unknown';
}

function validateCountry(country: string): string {
  const valid = ['BJ', 'CI', 'BF', 'TG'];
  const upper = (country || '').toUpperCase().trim();
  return valid.includes(upper) ? upper : '';
}

function clampConfidence(value: number): number {
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return 0;
  return Math.max(0, Math.min(1, num));
}
