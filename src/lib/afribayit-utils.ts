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
  favorites?: number;
  hasVR?: boolean;
  hasDroneView?: boolean;
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
  /** Optionnel : absent = bien introuvable (404 → UI « Bien non trouvé »). */
  property?: PropertyData;
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

/**
 * Libellés humains des équipements / atouts d'un bien (CDC §5.1).
 *
 * Les `features` sont stockées en base sous forme d'identifiants techniques
 * en minuscules/snake_case (« wifi », « eau_chaude »…) — jamais affichables
 * tels quels sur les fiches publiques. Cette map couvre les équipements
 * connus du CDC + du formulaire de publication ; tout identifiant inconnu
 * est humanisé proprement (snake_case → « Eau chaude ») au lieu d'être
 * affiché brut.
 */
export const FEATURE_LABELS: Record<string, string> = {
  // Connectivité & énergie
  wifi: 'Wi-Fi',
  internet: 'Internet fibre',
  fibre: 'Fibre optique',
  electricite: 'Électricité',
  eau_courante: 'Eau courante',
  eau_chaude: 'Eau chaude',
  groupe_electrogene: 'Groupe électrogène',
  panneau_solaire: 'Panneaux solaires',
  borne_electrique: 'Borne de recharge',
  // Confort thermique
  climatisation: 'Climatisation',
  ventilation: 'Ventilation',
  cheminee: 'Cheminée',
  // Stationnement & extérieur
  parking: 'Parking',
  garage: 'Garage',
  parking_prive: 'Parking privé',
  jardin: 'Jardin',
  terrasse: 'Terrasse',
  balcon: 'Balcon',
  piscine: 'Piscine',
  pool: 'Piscine',
  cour: 'Cour',
  // Cuisine & équipements
  cuisine_equipee: 'Cuisine équipée',
  cuisine: 'Cuisine',
  buanderie: 'Buanderie',
  // Sécurité
  securite: 'Sécurité 24/7',
  gardien: 'Gardien',
  surveillance: 'Vidéosurveillance',
  alarme: 'Alarme',
  camera: 'Caméras',
  portail_electrique: 'Portail électrique',
  // Immeuble & divers
  ascenseur: 'Ascenseur',
  meuble: 'Meublé',
  non_meuble: 'Non meublé',
  equipe: 'Équipé',
  nouvel_construction: 'Construction récente',
  proche_ecole: 'Proche écoles',
  proche_hopital: 'Proche hôpital',
  proche_transport: 'Proche transports',
  vue_mer: 'Vue mer',
  vue_lagune: 'Vue lagune',
  plage_privee: 'Accès plage privée',
  plage: 'Accès plage',
  animaux_acceptes: 'Animaux acceptés',
  fumeur: 'Fumeur accepté',
  // Anglais courant (données importées)
  furnished: 'Meublé',
  unfurnished: 'Non meublé',
  air_conditioning: 'Climatisation',
  hot_water: 'Eau chaude',
  swimming_pool: 'Piscine',
  security_system: 'Système de sécurité',
  solar_panels: 'Panneaux solaires',
};

/**
 * Formate un identifiant d'équipement en libellé affichable.
 * @example formatFeatureLabel('eau_chaude')  // → « Eau chaude »
 * @example formatFeatureLabel('wifi')        // → « Wi-Fi »
 * @example formatFeatureLabel('truc_inconnu') // → « Truc inconnu »
 */
export function formatFeatureLabel(feature: string): string {
  const known = FEATURE_LABELS[feature];
  if (known) return known;

  // Identifiant déjà affichable (lettre capitale, espace) → tel quel
  if (/[\sA-Z]/.test(feature.slice(1))) return feature;

  // Humanisation : snake_case → Capitalized words
  return feature
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============ DATE FORMATTING HELPERS ============

export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return "À l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Il y a ${days}j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Il y a ${months} mois`;
  return formatDate(dateStr);
}
