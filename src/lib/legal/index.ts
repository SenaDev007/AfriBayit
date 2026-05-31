/**
 * AfriBayit — Legal Engine Orchestrator
 * Main entry point for legal document validation and compliance checking
 */

export { COUNTRY_FRAMEWORKS, getFramework, getMandatoryDocs, getOptionalDocs } from './validation-rules';
export type {
  PropertyType,
  TransactionType,
  DocFormat,
  DocumentRequirement,
  ReformRule,
  AutoRejectCondition,
  CountryLegalFramework,
  SubmittedDocument,
} from './validation-rules';

export { checkCompleteness, validateDocument, getRequiredDocs } from './document-checker';
export type { DocStatus, DocumentCheckResult, CompletenessResult } from './document-checker';

export { checkAutoReject } from './auto-reject';
export type { RejectionSeverity, RejectionResult, RejectionCheckResult } from './auto-reject';

export {
  getUpdatesForCountry,
  getActiveUpdates,
  getCriticalUpdates,
  getReformRules,
  isUpdateActive,
  REGULATORY_UPDATES,
} from './regulatory-update';
export type { RegulatoryUpdate } from './regulatory-update';

import { checkCompleteness } from './document-checker';
import { checkAutoReject } from './auto-reject';
import type { PropertyType, TransactionType, SubmittedDocument } from './validation-rules';

// ============ High-Level Orchestrator ============

export interface LegalValidationResult {
  /** Document completeness check */
  completeness: import('./document-checker').CompletenessResult;
  /** Auto-rejection check */
  rejection: import('./auto-reject').RejectionResult;
  /** Overall pass/fail */
  isCompliant: boolean;
  /** Recommendations */
  recommendations: string[];
}

/**
 * Run the full legal validation pipeline for a property transaction.
 * Combines completeness checking and auto-rejection logic.
 */
export function validateLegalCompliance(
  country: string,
  propertyType: PropertyType,
  transaction: TransactionType,
  submittedDocs: SubmittedDocument[]
): LegalValidationResult {
  // Run completeness check
  const completeness = checkCompleteness(country, propertyType, transaction, submittedDocs);

  // Run auto-reject check
  const rejection = checkAutoReject(country, propertyType, submittedDocs);

  // Generate recommendations
  const recommendations: string[] = [];

  if (completeness.summary.missingCount > 0) {
    recommendations.push(
      `${completeness.summary.missingCount} document(s) obligatoire(s) manquant(s). ` +
      `Documents requis: ${completeness.missingDocs.map(d => d.nameFr).join(', ')}`
    );
  }

  if (completeness.summary.expiredCount > 0) {
    recommendations.push(
      `${completeness.summary.expiredCount} document(s) expiré(s) doivent être renouvelés.`
    );
  }

  if (completeness.summary.invalidCount > 0) {
    recommendations.push(
      `${completeness.summary.invalidCount} document(s) avec format incorrect. Veuillez fournir des copies certifiées conformes.`
    );
  }

  if (rejection.hasWarnings) {
    const warningReasons = rejection.results
      .filter(r => r.triggered && r.severity === 'warning')
      .map(r => r.reasonFr);
    recommendations.push(...warningReasons);
  }

  const isCompliant = completeness.overallComplete && rejection.passed;

  return {
    completeness,
    rejection,
    isCompliant,
    recommendations,
  };
}
