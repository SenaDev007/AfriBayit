/**
 * AfriBayit — Legal Documents by Country & Property Type
 * CDC V3.1 — Section 10B: Country-Specific Legal Document Requirements
 *
 * Defines which legal documents are required per country and property type
 * for property publication validation.
 */

export const LEGAL_DOCS_BY_COUNTRY: Record<string, Record<string, string[]>> = {
  BJ: {
    // Bénin
    terrain: ['titre_foncier', 'acd', 'certificat_propriete_andf'],
    villa: ['titre_foncier', 'permis_construire'],
    appartement: ['titre_foncier', 'permis_construire', 'autorisation_lotissement'],
    bureau: ['titre_foncier', 'permis_construire'],
    commerce: ['titre_foncier', 'permis_construire'],
  },
  CI: {
    // Côte d'Ivoire
    terrain: ['acd', 'lettre_attribution', 'arrete_concession'],
    villa: ['titre_foncier', 'certificat_propriete', 'approbation_lotissement'],
    appartement: ['titre_foncier', 'certificat_propriete'],
    bureau: ['titre_foncier', 'certificat_propriete'],
    commerce: ['titre_foncier', 'certificat_propriete'],
  },
  BF: {
    // Burkina Faso
    terrain: ['puh', 'titre_foncier', 'apfr'],
    villa: ['titre_foncier', 'permis_construire'],
    appartement: ['titre_foncier', 'permis_construire'],
    bureau: ['titre_foncier', 'permis_construire'],
    commerce: ['titre_foncier'],
  },
  TG: {
    // Togo
    terrain: ['titre_foncier', 'acte_cession', 'certificat_propriete_andf'],
    villa: ['titre_foncier', 'permis_construire'],
    appartement: ['titre_foncier', 'permis_construire'],
    bureau: ['titre_foncier'],
    commerce: ['titre_foncier'],
  },
};

export const LEGAL_DOC_LABELS: Record<string, string> = {
  titre_foncier: 'Titre Foncier',
  acd: 'Attestation de Détention Coutumière',
  permis_construire: 'Permis de Construire',
  decision_parcelle: 'Décision de Parcelle',
  lettre_attribution: "Lettre d'Attribution",
  arrete_concession: 'Arrêté de Concession',
  puh: "Permis Urbain d'Habiter",
  acte_cession: 'Acte de Cession',
  certificat_propriete_andf: 'Certificat de Propriété ANDF',
  certificat_propriete: 'Certificat de Propriété',
  autorisation_lotissement: 'Autorisation de Lotissement',
  approbation_lotissement: 'Approbation de Lotissement',
  apfr: 'Attestation de Possession Foncière Rurale',
};

export const LEGAL_DOC_DESCRIPTIONS: Record<string, string> = {
  titre_foncier: 'Titre de propriété foncière officiel délivré par les autorités',
  acd: 'Attestation reconnue par les autorités coutumières pour les terrains non titrés',
  permis_construire: 'Autorisation administrative de construire sur le terrain',
  decision_parcelle: 'Décision administrative attribuant une parcelle',
  lettre_attribution: "Lettre officielle d'attribution de terrain par les autorités",
  arrete_concession: 'Arrêté accordant une concession foncière',
  puh: "Permis d'habiter pour les constructions en zone urbaine",
  acte_cession: 'Acte juridique de transfert de propriété entre parties',
  certificat_propriete_andf: 'Certificat délivré par l\'ANDF attestant la propriété',
  certificat_propriete: 'Certificat officiel de propriété immobilière',
  autorisation_lotissement: 'Autorisation de diviser un terrain en lots',
  approbation_lotissement: 'Approbation officielle d\'un projet de lotissement',
  apfr: 'Attestation reconnue pour les terrains ruraux non titrés',
};

/** Country code to full name mapping */
export const COUNTRY_NAMES: Record<string, string> = {
  BJ: 'Bénin',
  CI: "Côte d'Ivoire",
  BF: 'Burkina Faso',
  TG: 'Togo',
};

/** Map display country names back to codes */
export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'Bénin': 'BJ',
  "Côte d'Ivoire": 'CI',
  'Burkina Faso': 'BF',
  'Togo': 'TG',
};

/**
 * Get required legal documents for a given country and property type.
 * Falls back to ['titre_foncier'] if the country/type combination is not found.
 */
export function getRequiredDocs(country: string, propertyType: string): string[] {
  return LEGAL_DOCS_BY_COUNTRY[country]?.[propertyType] || ['titre_foncier'];
}

/**
 * Get the display label for a legal document type.
 * Falls back to the doc key itself if no label is found.
 */
export function getDocLabel(docType: string): string {
  return LEGAL_DOC_LABELS[docType] || docType;
}

/**
 * Get the description for a legal document type.
 */
export function getDocDescription(docType: string): string {
  return LEGAL_DOC_DESCRIPTIONS[docType] || '';
}

/**
 * Get the country code from either a code or a display name.
 */
export function normalizeCountryCode(country: string): string {
  if (LEGAL_DOCS_BY_COUNTRY[country]) return country;
  return COUNTRY_NAME_TO_CODE[country] || country;
}
