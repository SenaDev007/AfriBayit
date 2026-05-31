/**
 * AfriBayit — Document Completeness Checker
 * Validates submitted documents against country-specific requirements
 */

import {
  type PropertyType,
  type TransactionType,
  type SubmittedDocument,
  type DocumentRequirement,
  COUNTRY_FRAMEWORKS,
  getMandatoryDocs,
  getOptionalDocs,
} from './validation-rules';

// ============ Types ============

export type DocStatus = 'complete' | 'missing' | 'expired' | 'invalid_format' | 'wrong_issuer' | 'valid';

export interface DocumentCheckResult {
  docType: string;
  nameFr: string;
  status: DocStatus;
  issues: string[];
  requirement: DocumentRequirement;
  submittedDoc?: SubmittedDocument;
}

export interface CompletenessResult {
  country: string;
  propertyType: string;
  transaction: string;
  overallComplete: boolean;
  completenessPercentage: number;
  mandatoryResults: DocumentCheckResult[];
  optionalResults: DocumentCheckResult[];
  missingDocs: DocumentRequirement[];
  expiredDocs: DocumentCheckResult[];
  invalidDocs: DocumentCheckResult[];
  summary: {
    totalMandatory: number;
    validMandatory: number;
    totalOptional: number;
    validOptional: number;
    missingCount: number;
    expiredCount: number;
    invalidCount: number;
  };
}

// ============ Core Functions ============

/**
 * Validate a single document against its requirement
 */
export function validateDocument(
  doc: SubmittedDocument,
  requirement: DocumentRequirement
): { status: DocStatus; issues: string[] } {
  const issues: string[] = [];
  let status: DocStatus = 'valid';

  // Check format
  if (requirement.format === 'original' && doc.format !== 'original') {
    issues.push(`Format requis: original, fourni: ${doc.format}`);
    status = 'invalid_format';
  } else if (requirement.format === 'certified_copy' && doc.format === 'simple_copy') {
    issues.push(`Format requis: copie certifiée, fourni: copie simple`);
    status = 'invalid_format';
  }

  // Check max age
  if (requirement.maxAgeMonths && doc.issueDate) {
    const issueDate = new Date(doc.issueDate);
    const now = new Date();
    const ageMs = now.getTime() - issueDate.getTime();
    const ageMonths = ageMs / (1000 * 60 * 60 * 24 * 30.44);
    if (ageMonths > requirement.maxAgeMonths) {
      issues.push(`Document trop ancien: ${Math.round(ageMonths)} mois (max: ${requirement.maxAgeMonths} mois)`);
      status = 'expired';
    }
  }

  // Check expiry date
  if (doc.expiryDate) {
    const expiryDate = new Date(doc.expiryDate);
    if (expiryDate < new Date()) {
      issues.push('Document expiré');
      status = 'expired';
    }
  }

  // Check issuing authority
  if (requirement.issuingAuthority && doc.issuingAuthority) {
    const expectedKeywords = requirement.issuingAuthority.toLowerCase().split(/[\s/()]+/).filter(w => w.length > 3);
    const docAuthority = doc.issuingAuthority.toLowerCase();
    const matches = expectedKeywords.some(kw => docAuthority.includes(kw));
    if (!matches && doc.isValid === false) {
      issues.push(`Autorité émettrice non reconnue: ${doc.issuingAuthority}`);
      status = 'wrong_issuer';
    }
  }

  // Check if explicitly marked invalid
  if (doc.isValid === false) {
    issues.push('Document marqué comme invalide');
    if (status === 'valid') status = 'invalid_format';
  }

  return { status, issues };
}

/**
 * Check document completeness for a given country, property type, and transaction
 */
export function checkCompleteness(
  country: string,
  propertyType: PropertyType,
  transaction: TransactionType,
  submittedDocs: SubmittedDocument[]
): CompletenessResult {
  const framework = COUNTRY_FRAMEWORKS[country];
  if (!framework) {
    return {
      country,
      propertyType,
      transaction,
      overallComplete: false,
      completenessPercentage: 0,
      mandatoryResults: [],
      optionalResults: [],
      missingDocs: [],
      expiredDocs: [],
      invalidDocs: [],
      summary: {
        totalMandatory: 0,
        validMandatory: 0,
        totalOptional: 0,
        validOptional: 0,
        missingCount: 0,
        expiredCount: 0,
        invalidCount: 0,
      },
    };
  }

  const mandatoryReqs = getMandatoryDocs(country, propertyType);
  const optionalReqs = getOptionalDocs(country, propertyType);

  // For rental transactions, some requirements may be relaxed
  const effectiveMandatoryReqs = transaction === 'location'
    ? mandatoryReqs.filter(r => r.docType === 'titre_foncier' || r.docType === 'certificat_propriete' || r.docType === 'certificat_propriete_andf' || r.docType === 'certificat_foncier')
    : mandatoryReqs;

  // Check mandatory documents
  const mandatoryResults: DocumentCheckResult[] = effectiveMandatoryReqs.map((req) => {
    const submitted = submittedDocs.find(d => d.docType === req.docType);

    if (!submitted) {
      return {
        docType: req.docType,
        nameFr: req.nameFr,
        status: 'missing' as DocStatus,
        issues: ['Document manquant'],
        requirement: req,
      };
    }

    const validation = validateDocument(submitted, req);
    return {
      docType: req.docType,
      nameFr: req.nameFr,
      status: validation.status,
      issues: validation.issues,
      requirement: req,
      submittedDoc: submitted,
    };
  });

  // Check optional documents
  const optionalResults: DocumentCheckResult[] = optionalReqs.map((req) => {
    const submitted = submittedDocs.find(d => d.docType === req.docType);

    if (!submitted) {
      return {
        docType: req.docType,
        nameFr: req.nameFr,
        status: 'missing' as DocStatus,
        issues: ['Document non fourni (optionnel)'],
        requirement: req,
      };
    }

    const validation = validateDocument(submitted, req);
    return {
      docType: req.docType,
      nameFr: req.nameFr,
      status: validation.status,
      issues: validation.issues,
      requirement: req,
      submittedDoc: submitted,
    };
  });

  const missingDocs = mandatoryResults
    .filter(r => r.status === 'missing')
    .map(r => r.requirement);

  const expiredDocs = mandatoryResults
    .filter(r => r.status === 'expired');

  const invalidDocs = mandatoryResults
    .filter(r => r.status === 'invalid_format' || r.status === 'wrong_issuer');

  const validMandatory = mandatoryResults.filter(r => r.status === 'valid').length;
  const validOptional = optionalResults.filter(r => r.status === 'valid').length;

  const totalMandatory = effectiveMandatoryReqs.length;
  const completenessPercentage = totalMandatory > 0
    ? Math.round((validMandatory / totalMandatory) * 100)
    : 0;

  return {
    country,
    propertyType,
    transaction,
    overallComplete: validMandatory === totalMandatory && totalMandatory > 0,
    completenessPercentage,
    mandatoryResults,
    optionalResults,
    missingDocs,
    expiredDocs,
    invalidDocs,
    summary: {
      totalMandatory,
      validMandatory,
      totalOptional: optionalReqs.length,
      validOptional,
      missingCount: missingDocs.length,
      expiredCount: expiredDocs.length,
      invalidCount: invalidDocs.length,
    },
  };
}

/**
 * Get required documents for a specific country, property type, and transaction
 */
export function getRequiredDocs(
  country: string,
  propertyType: PropertyType,
  transaction: TransactionType
): DocumentRequirement[] {
  const mandatoryReqs = getMandatoryDocs(country, propertyType);
  const optionalReqs = getOptionalDocs(country, propertyType);

  if (transaction === 'location') {
    // For rentals, fewer documents are required
    const relaxedMandatory = mandatoryReqs.filter(r =>
      r.docType === 'titre_foncier' ||
      r.docType === 'certificat_propriete' ||
      r.docType === 'certificat_propriete_andf' ||
      r.docType === 'certificat_foncier'
    );
    return [...relaxedMandatory, ...optionalReqs];
  }

  return [...mandatoryReqs, ...optionalReqs];
}
