// AfriBayit — KYC Document Analyzer
// AI-powered KYC document analysis that cross-references with user profile data
// CDC §9 — KYC-specific document analysis pipeline

import { analyzeDocument, type DocumentType } from './document-analyzer';
import { db } from '@/lib/db';

export type KycDocumentType =
  | 'ID_CARD'
  | 'PASSPORT'
  | 'DRIVER_LICENSE'
  | 'BUSINESS_REG'
  | 'NOTARY_CERT'
  | 'LAND_TITLE';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface KycAnalysisResult {
  isValid: boolean;
  extractedData: Record<string, string>;
  discrepancy: KycDiscrepancy[];
  riskLevel: RiskLevel;
  confidenceScore: number;
  authenticityScore: number;
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  aiScore: number; // 0-100 score to save on KycDocument
}

export interface KycDiscrepancy {
  field: string;
  claimedValue: string;
  extractedValue: string;
  severity: 'minor' | 'major' | 'critical';
}

/**
 * Analyze a KYC document with cross-referencing against user profile data.
 * This is the main entry point for KYC document analysis.
 */
export async function analyzeKYCDocument(
  imageBase64: string,
  userId: string,
  documentType: KycDocumentType
): Promise<KycAnalysisResult> {
  // Step 1: Load user profile data for cross-referencing
  const userProfile = await loadUserProfile(userId);

  // Step 2: Build claimed data from user profile
  const claimedData = buildClaimedData(userProfile, documentType);

  // Step 3: Run document analysis with VLM
  const countryCode = userProfile?.country || 'BJ';
  const analysisResult = await analyzeDocument(
    imageBase64,
    documentType as DocumentType,
    countryCode,
    claimedData
  );

  // Step 4: Cross-reference extracted data with user profile
  const discrepancies = crossReferenceData(
    analysisResult.extractedFields,
    claimedData,
    documentType
  );

  // Step 5: Determine risk level
  const riskLevel = calculateRiskLevel(
    analysisResult.confidenceScore,
    analysisResult.authenticityScore,
    discrepancies
  );

  // Step 6: Determine overall validity
  const isValid =
    analysisResult.recommendation === 'APPROVE' &&
    riskLevel !== 'critical' &&
    discrepancies.filter((d) => d.severity === 'critical').length === 0;

  // Step 7: Calculate final AI score (for KycDocument.aiScore field)
  const aiScore = calculateKycAiScore(
    analysisResult.confidenceScore,
    analysisResult.authenticityScore,
    discrepancies
  );

  return {
    isValid,
    extractedData: analysisResult.extractedFields,
    discrepancy: discrepancies,
    riskLevel,
    confidenceScore: analysisResult.confidenceScore,
    authenticityScore: analysisResult.authenticityScore,
    recommendation: analysisResult.recommendation,
    aiScore,
  };
}

/**
 * Load user profile from database for cross-referencing.
 */
async function loadUserProfile(userId: string): Promise<{
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  dateOfBirth: string | null;
  kycLevel: number;
} | null> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        country: true,
        city: true,
        kycLevel: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      dateOfBirth: null, // Not stored in current schema
    };
  } catch (error) {
    console.error('[kyc-analyzer] Error loading user profile:', error);
    return null;
  }
}

/**
 * Build claimed data dictionary from user profile for comparison.
 */
function buildClaimedData(
  userProfile: {
    name: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    country: string | null;
    city: string | null;
  } | null,
  documentType: KycDocumentType
): Record<string, string> {
  if (!userProfile) return {};

  const claimed: Record<string, string> = {};

  // Common fields for all document types
  if (userProfile.firstName) claimed.prenom = userProfile.firstName;
  if (userProfile.lastName) claimed.nom = userProfile.lastName;
  if (userProfile.name) claimed.nom_complet = userProfile.name;
  if (userProfile.phone) claimed.telephone = userProfile.phone;
  if (userProfile.country) claimed.pays = userProfile.country;
  if (userProfile.city) claimed.ville = userProfile.city;

  // Document-specific claimed data
  switch (documentType) {
    case 'BUSINESS_REG':
      claimed.email_entreprise = userProfile.email;
      break;
    case 'NOTARY_CERT':
      claimed.nom_notaire = userProfile.name;
      break;
  }

  return claimed;
}

/**
 * Cross-reference extracted document data against claimed user data.
 */
function crossReferenceData(
  extractedFields: Record<string, string>,
  claimedData: Record<string, string>,
  documentType: KycDocumentType
): KycDiscrepancy[] {
  const discrepancies: KycDiscrepancy[] = [];

  if (Object.keys(claimedData).length === 0) return discrepancies;

  // Normalize field names for comparison
  const normalizedExtracted = normalizeFieldNames(extractedFields);

  // Name comparison — critical for KYC
  const nameFieldsToCheck = getNameComparisonFields(documentType);

  for (const { claimedKey, extractedKeys, severity } of nameFieldsToCheck) {
    const claimedValue = claimedData[claimedKey];
    if (!claimedValue) continue;

    for (const extractedKey of extractedKeys) {
      const extractedValue = normalizedExtracted[extractedKey];
      if (!extractedValue) continue;

      if (!namesMatch(claimedValue, extractedValue)) {
        discrepancies.push({
          field: claimedKey,
          claimedValue,
          extractedValue,
          severity,
        });
      }
      break; // Only check the first matching extracted key
    }
  }

  // Phone comparison (minor severity)
  if (claimedData.telephone) {
    const extractedPhone =
      normalizedExtracted.telephone ||
      normalizedExtracted.phone ||
      normalizedExtracted.tel;
    if (extractedPhone && !phonesMatch(claimedData.telephone, extractedPhone)) {
      discrepancies.push({
        field: 'telephone',
        claimedValue: claimedData.telephone,
        extractedValue: extractedPhone,
        severity: 'minor',
      });
    }
  }

  return discrepancies;
}

/**
 * Get the name comparison fields based on document type.
 */
function getNameComparisonFields(
  documentType: KycDocumentType
): Array<{ claimedKey: string; extractedKeys: string[]; severity: 'minor' | 'major' | 'critical' }> {
  switch (documentType) {
    case 'ID_CARD':
    case 'PASSPORT':
    case 'DRIVER_LICENSE':
      return [
        { claimedKey: 'nom', extractedKeys: ['nom', 'last_name', 'surname', 'nom_de_famille'], severity: 'critical' },
        { claimedKey: 'prenom', extractedKeys: ['prenom', 'first_name', 'given_name', 'prenoms'], severity: 'critical' },
        { claimedKey: 'nom_complet', extractedKeys: ['nom_complet', 'full_name', 'name'], severity: 'major' },
      ];
    case 'BUSINESS_REG':
      return [
        { claimedKey: 'nom_complet', extractedKeys: ['gerant', 'directeur', 'representant_legal'], severity: 'major' },
      ];
    case 'NOTARY_CERT':
      return [
        { claimedKey: 'nom_notaire', extractedKeys: ['nom', 'nom_notaire', 'name'], severity: 'critical' },
      ];
    case 'LAND_TITLE':
      return [
        { claimedKey: 'nom_complet', extractedKeys: ['titulaire', 'proprietaire', 'nom'], severity: 'major' },
      ];
    default:
      return [];
  }
}

/**
 * Normalize field names: lowercase, remove accents, replace spaces with underscores.
 */
function normalizeFieldNames(fields: Record<string, string>): Record<string, string> {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(fields)) {
    const normalizedKey = key
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\s\-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    normalized[normalizedKey] = value;
  }

  return normalized;
}

/**
 * Check if two names match (fuzzy matching with tolerance for accents, case, and minor typos).
 */
function namesMatch(name1: string, name2: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

  const n1 = normalize(name1);
  const n2 = normalize(name2);

  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;

  // Levenshtein distance check for minor typos
  const distance = levenshteinDistance(n1, n2);
  const maxDistance = Math.max(1, Math.floor(Math.max(n1.length, n2.length) * 0.2));
  if (distance <= maxDistance) return true;

  return false;
}

/**
 * Check if two phone numbers match (ignoring formatting).
 */
function phonesMatch(phone1: string, phone2: string): boolean {
  const normalize = (s: string) => s.replace(/[\s\-\.\(\)\+]/g, '');

  const n1 = normalize(phone1);
  const n2 = normalize(phone2);

  if (n1 === n2) return true;

  // Check if one contains the other (different country code formats)
  if (n1.endsWith(n2) || n2.endsWith(n1)) return true;

  return false;
}

/**
 * Calculate Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

/**
 * Calculate risk level based on confidence, authenticity, and discrepancies.
 */
function calculateRiskLevel(
  confidenceScore: number,
  authenticityScore: number,
  discrepancies: KycDiscrepancy[]
): RiskLevel {
  // Critical discrepancies → critical risk
  if (discrepancies.some((d) => d.severity === 'critical')) return 'critical';

  // Low scores → high risk
  if (confidenceScore < 30 || authenticityScore < 30) return 'high';

  // Major discrepancies or medium scores → medium risk
  if (discrepancies.some((d) => d.severity === 'major')) return 'high';
  if (confidenceScore < 60 || authenticityScore < 60) return 'medium';

  // Minor discrepancies only → medium risk
  if (discrepancies.some((d) => d.severity === 'minor')) return 'medium';

  // All good → low risk
  return 'low';
}

/**
 * Calculate the overall KYC AI score (0-100) to save on KycDocument.aiScore.
 */
function calculateKycAiScore(
  confidenceScore: number,
  authenticityScore: number,
  discrepancies: KycDiscrepancy[]
): number {
  let score = (confidenceScore * 0.4 + authenticityScore * 0.6);

  // Penalize for discrepancies
  for (const d of discrepancies) {
    switch (d.severity) {
      case 'critical': score -= 25; break;
      case 'major': score -= 15; break;
      case 'minor': score -= 5; break;
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}
