/**
 * AfriBayit — GeoTrust Certification Packs
 * Available certification packs with pricing and features
 */

export interface CertificationPack {
  id: string;
  name: string;
  nameFr: string;
  price: number;
  currency: string;
  features: string[];
  icon: string;
  color: string;
  popular: boolean;
  turnaroundDays: number;
  includes: {
    cadastralVerification: boolean;
    topographicSurvey: boolean;
    geoTrustReport: boolean;
    verifiedBadge: boolean;
    droneCoverage: boolean;
    blockchainReport: boolean;
    premiumBadge: boolean;
  };
}

export const CERTIFICATION_PACKS: CertificationPack[] = [
  {
    id: 'standard',
    name: 'Standard',
    nameFr: 'Standard',
    price: 25000,
    currency: 'XOF',
    features: [
      'Vérification cadastrale',
      'Rapport basique',
      'Vérification des limites de propriété',
      'Délai 5-7 jours ouvrés',
    ],
    icon: 'clipboard-list',
    color: '#009CDE',
    popular: false,
    turnaroundDays: 7,
    includes: {
      cadastralVerification: true,
      topographicSurvey: false,
      geoTrustReport: false,
      verifiedBadge: false,
      droneCoverage: false,
      blockchainReport: false,
      premiumBadge: false,
    },
  },
  {
    id: 'geotrust',
    name: 'GeoTrust',
    nameFr: 'GeoTrust',
    price: 75000,
    currency: 'XOF',
    features: [
      'Vérification cadastrale',
      'Levé topographique',
      'Rapport GeoTrust complet',
      'Badge vérifié sur l\'annonce',
      'Délai 3-5 jours ouvrés',
    ],
    icon: 'map',
    color: '#00A651',
    popular: true,
    turnaroundDays: 5,
    includes: {
      cadastralVerification: true,
      topographicSurvey: true,
      geoTrustReport: true,
      verifiedBadge: true,
      droneCoverage: false,
      blockchainReport: false,
      premiumBadge: false,
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    nameFr: 'Premium',
    price: 150000,
    currency: 'XOF',
    features: [
      'Tout GeoTrust inclus',
      'Couverture drone HD',
      'Rapport blockchain (Polygon)',
      'Badge Premium doré',
      'Délai 2-3 jours ouvrés',
      'Support prioritaire 24/7',
    ],
    icon: 'crown',
    color: '#D4AF37',
    popular: false,
    turnaroundDays: 3,
    includes: {
      cadastralVerification: true,
      topographicSurvey: true,
      geoTrustReport: true,
      verifiedBadge: true,
      droneCoverage: true,
      blockchainReport: true,
      premiumBadge: true,
    },
  },
];

export function getPackById(id: string): CertificationPack | undefined {
  return CERTIFICATION_PACKS.find(p => p.id === id);
}

export function getPopularPack(): CertificationPack {
  return CERTIFICATION_PACKS.find(p => p.popular) || CERTIFICATION_PACKS[1];
}
