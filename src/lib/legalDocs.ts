/**
 * Matrice des documents fonciers légaux par pays — CDC §10B
 * BJ (Bénin) | CI (Côte d'Ivoire) | BF (Burkina Faso) | TG (Togo)
 *
 * Status:
 *  ACCEPTED     → Validé automatiquement, procédure standard 24-72h
 *  CONDITIONAL  → Transmis au Country Admin pour validation humaine
 *  REJECTED     → Rejet automatique immédiat
 */

export type DocStatus = "ACCEPTED" | "CONDITIONAL" | "REJECTED";

export interface LegalDocInfo {
  code: string;
  label: string;
  status: DocStatus;
  authority: string;   // Organisme délivrant le document
  note: string;        // Condition ou explication
}

export type CountryCode = "BJ" | "CI" | "BF" | "TG";

const BJ_DOCS: LegalDocInfo[] = [
  {
    code: "TITRE_FONCIER",
    label: "Titre Foncier (TF)",
    status: "ACCEPTED",
    authority: "ANDF / BCDF",
    note: "Preuve absolue de propriété — prioritaire depuis la réforme du 15/08/2023.",
  },
  {
    code: "ADC",
    label: "Attestation de Détention Coutumière (ADC)",
    status: "ACCEPTED",
    authority: "Mairie après enquête contradictoire",
    note: "Accepté uniquement avec levé topographique par géomètre agréé.",
  },
  {
    code: "ATTESTATION_RECASEMENT",
    label: "Attestation de Recasement",
    status: "ACCEPTED",
    authority: "Mairie",
    note: "Accepté pour les zones loties uniquement.",
  },
  {
    code: "CERTIFICAT_INSCRIPTION_ANDF",
    label: "Certificat d'inscription ANDF/BCDF",
    status: "ACCEPTED",
    authority: "ANDF",
    note: "Acte de présomption moderne.",
  },
  {
    code: "DECISION_JUSTICE",
    label: "Décision de justice définitive",
    status: "ACCEPTED",
    authority: "Tribunaux",
    note: "Force probante équivalente au titre foncier.",
  },
  {
    code: "AVIS_IMPOSITION",
    label: "Avis d'imposition (3 dernières années)",
    status: "CONDITIONAL",
    authority: "DGI",
    note: "Accepté uniquement en complément d'un autre acte présomptif. Validation Country Admin requise.",
  },
  {
    code: "PERMIS_HABITER",
    label: "Permis d'habiter",
    status: "CONDITIONAL",
    authority: "Mairie (ancienne délivrance)",
    note: "Accepté pour transformation en TF uniquement. Validation Country Admin requise.",
  },
  {
    code: "CONVENTION_NOTARIEE",
    label: "Convention de vente notariée (seule)",
    status: "REJECTED",
    authority: "Notaire",
    note: "INSUFFISANTE depuis le 15/08/2023. La convention seule sans TF est réputée nulle.",
  },
  {
    code: "CONVENTION_MAIRE",
    label: "Convention de vente affirmée par le maire",
    status: "REJECTED",
    authority: "Mairie",
    note: "NUL ET NON AVENU depuis le 15/08/2023. Refus catégorique.",
  },
];

const CI_DOCS: LegalDocInfo[] = [
  {
    code: "TITRE_FONCIER",
    label: "Titre Foncier (TF)",
    status: "ACCEPTED",
    authority: "Conservation Foncière",
    note: "Preuve ultime de propriété.",
  },
  {
    code: "ACD",
    label: "Arrêté de Concession Définitive (ACD)",
    status: "ACCEPTED",
    authority: "Ministère de la Construction",
    note: "Seul acte conférant la pleine propriété d'un terrain urbain — délivré en max 6 mois.",
  },
  {
    code: "ADU",
    label: "Attestation de Droit d'Usage Coutumier (ADU)",
    status: "ACCEPTED",
    authority: "AFOR",
    note: "Nouveau document obligatoire en zone rurale depuis janvier 2025.",
  },
  {
    code: "CERTIFICAT_FONCIER_RURAL",
    label: "Certificat Foncier Rural (ancien)",
    status: "CONDITIONAL",
    authority: "AFOR",
    note: "Accepté en période de transition. Vérifier date et statut AFOR. Validation Country Admin requise.",
  },
  {
    code: "LETTRE_ATTRIBUTION",
    label: "Lettre d'Attribution",
    status: "CONDITIONAL",
    authority: "Administration",
    note: "Accepté uniquement si accompagné d'une procédure ACD en cours. Validation Country Admin requise.",
  },
  {
    code: "APPROBATION_LOTISSEMENT",
    label: "Approbation de lotissement",
    status: "CONDITIONAL",
    authority: "Ministère de la Construction",
    note: "Accepté en complément du TF ou ACD. Validation Country Admin requise.",
  },
  {
    code: "ATTESTATION_VILLAGIOISE",
    label: "Attestation villagioise",
    status: "REJECTED",
    authority: "Village / Chefferie",
    note: "REFUSÉE seule — insuffisante sans ACD ou TF en cours.",
  },
];

const BF_DOCS: LegalDocInfo[] = [
  {
    code: "TITRE_FONCIER",
    label: "Titre Foncier (TF)",
    status: "ACCEPTED",
    authority: "DGI / Ministère Urbanisme",
    note: "Acte de propriété de référence — tout type urbain.",
  },
  {
    code: "PUH",
    label: "Permis Urbain d'Habiter (PUH)",
    status: "ACCEPTED",
    authority: "Mairie / Ministère Urbanisme",
    note: "Document de référence en zone urbaine et péri-urbaine.",
  },
  {
    code: "APFR",
    label: "Attestation de Possession Foncière Rurale (APFR)",
    status: "ACCEPTED",
    authority: "DGI",
    note: "Nouveau document RAF 2025 — reconnaît les droits coutumiers ruraux.",
  },
  {
    code: "BAIL_EMPHYTEOTIQUE",
    label: "Bail emphytéotique",
    status: "ACCEPTED",
    authority: "Notaire / Administration",
    note: "Durée 18 à 99 ans — redevances annuelles stables. RAF 2025 art. 102.",
  },
  {
    code: "ARRETE_MORCELLEMENT",
    label: "Arrêté de morcellement",
    status: "CONDITIONAL",
    authority: "Mairie / Urbanisme",
    note: "Accepté en complément du TF ou PUH. Validation Country Admin requise.",
  },
  {
    code: "CONVENTION_VENTE",
    label: "Convention de vente simple",
    status: "REJECTED",
    authority: "—",
    note: "INSUFFISANTE seule — aucune valeur juridique sans acte foncier officiel.",
  },
];

const TG_DOCS: LegalDocInfo[] = [
  {
    code: "TITRE_FONCIER",
    label: "Titre Foncier (TF)",
    status: "ACCEPTED",
    authority: "ANDF + DCCF (OTR)",
    note: "Unique preuve de propriété — art. 256 CFD 2018. Définitif, intangible, inattaquable.",
  },
  {
    code: "ACTE_CESSION_NOTARIE",
    label: "Acte de cession notarié + immatriculation prouvée",
    status: "ACCEPTED",
    authority: "Notaire + DCCF",
    note: "Accepté uniquement si l'immatriculation préalable est prouvée (art. 161-162 CFD).",
  },
  {
    code: "DECISION_JUSTICE",
    label: "Décision de justice définitive",
    status: "ACCEPTED",
    authority: "Tribunaux",
    note: "Force probante équivalente au titre foncier.",
  },
  {
    code: "CERTIFICAT_PROPRIETE_ANCIEN",
    label: "Certificat de propriété (ancien régime, avant 2018)",
    status: "CONDITIONAL",
    authority: "DCCF",
    note: "Accepté avec validation DCCF — vérifier cas par cas. Validation Country Admin requise.",
  },
  {
    code: "AVIS_PERTE_TF",
    label: "Avis de perte de titre foncier (publié)",
    status: "CONDITIONAL",
    authority: "OTR",
    note: "Accepté provisoirement avec justificatif OTR. Validation Country Admin requise.",
  },
  {
    code: "CONVENTION_VENTE",
    label: "Convention de vente seule",
    status: "REJECTED",
    authority: "—",
    note: "INVALIDE — art. 161-162 CFD Togo : nulle sans immatriculation préalable.",
  },
];

/** Matrice complète pays → documents */
export const LEGAL_DOCS_BY_COUNTRY: Record<CountryCode, LegalDocInfo[]> = {
  BJ: BJ_DOCS,
  CI: CI_DOCS,
  BF: BF_DOCS,
  TG: TG_DOCS,
};

/**
 * Validates a document type against a country's legal matrix.
 * Returns the DocInfo if found, null if country not in Phase 1.
 */
export function validateLegalDoc(
  country: string,
  docCode: string
): { found: boolean; info: LegalDocInfo | null } {
  const docs = LEGAL_DOCS_BY_COUNTRY[country as CountryCode];
  if (!docs) return { found: false, info: null };

  const info = docs.find((d) => d.code === docCode) ?? null;
  return { found: true, info };
}

/** Returns all valid doc codes for a country */
export function getAcceptedDocCodes(country: string): string[] {
  const docs = LEGAL_DOCS_BY_COUNTRY[country as CountryCode] ?? [];
  return docs.filter((d) => d.status !== "REJECTED").map((d) => d.code);
}
