// AfriBayit — Legal Document Checker
// Validates property legal documents against per-country rules from tenant config
// CDC §4.3, §9 — Per-country legal document compliance checking

import { analyzeDocument, type DocumentType } from './document-analyzer';
import { getTenantConfig, type SupportedCountry } from '@/lib/tenant/config';

export interface PropertyData {
  propertyId?: string;
  propertyType: string; // villa, appartement, terrain, bureau, commerce
  country: string;
  city?: string;
  address?: string;
  surface?: number;
  price?: number;
  ownerName?: string;
}

export interface LegalDocCheckResult {
  isValid: boolean;
  documentType: string;
  extractedInfo: Record<string, string>;
  complianceStatus: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT' | 'UNKNOWN';
  missingDocs: string[];
  issues: string[];
  confidenceScore: number;
  authenticityScore: number;
  recommendation: 'PROCEED' | 'REVIEW' | 'REJECT';
}

// Per-country required documents mapping (from CDC §4.3)
const COUNTRY_REQUIRED_DOCS: Record<string, Array<{
  propertyTypes: string[]; // empty = all types
  docs: string[]; // at least one from each group must be present
  label: string;
}>> = {
  BJ: [
    { propertyTypes: ['terrain', 'villa'], docs: ['titre_foncier', 'acd'], label: 'Titre Foncier ou ACD' },
    { propertyTypes: ['appartement'], docs: ['titre_foncier', 'permis_construire'], label: 'Titre Foncier + Permis de Construire' },
    { propertyTypes: [], docs: ['permis_construire'], label: 'Permis de Construire (si construction)' },
  ],
  CI: [
    { propertyTypes: ['terrain'], docs: ['lettre_attribution'], label: 'Lettre d\'Attribution' },
    { propertyTypes: ['terrain'], docs: ['acd', 'arrete_concession'], label: 'ACD ou Arrêté de Concession' },
    { propertyTypes: ['villa', 'appartement'], docs: ['titre_foncier', 'certificat_propriete'], label: 'Titre Foncier ou Certificat de Propriété' },
    { propertyTypes: [], docs: ['attestation_villagéoise'], label: 'Attestation Villagéoise (zone rurale)' },
  ],
  BF: [
    { propertyTypes: ['terrain'], docs: ['puh'], label: 'PUH (Permis Urbain d\'Habiter)' },
    { propertyTypes: [], docs: ['titre_foncier'], label: 'Titre Foncier' },
  ],
  TG: [
    { propertyTypes: [], docs: ['titre_foncier'], label: 'Titre Foncier' },
    { propertyTypes: [], docs: ['acte_cession', 'certificat_andf'], label: 'Acte de Cession + Certificat ANDF' },
  ],
};

// Document type mapping: doc type key → DocumentType for analyzer
const DOC_TYPE_MAP: Record<string, DocumentType> = {
  titre_foncier: 'LAND_TITLE',
  acd: 'ACD',
  permis_construire: 'BUILDING_PERMIT',
  acte_cession: 'ACTE_CESSION',
  certificat_andf: 'CERTIFICAT_ANDF',
  puh: 'PUH',
  attestation_villagéoise: 'ATTESTATION_VILLAGEOISE',
  lettre_attribution: 'LAND_TITLE', // Closest match for VLM analysis
  arrete_concession: 'ACD', // Closest match
  certificat_propriete: 'LAND_TITLE', // Closest match
};

// Human-readable document names
const DOC_LABELS: Record<string, string> = {
  titre_foncier: 'Titre Foncier',
  acd: 'Attestation de Custom Déguerpissement (ACD)',
  permis_construire: 'Permis de Construire',
  acte_cession: 'Acte de Cession',
  certificat_andf: 'Certificat ANDF',
  puh: 'PUH (Permis Urbain d\'Habiter)',
  attestation_villagéoise: 'Attestation Villagéoise',
  lettre_attribution: 'Lettre d\'Attribution',
  arrete_concession: 'Arrêté de Concession',
  certificat_propriete: 'Certificat de Propriété',
};

/**
 * Check a legal document against property data and country rules.
 * Uses VLM to analyze the document image and validates compliance.
 */
export async function checkLegalDocument(
  imageBase64: string,
  propertyData: PropertyData,
  countryCode: string,
  documentTypeKey?: string
): Promise<LegalDocCheckResult> {
  // Step 1: Determine the document type for analysis
  const resolvedDocType = documentTypeKey
    ? DOC_TYPE_MAP[documentTypeKey] || 'UNKNOWN'
    : 'UNKNOWN';

  // Step 2: Run VLM analysis on the document
  const analysisResult = await analyzeDocument(
    imageBase64,
    resolvedDocType as DocumentType,
    countryCode,
    {
      proprietaire: propertyData.ownerName || '',
      adresse: propertyData.address || '',
      superficie: propertyData.surface ? `${propertyData.surface} m²` : '',
      type_bien: propertyData.propertyType,
      pays: propertyData.country,
      ville: propertyData.city || '',
    }
  );

  // Step 3: If document type not specified, try to identify it from extracted fields
  const identifiedDocType = documentTypeKey || identifyDocumentType(analysisResult.extractedFields, countryCode);

  // Step 4: Validate against country-specific rules
  const missingDocs = getMissingDocuments(
    identifiedDocType,
    propertyData.propertyType,
    countryCode
  );

  // Step 5: Check compliance status
  const complianceStatus = determineComplianceStatus(
    analysisResult.confidenceScore,
    analysisResult.authenticityScore,
    missingDocs,
    analysisResult.issues
  );

  // Step 6: Determine validity
  const isValid =
    complianceStatus === 'COMPLIANT' &&
    analysisResult.recommendation !== 'REJECT' &&
    analysisResult.authenticityScore >= 60;

  // Step 7: Determine recommendation
  let recommendation: LegalDocCheckResult['recommendation'] = 'REVIEW';
  if (isValid && analysisResult.confidenceScore >= 70) recommendation = 'PROCEED';
  else if (analysisResult.authenticityScore < 30 || analysisResult.confidenceScore < 30) {
    recommendation = 'REJECT';
  }

  return {
    isValid,
    documentType: identifiedDocType,
    extractedInfo: analysisResult.extractedFields,
    complianceStatus,
    missingDocs: missingDocs.map((d) => DOC_LABELS[d] || d),
    issues: analysisResult.issues,
    confidenceScore: analysisResult.confidenceScore,
    authenticityScore: analysisResult.authenticityScore,
    recommendation,
  };
}

/**
 * Get all missing required documents for a property type in a country.
 * Considers the already-provided document type.
 */
function getMissingDocuments(
  providedDocType: string,
  propertyType: string,
  countryCode: string
): string[] {
  const countryRules = COUNTRY_REQUIRED_DOCS[countryCode];
  if (!countryRules) return ['titre_foncier']; // Default requirement

  const missing: string[] = [];
  const provided = new Set([providedDocType]);

  for (const rule of countryRules) {
    // Skip rules for other property types
    if (rule.propertyTypes.length > 0 && !rule.propertyTypes.includes(propertyType)) {
      continue;
    }

    // Check if at least one doc from this rule is provided
    const hasOneFromRule = rule.docs.some((doc) => provided.has(doc));
    if (!hasOneFromRule) {
      // Add all docs from this rule as missing
      for (const doc of rule.docs) {
        if (!missing.includes(doc)) missing.push(doc);
      }
    }
  }

  return missing;
}

/**
 * Try to identify the document type from extracted fields and country context.
 */
function identifyDocumentType(
  extractedFields: Record<string, string>,
  countryCode: string
): string {
  const allText = Object.values(extractedFields).join(' ').toLowerCase();

  // Check for specific document indicators
  if (allText.includes('titre foncier') || allText.includes('tf n')) return 'titre_foncier';
  if (allText.includes('custom déguerpissement') || allText.includes('acd')) return 'acd';
  if (allText.includes('permis de construire') || allText.includes('permis construire')) return 'permis_construire';
  if (allText.includes('acte de cession')) return 'acte_cession';
  if (allText.includes('certificat andf') || allText.includes('agence nationale de domaine')) return 'certificat_andf';
  if (allText.includes('puh') || allText.includes('permis urbain')) return 'puh';
  if (allText.includes('attestation villagéoise') || allText.includes('villagéoise')) return 'attestation_villagéoise';
  if (allText.includes('lettre d\'attribution') || allText.includes('lettre attribution')) return 'lettre_attribution';
  if (allText.includes('arrêté de concession') || allText.includes('arrete de concession')) return 'arrete_concession';
  if (allText.includes('certificat de propriété') || allText.includes('certificat propriete')) return 'certificat_propriete';

  // Country-specific heuristics
  if (countryCode === 'BF' && (allText.includes('permis') || allText.includes('habiter'))) return 'puh';
  if (countryCode === 'TG' && (allText.includes('andf') || allText.includes('domaine foncier'))) return 'certificat_andf';

  return 'unknown';
}

/**
 * Determine compliance status based on analysis results.
 */
function determineComplianceStatus(
  confidenceScore: number,
  authenticityScore: number,
  missingDocs: string[],
  issues: string[]
): LegalDocCheckResult['complianceStatus'] {
  // If we can't even read the document properly
  if (confidenceScore < 20) return 'UNKNOWN';

  // Missing critical documents
  if (missingDocs.length >= 2) return 'NON_COMPLIANT';

  // Major issues detected
  const majorIssues = issues.filter((i) =>
    i.toLowerCase().includes('falsif') ||
    i.toLowerCase().includes('falsifi') ||
    i.toLowerCase().includes('contrefa') ||
    i.toLowerCase().includes('expiré') ||
    i.toLowerCase().includes('manquant')
  );
  if (majorIssues.length >= 2) return 'NON_COMPLIANT';

  // Some documents missing or minor issues
  if (missingDocs.length > 0 || issues.length > 0) return 'PARTIAL';

  // All checks passed
  if (confidenceScore >= 60 && authenticityScore >= 60) return 'COMPLIANT';

  return 'PARTIAL';
}

/**
 * Get the required documents for a property type in a given country.
 * Returns human-readable labels.
 */
export function getRequiredDocumentsForProperty(
  countryCode: string,
  propertyType: string
): string[][] {
  const tenantConfig = getTenantConfig(countryCode);
  if (tenantConfig?.requiredDocuments) {
    const docs = tenantConfig.requiredDocuments[propertyType] ||
      tenantConfig.requiredDocuments['terrain'] ||
      [['titre_foncier']];
    return docs;
  }

  // Fallback to our own mapping
  const countryRules = COUNTRY_REQUIRED_DOCS[countryCode];
  if (!countryRules) return [['titre_foncier']];

  return countryRules
    .filter((rule) => rule.propertyTypes.length === 0 || rule.propertyTypes.includes(propertyType))
    .map((rule) => rule.docs);
}

/**
 * Get human-readable document labels for a country.
 */
export function getDocumentLabels(countryCode: string): Record<string, string> {
  const labels: Record<string, string> = { ...DOC_LABELS };

  // Add country-specific labels
  if (countryCode === 'BJ') {
    labels['decision_parcelle'] = 'Décision de Parcelle';
    labels['lettre_attribution'] = 'Lettre d\'Attribution';
  }

  return labels;
}
