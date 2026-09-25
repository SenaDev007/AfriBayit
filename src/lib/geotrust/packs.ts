/**
 * AfriBayit — GeoTrust Certification Packs
 * Prix issus de la source unique src/lib/geotrust/pricing.ts (décision T-5,
 * registre d'arbitrage CDC V4.0) : 75 000 / 150 000 / 350 000 XOF.
 */
import { GEO_PACKS, packALaCarteTotal } from './pricing';

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

const PACK_META: Record<string, { icon: string; color: string; turnaroundDays: number; features: string[];
  includes: CertificationPack['includes'] }> = {
  standard: {
    icon: 'clipboard-list',
    color: '#009CDE',
    turnaroundDays: 7,
    features: [
      'Vérification cadastrale',
      'Rapport basique',
      'Vérification des limites de propriété',
      'Délai 5-7 jours ouvrés',
    ],
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
  geotrust: {
    icon: 'map',
    color: '#00A651',
    turnaroundDays: 5,
    features: [
      'Vérification cadastrale',
      'Levé topographique',
      'Rapport GeoTrust complet',
      'Badge vérifié sur l\'annonce',
      'Délai 3-5 jours ouvrés',
    ],
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
  premium: {
    icon: 'crown',
    color: '#D4AF37',
    turnaroundDays: 3,
    features: [
      'Tout GeoTrust inclus',
      'Couverture drone HD',
      'Rapport blockchain (Polygon)',
      'Badge Premium doré',
      'Délai 2-3 jours ouvrés',
      'Support prioritaire 24/7',
    ],
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
};

const ID_BY_CODE: Record<string, string> = {
  standard: 'standard',
  certification: 'geotrust',
  premium_drone: 'premium',
};

export const CERTIFICATION_PACKS: CertificationPack[] = GEO_PACKS.map((pack) => {
  const meta = PACK_META[ID_BY_CODE[pack.code]] ?? PACK_META.geotrust;
  return {
    id: ID_BY_CODE[pack.code] ?? pack.id,
    name: pack.code === 'certification' ? 'GeoTrust' : pack.code === 'premium_drone' ? 'Premium' : 'Standard',
    nameFr: pack.name,
    price: pack.price,
    currency: pack.currency,
    features: [...meta.features, `Valeur à la carte : ${packALaCarteTotal(pack).toLocaleString('fr-FR')} XOF`],
    icon: meta.icon,
    color: meta.color,
    popular: pack.highlight,
    turnaroundDays: meta.turnaroundDays,
    includes: meta.includes,
  };
});

export function getPackById(id: string): CertificationPack | undefined {
  return CERTIFICATION_PACKS.find(p => p.id === id);
}

export function getPopularPack(): CertificationPack {
  return CERTIFICATION_PACKS.find(p => p.popular) || CERTIFICATION_PACKS[1];
}
