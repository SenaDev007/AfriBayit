// AfriBayit — Shared utility functions and types
// These are configuration and helper functions, NOT mock data

// ============ PROPERTY TYPE ============

export interface PropertyData {
  id: string;
  title: string;
  type: string; // villa, appartement, terrain, bureau, commerce, chambre
  transaction: string; // achat, location, investissement
  price: number;
  currency?: string;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  country: string;
  quartier: string;
  description: string;
  images: string[];
  verified: boolean;
  geoTrust: boolean;
  premium: boolean;
  features: string[];
  agentId: string;
  lat?: number | null;
  lng?: number | null;
  views: number;
  createdAt: string;
  status?: string;
  // Agent info (joined from User relation)
  agent?: {
    id: string;
    name: string;
    avatar?: string;
    company?: string;
    certified?: boolean;
    rating?: number;
    reviews?: number;
    listings?: number;
    phone?: string;
  };
}

// ============ PAGINATION TYPE ============

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PropertiesResponse {
  properties: PropertyData[];
  pagination: PaginationData;
}

export interface PropertyDetailResponse {
  property: PropertyData;
}

// ============ COUNTRIES CONFIG (static, not from DB) ============

export const COUNTRIES_CONFIG = [
  { code: 'BJ', name: 'Bénin', cities: ['Cotonou', 'Porto-Novo', 'Parakou', 'Ouidah'] },
  { code: 'CI', name: "Côte d'Ivoire", cities: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro'] },
  { code: 'BF', name: 'Burkina Faso', cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora'] },
  { code: 'TG', name: 'Togo', cities: ['Lomé', 'Sokodé', 'Kara', 'Kpalimé'] },
] as const;

// ============ HELPER FUNCTIONS ============

export function formatPrice(price: number, transaction?: string): string {
  const formatted = new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  if (transaction === 'location') {
    return formatted + '/mois';
  }
  return formatted;
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    villa: 'Villa',
    appartement: 'Appartement',
    terrain: 'Terrain',
    bureau: 'Bureau',
    commerce: 'Commerce',
    chambre: 'Studio/Chambre',
  };
  return labels[type] || type;
}

export function getTransactionLabel(t: string): string {
  const labels: Record<string, string> = {
    achat: 'À vendre',
    location: 'À louer',
    investissement: 'Investissement',
  };
  return labels[t] || t;
}
