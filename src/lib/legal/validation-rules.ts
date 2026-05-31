/**
 * AfriBayit — Country-Specific Legal Validation Rules
 * Per-country validation matrices for property document compliance
 * Covers: Bénin (BJ), Côte d'Ivoire (CI), Burkina Faso (BF), Togo (TG)
 */

// ============ Types ============

export type PropertyType = 'terrain' | 'villa' | 'appartement' | 'bureau' | 'commerce' | 'chateau' | 'usine' | 'entrepot';
export type TransactionType = 'achat' | 'location' | 'cession' | 'echange' | 'donation' | 'succession';
export type DocFormat = 'original' | 'certified_copy' | 'simple_copy';

export interface DocumentRequirement {
  docType: string;
  nameFr: string;
  nameEn: string;
  mandatory: boolean;
  format: DocFormat;
  maxAgeMonths?: number;
  issuingAuthority: string;
  notes?: string;
}

export interface ReformRule {
  id: string;
  name: string;
  effectiveDate: string;
  description: string;
  appliesTo: PropertyType[];
  newRequirements: Partial<DocumentRequirement>[];
}

export interface AutoRejectCondition {
  id: string;
  condition: string;
  check: (documents: SubmittedDocument[]) => boolean;
  reasonFr: string;
  reasonEn: string;
  severity: 'warning' | 'rejection';
}

export interface CountryLegalFramework {
  countryCode: string;
  countryName: string;
  propertyTypesRequiringTF: string[];
  mandatoryDocs: Record<PropertyType, DocumentRequirement[]>;
  optionalDocs: Record<PropertyType, DocumentRequirement[]>;
  postReformRules: ReformRule[];
  autoRejectConditions: AutoRejectCondition[];
  registrationAuthority: string;
  averageProcessingTime: string;
  currency: string;
}

export interface SubmittedDocument {
  docType: string;
  format: DocFormat;
  issueDate?: string;
  issuingAuthority?: string;
  isValid?: boolean;
  expiryDate?: string;
  fileUrl?: string;
}

// ============ BÉNIN (BJ) — Post-2023 Reform ============

const beninMandatoryDocs: Record<PropertyType, DocumentRequirement[]> = {
  terrain: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'ANDF (Agence Nationale du Domaine Foncier)',
      notes: 'Obligatoire depuis la réforme foncière 2023 pour toutes les transactions immobilières',
    },
    {
      docType: 'acd',
      nameFr: 'Attestation de Détention Coutumière',
      nameEn: 'Customary Land Holding Certificate',
      mandatory: false,
      format: 'original',
      maxAgeMonths: 60,
      issuingAuthority: 'Autorités coutumières reconnues',
      notes: 'Seulement si le terrain n\'est pas encore titré (transition vers TF obligatoire)',
    },
    {
      docType: 'certificat_propriete_andf',
      nameFr: 'Certificat de Propriété ANDF',
      nameEn: 'ANDF Property Certificate',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 36,
      issuingAuthority: 'ANDF',
      notes: 'Inscription obligatoire au registre numérique ANDF',
    },
    {
      docType: 'certificat_urbanisme',
      nameFr: 'Certificat d\'Urbanisme',
      nameEn: 'Urban Planning Certificate',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 6,
      issuingAuthority: 'Mairie / Commune',
      notes: 'Indique les règles d\'urbanisme applicables au terrain',
    },
  ],
  villa: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'ANDF',
      notes: 'Réforme 2023: TF obligatoire pour toute vente immobilière',
    },
    {
      docType: 'permis_construire',
      nameFr: 'Permis de Construire',
      nameEn: 'Building Permit',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Mairie / Commune',
      notes: 'Obligatoire pour toute construction achevée',
    },
    {
      docType: 'certificat_conformite',
      nameFr: 'Certificat de Conformité',
      nameEn: 'Certificate of Conformity',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 60,
      issuingAuthority: 'Mairie / Commune',
      notes: 'Délivré après inspection de la construction',
    },
    {
      docType: 'certificat_propriete_andf',
      nameFr: 'Certificat de Propriété ANDF',
      nameEn: 'ANDF Property Certificate',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 36,
      issuingAuthority: 'ANDF',
    },
  ],
  appartement: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'ANDF',
    },
    {
      docType: 'permis_construire',
      nameFr: 'Permis de Construire',
      nameEn: 'Building Permit',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Mairie / Commune',
    },
    {
      docType: 'autorisation_lotissement',
      nameFr: 'Autorisation de Lotissement',
      nameEn: 'Subdivision Authorization',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Mairie / Direction de l\'Urbanisme',
      notes: 'Requis pour les copropriétés',
    },
    {
      docType: 'reglement_copropriete',
      nameFr: 'Règlement de Copropriété',
      nameEn: 'Co-ownership Regulations',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Notaire',
    },
  ],
  bureau: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'ANDF',
    },
    {
      docType: 'permis_construire',
      nameFr: 'Permis de Construire',
      nameEn: 'Building Permit',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Mairie / Commune',
    },
    {
      docType: 'certificat_conformite',
      nameFr: 'Certificat de Conformité',
      nameEn: 'Certificate of Conformity',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 60,
      issuingAuthority: 'Mairie / Commune',
    },
  ],
  commerce: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'ANDF',
    },
    {
      docType: 'permis_construire',
      nameFr: 'Permis de Construire',
      nameEn: 'Building Permit',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Mairie / Commune',
    },
    {
      docType: 'licence_commerciale',
      nameFr: 'Licence Commerciale',
      nameEn: 'Commercial License',
      mandatory: false,
      format: 'certified_copy',
      maxAgeMonths: 12,
      issuingAuthority: 'CCBM (Chambre de Commerce)',
    },
  ],
  chateau: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'ANDF',
    },
    {
      docType: 'permis_construire',
      nameFr: 'Permis de Construire',
      nameEn: 'Building Permit',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Mairie / Commune',
    },
  ],
  usine: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'ANDF',
    },
    {
      docType: 'permis_construire',
      nameFr: 'Permis de Construire',
      nameEn: 'Building Permit',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Mairie / Commune',
    },
    {
      docType: 'autorisation_exploitation',
      nameFr: 'Autorisation d\'Exploitation',
      nameEn: 'Operating Authorization',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Ministère de l\'Industrie',
    },
  ],
  entrepot: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'ANDF',
    },
    {
      docType: 'permis_construire',
      nameFr: 'Permis de Construire',
      nameEn: 'Building Permit',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Mairie / Commune',
    },
  ],
};

const beninOptionalDocs: Record<PropertyType, DocumentRequirement[]> = {
  terrain: [
    {
      docType: 'plan_cadastral',
      nameFr: 'Plan Cadastral',
      nameEn: 'Cadastral Plan',
      mandatory: false,
      format: 'certified_copy',
      issuingAuthority: 'Service du Cadastre',
    },
    {
      docType: 'rapport_geotechnique',
      nameFr: 'Rapport Géotechnique',
      nameEn: 'Geotechnical Report',
      mandatory: false,
      format: 'simple_copy',
      maxAgeMonths: 24,
      issuingAuthority: 'Bureau d\'Études agréé',
    },
  ],
  villa: [
    {
      docType: 'plan_architecte',
      nameFr: 'Plan d\'Architecte',
      nameEn: 'Architectural Plan',
      mandatory: false,
      format: 'simple_copy',
      issuingAuthority: 'Architecte agréé',
    },
  ],
  appartement: [
    {
      docType: 'etat_descriptif',
      nameFr: 'État Descriptif de Division',
      nameEn: 'Descriptive Division Statement',
      mandatory: false,
      format: 'certified_copy',
      issuingAuthority: 'Géomètre-expert',
    },
  ],
  bureau: [],
  commerce: [],
  chateau: [],
  usine: [],
  entrepot: [],
};

// ============ CÔTE D'IVOIRE (CI) ============

const coteIvoireMandatoryDocs: Record<PropertyType, DocumentRequirement[]> = {
  terrain: [
    {
      docType: 'acd',
      nameFr: 'Attestation de Coutume et de Détention',
      nameEn: 'Customary Attestation of Detention',
      mandatory: true,
      format: 'original',
      maxAgeMonths: 36,
      issuingAuthority: 'Village Chief / Sous-préfet',
      notes: 'Requis pour les terrains coutumiers en zone rurale',
    },
    {
      docType: 'lettre_attribution',
      nameFr: 'Lettre d\'Attribution',
      nameEn: 'Letter of Attribution',
      mandatory: false,
      format: 'certified_copy',
      issuingAuthority: 'DGI (Direction Générale des Impôts)',
      notes: 'Pour les terrains domaniaux',
    },
    {
      docType: 'arrete_concession',
      nameFr: 'Arrêté de Concession',
      nameEn: 'Concession Order',
      mandatory: false,
      format: 'certified_copy',
      issuingAuthority: 'Ministère de la Construction',
      notes: 'Pour les concessions domaniales',
    },
    {
      docType: 'certificat_foncier',
      nameFr: 'Certificat Foncier',
      nameEn: 'Land Certificate',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'DGI / Direction du Domaine Foncier',
      notes: 'Obligatoire depuis la loi de 2025 pour toute transaction',
    },
  ],
  villa: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'DGI',
    },
    {
      docType: 'certificat_propriete',
      nameFr: 'Certificat de Propriété',
      nameEn: 'Property Certificate',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 60,
      issuingAuthority: 'DGI',
    },
    {
      docType: 'permis_construire',
      nameFr: 'Permis de Construire',
      nameEn: 'Building Permit',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Mairie / Direction de la Construction',
    },
  ],
  appartement: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'DGI',
    },
    {
      docType: 'certificat_propriete',
      nameFr: 'Certificat de Propriété',
      nameEn: 'Property Certificate',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 60,
      issuingAuthority: 'DGI',
    },
    {
      docType: 'approbation_lotissement',
      nameFr: 'Approbation de Lotissement',
      nameEn: 'Subdivision Approval',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Direction de la Construction',
    },
  ],
  bureau: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'DGI',
    },
    {
      docType: 'certificat_propriete',
      nameFr: 'Certificat de Propriété',
      nameEn: 'Property Certificate',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 60,
      issuingAuthority: 'DGI',
    },
  ],
  commerce: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'DGI',
    },
    {
      docType: 'certificat_propriete',
      nameFr: 'Certificat de Propriété',
      nameEn: 'Property Certificate',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 60,
      issuingAuthority: 'DGI',
    },
  ],
  chateau: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'DGI',
    },
  ],
  usine: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'DGI',
    },
  ],
  entrepot: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'DGI',
    },
  ],
};

const coteIvoireOptionalDocs: Record<PropertyType, DocumentRequirement[]> = {
  terrain: [
    {
      docType: 'plan_cadastral',
      nameFr: 'Plan Cadastral',
      nameEn: 'Cadastral Plan',
      mandatory: false,
      format: 'certified_copy',
      issuingAuthority: 'Direction du Cadastre',
    },
  ],
  villa: [
    {
      docType: 'acte_notarie',
      nameFr: 'Acte Notarié',
      nameEn: 'Notarial Deed',
      mandatory: false,
      format: 'original',
      issuingAuthority: 'Notaire',
      notes: 'Recommandé pour les transactions > 10M FCFA',
    },
  ],
  appartement: [],
  bureau: [],
  commerce: [],
  chateau: [],
  usine: [],
  entrepot: [],
};

// ============ BURKINA FASO (BF) — RAF 2025 ============

const burkinaMandatoryDocs: Record<PropertyType, DocumentRequirement[]> = {
  terrain: [
    {
      docType: 'puh',
      nameFr: 'Permis Urbain d\'Habiter',
      nameEn: 'Urban Habitation Permit',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Direction de l\'Urbanisme',
      notes: 'RAF 2025 (art. 45-52): Type PUH pour terrains urbains — remplace les anciens titres',
    },
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Direction du Cadastre / CF',
      notes: 'Obligatoire pour la conversion définitive (art. 142 RAF 2025: APFR → TF dans 5 ans)',
    },
    {
      docType: 'apfr',
      nameFr: 'Attestation de Possession Foncière Rurale',
      nameEn: 'Rural Land Possession Certificate',
      mandatory: false,
      format: 'original',
      maxAgeMonths: 60,
      issuingAuthority: 'Commission foncière villageoise',
      notes: 'RAF 2025 (art. 85-98): Type APFR pour terrains ruraux — conversion en TF obligatoire sous 5 ans',
    },
    {
      docType: 'plan_cadastral_numerique',
      nameFr: 'Plan Cadastral Numérique',
      nameEn: 'Digital Cadastral Plan',
      mandatory: true,
      format: 'simple_copy',
      maxAgeMonths: 36,
      issuingAuthority: 'Direction du Cadastre (Système Numérique)',
      notes: 'RAF 2025 (art. 15-20): Inscription au cadastre numérique obligatoire depuis le 1er janvier 2025',
    },
    {
      docType: 'certificat_conformite_urbanisme',
      nameFr: 'Certificat de Conformité Urbanistique',
      nameEn: 'Urban Planning Conformity Certificate',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 6,
      issuingAuthority: 'Direction de l\'Urbanisme / Mairie',
      notes: 'RAF 2025 (art. 110): Conformité au plan d\'urbanisme obligatoire',
    },
  ],
  villa: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Direction du Cadastre / CF',
      notes: 'RAF 2025: TF obligatoire pour toute transaction immobilière',
    },
    {
      docType: 'permis_construire',
      nameFr: 'Permis de Construire',
      nameEn: 'Building Permit',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Mairie / Direction de l\'Urbanisme',
      notes: 'RAF 2025 (art. 130): Permis de construire obligatoire',
    },
    {
      docType: 'certificat_conformite',
      nameFr: 'Certificat de Conformité',
      nameEn: 'Certificate of Conformity',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 60,
      issuingAuthority: 'Mairie',
      notes: 'RAF 2025 (art. 135): Conformité de la construction obligatoire',
    },
    {
      docType: 'plan_cadastral_numerique',
      nameFr: 'Plan Cadastral Numérique',
      nameEn: 'Digital Cadastral Plan',
      mandatory: true,
      format: 'simple_copy',
      maxAgeMonths: 36,
      issuingAuthority: 'Direction du Cadastre (Système Numérique)',
      notes: 'RAF 2025: Cadastre numérique obligatoire',
    },
  ],
  appartement: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Direction du Cadastre / CF',
      notes: 'RAF 2025: TF obligatoire',
    },
    {
      docType: 'permis_construire',
      nameFr: 'Permis de Construire',
      nameEn: 'Building Permit',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Mairie / Direction de l\'Urbanisme',
      notes: 'RAF 2025 (art. 130): Permis de construire obligatoire',
    },
    {
      docType: 'certificat_conformite',
      nameFr: 'Certificat de Conformité',
      nameEn: 'Certificate of Conformity',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 60,
      issuingAuthority: 'Mairie',
      notes: 'RAF 2025 (art. 135): Conformité obligatoire',
    },
  ],
  bureau: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Direction du Cadastre / CF',
    },
    {
      docType: 'permis_construire',
      nameFr: 'Permis de Construire',
      nameEn: 'Building Permit',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Mairie / Direction de l\'Urbanisme',
    },
  ],
  commerce: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Direction du Cadastre / CF',
    },
  ],
  chateau: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Direction du Cadastre / CF',
    },
  ],
  usine: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Direction du Cadastre / CF',
    },
  ],
  entrepot: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Direction du Cadastre / CF',
    },
  ],
};

const burkinaOptionalDocs: Record<PropertyType, DocumentRequirement[]> = {
  terrain: [
    {
      docType: 'plan_cadastral',
      nameFr: 'Plan Cadastral Numérique',
      nameEn: 'Digital Cadastral Plan',
      mandatory: false,
      format: 'simple_copy',
      issuingAuthority: 'Direction du Cadastre',
      notes: 'Nouveau cadastre numérique 2025',
    },
  ],
  villa: [
    {
      docType: 'certificat_conformite',
      nameFr: 'Certificat de Conformité',
      nameEn: 'Certificate of Conformity',
      mandatory: false,
      format: 'certified_copy',
      maxAgeMonths: 60,
      issuingAuthority: 'Mairie',
    },
  ],
  appartement: [],
  bureau: [],
  commerce: [],
  chateau: [],
  usine: [],
  entrepot: [],
};

// ============ TOGO (TG) — CFD 2018 + DCCF 2025 ============

const togoMandatoryDocs: Record<PropertyType, DocumentRequirement[]> = {
  terrain: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Conservation Foncière',
      notes: 'CFD 2018 (art. 3): TF obligatoire pour toutes transactions immobilières',
    },
    {
      docType: 'acte_cession',
      nameFr: 'Acte de Cession',
      nameEn: 'Deed of Transfer',
      mandatory: true,
      format: 'original',
      maxAgeMonths: 12,
      issuingAuthority: 'Notaire',
      notes: 'DCCF 2025 (art. 15): Enregistrement obligatoire dans les 30 jours — pénalité 10% en cas de retard',
    },
    {
      docType: 'certificat_propriete_andf',
      nameFr: 'Certificat de Propriété ANDF',
      nameEn: 'ANDF Property Certificate',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 36,
      issuingAuthority: 'ANDF Togo',
      notes: 'DCCF 2025 (art. 22): Certificat ANDF obligatoire pour toute mutation',
    },
    {
      docType: 'certificat_foncier_droit',
      nameFr: 'Certificat Foncier de Droit (CFD)',
      nameEn: 'Land Right Certificate (CFD)',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Conservation Foncière',
      notes: 'DCCF 2025 (art. 8): CFD obligatoire comme titre intermédiaire en attendant le TF définitif',
    },
  ],
  villa: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Conservation Foncière',
      notes: 'DCCF 2025: TF obligatoire pour toute transaction immobilière',
    },
    {
      docType: 'permis_construire',
      nameFr: 'Permis de Construire',
      nameEn: 'Building Permit',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Mairie / Direction de l\'Urbanisme',
    },
    {
      docType: 'certificat_conformite',
      nameFr: 'Certificat de Conformité',
      nameEn: 'Certificate of Conformity',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 60,
      issuingAuthority: 'Mairie',
      notes: 'DCCF 2025: Conformité de la construction obligatoire',
    },
    {
      docType: 'acte_cession',
      nameFr: 'Acte de Cession',
      nameEn: 'Deed of Transfer',
      mandatory: true,
      format: 'original',
      maxAgeMonths: 12,
      issuingAuthority: 'Notaire',
      notes: 'DCCF 2025: Enregistrement obligatoire dans les 30 jours',
    },
  ],
  appartement: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Conservation Foncière',
      notes: 'DCCF 2025: TF obligatoire',
    },
    {
      docType: 'permis_construire',
      nameFr: 'Permis de Construire',
      nameEn: 'Building Permit',
      mandatory: true,
      format: 'certified_copy',
      issuingAuthority: 'Mairie / Direction de l\'Urbanisme',
    },
    {
      docType: 'acte_cession',
      nameFr: 'Acte de Cession',
      nameEn: 'Deed of Transfer',
      mandatory: true,
      format: 'original',
      maxAgeMonths: 12,
      issuingAuthority: 'Notaire',
      notes: 'DCCF 2025: Enregistrement obligatoire',
    },
  ],
  bureau: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Conservation Foncière',
    },
  ],
  commerce: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Conservation Foncière',
    },
  ],
  chateau: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Conservation Foncière',
    },
  ],
  usine: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Conservation Foncière',
    },
  ],
  entrepot: [
    {
      docType: 'titre_foncier',
      nameFr: 'Titre Foncier',
      nameEn: 'Land Title',
      mandatory: true,
      format: 'certified_copy',
      maxAgeMonths: 120,
      issuingAuthority: 'Conservation Foncière',
    },
  ],
};

const togoOptionalDocs: Record<PropertyType, DocumentRequirement[]> = {
  terrain: [
    {
      docType: 'plan_cadastral',
      nameFr: 'Plan Cadastral',
      nameEn: 'Cadastral Plan',
      mandatory: false,
      format: 'certified_copy',
      issuingAuthority: 'Service du Cadastre',
    },
  ],
  villa: [
    {
      docType: 'certificat_conformite',
      nameFr: 'Certificat de Conformité',
      nameEn: 'Certificate of Conformity',
      mandatory: false,
      format: 'certified_copy',
      maxAgeMonths: 60,
      issuingAuthority: 'Mairie',
    },
  ],
  appartement: [],
  bureau: [],
  commerce: [],
  chateau: [],
  usine: [],
  entrepot: [],
};

// ============ Auto-Reject Conditions ============

function makeBeninAutoRejectConditions(): AutoRejectCondition[] {
  return [
    {
      id: 'BJ-TF-MISSING',
      condition: 'Titre Foncier manquant pour vente immobilière',
      check: (docs: SubmittedDocument[]) => {
        return !docs.some(d => d.docType === 'titre_foncier' && d.isValid !== false);
      },
      reasonFr: 'Titre Foncier obligatoire pour toute transaction immobilière depuis la réforme 2023',
      reasonEn: 'Land Title mandatory for all real estate transactions since 2023 reform',
      severity: 'rejection',
    },
    {
      id: 'BJ-ANDF-MISSING',
      condition: 'Certificat ANDF manquant',
      check: (docs: SubmittedDocument[]) => {
        return !docs.some(d => d.docType === 'certificat_propriete_andf' && d.isValid !== false);
      },
      reasonFr: 'Inscription au registre numérique ANDF obligatoire',
      reasonEn: 'Registration in the ANDF digital registry is mandatory',
      severity: 'rejection',
    },
    {
      id: 'BJ-DOC-EXPIRED',
      condition: 'Document expiré',
      check: (docs: SubmittedDocument[]) => {
        const now = new Date();
        return docs.some(d => {
          if (!d.expiryDate) return false;
          return new Date(d.expiryDate) < now;
        });
      },
      reasonFr: 'Un ou plusieurs documents sont expirés',
      reasonEn: 'One or more documents have expired',
      severity: 'warning',
    },
    {
      id: 'BJ-WRONG-FORMAT',
      condition: 'Format de document incorrect',
      check: (docs: SubmittedDocument[]) => {
        // Check if any doc requiring certified_copy is only simple_copy
        return docs.some(d => d.format === 'simple_copy' && d.isValid === false);
      },
      reasonFr: 'Un document requiert une copie certifiée conforme',
      reasonEn: 'A document requires a certified copy',
      severity: 'warning',
    },
  ];
}

function makeCoteIvoireAutoRejectConditions(): AutoRejectCondition[] {
  return [
    {
      id: 'CI-TF-OR-CERT-MISSING',
      condition: 'Titre Foncier ou Certificat Foncier manquant',
      check: (docs: SubmittedDocument[]) => {
        const hasTF = docs.some(d => d.docType === 'titre_foncier' && d.isValid !== false);
        const hasCF = docs.some(d => d.docType === 'certificat_foncier' && d.isValid !== false);
        return !hasTF && !hasCF;
      },
      reasonFr: 'Titre Foncier ou Certificat Foncier obligatoire selon la loi 2025',
      reasonEn: 'Land Title or Land Certificate required per 2025 law',
      severity: 'rejection',
    },
    {
      id: 'CI-DOC-EXPIRED',
      condition: 'Document expiré',
      check: (docs: SubmittedDocument[]) => {
        const now = new Date();
        return docs.some(d => d.expiryDate ? new Date(d.expiryDate) < now : false);
      },
      reasonFr: 'Un ou plusieurs documents sont expirés',
      reasonEn: 'One or more documents have expired',
      severity: 'warning',
    },
    {
      id: 'CI-UNAUTHORIZED-ISSUER',
      condition: 'Émetteur non autorisé',
      check: (docs: SubmittedDocument[]) => {
        return docs.some(d => d.isValid === false);
      },
      reasonFr: 'Un document a été délivré par une autorité non reconnue',
      reasonEn: 'A document was issued by an unrecognized authority',
      severity: 'rejection',
    },
  ];
}

function makeBurkinaAutoRejectConditions(): AutoRejectCondition[] {
  return [
    {
      id: 'BF-TF-OR-PUH-MISSING',
      condition: 'Titre Foncier ou PUH/APFR manquant',
      check: (docs: SubmittedDocument[]) => {
        const hasTF = docs.some(d => d.docType === 'titre_foncier' && d.isValid !== false);
        const hasPUH = docs.some(d => d.docType === 'puh' && d.isValid !== false);
        const hasAPFR = docs.some(d => d.docType === 'apfr' && d.isValid !== false);
        return !hasTF && !hasPUH && !hasAPFR;
      },
      reasonFr: 'Titre Foncier, PUH ou APFR obligatoire selon le RAF 2025 (214 articles)',
      reasonEn: 'Land Title, PUH or APFR mandatory per RAF 2025 (214 articles)',
      severity: 'rejection',
    },
    {
      id: 'BF-DOC-EXPIRED',
      condition: 'Document expiré',
      check: (docs: SubmittedDocument[]) => {
        const now = new Date();
        return docs.some(d => d.expiryDate ? new Date(d.expiryDate) < now : false);
      },
      reasonFr: 'Un ou plusieurs documents sont expirés',
      reasonEn: 'One or more documents have expired',
      severity: 'warning',
    },
  ];
}

function makeTogoAutoRejectConditions(): AutoRejectCondition[] {
  return [
    {
      id: 'TG-TF-MISSING',
      condition: 'Titre Foncier manquant',
      check: (docs: SubmittedDocument[]) => {
        return !docs.some(d => d.docType === 'titre_foncier' && d.isValid !== false);
      },
      reasonFr: 'Titre Foncier obligatoire selon le CFD 2018',
      reasonEn: 'Land Title mandatory per CFD 2018',
      severity: 'rejection',
    },
    {
      id: 'TG-CESSION-NOT-REGISTERED',
      condition: 'Acte de cession non enregistré',
      check: (docs: SubmittedDocument[]) => {
        const hasCession = docs.some(d => d.docType === 'acte_cession' && d.isValid !== false);
        return !hasCession;
      },
      reasonFr: 'Acte de cession enregistré obligatoire selon le DCCF 2025 (art. 15) — pénalité 10% en cas de retard',
      reasonEn: 'Registered deed of transfer mandatory per DCCF 2025 (art. 15) — 10% penalty for late registration',
      severity: 'rejection',
    },
    {
      id: 'TG-CFD-MISSING',
      condition: 'Certificat Foncier de Droit (CFD) manquant',
      check: (docs: SubmittedDocument[]) => {
        const hasCFD = docs.some(d => d.docType === 'certificat_foncier_droit' && d.isValid !== false);
        const hasTF = docs.some(d => d.docType === 'titre_foncier' && d.isValid !== false);
        return !hasCFD && !hasTF;
      },
      reasonFr: 'Certificat Foncier de Droit (CFD) ou Titre Foncier obligatoire selon le DCCF 2025 (art. 8)',
      reasonEn: 'Land Right Certificate (CFD) or Land Title mandatory per DCCF 2025 (art. 8)',
      severity: 'rejection',
    },
    {
      id: 'TG-DOC-EXPIRED',
      condition: 'Document expiré',
      check: (docs: SubmittedDocument[]) => {
        const now = new Date();
        return docs.some(d => d.expiryDate ? new Date(d.expiryDate) < now : false);
      },
      reasonFr: 'Un ou plusieurs documents sont expirés',
      reasonEn: 'One or more documents have expired',
      severity: 'warning',
    },
  ];
}

// ============ Country Legal Frameworks ============

export const COUNTRY_FRAMEWORKS: Record<string, CountryLegalFramework> = {
  BJ: {
    countryCode: 'BJ',
    countryName: 'Bénin',
    propertyTypesRequiringTF: ['villa', 'appartement', 'bureau', 'commerce', 'terrain', 'chateau', 'usine', 'entrepot'],
    mandatoryDocs: beninMandatoryDocs,
    optionalDocs: beninOptionalDocs,
    postReformRules: [
      {
        id: 'BJ-2023-TF',
        name: 'Réforme Foncière 2023',
        effectiveDate: '2023-01-01',
        description: 'Obligation de Titre Foncier pour toutes les transactions immobilières. Registre numérique ANDF.',
        appliesTo: ['terrain', 'villa', 'appartement', 'bureau', 'commerce'],
        newRequirements: [
          { docType: 'titre_foncier', mandatory: true },
          { docType: 'certificat_propriete_andf', mandatory: true },
        ],
      },
    ],
    autoRejectConditions: makeBeninAutoRejectConditions(),
    registrationAuthority: 'ANDF (Agence Nationale du Domaine Foncier)',
    averageProcessingTime: '2-4 semaines',
    currency: 'XOF',
  },
  CI: {
    countryCode: 'CI',
    countryName: "Côte d'Ivoire",
    propertyTypesRequiringTF: ['villa', 'appartement', 'bureau', 'commerce'],
    mandatoryDocs: coteIvoireMandatoryDocs,
    optionalDocs: coteIvoireOptionalDocs,
    postReformRules: [
      {
        id: 'CI-2025-ACD',
        name: 'Loi ACD/ADU 2025',
        effectiveDate: '2025-01-01',
        description: 'Renforcement des exigences ACD et enregistrement DGI obligatoire. Acte notarié obligatoire.',
        appliesTo: ['terrain', 'villa', 'appartement'],
        newRequirements: [
          { docType: 'certificat_foncier', mandatory: true },
        ],
      },
    ],
    autoRejectConditions: makeCoteIvoireAutoRejectConditions(),
    registrationAuthority: 'DGI (Direction Générale des Impôts)',
    averageProcessingTime: '3-6 semaines',
    currency: 'XOF',
  },
  BF: {
    countryCode: 'BF',
    countryName: 'Burkina Faso',
    propertyTypesRequiringTF: ['villa', 'appartement', 'bureau', 'commerce', 'terrain'],
    mandatoryDocs: burkinaMandatoryDocs,
    optionalDocs: burkinaOptionalDocs,
    postReformRules: [
      {
        id: 'BF-2025-RAF',
        name: 'Réforme Agraire et Foncière 2025',
        effectiveDate: '2025-01-01',
        description: 'RAF 2025 — 214 articles. Types PUH (urbain) et APFR (rural). Cadastre numérique obligatoire. Conversion APFR → TF sous 5 ans (art. 142). Certificat de conformité obligatoire (art. 135).',
        appliesTo: ['terrain', 'villa', 'appartement', 'bureau'],
        newRequirements: [
          { docType: 'puh', mandatory: true },
          { docType: 'apfr', mandatory: false },
          { docType: 'plan_cadastral_numerique', mandatory: true },
          { docType: 'certificat_conformite', mandatory: true },
        ],
      },
    ],
    autoRejectConditions: makeBurkinaAutoRejectConditions(),
    registrationAuthority: 'Direction du Cadastre / Conservation Foncière',
    averageProcessingTime: '4-8 semaines',
    currency: 'XOF',
  },
  TG: {
    countryCode: 'TG',
    countryName: 'Togo',
    propertyTypesRequiringTF: ['villa', 'appartement', 'bureau', 'commerce', 'terrain'],
    mandatoryDocs: togoMandatoryDocs,
    optionalDocs: togoOptionalDocs,
    postReformRules: [
      {
        id: 'TG-2018-CFD',
        name: 'Code Foncier Domanial 2018',
        effectiveDate: '2018-01-01',
        description: 'CFD 2018: TF obligatoire pour toutes transactions. Conservation foncière renforcée.',
        appliesTo: ['terrain', 'villa', 'appartement', 'bureau', 'commerce'],
        newRequirements: [
          { docType: 'titre_foncier', mandatory: true },
        ],
      },
      {
        id: 'TG-2025-DCCF',
        name: 'Décret d\'Application du Code de la Construction et de l\'Habitat 2025',
        effectiveDate: '2025-01-01',
        description: 'DCCF 2025: Enregistrement obligatoire de tous les actes dans les 30 jours. CFD comme titre intermédiaire. Pénalité 10% pour retard d\'enregistrement. Mandatory registration enforcement.',
        appliesTo: ['terrain', 'villa', 'appartement', 'bureau', 'commerce'],
        newRequirements: [
          { docType: 'acte_cession', mandatory: true },
          { docType: 'certificat_foncier_droit', mandatory: true },
        ],
      },
    ],
    autoRejectConditions: makeTogoAutoRejectConditions(),
    registrationAuthority: 'Conservation Foncière',
    averageProcessingTime: '2-4 semaines',
    currency: 'XOF',
  },
};

export function getFramework(countryCode: string): CountryLegalFramework | undefined {
  return COUNTRY_FRAMEWORKS[countryCode];
}

export function getMandatoryDocs(countryCode: string, propertyType: PropertyType): DocumentRequirement[] {
  const framework = COUNTRY_FRAMEWORKS[countryCode];
  if (!framework) return [];
  return framework.mandatoryDocs[propertyType] || [];
}

export function getOptionalDocs(countryCode: string, propertyType: PropertyType): DocumentRequirement[] {
  const framework = COUNTRY_FRAMEWORKS[countryCode];
  if (!framework) return [];
  return framework.optionalDocs[propertyType] || [];
}
