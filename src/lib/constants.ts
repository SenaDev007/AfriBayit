// AfriBayit — Frontend constants (previously in backend lib modules)
// This file centralizes constants needed by frontend components after
// the backend/frontend separation.

// Country names mapping
export const COUNTRY_NAMES: Record<string, string> = {
  BJ: 'Bénin',
  CI: "Côte d'Ivoire",
  BF: 'Burkina Faso',
  TG: 'Togo',
  SN: 'Sénégal',
  ALL: 'Tous les pays',
};

// Country flags
export const COUNTRY_FLAGS: Record<string, string> = {
  BJ: '🇧🇯',
  CI: '🇨🇮',
  BF: '🇧🇫',
  TG: '🇹🇬',
  SN: '🇸🇳',
};

// GeoTrust service codes (previously in lib/geotrust/service-codes.ts)
export function geoServiceLabel(code: string): string {
  const labels: Record<string, string> = {
    GEO_GPS: 'Géolocalisation GPS',
    GEO_SURF: 'Mesure de surface',
    GEO_BIRTH: 'Acte de naissance foncier',
    GEO_DRONE: 'Survols drone',
    GEO_NOTARY: 'Vérification notariale',
    GEO_CONFLICT: 'Détection de conflits',
    GEO_TITLE: 'Vérification titre foncier',
    GEO_BOUNDARY: 'Bornage physique',
  };
  return labels[code] || code;
}

// Investment score labels (previously in lib/investment-score.ts)
export function getInvestmentScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Très bon';
  if (score >= 40) return 'Bon';
  if (score >= 20) return 'Moyen';
  return 'Faible';
}

// Required docs by country (simplified — full logic in backend)
export function getRequiredDocs(country: string, propertyType: string): string[] {
  const common = ['title_deed', 'id_card'];
  if (country === 'BJ') return [...common, 'caf'];
  if (country === 'CI') return [...common, 'dfe'];
  if (country === 'BF') return [...common, 'attribution'];
  if (country === 'TG') return [...common, 'conservation'];
  return common;
}

export function getDocLabel(docType: string): string {
  const labels: Record<string, string> = {
    title_deed: 'Titre foncier',
    id_card: 'Carte d\'identité',
    caf: 'Certificat Administratif Foncier (CAF)',
    dfe: 'Document Foncier Enumératif (DFE)',
    attribution: 'Attestation d\'attribution',
    conservation: 'Titre de conservation',
    rccm: 'Registre RCCM',
    business_reg: 'Registre de commerce',
  };
  return labels[docType] || docType;
}

export function getDocDescription(docType: string): string {
  const descriptions: Record<string, string> = {
    title_deed: 'Document officiel prouvant la propriété du bien',
    id_card: 'Pièce d\'identité du propriétaire',
    caf: 'Certificat administratif foncier délivré par l\'ANDF',
    dfe: 'Document foncier énumératif (Côte d\'Ivoire)',
    attribution: 'Attestation d\'attribution de terrain (Burkina Faso)',
    conservation: 'Titre de conservation foncière (Togo)',
  };
  return descriptions[docType] || '';
}

export function normalizeCountryCode(code: string): string {
  const mapping: Record<string, string> = {
    benin: 'BJ', bénin: 'BJ',
    'cote d ivoire': 'CI', 'côte d ivoire': 'CI', ivoire: 'CI',
    burkina: 'BF', 'burkina faso': 'BF',
    togo: 'TG',
    senegal: 'SN', sénégal: 'SN',
  };
  return mapping[code.toLowerCase()] || code.toUpperCase();
}

// Search filters (simplified — full logic in backend)
export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular';

export interface SearchFilters {
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  city?: string;
  country?: string;
}

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'popular', label: 'Populaires' },
];

export function countActiveFilters(filters: SearchFilters): number {
  return Object.values(filters).filter((v) => v !== undefined && v !== null && v !== '').length;
}

export function getFilterChipLabel(key: string, value: any): string {
  if (key === 'minPrice') return `≥ ${value} XOF`;
  if (key === 'maxPrice') return `≤ ${value} XOF`;
  if (key === 'bedrooms') return `${value}+ ch`;
  return String(value);
}

// Tax types (previously in lib/tax/types.ts)
export interface TaxLineItem {
  label: string;
  rate: number;
  amount: number;
}

export interface TaxCalculation {
  country: string;
  propertyType: string;
  transactionType: string;
  propertyValue: number;
  lineItems: TaxLineItem[];
  totalTax: number;
  netAmount: number;
}

// Payment types (previously in lib/payments/types.ts)
export type PaymentMethod = 'card' | 'orange_money' | 'mtn_momo' | 'moov_money' | 'wave' | 'bank_transfer';
export type PaymentProvider = 'stripe' | 'fedapay';

// Quiz types (previously in lib/quiz/types.ts)
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface QuestionFeedback {
  isCorrect: boolean;
  explanation: string;
}

// Country config (previously in lib/tenant/config.ts)
export const COUNTRIES_CONFIG = [
  { code: 'BJ', name: 'Bénin', cities: ['Cotonou', 'Porto-Novo', 'Parakou', 'Bohicon'] },
  { code: 'CI', name: "Côte d'Ivoire", cities: ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro'] },
  { code: 'BF', name: 'Burkina Faso', cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou'] },
  { code: 'TG', name: 'Togo', cities: ['Lomé', 'Sokodé', 'Kara', 'Kpalimé'] },
  { code: 'SN', name: 'Sénégal', cities: ['Dakar', 'Thiès', 'Saint-Louis'] },
];

// Property & transaction type options (previously in lib/search/filters.ts)
export const PROPERTY_TYPE_OPTIONS = [
  { value: 'villa', label: 'Villa' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'chambre', label: 'Chambre' },
  { value: 'guesthouse', label: 'Guesthouse' },
  { value: 'maison', label: 'Maison' },
  { value: 'loft', label: 'Loft' },
  { value: 'bungalow', label: 'Bungalow' },
];

export const TRANSACTION_TYPE_OPTIONS = [
  { value: 'achat', label: 'Achat' },
  { value: 'location', label: 'Location' },
  { value: 'investissement', label: 'Investissement' },
  { value: 'location_courte_duree', label: 'Location courte durée' },
];

// Feature options (previously in lib/search/filters.ts)
export const FEATURE_MAP: Record<string, string> = {
  pool: 'Piscine',
  garage: 'Garage',
  garden: 'Jardin',
  terrace: 'Terrasse',
  ac: 'Climatisation',
  furnished: 'Meublé',
  security: 'Sécurité 24/7',
  elevator: 'Ascenseur',
  generator: 'Groupe électrogène',
  water: 'Eau courante',
  internet: 'Internet',
  parking: 'Parking',
};

// Extended SearchFilters (full version for AdvancedFilterSidebar)
export interface ExtendedSearchFilters extends SearchFilters {
  transaction?: string;
  sortBy?: SortOption;
  limit?: number;
  page?: number;
  query?: string;
  quartier?: string;
  priceMin?: number;
  priceMax?: number;
  filter?: string | string[];
  features?: string[];
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  surfaceMax?: number;
  bathrooms?: number;
  surfaceMin?: number;
}

// Extended TaxCalculation with additional fields used by TaxCalculator component
export interface ExtendedTaxCalculation extends TaxCalculation {
  grandTotal?: number;
  effectiveRate?: number;
  totalTaxes?: number;
  registrationFee?: number;
  notaryFee?: number;
  notaryFees?: number;
  totalNotaryFees?: number;
  transferTax?: number;
  registrationDuty?: number;
  agencyFee?: number;
  stampDuty?: number;
  vat?: number;
  mortgageFees?: number;
  breakdown?: any[];
  countryName?: string;
  landTax?: number;
  municipalTax?: number;
}

// Extended QuizQuestion for QuizTaker (without correctAnswer on client side)
export interface ClientQuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  type?: string;
}

// Additional search filter fields for AdvancedFilterSidebar
export interface FullSearchFilters extends ExtendedSearchFilters {
  roomsMin?: number;
  roomsMax?: number;
  verified?: boolean;
  geoTrust?: boolean;
  premium?: boolean;
  investmentScoreMin?: number;
  roiMin?: number;
}
