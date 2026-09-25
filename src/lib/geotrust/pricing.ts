/**
 * AfriBayit — Tarification GeoTrust canonique (XOF).
 * SOURCE UNIQUE DE VÉRITÉ — décision T-5 du registre d'arbitrage CDC V4.0
 * (document : AfriBayit_Arbitrage_CDC.pdf).
 *
 * Packs = CDC §7C.9 : Inspection Standard 75 000 / Certification 150 000 /
 * Premium Drone 350 000. Grille unitaire arbitrée pour que chaque pack
 * conserve une remise réelle vs. services à la carte :
 *   Standard −21 % · Certification −39 % · Premium Drone −11 % (services seuls).
 *
 * L'interface publique, l'API /api/geotrust/packs et l'intégration escrow
 * importent TOUTES leurs valeurs depuis ce module.
 */

import type { GeoTrustServiceCode } from './service-codes';
export type { GeoTrustServiceCode };

export const GEO_SERVICE_PRICES: Record<GeoTrustServiceCode, number> = {
  GEO_GPS: 40_000,
  GEO_SURF: 55_000,
  GEO_INSP: 60_000,
  GEO_CONF: 50_000,
  GEO_BORN: 90_000,
  GEO_TOPO: 110_000,
  GEO_DRON: 190_000,
  GEO_3D: 160_000,
  GEO_CERT: 45_000,
};

export function getServicePrice(code: GeoTrustServiceCode): number {
  return GEO_SERVICE_PRICES[code] ?? 0;
}

export interface GeoTrustPackDef {
  id: string;
  code: 'standard' | 'certification' | 'premium_drone';
  name: string;
  price: number;
  currency: 'XOF';
  services: GeoTrustServiceCode[];
  includes: string[];
  highlight: boolean;
}

export const GEO_PACKS: GeoTrustPackDef[] = [
  {
    id: 'pack-standard',
    code: 'standard',
    name: 'Pack Inspection Standard',
    price: 75_000,
    currency: 'XOF',
    services: ['GEO_GPS', 'GEO_SURF'],
    includes: ['GEO_GPS', 'GEO_SURF', 'Rapport de mission'],
    highlight: false,
  },
  {
    id: 'pack-certification',
    code: 'certification',
    name: 'Pack Certification GeoTrust',
    price: 150_000,
    currency: 'XOF',
    services: ['GEO_TOPO', 'GEO_BORN', 'GEO_CERT'],
    includes: ['GEO_TOPO', 'GEO_BORN', 'GEO_CERT', 'Badge GeoTrust officiel', 'Sécurisation escrow AfriBayit'],
    highlight: true,
  },
  {
    id: 'pack-premium-drone',
    code: 'premium_drone',
    name: 'Pack Premium Drone',
    price: 350_000,
    currency: 'XOF',
    services: ['GEO_DRON', 'GEO_3D', 'GEO_CERT'],
    includes: ['GEO_DRON', 'GEO_3D', 'GEO_CERT', 'Visite VR immersive', 'Rapport détaillé'],
    highlight: false,
  },
];

export function getPackByCode(code: GeoTrustPackDef['code']): GeoTrustPackDef | undefined {
  return GEO_PACKS.find((p) => p.code === code);
}

/** Somme des services du pack au tarif unitaire (valeur « à la carte »). */
export function packALaCarteTotal(pack: GeoTrustPackDef): number {
  return pack.services.reduce((sum, code) => sum + getServicePrice(code), 0);
}

/** Remise réelle du pack vs. services à la carte (0-1). */
export function packDiscount(pack: GeoTrustPackDef): number {
  const total = packALaCarteTotal(pack);
  if (total <= 0) return 0;
  return (total - pack.price) / total;
}

// ============ Options monétisation (CDC §7C.9 — phases ultérieures) ============

/** Option « Inspection Obligatoire » — phase 2 : 25 000 XOF/an ou 3 % de prime. */
export const INSPECTION_OBLIGATOIRE = { annualPrice: 25_000, transactionPrimeRate: 0.03 } as const;

/** API géospatiale partenaires — phase 3 : 0,5 € par requête. */
export const GEOSPATIAL_API_PRICE_EUR = 0.5;
