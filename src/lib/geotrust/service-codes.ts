/**
 * AfriBayit — GeoTrust Service Code Labels
 * Centralized mapping from GEO_* service codes to human-readable French names.
 * Used across GeoTrust components, mission dialogs, and geometer profile cards.
 */

export type GeoTrustServiceCode =
  | 'GEO_GPS'
  | 'GEO_SURF'
  | 'GEO_INSP'
  | 'GEO_BORN'
  | 'GEO_TOPO'
  | 'GEO_DRON'
  | 'GEO_CERT'
  | 'GEO_3D';

/** Map a GEO_* service code to its French display name. */
export const GEO_SERVICE_LABELS: Record<GeoTrustServiceCode, string> = {
  GEO_GPS: 'Géolocalisation GPS',
  GEO_SURF: 'Arpenteur de surface',
  GEO_INSP: 'Inspection immobilière',
  GEO_BORN: 'Bornage',
  GEO_TOPO: 'Topographie',
  GEO_DRON: 'Drone',
  GEO_CERT: 'Certification géomètre',
  GEO_3D: 'Modélisation 3D',
};

/**
 * Convert a service code to its French display name.
 * Normalizes the code to uppercase before lookup so that lowercase
 * variants stored in the DB (e.g. "geo_gps") still resolve correctly.
 * Falls back to the raw code if the code is unknown.
 */
export function geoServiceLabel(code: string): string {
  const normalizedCode = code.toUpperCase();
  return (GEO_SERVICE_LABELS as Record<string, string>)[normalizedCode] ?? code;
}

/** All valid GeoTrust service codes (useful for iteration). */
export const GEO_SERVICE_CODES = Object.keys(GEO_SERVICE_LABELS) as GeoTrustServiceCode[];
