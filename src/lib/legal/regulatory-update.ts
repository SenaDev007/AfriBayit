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
    description: 'Réforme majeure avec 214 articles. Introduction des types PUH (Permis Urbain d\'Habiter) et APFR (Attestation de Possession Foncière Rurale). Nouveau cadastre numérique en cours de déploiement.',
    effectiveDate: '2025-01-01',
    source: 'Gouvernement du Burkina Faso — Ministère de l\'Urbanisme',
    impactLevel: 'critical',
    affectedPropertyTypes: ['terrain', 'villa', 'appartement', 'bureau', 'commerce'],
    newRequirements: ['puh', 'apfr'],
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
    title: 'Décret d\'Application du Code de la Construction et de l\'Habitat 2025',
    description: 'DCCF 2025: Enregistrement obligatoire de tous les actes de cession. Nouveaux délais de traitement. Procédure simplifiée pour les mutations.',
    effectiveDate: '2025-01-01',
    source: 'Gouvernement du Togo — Ministère de l\'Urbanisme',
    impactLevel: 'major',
    affectedPropertyTypes: ['terrain', 'villa', 'appartement', 'bureau', 'commerce'],
    newRequirements: ['acte_cession'],
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
