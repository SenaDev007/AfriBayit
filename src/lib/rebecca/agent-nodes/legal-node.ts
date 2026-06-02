// AfriBayit — Legal Advisor Agent Node
// Answers legal questions about property documents, procedures, and regulations

import { getRequiredDocumentsForProperty } from '@/lib/ai/legal-doc-checker';
import { getTenantConfig } from '@/lib/tenant/config';

export interface LegalAdviceState {
  question: string;
  answer: string;
  requiredDocuments: string[][];
  countryRules: Array<{
    country: string;
    countryName: string;
    docs: string[][];
  }>;
  recommendations: string[];
  disclaimer: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo', SN: 'Sénégal',
};

export async function executeLegalNode(
  state: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const entities = (state.entities as Array<{ type: string; value: string }>) || [];
  const message = (state.userMessage as string) || '';

  // Extract country and property type from entities
  let country = 'BJ';
  let propertyType = 'terrain';

  for (const entity of entities) {
    if (entity.type === 'country' && ['BJ', 'CI', 'BF', 'TG', 'SN'].includes(entity.value)) {
      country = entity.value;
    }
    if (entity.type === 'property_type') {
      propertyType = entity.value.toLowerCase();
    }
    if (entity.type === 'document_type') {
      // User is asking about a specific document type
    }
  }

  // Also try to extract country from message
  const countryKeywords: Record<string, string> = {
    'bénin': 'BJ', 'benin': 'BJ', 'cotonou': 'BJ',
    "côte d'ivoire": 'CI', 'abidjan': 'CI', 'ivory': 'CI',
    'burkina': 'BF', 'ouagadougou': 'BF',
    'togo': 'TG', 'lomé': 'TG', 'lome': 'TG',
    'sénégal': 'SN', 'senegal': 'SN', 'dakar': 'SN',
  };
  for (const [keyword, code] of Object.entries(countryKeywords)) {
    if (message.toLowerCase().includes(keyword)) {
      country = code;
      break;
    }
  }

  // Get required documents for the property type and country
  const requiredDocs = getRequiredDocumentsForProperty(country, propertyType);

  // Build legal knowledge base response
  const countryName = COUNTRY_NAMES[country] || country;
  const tenantConfig = getTenantConfig(country);

  // Generate country-specific legal information
  const countryRules = buildCountryRules(country, propertyType);

  // Build recommendations
  const recommendations = buildRecommendations(country, propertyType, message);

  // Generate the legal answer
  const answer = buildLegalAnswer(message, country, propertyType, requiredDocs, countryName);

  const disclaimer = '⚠️ Ces informations sont fournies à titre indicatif et ne constituent pas un conseil juridique. Consultez toujours un notaire ou un juriste certifié pour toute décision foncière.';

  return {
    ...state,
    legalAdvice: {
      question: message,
      answer,
      requiredDocuments: requiredDocs,
      countryRules,
      recommendations,
      disclaimer,
    } satisfies LegalAdviceState,
  };
}

function buildCountryRules(country: string, propertyType: string): LegalAdviceState['countryRules'] {
  const rules: LegalAdviceState['countryRules'] = [];

  // Always show the primary country's rules
  const primaryDocs = getRequiredDocumentsForProperty(country, propertyType);
  rules.push({
    country,
    countryName: COUNTRY_NAMES[country] || country,
    docs: primaryDocs,
  });

  // Also show neighboring countries for comparison
  const neighbors: Record<string, string[]> = {
    BJ: ['TG', 'BF', 'CI'],
    CI: ['BF', 'BJ'],
    BF: ['BJ', 'CI', 'TG'],
    TG: ['BJ', 'BF'],
    SN: [],
  };

  for (const neighbor of (neighbors[country] || []).slice(0, 2)) {
    const neighborDocs = getRequiredDocumentsForProperty(neighbor, propertyType);
    rules.push({
      country: neighbor,
      countryName: COUNTRY_NAMES[neighbor] || neighbor,
      docs: neighborDocs,
    });
  }

  return rules;
}

function buildRecommendations(country: string, propertyType: string, message: string): string[] {
  const recommendations: string[] = [];

  recommendations.push('Vérifiez toujours l\'authenticité des documents auprès des services fonciers compétents');
  recommendations.push('Faites accompagner par un notaire certifié pour toute transaction immobilière');

  // Country-specific recommendations
  switch (country) {
    case 'BJ':
      recommendations.push('Au Bénin, privilégiez le Titre Foncier à l\'ACD — l\'ACD ne garantit pas la propriété');
      recommendations.push('Vérifiez le bornage avec un géomètre certifié avant tout achat de terrain');
      break;
    case 'CI':
      recommendations.push('En Côte d\'Ivoire, vérifiez la conformité avec le Plan d\'Occupation des Sols (POS)');
      recommendations.push('L\'Attestation Villagéoise a une portée très limitée — ne constitue pas un titre de propriété');
      break;
    case 'BF':
      recommendations.push('Au Burkina Faso, le PUH ne confère qu\'un droit d\'occupation — le Titre Foncier reste le titre le plus sûr');
      break;
    case 'TG':
      recommendations.push('Au Togo, le Certificat ANDF est obligatoire pour les transactions foncières');
      recommendations.push('Vérifiez l\'enregistrement à l\'ANDF pour sécuriser votre transaction');
      break;
  }

  if (propertyType === 'terrain') {
    recommendations.push('Pour un terrain, exigez un bornage contradictoire avec les voisins');
  }

  if (message.toLowerCase().includes('construct')) {
    recommendations.push('Le Permis de Construire est obligatoire — les constructions sans permis sont illégales');
  }

  return recommendations;
}

function buildLegalAnswer(
  message: string,
  country: string,
  propertyType: string,
  requiredDocs: string[][],
  countryName: string
): string {
  const docLabels: Record<string, string> = {
    titre_foncier: 'Titre Foncier',
    acd: 'ACD (Attestation de Custom Déguerpissement)',
    permis_construire: 'Permis de Construire',
    acte_cession: 'Acte de Cession',
    certificat_andf: 'Certificat ANDF',
    puh: 'PUH (Permis Urbain d\'Habiter)',
    attestation_villagéoise: 'Attestation Villagéoise',
    lettre_attribution: 'Lettre d\'Attribution',
    arrete_concession: 'Arrêté de Concession',
    certificat_propriete: 'Certificat de Propriété',
  };

  const docList = requiredDocs
    .map((group) => group.map((d) => docLabels[d] || d).join(' OU '))
    .join(', ');

  let answer = `En ${countryName}, pour un bien de type "${propertyType}", les documents requis sont: ${docList}.\n\n`;

  // Add specific guidance based on the message
  const lower = message.toLowerCase();

  if (lower.includes('titre foncier') || lower.includes('tf')) {
    answer += '📜 Le Titre Foncier est le titre de propriété le plus sûr en Afrique de l\'Ouest. ';
    answer += 'Il est délivré par la Conservation Foncière après une procédure d\'immatriculation. ';
    answer += 'Il confère un droit réel et inattaquable (sauf annulation judiciaire).';
  } else if (lower.includes('acd')) {
    answer += '📋 L\'ACD (Attestation de Custom Déguerpissement) est délivrée par la mairie. ';
    answer += '⚠️ Attention: l\'ACD ne constitue PAS un titre de propriété. ';
    answer += 'Elle atteste seulement que le terrain a été "déguerpi" du domaine public coutumier. ';
    answer += 'Il est fortement recommandé de transformer l\'ACD en Titre Foncier.';
  } else if (lower.includes('permis de construire') || lower.includes('construire')) {
    answer += '🏗️ Le Permis de Construire est obligatoire pour toute construction. ';
    answer += 'Il est délivré par la mairie après vérification de la conformité avec le plan d\'urbanisme. ';
    answer += 'La construction sans permis expose à des sanctions (amendes, démolition).';
  } else if (lower.includes('achat') || lower.includes('acheter') || lower.includes('transaction')) {
    answer += '🔑 Pour un achat immobilier sécurisé en ' + countryName + ':\n';
    answer += '1. Vérifiez le titre de propriété du vendeur\n';
    answer += '2. Faites faire un bornage contradictoire\n';
    answer += '3. Signez un compromis de vente avec conditions suspensives\n';
    answer += '4. Passez par un notaire pour l\'acte de vente\n';
    answer += '5. Enregistrez la transaction auprès des services fonciers\n';
    answer += '6. Utilisez le système escrow d\'AfriBayit pour sécuriser le paiement';
  } else {
    answer += 'Je vous recommande de consulter un notaire certifié pour vos questions spécifiques. ';
    answer += 'AfriBayit propose aussi un service de vérification documentaire via notre IA.';
  }

  return answer;
}
