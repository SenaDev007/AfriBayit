/**
 * AfriBayit — Regulatory Update Tracking
 * Tracks regulatory changes and their impact on document requirements
 */

import { type ReformRule, COUNTRY_FRAMEWORKS, type PropertyType } from './validation-rules';

// ============ Types ============

export interface RegulatoryUpdate {
  id: string;
  countryCode: string;
  countryName: string;
  title: string;
  description: string;
  effectiveDate: string;
  source: string;
  impactLevel: 'critical' | 'major' | 'minor';
  affectedPropertyTypes: PropertyType[];
  newRequirements: string[];
  removedRequirements: string[];
  status: 'upcoming' | 'active' | 'superseded';
  supersededBy?: string;
}

// ============ Known Regulatory Updates ============

export const REGULATORY_UPDATES: RegulatoryUpdate[] = [
  {
    id: 'BJ-2023-REFORM',
    countryCode: 'BJ',
    countryName: 'Bénin',
    title: 'Réforme Foncière 2023 — Obligation TF & Registre Numérique',
    description: 'La réforme foncière de 2023 rend obligatoire le Titre Foncier pour toutes les transactions immobilières au Bénin. L\'ANDF met en place un registre numérique pour la traçabilité des propriétés.',
    effectiveDate: '2023-01-01',
    source: 'Gouvernement du Bénin — ANDF',
    impactLevel: 'critical',
    affectedPropertyTypes: ['terrain', 'villa', 'appartement', 'bureau', 'commerce'],
    newRequirements: ['titre_foncier', 'certificat_propriete_andf'],
    removedRequirements: [],
    status: 'active',
  },
  {
    id: 'CI-2025-ACD-ADU',
    countryCode: 'CI',
    countryName: "Côte d'Ivoire",
    title: 'Loi ACD/ADU 2025 — Renforcement Enregistrement DGI',
    description: 'Nouvelle législation renforçant les exigences ACD (Attestation de Coutume et de Détention) et ADU. L\'enregistrement à la DGI est désormais obligatoire. L\'acte notarié est requis pour toute transaction supérieure à 10M FCFA.',
    effectiveDate: '2025-01-01',
    source: 'Gouvernement de Côte d\'Ivoire — DGI',
    impactLevel: 'critical',
    affectedPropertyTypes: ['terrain', 'villa', 'appartement', 'bureau', 'commerce'],
    newRequirements: ['certificat_foncier'],
    removedRequirements: [],
    status: 'active',
  },
  {
    id: 'BF-2025-RAF',
    countryCode: 'BF',
    countryName: 'Burkina Faso',
    title: 'RAF 2025 — Réforme Agraire et Foncière (214 articles)',
    description: 'Réforme majeure avec 214 articles. Introduction des types PUH (Permis Urbain d\'Habiter, art. 45-52) et APFR (Attestation de Possession Foncière Rurale, art. 85-98). Cadastre numérique obligatoire (art. 15-20). Conversion APFR → TF sous 5 ans (art. 142). Certificat de conformité obligatoire (art. 135).',
    effectiveDate: '2025-01-01',
    source: 'Gouvernement du Burkina Faso — Ministère de l\'Urbanisme',
    impactLevel: 'critical',
    affectedPropertyTypes: ['terrain', 'villa', 'appartement', 'bureau', 'commerce'],
    newRequirements: ['puh', 'apfr', 'plan_cadastral_numerique', 'certificat_conformite', 'certificat_conformite_urbanisme'],
    removedRequirements: [],
    status: 'active',
  },
  {
    id: 'TG-2018-CFD',
    countryCode: 'TG',
    countryName: 'Togo',
    title: 'Code Foncier Domanial 2018',
    description: 'Le CFD 2018 rend le Titre Foncier obligatoire pour toutes les transactions immobilières au Togo. La Conservation foncière est renforcée.',
    effectiveDate: '2018-01-01',
    source: 'Gouvernement du Togo — Conservation Foncière',
    impactLevel: 'critical',
    affectedPropertyTypes: ['terrain', 'villa', 'appartement', 'bureau', 'commerce'],
    newRequirements: ['titre_foncier'],
    removedRequirements: [],
    status: 'active',
  },
  {
    id: 'TG-2025-DCCF',
    countryCode: 'TG',
    countryName: 'Togo',
    title: 'DCCF 2025 — Décret d\'Application du Code de la Construction et de l\'Habitat',
    description: 'DCCF 2025: Enregistrement obligatoire de tous les actes de cession dans les 30 jours (art. 15, pénalité 10% en cas de retard). CFD (Certificat Foncier de Droit) comme titre intermédiaire (art. 8). Certificat ANDF obligatoire pour toute mutation (art. 22). Procédure simplifiée pour les mutations. Mandatory registration enforcement.',
    effectiveDate: '2025-01-01',
    source: 'Gouvernement du Togo — Ministère de l\'Urbanisme',
    impactLevel: 'critical',
    affectedPropertyTypes: ['terrain', 'villa', 'appartement', 'bureau', 'commerce'],
    newRequirements: ['acte_cession', 'certificat_foncier_droit', 'certificat_propriete_andf'],
    removedRequirements: [],
    status: 'active',
  },
  {
    id: 'BJ-2025-DIGITAL',
    countryCode: 'BJ',
    countryName: 'Bénin',
    title: 'Numérisation du Registre Foncier — Phase 2',
    description: 'Extension du registre numérique ANDF. Les transactions purement numériques sont désormais possibles pour les biens déjà inscrits.',
    effectiveDate: '2025-06-01',
    source: 'ANDF Bénin',
    impactLevel: 'minor',
    affectedPropertyTypes: ['terrain', 'villa', 'appartement', 'bureau', 'commerce'],
    newRequirements: [],
    removedRequirements: [],
    status: 'active',
  },
];

// ============ Functions ============

/**
 * Get all regulatory updates for a specific country
 */
export function getUpdatesForCountry(countryCode: string): RegulatoryUpdate[] {
  return REGULATORY_UPDATES.filter(u => u.countryCode === countryCode && u.status === 'active');
}

/**
 * Get all active regulatory updates
 */
export function getActiveUpdates(): RegulatoryUpdate[] {
  return REGULATORY_UPDATES.filter(u => u.status === 'active');
}

/**
 * Get critical updates that affect a specific property type
 */
export function getCriticalUpdates(countryCode: string, propertyType: PropertyType): RegulatoryUpdate[] {
  return REGULATORY_UPDATES.filter(u =>
    u.countryCode === countryCode &&
    u.status === 'active' &&
    u.impactLevel === 'critical' &&
    u.affectedPropertyTypes.includes(propertyType)
  );
}

/**
 * Get reform rules from the framework for a country
 */
export function getReformRules(countryCode: string): ReformRule[] {
  const framework = COUNTRY_FRAMEWORKS[countryCode];
  return framework?.postReformRules || [];
}

/**
 * Check if a regulatory update is currently in effect
 */
export function isUpdateActive(updateId: string): boolean {
  const update = REGULATORY_UPDATES.find(u => u.id === updateId);
  if (!update) return false;
  if (update.status !== 'active') return false;
  return new Date(update.effectiveDate) <= new Date();
}

// ============ Update Mechanism ============

export interface UpdateHistoryEntry {
  id: string;
  countryCode: string;
  updateType: 'add' | 'modify' | 'remove';
  description: string;
  appliedAt: string;
  appliedBy: string;
  previousValue?: string;
  newValue?: string;
}

const updateHistory: UpdateHistoryEntry[] = [];

// Semi-annual review dates (June 1 and December 1)
const REVIEW_MONTHS = [5, 11]; // 0-indexed: June = 5, December = 11

/**
 * Check if legal rules for a country need updating
 * Reviews are semi-annual (June and December)
 */
export function checkForUpdates(countryCode: string): {
  needsUpdate: boolean;
  nextReviewDate: string;
  lastReviewDate: string | null;
  pendingUpdates: RegulatoryUpdate[];
} {
  const now = new Date();
  const currentMonth = now.getMonth();

  // Find next review date
  let nextReviewMonth = REVIEW_MONTHS.find(m => m > currentMonth);
  let nextReviewYear = now.getFullYear();
  if (nextReviewMonth === undefined) {
    nextReviewMonth = REVIEW_MONTHS[0];
    nextReviewYear++;
  }

  const nextReviewDate = new Date(nextReviewYear, nextReviewMonth, 1).toISOString();

  // Find last review date
  let lastReviewMonth = [...REVIEW_MONTHS].reverse().find(m => m < currentMonth);
  let lastReviewYear = now.getFullYear();
  if (lastReviewMonth === undefined) {
    lastReviewMonth = REVIEW_MONTHS[REVIEW_MONTHS.length - 1];
    lastReviewYear--;
  }

  const lastReviewDate = new Date(lastReviewYear, lastReviewMonth, 1).toISOString();

  // Check for upcoming/active updates that haven't been applied yet
  const pendingUpdates = REGULATORY_UPDATES.filter(
    u => u.countryCode === countryCode && (u.status === 'upcoming' || u.status === 'active')
  );

  // Check if any updates were added since last review
  const updatesSinceLastReview = pendingUpdates.filter(
    u => new Date(u.effectiveDate) >= new Date(lastReviewDate)
  );

  return {
    needsUpdate: updatesSinceLastReview.length > 0,
    nextReviewDate,
    lastReviewDate,
    pendingUpdates: updatesSinceLastReview,
  };
}

/**
 * Apply a regulatory update to the system
 */
export function applyUpdate(
  countryCode: string,
  updateData: {
    updateType: 'add' | 'modify' | 'remove';
    description: string;
    appliedBy: string;
    previousValue?: string;
    newValue?: string;
  }
): UpdateHistoryEntry {
  const entry: UpdateHistoryEntry = {
    id: `update-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    countryCode,
    updateType: updateData.updateType,
    description: updateData.description,
    appliedAt: new Date().toISOString(),
    appliedBy: updateData.appliedBy,
    previousValue: updateData.previousValue,
    newValue: updateData.newValue,
  };

  updateHistory.push(entry);
  return entry;
}

/**
 * Get the history of regulatory changes for a country
 */
export function getUpdateHistory(countryCode: string): UpdateHistoryEntry[] {
  return updateHistory.filter(e => e.countryCode === countryCode);
}

/**
 * Check if a semi-annual review is due
 */
export function isReviewDue(): boolean {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth();
  // Review is due in the first 7 days of review months
  return REVIEW_MONTHS.includes(month) && day <= 7;
}
