// AfriBayit — Advanced Search Filters
// 25+ filter criteria for the property search engine

export type PropertyType = 'villa' | 'appartement' | 'terrain' | 'bureau' | 'commerce' | 'chambre' | 'guesthouse';
export type TransactionType = 'achat' | 'location' | 'investissement' | 'location_courte_duree';
export type SortOption = 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'surface_desc' | 'investment_score';

export interface SearchFilters {
  // Text search
  query?: string;

  // Location
  country?: string;
  city?: string;
  quartier?: string;

  // Property type
  type?: PropertyType[];
  transaction?: TransactionType[];

  // Price
  priceMin?: number;
  priceMax?: number;
  currency?: string;

  // Size
  surfaceMin?: number;
  surfaceMax?: number;

  // Rooms
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  roomsMin?: number;

  // Features (stored in JSON features field)
  hasPool?: boolean;
  hasGarden?: boolean;
  hasGarage?: boolean;
  hasAirCon?: boolean;
  hasSecurity?: boolean;
  furnished?: boolean;

  // Quality
  verified?: boolean;
  geoTrust?: boolean;
  premium?: boolean;

  // Investment
  investmentScoreMin?: number;
  roiMin?: number;

  // Dates
  availableFrom?: string;
  publishedAfter?: string;

  // Map bounds
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };

  // Sort
  sortBy?: SortOption;

  // Pagination
  page?: number;
  limit?: number;
}

export const FEATURE_MAP: Record<string, string> = {
  hasPool: 'piscine',
  hasGarden: 'jardin',
  hasGarage: 'garage',
  hasAirCon: 'climatisation',
  hasSecurity: 'securite',
  furnished: 'meuble',
};

export const DEFAULT_FILTERS: SearchFilters = {
  page: 1,
  limit: 24,
  sortBy: 'newest',
};

export const PROPERTY_TYPE_OPTIONS: { value: PropertyType; label: string }[] = [
  { value: 'villa', label: 'Villa' },
  { value: 'appartement', label: 'Appartement' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'bureau', label: 'Bureau' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'chambre', label: 'Studio/Chambre' },
  { value: 'guesthouse', label: 'Guesthouse' },
];

export const TRANSACTION_TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'achat', label: 'Acheter' },
  { value: 'location', label: 'Louer' },
  { value: 'investissement', label: 'Investir' },
  { value: 'location_courte_duree', label: 'Courte durée' },
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Plus récents' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'popular', label: 'Plus populaires' },
  { value: 'surface_desc', label: 'Plus grande surface' },
  { value: 'investment_score', label: "Meilleur score d'investissement" },
];

// Count active filters for display
export function countActiveFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.query) count++;
  if (filters.country) count++;
  if (filters.city) count++;
  if (filters.quartier) count++;
  if (filters.type && filters.type.length > 0) count++;
  if (filters.transaction && filters.transaction.length > 0) count++;
  if (filters.priceMin !== undefined) count++;
  if (filters.priceMax !== undefined) count++;
  if (filters.surfaceMin !== undefined) count++;
  if (filters.surfaceMax !== undefined) count++;
  if (filters.bedroomsMin !== undefined) count++;
  if (filters.bedroomsMax !== undefined) count++;
  if (filters.bathroomsMin !== undefined) count++;
  if (filters.roomsMin !== undefined) count++;
  if (filters.hasPool) count++;
  if (filters.hasGarden) count++;
  if (filters.hasGarage) count++;
  if (filters.hasAirCon) count++;
  if (filters.hasSecurity) count++;
  if (filters.furnished) count++;
  if (filters.verified) count++;
  if (filters.geoTrust) count++;
  if (filters.premium) count++;
  if (filters.investmentScoreMin !== undefined) count++;
  if (filters.roiMin !== undefined) count++;
  if (filters.publishedAfter) count++;
  return count;
}

// Get filter label for chip display
export function getFilterChipLabel(key: string, value: unknown): string {
  switch (key) {
    case 'query': return `"${value}"`;
    case 'country': return `Pays: ${value}`;
    case 'city': return `Ville: ${value}`;
    case 'quartier': return `Quartier: ${value}`;
    case 'type': return `Type: ${(value as string[]).map(t => PROPERTY_TYPE_OPTIONS.find(o => o.value === t)?.label || t).join(', ')}`;
    case 'transaction': return `${(value as string[]).map(t => TRANSACTION_TYPE_OPTIONS.find(o => o.value === t)?.label || t).join(', ')}`;
    case 'priceMin': return `Min: ${Number(value).toLocaleString('fr-FR')} FCFA`;
    case 'priceMax': return `Max: ${Number(value).toLocaleString('fr-FR')} FCFA`;
    case 'surfaceMin': return `Surface min: ${value} m²`;
    case 'surfaceMax': return `Surface max: ${value} m²`;
    case 'bedroomsMin': return `Chambres min: ${value}`;
    case 'bedroomsMax': return `Chambres max: ${value}`;
    case 'bathroomsMin': return `SDB min: ${value}`;
    case 'roomsMin': return `Pièces min: ${value}`;
    case 'hasPool': return 'Piscine';
    case 'hasGarden': return 'Jardin';
    case 'hasGarage': return 'Garage';
    case 'hasAirCon': return 'Climatisation';
    case 'hasSecurity': return 'Sécurité';
    case 'furnished': return 'Meublé';
    case 'verified': return 'Vérifié';
    case 'geoTrust': return 'GeoTrust';
    case 'premium': return 'Premium';
    case 'investmentScoreMin': return `Score invest. min: ${value}`;
    case 'roiMin': return `ROI min: ${value}%`;
    case 'publishedAfter': return `Publié après: ${value}`;
    default: return `${key}: ${value}`;
  }
}
