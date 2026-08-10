// AfriBayit — Country-Specific Legal Document Requirements
// CDC §4.3 — Exigences documentaires par pays et type de bien
//
// Règles de documents obligatoires selon le pays et le type de bien immobilier :
// - BJ (Bénin) : terrain/villa, appartement
// - CI (Côte d'Ivoire) : terrain, bien bâti
// - BF (Burkina Faso) : terrain
// - TG (Togo) : tout bien

/** Types de pays supportés */
export type SupportedCountry = 'BJ' | 'CI' | 'BF' | 'TG';

/** Types de bien immobilier */
export type PropertyType = 'terrain' | 'villa' | 'appartement' | 'bien_bati' | 'bureau' | 'commerce' | 'tout_bien';

/** Type de document juridique */
export type DocType =
  | 'titre_foncier'
  | 'acd'
  | 'permis_construire'
  | 'autorisation_lotissement'
  | 'lettre_attribution'
  | 'arrete_concession'
  | 'certificat_propriete'
  | 'puh'
  | 'acte_cession'
  | 'certificat_andf';

/** Mode de combinaison des documents requis */
export type RequirementMode = 'OR' | 'AND';

/** Un groupe de documents requis (avec mode de combinaison) */
export interface DocRequirementGroup {
  /** Libellé descriptif en français */
  label: string;
  /** Mode de combinaison : OR = au moins un requis, AND = tous requis */
  mode: RequirementMode;
  /** Liste des types de documents dans ce groupe */
  docs: DocType[];
}

/** Résultat de la vérification des documents requis */
export interface RequiredDocsResult {
  /** Pays concerné */
  country: SupportedCountry;
  /** Type de bien */
  propertyType: PropertyType;
  /** Groupes de documents requis */
  requirements: DocRequirementGroup[];
  /** Liste plate de tous les types de documents possibles */
  allDocTypes: DocType[];
  /** Description en français des exigences */
  description: string;
}

// ============ LABELS EN FRANÇAIS ============

/** Libellés français pour chaque type de document */
export const DOC_LABELS: Record<DocType, string> = {
  titre_foncier: 'Titre Foncier',
  acd: 'Arrêté de Concession Définitive (ACD)',
  permis_construire: 'Permis de Construire',
  autorisation_lotissement: 'Autorisation de Lotissement',
  lettre_attribution: 'Lettre d\'Attribution',
  arrete_concession: 'Arrêté de Concession',
  certificat_propriete: 'Certificat de Propriété',
  puh: 'Permis Urbain d\'Habiter (PUH)',
  acte_cession: 'Acte de Cession',
  certificat_andf: 'Certificat ANDF (Agence Nationale de Domaine Foncier)',
};

// ============ EXIGENCES PAR PAYS ET TYPE DE BIEN ============

/**
 * Bénin — terrain ou villa :
 *   Titre Foncier OR ACD
 */
const BJ_TERRAIN_VILLA: DocRequirementGroup[] = [
  {
    label: 'Justificatif de propriété (Bénin - Terrain/Villa)',
    mode: 'OR',
    docs: ['titre_foncier', 'acd'],
  },
];

/**
 * Bénin — appartement :
 *   Titre Foncier + Permis de Construire + Autorisation de Lotissement
 */
const BJ_APPARTEMENT: DocRequirementGroup[] = [
  {
    label: 'Justificatif de propriété (Bénin - Appartement)',
    mode: 'AND',
    docs: ['titre_foncier', 'permis_construire', 'autorisation_lotissement'],
  },
];

/**
 * Côte d'Ivoire — terrain :
 *   Lettre d'Attribution OR (ACD + Arrêté de Concession)
 */
const CI_TERRAIN: DocRequirementGroup[] = [
  {
    label: 'Justificatif de propriété (Côte d\'Ivoire - Terrain) — Option A',
    mode: 'OR',
    docs: ['lettre_attribution'],
  },
  {
    label: 'Justificatif de propriété (Côte d\'Ivoire - Terrain) — Option B',
    mode: 'AND',
    docs: ['acd', 'arrete_concession'],
  },
];

/**
 * Côte d'Ivoire — bien bâti :
 *   Titre Foncier + Certificat de Propriété
 */
const CI_BIEN_BATI: DocRequirementGroup[] = [
  {
    label: 'Justificatif de propriété (Côte d\'Ivoire - Bien Bâti)',
    mode: 'AND',
    docs: ['titre_foncier', 'certificat_propriete'],
  },
];

/**
 * Burkina Faso — terrain :
 *   PUH OR Titre Foncier
 */
const BF_TERRAIN: DocRequirementGroup[] = [
  {
    label: 'Justificatif de propriété (Burkina Faso - Terrain)',
    mode: 'OR',
    docs: ['puh', 'titre_foncier'],
  },
];

/**
 * Togo — tout bien :
 *   Titre Foncier OR (Acte de Cession + Certificat ANDF)
 */
const TG_TOUT_BIEN: DocRequirementGroup[] = [
  {
    label: 'Justificatif de propriété (Togo - Tout Bien) — Option A',
    mode: 'OR',
    docs: ['titre_foncier'],
  },
  {
    label: 'Justificatif de propriété (Togo - Tout Bien) — Option B',
    mode: 'AND',
    docs: ['acte_cession', 'certificat_andf'],
  },
];

// ============ TABLE DE CORRESPONDANCE ============

type CountryPropertyKey = `${SupportedCountry}_${string}`;

/** Table de correspondance pays + type de bien → exigences documentaires */
const REQUIREMENTS_MAP: Record<CountryPropertyKey, DocRequirementGroup[]> = {
  BJ_terrain: BJ_TERRAIN_VILLA,
  BJ_villa: BJ_TERRAIN_VILLA,
  BJ_appartement: BJ_APPARTEMENT,
  CI_terrain: CI_TERRAIN,
  CI_bien_bati: CI_BIEN_BATI,
  BF_terrain: BF_TERRAIN,
  TG_tout_bien: TG_TOUT_BIEN,
};

/** Alias de types de bien pour la résolution */
const PROPERTY_TYPE_ALIASES: Record<PropertyType, PropertyType[]> = {
  terrain: ['terrain'],
  villa: ['villa'],
  appartement: ['appartement'],
  bien_bati: ['bien_bati'],
  bureau: ['bien_bati'],     // bureau → traité comme bien bâti
  commerce: ['bien_bati'],   // commerce → traité comme bien bâti
  tout_bien: ['tout_bien'],
};

// ============ FONCTIONS PUBLIQUES ============

/**
 * Récupère les documents requis pour un pays et un type de bien donnés.
 *
 * @param country - Code pays (BJ, CI, BF, TG)
 * @param propertyType - Type de bien immobilier
 * @returns Objet contenant les exigences documentaires
 *
 * @example
 * // Bénin - Terrain
 * const docs = getRequiredDocs('BJ', 'terrain');
 * // → requirements: [{ mode: 'OR', docs: ['titre_foncier', 'acd'] }]
 *
 * // Bénin - Appartement
 * const docs = getRequiredDocs('BJ', 'appartement');
 * // → requirements: [{ mode: 'AND', docs: ['titre_foncier', 'permis_construire', 'autorisation_lotissement'] }]
 *
 * // Côte d'Ivoire - Terrain
 * const docs = getRequiredDocs('CI', 'terrain');
 * // → requirements: [{ mode: 'OR', docs: ['lettre_attribution'] }, { mode: 'AND', docs: ['acd', 'arrete_concession'] }]
 *
 * // Togo - Tout bien
 * const docs = getRequiredDocs('TG', 'tout_bien');
 * // → requirements: [{ mode: 'OR', docs: ['titre_foncier'] }, { mode: 'AND', docs: ['acte_cession', 'certificat_andf'] }]
 */
export function getRequiredDocs(
  country: SupportedCountry,
  propertyType: PropertyType
): RequiredDocsResult {
  // Tentative de résolution directe
  const key: CountryPropertyKey = `${country}_${propertyType}`;
  let requirements = REQUIREMENTS_MAP[key] ?? null;

  // Si pas trouvé, essayer les alias
  if (!requirements) {
    const aliases = PROPERTY_TYPE_ALIASES[propertyType] ?? [propertyType];
    for (const alias of aliases) {
      const aliasKey: CountryPropertyKey = `${country}_${alias}`;
      requirements = REQUIREMENTS_MAP[aliasKey] ?? null;
      if (requirements) break;
    }
  }

  // Si toujours pas trouvé, exigence par défaut : Titre Foncier requis
  if (!requirements) {
    requirements = [
      {
        label: `Justificatif de propriété par défaut (${country} - ${propertyType})`,
        mode: 'OR' as RequirementMode,
        docs: ['titre_foncier' as DocType],
      },
    ];
  }

  // Calculer la liste plate de tous les types de documents
  const allDocTypes = [...new Set(requirements.flatMap(r => r.docs))];

  // Construire la description en français
  const description = buildDescription(country, propertyType, requirements);

  return {
    country,
    propertyType,
    requirements,
    allDocTypes,
    description,
  };
}

/**
 * Vérifie si un ensemble de documents soumis satisfait les exigences
 * pour un pays et un type de bien donnés.
 *
 * @param country - Code pays
 * @param propertyType - Type de bien
 * @param submittedDocs - Liste des types de documents soumis
 * @returns true si les exigences sont satisfaites, false sinon
 */
export function validateDocRequirements(
  country: SupportedCountry,
  propertyType: PropertyType,
  submittedDocs: DocType[]
): { satisfied: boolean; missingGroups: DocRequirementGroup[] } {
  const { requirements } = getRequiredDocs(country, propertyType);
  const submittedSet = new Set(submittedDocs);
  const missingGroups: DocRequirementGroup[] = [];

  for (const group of requirements) {
    const groupSatisfied = checkGroupSatisfied(group, submittedSet);
    if (!groupSatisfied) {
      missingGroups.push(group);
    }
  }

  return {
    satisfied: missingGroups.length === 0,
    missingGroups,
  };
}

/**
 * Vérifie si un groupe de documents est satisfait.
 * - Mode OR : au moins un document du groupe est présent
 * - Mode AND : tous les documents du groupe sont présents
 */
function checkGroupSatisfied(
  group: DocRequirementGroup,
  submittedSet: Set<DocType>
): boolean {
  if (group.mode === 'OR') {
    return group.docs.some(doc => submittedSet.has(doc));
  }
  // AND
  return group.docs.every(doc => submittedSet.has(doc));
}

/**
 * Construit une description en français des exigences documentaires.
 */
function buildDescription(
  country: string,
  propertyType: string,
  requirements: DocRequirementGroup[]
): string {
  const countryNames: Record<string, string> = {
    BJ: 'Bénin',
    CI: 'Côte d\'Ivoire',
    BF: 'Burkina Faso',
    TG: 'Togo',
  };

  const propertyTypeLabels: Record<string, string> = {
    terrain: 'Terrain',
    villa: 'Villa',
    appartement: 'Appartement',
    bien_bati: 'Bien bâti',
    bureau: 'Bureau',
    commerce: 'Commerce',
    tout_bien: 'Tout bien',
  };

  const countryName = countryNames[country] || country;
  const propLabel = propertyTypeLabels[propertyType] || propertyType;

  const groupDescriptions = requirements.map(group => {
    const docLabels = group.docs.map(d => DOC_LABELS[d]).join(', ');
    const connector = group.mode === 'OR' ? 'ou' : 'et';
    return `${docLabels} (${connector})`;
  });

  return `Documents requis pour ${propLabel} en ${countryName} : ${groupDescriptions.join(' ; ')}`;
}

/**
 * Récupère le libellé français d'un type de document.
 */
export function getDocLabel(docType: DocType): string {
  return DOC_LABELS[docType] || docType;
}

/**
 * Récupère toutes les exigences documentaires pour un pays donné.
 */
export function getAllRequirementsForCountry(
  country: SupportedCountry
): Record<string, RequiredDocsResult> {
  const results: Record<string, RequiredDocsResult> = {};
  const propertyTypes: PropertyType[] = ['terrain', 'villa', 'appartement', 'bien_bati', 'tout_bien'];

  for (const pt of propertyTypes) {
    const key = `${country}_${pt}`;
    if (REQUIREMENTS_MAP[key as CountryPropertyKey]) {
      results[pt] = getRequiredDocs(country, pt);
    }
  }

  return results;
}
