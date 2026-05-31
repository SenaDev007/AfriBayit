/**
 * AfriBayit — Auto-Rejection Logic
 * Automatically checks documents for conditions that warrant rejection
 */

import {
  type PropertyType,
  type SubmittedDocument,
  COUNTRY_FRAMEWORKS,
} from './validation-rules';

// ============ Types ============

export type RejectionSeverity = 'warning' | 'rejection';

export interface RejectionResult {
  passed: boolean;
  results: RejectionCheckResult[];
  hasWarnings: boolean;
  hasRejections: boolean;
  summary: {
    totalChecks: number;
    passedChecks: number;
    warnings: number;
    rejections: number;
  };
}

export interface RejectionCheckResult {
  conditionId: string;
  condition: string;
  triggered: boolean;
  reasonFr: string;
  reasonEn: string;
  severity: RejectionSeverity;
}

// ============ Core Function ============

/**
 * Run all auto-reject checks for a given country, property type, and submitted documents.
 * Returns a comprehensive result with pass/fail status and specific reasons.
 */
export function checkAutoReject(
  country: string,
  propertyType: PropertyType,
  documents: SubmittedDocument[]
): RejectionResult {
  const framework = COUNTRY_FRAMEWORKS[country];

  if (!framework) {
    return {
      passed: false,
      results: [{
        conditionId: 'UNKNOWN-COUNTRY',
        condition: 'Pays non supporté',
        triggered: true,
        reasonFr: `Le pays ${country} n'est pas supporté par le système de validation`,
        reasonEn: `Country ${country} is not supported by the validation system`,
        severity: 'rejection',
      }],
      hasWarnings: false,
      hasRejections: true,
      summary: { totalChecks: 1, passedChecks: 0, warnings: 0, rejections: 1 },
    };
  }

  const results: RejectionCheckResult[] = framework.autoRejectConditions.map((condition) => {
    const triggered = condition.check(documents);
    return {
      conditionId: condition.id,
      condition: condition.condition,
      triggered,
      reasonFr: condition.reasonFr,
      reasonEn: condition.reasonEn,
      severity: condition.severity,
    };
  });

  // Additional property-type-specific checks
  const additionalChecks = getPropertySpecificChecks(country, propertyType, documents);
  results.push(...additionalChecks);

  const warnings = results.filter(r => r.triggered && r.severity === 'warning');
  const rejections = results.filter(r => r.triggered && r.severity === 'rejection');
  const passedChecks = results.filter(r => !r.triggered);

  return {
    passed: rejections.length === 0,
    results,
    hasWarnings: warnings.length > 0,
    hasRejections: rejections.length > 0,
    summary: {
      totalChecks: results.length,
      passedChecks: passedChecks.length,
      warnings: warnings.length,
      rejections: rejections.length,
    },
  };
}

// ============ Property-Specific Checks ============

function getPropertySpecificChecks(
  country: string,
  propertyType: PropertyType,
  documents: SubmittedDocument[]
): RejectionCheckResult[] {
  const checks: RejectionCheckResult[] = [];

  // Check: Missing TF for property sale (all countries)
  const framework = COUNTRY_FRAMEWORKS[country];
  if (framework?.propertyTypesRequiringTF.includes(propertyType)) {
    const hasTF = documents.some(d => d.docType === 'titre_foncier' && d.isValid !== false);
    checks.push({
      conditionId: `${country}-TF-REQUIRED`,
      condition: `Titre Foncier requis pour le type ${propertyType}`,
      triggered: !hasTF,
      reasonFr: `Le Titre Foncier est obligatoire pour les transactions de type ${propertyType} dans ce pays`,
      reasonEn: `Land Title is mandatory for ${propertyType} transactions in this country`,
      severity: 'rejection',
    });
  }

  // Check: Expired documents
  const now = new Date();
  const expiredDocs = documents.filter(d => {
    if (!d.expiryDate) return false;
    return new Date(d.expiryDate) < now;
  });
  if (expiredDocs.length > 0) {
    checks.push({
      conditionId: `${country}-EXPIRED-DOCS`,
      condition: `${expiredDocs.length} document(s) expiré(s)`,
      triggered: true,
      reasonFr: `${expiredDocs.length} document(s) sont expirés et doivent être renouvelés`,
      reasonEn: `${expiredDocs.length} document(s) have expired and must be renewed`,
      severity: 'warning',
    });
  }

  // Check: Wrong format (simple copy when certified required)
  const wrongFormatDocs = documents.filter(d => d.format === 'simple_copy' && d.isValid === false);
  if (wrongFormatDocs.length > 0) {
    checks.push({
      conditionId: `${country}-WRONG-FORMAT`,
      condition: `${wrongFormatDocs.length} document(s) avec format incorrect`,
      triggered: true,
      reasonFr: `${wrongFormatDocs.length} document(s) nécessitent une copie certifiée conforme au lieu d'une copie simple`,
      reasonEn: `${wrongFormatDocs.length} document(s) require a certified copy instead of a simple copy`,
      severity: 'warning',
    });
  }

  // Check: No documents submitted at all
  if (documents.length === 0) {
    checks.push({
      conditionId: `${country}-NO-DOCS`,
      condition: 'Aucun document soumis',
      triggered: true,
      reasonFr: 'Aucun document n\'a été soumis pour validation',
      reasonEn: 'No documents have been submitted for validation',
      severity: 'rejection',
    });
  }

  return checks;
}
