/**
 * AfriBayit — Deed Generator
 * Auto-fill deed templates with transaction data and AI-drafted sections
 */

import { type DeedTemplate, getTemplateById } from './deed-templates';

export interface TransactionData {
  transactionId: string;
  propertyId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  country: string;
  propertyType: string;
  transactionType: string;
  // Property details
  propertyAddress?: string;
  propertyQuartier?: string;
  propertyCity?: string;
  propertySurface?: number;
  propertyDescription?: string;
  titreFoncierNumber?: string;
  acdNumber?: string;
  apfrNumber?: string;
  puhNumber?: string;
  acteCessionNumber?: string;
  certificatFoncierNumber?: string;
  andfCertificateNumber?: string;
  // Buyer details
  buyerFullName?: string;
  buyerBirthDate?: string;
  buyerBirthPlace?: string;
  buyerNationality?: string;
  buyerProfession?: string;
  buyerAddress?: string;
  buyerIdNumber?: string;
  // Seller details
  sellerFullName?: string;
  sellerBirthDate?: string;
  sellerBirthPlace?: string;
  sellerNationality?: string;
  sellerProfession?: string;
  sellerAddress?: string;
  sellerIdNumber?: string;
  // Notary details
  notaryName?: string;
  notaryCity?: string;
  notaryChamber?: string;
  notaryAddress?: string;
  // Payment details
  paymentMethod?: string;
  escrowAccountNumber?: string;
  // Additional
  [key: string]: string | number | undefined;
}

export interface GeneratedDeed {
  id: string;
  templateId: string;
  transactionId: string;
  country: string;
  deedType: string;
  title: string;
  sections: {
    id: string;
    title: string;
    content: string;
    aiGenerated: boolean;
  }[];
  generatedAt: string;
  status: 'draft' | 'review' | 'pending_signature' | 'signed' | 'registered';
}

/**
 * Convert number to French words (simplified for FCFA amounts)
 */
function numberToFrenchWords(n: number): string {
  if (n === 0) return 'zéro';
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

  if (n < 10) return units[n];
  if (n < 20) return teens[n - 10];
  if (n < 70) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    return u === 1 ? `${tens[t]} et un` : `${tens[t]}${u ? '-' + units[u] : ''}`;
  }
  if (n < 100) {
    const u = n - 60;
    return `soixante${u < 10 ? '-' + units[u] : '-' + teens[u - 10]}`;
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const hStr = h === 1 ? 'cent' : `${units[h]} cent`;
    return rest ? `${hStr} ${numberToFrenchWords(rest)}` : hStr;
  }
  if (n < 1000000) {
    const th = Math.floor(n / 1000);
    const rest = n % 1000;
    const thStr = th === 1 ? 'mille' : `${numberToFrenchWords(th)} mille`;
    return rest ? `${thStr} ${numberToFrenchWords(rest)}` : thStr;
  }
  if (n < 1000000000) {
    const m = Math.floor(n / 1000000);
    const rest = n % 1000000;
    const mStr = `${numberToFrenchWords(m)} million${m > 1 ? 's' : ''}`;
    return rest ? `${mStr} ${numberToFrenchWords(rest)}` : mStr;
  }
  return n.toLocaleString('fr-FR');
}

/**
 * Format date in French notarial notation
 */
function formatDateNotation(date?: Date): string {
  const d = date || new Date();
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  return `le ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Generate a deed draft from a template and transaction data
 */
export async function generateDeedDraft(
  transactionId: string,
  templateId: string,
  data: TransactionData
): Promise<GeneratedDeed> {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template non trouvé: ${templateId}`);
  }

  // Build placeholder values from transaction data
  const values: Record<string, string> = {
    year: new Date().getFullYear().toString(),
    dateNotation: formatDateNotation(),
    notaryName: data.notaryName || '[NOM DU NOTAIRE]',
    notaryCity: data.notaryCity || data.propertyCity || '[VILLE]',
    notaryChamber: data.notaryChamber || '[CHAMBRE DES NOTAIRES]',
    notaryAddress: data.notaryAddress || '[ADRESSE ÉTUDE]',
    sellerFullName: data.sellerFullName || '[NOM DU VENDEUR]',
    sellerBirthDate: data.sellerBirthDate || '[DATE DE NAISSANCE]',
    sellerBirthPlace: data.sellerBirthPlace || '[LIEU DE NAISSANCE]',
    sellerNationality: data.sellerNationality || '[NATIONALITÉ]',
    sellerProfession: data.sellerProfession || '[PROFESSION]',
    sellerAddress: data.sellerAddress || '[ADRESSE]',
    sellerIdNumber: data.sellerIdNumber || '[N° PIÈCE]',
    sellerCINumber: '[N° CI]',
    buyerFullName: data.buyerFullName || '[NOM DE L\'ACQUÉREUR]',
    buyerBirthDate: data.buyerBirthDate || '[DATE DE NAISSANCE]',
    buyerBirthPlace: data.buyerBirthPlace || '[LIEU DE NAISSANCE]',
    buyerNationality: data.buyerNationality || '[NATIONALITÉ]',
    buyerProfession: data.buyerProfession || '[PROFESSION]',
    buyerAddress: data.buyerAddress || '[ADRESSE]',
    buyerIdNumber: data.buyerIdNumber || '[N° PIÈCE]',
    propertyDescription: data.propertyDescription || '[DESCRIPTION DU BIEN]',
    propertyAddress: data.propertyAddress || '[ADRESSE DU BIEN]',
    propertyQuartier: data.propertyQuartier || '[QUARTIER]',
    propertyCity: data.propertyCity || '[VILLE]',
    propertyDepartment: '[DÉPARTEMENT]',
    propertySurface: data.propertySurface?.toString() || '[SUPERFICIE]',
    propertySurfaceLetters: data.propertySurface ? numberToFrenchWords(data.propertySurface) : '[SUPERFICIE EN LETTRES]',
    propertyBuiltDescription: '[DESCRIPTION DU BÂTI]',
    titreFoncierNumber: data.titreFoncierNumber || '[N° TITRE FONCIER]',
    titreFoncierDate: '[DATE TF]',
    acdNumber: data.acdNumber || '[N° ACD]',
    acdDate: '[DATE ACD]',
    apfrNumber: data.apfrNumber || '[N° APFR]',
    puhNumber: data.puhNumber || '[N° PUH]',
    acteCessionNumber: data.acteCessionNumber || '[N° ACTE DE CESSION]',
    acteCessionDate: '[DATE ACTE DE CESSION]',
    certificatFoncierNumber: data.certificatFoncierNumber || '[N° CERTIFICAT FONCIER]',
    andfCertificateNumber: data.andfCertificateNumber || '[N° CERT. ANDF]',
    andfCertificateDate: '[DATE CERT. ANDF]',
    conservationFonciereCity: data.propertyCity || '[VILLE CONSERVATION]',
    livreFoncierNumber: '[N° LIVRE FONCIER]',
    andfDigitalRef: `[ANDF-${Date.now().toString(36).toUpperCase()}]`,
    priceAmount: data.amount?.toLocaleString('fr-FR') || '[MONTANT]',
    priceAmountLetters: data.amount ? numberToFrenchWords(Math.round(data.amount)) : '[MONTANT EN LETTRES]',
    paymentMethod: data.paymentMethod || '[MODE DE PAIEMENT]',
    paymentConditions: '[CONDITIONS DE PAIEMENT]',
    escrowAccountNumber: data.escrowAccountNumber || '[N° COMPTE SÉQUESTRE]',
    registrationFees: '[DROITS DE MUTATION]',
    registrationFeesPayer: 'acquéreur',
    ownershipOrigin: '[ORIGINE DE PROPRIÉTÉ]',
    chargesAndConditions: '[CHARGES ET CONDITIONS]',
    servitudesDescription: '[SERVITUDES]',
    terrainType: '[TYPE DE TERRAIN]',
    commissionVillageoise: '[COMMISSION VILLAGEOISE]',
    bailDuration: '[DURÉE DU BAIL]',
    paymentFrequency: 'à terme échu chaque début de mois',
    cautionAmount: '[MONTANT CAUTION]',
    cautionMonths: '3',
    bailDestination: '[DESTINATION DES LIEUX]',
    donationConditions: '[CONDITIONS DE LA DONATION]',
    pasDePorte: '0',
    buyerBusinessActivity: '[ACTIVITÉ COMMERCIALE]',
    buyerCINumber: '[N° CI]',
  };

  // Try AI generation for aiGenerated sections
  let aiSections: Record<string, string> = {};
  try {
    aiSections = await generateAISections(template, data);
  } catch {
    // AI generation failed, use fallback content
    aiSections = {};
  }

  // Fill template sections
  const filledSections = template.sections.map(section => {
    let content = section.content;

    // Replace placeholders
    for (const [key, value] of Object.entries(values)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, value);
    }

    // Use AI-generated content if available
    if (section.aiGenerated && aiSections[section.id]) {
      content = aiSections[section.id];
    }

    return {
      id: section.id,
      title: section.title,
      content,
      aiGenerated: section.aiGenerated,
    };
  });

  return {
    id: `deed-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    templateId,
    transactionId,
    country: template.country,
    deedType: template.deedType,
    title: template.nameFr,
    sections: filledSections,
    generatedAt: new Date().toISOString(),
    status: 'draft',
  };
}

/**
 * Use AI to draft deed sections
 * In production, this would use z-ai-web-dev-sdk
 */
async function generateAISections(
  template: DeedTemplate,
  data: TransactionData
): Promise<Record<string, string>> {
  // In production, we would call the AI SDK here
  // For now, return enhanced fallback content based on template type
  const result: Record<string, string> = {};

  if (template.country === 'BJ') {
    if (template.deedType === 'acte_vente_tf') {
      result['bj-vente-declarations'] = `DÉCLARATIONS DU VENDEUR :

Le vendeur déclare :
1. Être seul et unique propriétaire du bien vendu, sans aucun droit d'usufruit, servitude ou occupation litigieuse ;
2. Que le bien est libre de toute hypothèque, saisie ou contestation ;
3. Que le Titre Foncier n° ${data.titreFoncierNumber || '[N° TF]'} est authentique et conforme au registre ANDF ;
4. Qu'il n'existe aucun litige ni procédure en cours concernant le bien ;
5. Que les impôts fonciers et taxes afférents ont été acquittés jusqu'à ce jour ;
6. Que le bien n'est pas situé en zone inondable ou à risque, à sa connaissance ;
7. Que le certificat de propriété ANDF est valide et à jour.`;

      result['bj-vente-garanties'] = `GARANTIES :

Le vendeur garantit l'acquéreur contre toutes les évictions, troubles ou revendications conformément aux articles 1628 et suivants du Code Civil.

CHARGES ET CONDITIONS :
Le bien est vendu en l'état, sans garantie de conformité sauf vice caché.

SERVITUDES :
Les servitudes apparentes et non apparentes existantes sont celles résultant du titre foncier et de la réglementation d'urbanisme en vigueur.

L'acquéreur déclare avoir visité le bien et en connaître l'état.`;

      result['bj-vente-clauses'] = `CLAUSES SPÉCIALES :

1. Enregistrement ANDF : L'acquéreur s'engage à faire enregistrer la mutation auprès de l'ANDF dans un délai de 30 jours suivant la signature de l'acte, conformément à la réforme foncière 2023.

2. Attestation de mutation : Le notaire dressera l'attestation de mutation dans les formes légales et la transmettra à la Conservation Foncière.

3. Droits d'enregistrement : Les droits d'enregistrement et de mutation sont à la charge de l'acquéreur, sauf convention contraire.

4. Publicité foncière : Le présent acte sera publié au service de la publicité foncière dans les délais légaux.

5. Réforme 2023 : Conformément à la réforme foncière de 2023, le présent acte est enregistré dans le registre numérique ANDF.

6. Clause résolutoire : À défaut de paiement du prix dans les délais convenus, la vente sera résolue de plein droit sans mise en demeure préalable.`;
    }
  }

  if (template.country === 'CI') {
    result['ci-vente-clauses'] = `Conformément à la loi ACD/ADU 2025 :
1. Enregistrement DGI : L'acte doit être enregistré à la Direction Générale des Impôts dans les 30 jours.
2. Certificat foncier : Obligatoire selon la loi 2025, n° ${data.certificatFoncierNumber || '[N°]'}.
3. Droits de mutation : Calculés selon le barème DGI en vigueur.
4. Publicité foncière : Publication à la Conservation Foncière obligatoire.
5. Acte notarié : Requis pour toute transaction supérieure à 10M FCFA.`;
  }

  if (template.country === 'BF') {
    result['bf-vente-clauses'] = `Conformément au RAF 2025 (214 articles) :
1. Type de terrain : ${data.propertyType === 'terrain' ? 'Terrain nu — classification PUH/APFR requise' : 'Terrain bâti'}.
2. Enregistrement au cadastre numérique obligatoire (nouveau dispositif 2025).
3. Commission foncière villageoise : Consultation requise pour les terrains ruraux.
4. Droits de mutation : Conformément au barème RAF 2025.
5. Conversion : L'APFR doit être convertie en TF dans un délai de 5 ans (art. 142 RAF 2025).`;
  }

  if (template.country === 'TG') {
    result['tg-vente-clauses'] = `1. CFD 2018 : Le Titre Foncier est obligatoire pour toutes transactions immobilières au Togo.
2. DCCF 2025 : L'acte de cession doit être enregistré dans les 30 jours suivant la signature.
3. Conservation Foncière : Enregistrement obligatoire auprès de la Conservation Foncière.
4. Certificat de propriété ANDF : Obligatoire selon le DCCF 2025.
5. Sanctions : Le défaut d'enregistrement dans les délais entraîne une pénalité de 10% du montant de la transaction.`;
  }

  return result;
}
