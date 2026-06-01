// AfriBayit — AI Document Analyzer
// Uses z-ai-web-dev-sdk VLM to analyze document images for OCR, authenticity, and field extraction
// CDC §9 — AI-powered document analysis for KYC and legal documents

export type DocumentType =
  | 'ID_CARD'
  | 'PASSPORT'
  | 'DRIVER_LICENSE'
  | 'BUSINESS_REG'
  | 'NOTARY_CERT'
  | 'LAND_TITLE'
  | 'ACD'
  | 'BUILDING_PERMIT'
  | 'ACTE_CESSION'
  | 'CERTIFICAT_ANDF'
  | 'PUH'
  | 'ATTESTATION_VILLAGEOISE'
  | 'UNKNOWN';

export interface DocumentAnalysisResult {
  extractedFields: Record<string, string>;
  confidenceScore: number; // 0-100
  authenticityScore: number; // 0-100
  issues: string[];
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  rawText?: string;
}

/**
 * Analyze a document image using the VLM (Vision Language Model).
 * Extracts text, validates authenticity, extracts key fields, and compares against claimed data.
 */
export async function analyzeDocument(
  imageBase64: string,
  documentType: DocumentType,
  countryCode: string,
  claimedData?: Record<string, string>
): Promise<DocumentAnalysisResult> {
  const systemPrompt = buildDocumentAnalysisPrompt(documentType, countryCode, claimedData);

  try {
    const { default: ZAI } = await import('z-ai-web-dev-sdk');
    const zai = new ZAI();

    // Use VLM chat completions with image input
    const userContent = buildVLMUserContent(imageBase64, documentType);

    const completion = await zai.chat.completions.create({
      model: 'glm-4v-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const aiResponse = completion.choices?.[0]?.message?.content || '';

    // Parse the structured response from the VLM
    return parseAnalysisResponse(aiResponse, documentType, countryCode);
  } catch (error) {
    console.error('[document-analyzer] VLM error:', error);

    // Fallback: basic analysis without VLM
    return {
      extractedFields: {},
      confidenceScore: 0,
      authenticityScore: 0,
      issues: ['VLM temporairement indisponible — analyse automatique impossible'],
      recommendation: 'REVIEW',
    };
  }
}

/**
 * Build the system prompt for document analysis based on document type and country.
 */
function buildDocumentAnalysisPrompt(
  documentType: DocumentType,
  countryCode: string,
  claimedData?: Record<string, string>
): string {
  const countryNames: Record<string, string> = {
    BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo', SN: 'Sénégal',
  };
  const countryName = countryNames[countryCode] || countryCode;

  let typeSpecific = '';
  switch (documentType) {
    case 'ID_CARD':
      typeSpecific = `Il s'agit d'une carte d'identité nationale de ${countryName}. Extrais: nom complet, prénom(s), date de naissance, lieu de naissance, numéro du document, date de délivrance, date d'expiration, sexe, taille, profession. Vérifie la présence de: photo, signature, hologramme, filigrane de sécurité.`;
      break;
    case 'PASSPORT':
      typeSpecific = `Il s'agit d'un passeport de ${countryName}. Extrais: nom, prénom(s), date de naissance, lieu de naissance, numéro de passeport, date de délivrance, date d'expiration, autorité émettrice. Vérifie: photo, MRZ (Machine Readable Zone), signature, filigrane de sécurité.`;
      break;
    case 'DRIVER_LICENSE':
      typeSpecific = `Il s'agit d'un permis de conduire de ${countryName}. Extrais: nom, prénom, date de naissance, numéro de permis, catégorie(s), date de délivrance, date d'expiration. Vérifie: photo, signature, cachet officiel.`;
      break;
    case 'BUSINESS_REG':
      typeSpecific = `Il s'agit d'un registre de commerce / RCCM de ${countryName}. Extrais: raison sociale, numéro RCCM, numéro d'identification fiscale (NIF), siège social, capital social, gérant/directeur, date d'immatriculation. Vérifie: cachet du greffe, signature officielle.`;
      break;
    case 'NOTARY_CERT':
      typeSpecific = `Il s'agit d'un certificat de notaire de ${countryName}. Extrais: nom du notaire, numéro de licence, chambre des notaires, spécialité, zone d'intervention. Vérifie: cachet officiel, signature, numéro d'inscription au tableau.`;
      break;
    case 'LAND_TITLE':
      typeSpecific = `Il s'agit d'un Titre Foncier de ${countryName}. Extrais: numéro TF, nom du titulaire, superficie, limites/bornes, localisation, charges éventuelles, date d'établissement. Vérifie: cachet de la conservation foncière, signature officielle, numéro d'enregistrement.`;
      break;
    case 'ACD':
      typeSpecific = `Il s'agit d'une Attestation de Custom Déguerpissement (ACD) de ${countryName}. Extrais: nom du bénéficiaire, localisation, superficie, mairie émettrice, date de délivrance. Attention: l'ACD n'est PAS un titre de propriété. Vérifie: cachet de la mairie, signature du maire ou adjoint.`;
      break;
    case 'BUILDING_PERMIT':
      typeSpecific = `Il s'agit d'un Permis de Construire de ${countryName}. Extrais: titulaire, adresse du projet, type de construction, surface autorisée, date de délivrance, validité, conformité urbanistique. Vérifie: cachet de la mairie, signature, numéro de permis.`;
      break;
    case 'ACTE_CESSION':
      typeSpecific = `Il s'agit d'un Acte de Cession de ${countryName}. Extrais: parties (cédant/cessionnaire), prix, conditions, garanties, notaire, date. Vérifie: signature notariale, cachet, enregistrement.`;
      break;
    case 'CERTIFICAT_ANDF':
      typeSpecific = `Il s'agit d'un Certificat ANDF (Agence Nationale de Domaine Foncier) du Togo. Extrais: nom du titulaire, numéro de certificat, localisation, superficie, date de délivrance. Vérifie: cachet ANDF, signature officielle.`;
      break;
    case 'PUH':
      typeSpecific = `Il s'agit d'un PUH (Permis Urbain d'Habiter) du Burkina Faso. Extrais: nom du titulaire, localisation, superficie, date de délivrance, limitations. Vérifie: cachet officiel, signature, numéro.`;
      break;
    case 'ATTESTATION_VILLAGEOISE':
      typeSpecific = `Il s'agit d'une Attestation Villagéoise de Côte d'Ivoire. Extrais: nom du bénéficiaire, village, localisation, chef de village, date. Attention: ce document a une portée limitée. Vérifie: signature du chef de village, cachet.`;
      break;
    default:
      typeSpecific = `Il s'agit d'un document immobilier de ${countryName}. Extrais toutes les informations visibles: noms, dates, montants, numéros, adresses, signatures, cachets.`;
  }

  const claimedDataStr = claimedData
    ? `\n\nDonnées déclarées par l'utilisateur (à vérifier):\n${Object.entries(claimedData)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n')}`
    : '';

  return `Tu es Rebecca, l'IA d'AfriBayit spécialisée dans l'analyse de documents immobiliers et KYC en Afrique de l'Ouest.

${typeSpecific}

INSTRUCTIONS D'ANALYSE:
1. Extrais tous les champs texte visibles du document
2. Vérifie les signes d'authenticité (cachets, signatures, filigranes, hologrammes, MRZ)
3. Vérifie les signes de falsification (pixels irréguliers, zones floues suspectes, incohérences typographiques)
4. Compare les données extraites avec les données déclarées si fournies
5. Évalue le niveau de confiance et d'authenticité${claimedDataStr}

RÉPONS AU FORMAT JSON STRICT:
{
  "extractedFields": {
    "fieldName": "extractedValue"
  },
  "confidenceScore": 0-100,
  "authenticityScore": 0-100,
  "issues": ["liste des problèmes détectés"],
  "recommendation": "APPROVE|REVIEW|REJECT",
  "rawText": "texte brut extrait du document"
}

Règles de scoring:
- confidenceScore: 0-40 (données illisibles/incomplètes), 41-70 (partielles), 71-100 (complètes et claires)
- authenticityScore: 0-40 (signes de falsification), 41-70 (incertain), 71-100 (semble authentique)
- recommendation: APPROVE si confidence≥70 ET authenticity≥70, REVIEW si confidence≥40 OU authenticity≥40, REJECT sinon`;
}

/**
 * Build the user content for VLM with the document image.
 */
function buildVLMUserContent(imageBase64: string, documentType: DocumentType): string {
  // The z-ai-web-dev-sdk VLM accepts base64 images in the content
  const dataUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64.replace(/^data:image\/\w+;base64,/, '')}`;

  return `Analyse ce document de type ${documentType}.\n\nImage du document: ${dataUrl}`;
}

/**
 * Parse the VLM analysis response into a structured result.
 */
function parseAnalysisResponse(
  aiResponse: string,
  documentType: DocumentType,
  countryCode: string
): DocumentAnalysisResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      const extractedFields: Record<string, string> = {};
      if (parsed.extractedFields && typeof parsed.extractedFields === 'object') {
        for (const [k, v] of Object.entries(parsed.extractedFields)) {
          if (typeof v === 'string') extractedFields[k] = v;
          else if (v !== null && v !== undefined) extractedFields[k] = String(v);
        }
      }

      const confidenceScore = clampScore(Number(parsed.confidenceScore) || 0);
      const authenticityScore = clampScore(Number(parsed.authenticityScore) || 0);

      const issues: string[] = [];
      if (Array.isArray(parsed.issues)) {
        for (const issue of parsed.issues) {
          if (typeof issue === 'string') issues.push(issue);
        }
      }

      // Add country-specific validation issues
      const countryIssues = validateCountrySpecificRules(extractedFields, documentType, countryCode);
      issues.push(...countryIssues);

      // Recalculate recommendation based on scores
      let recommendation: DocumentAnalysisResult['recommendation'] = 'REVIEW';
      if (confidenceScore >= 70 && authenticityScore >= 70) recommendation = 'APPROVE';
      else if (confidenceScore < 40 && authenticityScore < 40) recommendation = 'REJECT';

      return {
        extractedFields,
        confidenceScore,
        authenticityScore,
        issues,
        recommendation,
        rawText: parsed.rawText || undefined,
      };
    }
  } catch {
    // JSON parse failed, return basic result
  }

  // Fallback: try to extract some basic info from the text response
  return {
    extractedFields: extractBasicFields(aiResponse),
    confidenceScore: 30,
    authenticityScore: 30,
    issues: ['Impossible de structurer la réponse IA — vérification manuelle requise'],
    recommendation: 'REVIEW',
    rawText: aiResponse,
  };
}

/**
 * Validate country-specific rules for documents.
 */
function validateCountrySpecificRules(
  fields: Record<string, string>,
  documentType: DocumentType,
  countryCode: string
): string[] {
  const issues: string[] = [];

  // Check for required fields based on country and document type
  if (documentType === 'LAND_TITLE') {
    if (!fields.numeroTF && !fields.numero_tf && !fields.numTF && !fields['numéro TF'] && !fields['titre foncier numéro']) {
      issues.push('Numéro de Titre Foncier manquant');
    }
  }

  if (documentType === 'ACD') {
    if (!fields.mairie && !fields.commune) {
      issues.push('Mairie émettrice non identifiée sur l\'ACD');
    }
  }

  if (documentType === 'ID_CARD') {
    // Check expiration for ID cards
    const expiry = fields.dateExpiration || fields.date_expiration || fields.expiration;
    if (expiry) {
      try {
        const expiryDate = parseFrenchDate(expiry);
        if (expiryDate && expiryDate < new Date()) {
          issues.push(`Carte d'identité expirée depuis le ${expiry}`);
        }
      } catch {
        // Date parsing failed, skip
      }
    }
  }

  // Country-specific document validity rules
  if (countryCode === 'BJ') {
    if (documentType === 'ACD' && !fields.superficie && !fields.surface) {
      issues.push('Superficie non mentionnée — recommandation: vérifier le bornage');
    }
  }

  if (countryCode === 'BF') {
    if (documentType === 'PUH' && !fields.superficie) {
      issues.push('Superficie manquante sur le PUH');
    }
  }

  if (countryCode === 'TG') {
    if (documentType === 'CERTIFICAT_ANDF' && !fields.numero_certificat) {
      issues.push('Numéro de certificat ANDF manquant');
    }
  }

  return issues;
}

/**
 * Extract basic fields from unstructured text response.
 */
function extractBasicFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};

  // Try to find common patterns
  const patterns: Array<[string, RegExp]> = [
    ['nom', /nom\s*:\s*(.+)/i],
    ['prénom', /pr[eé]nom\s*:\s*(.+)/i],
    ['date_naissance', /(?:date de naissance|n[eé] le)\s*:\s*(.+)/i],
    ['numéro', /n[°o]\s*(?:du document|de la carte|d'identification)?\s*:\s*(.+)/i],
    ['date_délivrance', /d[eé]livr[eé]\s*(?:le)?\s*:\s*(.+)/i],
    ['date_expiration', /expir(?:e|ation)\s*(?:le)?\s*:\s*(.+)/i],
    ['lieu', /lieu\s*:\s*(.+)/i],
    ['superficie', /superficie\s*:\s*(.+)/i],
    ['adresse', /adresse\s*:\s*(.+)/i],
    ['montant', /montant\s*:\s*(.+)/i],
  ];

  for (const [key, pattern] of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      fields[key] = match[1].trim();
    }
  }

  return fields;
}

/**
 * Parse a French-format date string.
 */
function parseFrenchDate(dateStr: string): Date | null {
  // Try DD/MM/YYYY
  const ddmmyyyy = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ddmmyyyy) {
    return new Date(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]) - 1, Number(ddmmyyyy[1]));
  }

  // Try "1er janvier 2024" style
  const months: Record<string, number> = {
    'janvier': 0, 'février': 1, 'fevrier': 1, 'mars': 2, 'avril': 3,
    'mai': 4, 'juin': 5, 'juillet': 6, 'août': 7, 'aout': 7,
    'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11, 'decembre': 11,
  };

  const textual = dateStr.match(/(\d{1,2})(?:er|ère)?\s+(\w+)\s+(\d{4})/i);
  if (textual && months[textual[2].toLowerCase()] !== undefined) {
    return new Date(Number(textual[3]), months[textual[2].toLowerCase()], Number(textual[1]));
  }

  return null;
}

/**
 * Clamp a score value between 0 and 100.
 */
function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
