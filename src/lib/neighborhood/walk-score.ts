/**
 * AfriBayit — Walk Score Calculator
 * Calculates walkability score (0-100) based on proximity to amenities
 */

export interface WalkScoreResult {
  score: number;
  level: 'Très mauvais' | 'Mauvais' | 'Moyen' | 'Bon' | 'Excellent';
  color: string;
  details: {
    category: string;
    distance: number;
    contribution: number;
  }[];
}

export interface AmenityPoint {
  type: string;
  name: string;
  lat: number;
  lng: number;
  category: 'school' | 'hospital' | 'market' | 'bank' | 'pharmacy' | 'restaurant' | 'park' | 'worship';
  weight: number;
}

// Weight configuration for walk score
const AMENITY_WEIGHTS: Record<string, number> = {
  school: 15,
  hospital: 15,
  market: 12,
  bank: 10,
  pharmacy: 10,
  restaurant: 8,
  park: 10,
  worship: 10,
  transport: 10,
};

// Maximum walking distance (meters) - beyond this, contribution is 0
const MAX_WALK_DISTANCE = 2000;

// Ideal walking distance (meters) - within this, full contribution
const IDEAL_WALK_DISTANCE = 400;

/**
 * Calculate haversine distance between two coordinates
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate walk score for a location
 */
export function calculateWalkScore(
  lat: number,
  lng: number,
  amenities: AmenityPoint[]
): WalkScoreResult {
  let totalScore = 0;
  const details: { category: string; distance: number; contribution: number }[] = [];

  // Group amenities by category and find closest in each
  const categories = new Map<string, { amenity: AmenityPoint; distance: number }>();

  for (const amenity of amenities) {
    const distance = haversineDistance(lat, lng, amenity.lat, amenity.lng);
    const existing = categories.get(amenity.category);

    if (!existing || distance < existing.distance) {
      categories.set(amenity.category, { amenity, distance });
    }
  }

  // Calculate contribution from each category
  for (const [category, data] of categories) {
    const weight = AMENITY_WEIGHTS[category] || 5;
    let contribution = 0;

    if (data.distance <= IDEAL_WALK_DISTANCE) {
      contribution = weight;
    } else if (data.distance <= MAX_WALK_DISTANCE) {
      const ratio = 1 - (data.distance - IDEAL_WALK_DISTANCE) / (MAX_WALK_DISTANCE - IDEAL_WALK_DISTANCE);
      contribution = weight * ratio;
    }

    totalScore += contribution;
    details.push({
      category,
      distance: Math.round(data.distance),
      contribution: Math.round(contribution * 10) / 10,
    });
  }

  // Normalize to 0-100
  const maxPossible = Object.values(AMENITY_WEIGHTS).reduce((s, w) => s + w, 0);
  const score = Math.min(100, Math.round((totalScore / maxPossible) * 100));

  let level: WalkScoreResult['level'];
  let color: string;

  if (score >= 80) { level = 'Excellent'; color = '#00A651'; }
  else if (score >= 60) { level = 'Bon'; color = '#009CDE'; }
  else if (score >= 40) { level = 'Moyen'; color = '#D4AF37'; }
  else if (score >= 20) { level = 'Mauvais'; color = '#FF6B35'; }
  else { level = 'Très mauvais'; color = '#D93025'; }

  return { score, level, color, details };
}

/**
 * Get demo amenities for a city
 */
export function getDemoAmenities(city: string, lat: number, lng: number): AmenityPoint[] {
  const cityAmenities: Record<string, AmenityPoint[]> = {
    Cotonou: [
      { type: 'École primaire', name: 'École Aupiais', lat: 6.3700, lng: 2.3900, category: 'school', weight: 15 },
      { type: 'Hôpital', name: 'CNHU Hubert Koutoukou', lat: 6.3650, lng: 2.3850, category: 'hospital', weight: 15 },
      { type: 'Marché', name: 'Marché Dantokpa', lat: 6.3550, lng: 2.4100, category: 'market', weight: 12 },
      { type: 'Banque', name: 'BOA Bénin', lat: 6.3680, lng: 2.3920, category: 'bank', weight: 10 },
      { type: 'Pharmacie', name: 'Pharmacie Centrale', lat: 6.3690, lng: 2.3910, category: 'pharmacy', weight: 10 },
      { type: 'Restaurant', name: 'Le Living', lat: 6.3710, lng: 2.3930, category: 'restaurant', weight: 8 },
      { type: 'Parc', name: 'Jardin de l\'Ambassade', lat: 6.3720, lng: 2.3940, category: 'park', weight: 10 },
      { type: 'Lieu de culte', name: 'Cathédrale Notre-Dame', lat: 6.3660, lng: 2.3960, category: 'worship', weight: 10 },
    ],
    Abidjan: [
      { type: 'École', name: 'Lycée Classique', lat: 5.3200, lng: -4.0100, category: 'school', weight: 15 },
      { type: 'Hôpital', name: 'CHU Cocody', lat: 5.3300, lng: -3.9900, category: 'hospital', weight: 15 },
      { type: 'Marché', name: 'Marché de Cocody', lat: 5.3400, lng: -4.0000, category: 'market', weight: 12 },
      { type: 'Banque', name: 'SGBCI', lat: 5.3250, lng: -4.0050, category: 'bank', weight: 10 },
      { type: 'Pharmacie', name: 'Pharmacie Cocody', lat: 5.3280, lng: -4.0020, category: 'pharmacy', weight: 10 },
    ],
    Ouagadougou: [
      { type: 'École', name: 'Lycée Philippe Zinda', lat: 12.3700, lng: -1.5200, category: 'school', weight: 15 },
      { type: 'Hôpital', name: 'CHU Yalgado', lat: 12.3750, lng: -1.5150, category: 'hospital', weight: 15 },
      { type: 'Marché', name: 'Grand Marché', lat: 12.3650, lng: -1.5250, category: 'market', weight: 12 },
    ],
    Lomé: [
      { type: 'École', name: 'Lycée de Lomé', lat: 6.1300, lng: 1.2200, category: 'school', weight: 15 },
      { type: 'Hôpital', name: 'CHU Sylvanus Olympio', lat: 6.1350, lng: 1.2150, category: 'hospital', weight: 15 },
      { type: 'Marché', name: 'Grand Marché de Lomé', lat: 6.1250, lng: 1.2300, category: 'market', weight: 12 },
    ],
  };

  return cityAmenities[city] || cityAmenities['Cotonou'];
}
