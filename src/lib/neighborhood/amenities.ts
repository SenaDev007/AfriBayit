/**
 * AfriBayit — Amenity Proximity Scoring
 * Scores and categorizes nearby amenities
 */

export interface AmenityScore {
  category: string;
  categoryFr: string;
  icon: string;
  count: number;
  nearestDistance: number;
  score: number;
  items: { name: string; distance: number }[];
}

export interface AmenityProximityResult {
  totalScore: number;
  categoryScores: AmenityScore[];
  amenityCount: number;
  varietyScore: number;
}

const CATEGORY_CONFIG: Record<string, { labelFr: string; icon: string; maxDistance: number }> = {
  school: { labelFr: 'Écoles', icon: '🏫', maxDistance: 1500 },
  hospital: { labelFr: 'Hôpitaux', icon: '🏥', maxDistance: 3000 },
  market: { labelFr: 'Marchés', icon: '🏪', maxDistance: 1500 },
  bank: { labelFr: 'Banques', icon: '🏦', maxDistance: 2000 },
  pharmacy: { labelFr: 'Pharmacies', icon: '💊', maxDistance: 1000 },
  restaurant: { labelFr: 'Restaurants', icon: '🍽️', maxDistance: 800 },
  park: { labelFr: 'Parcs', icon: '🌳', maxDistance: 1500 },
  worship: { labelFr: 'Lieux de culte', icon: '⛪', maxDistance: 1500 },
  police: { labelFr: 'Police', icon: '🚔', maxDistance: 3000 },
  post: { labelFr: 'Poste', icon: '📮', maxDistance: 2000 },
};

/**
 * Score amenity proximity for a location
 */
export function scoreAmenities(
  amenities: { type: string; name: string; category: string; lat: number; lng: number }[],
  userLat: number,
  userLng: number
): AmenityProximityResult {
  const categoryMap = new Map<string, { name: string; distance: number }[]>();

  // Group and calculate distances
  for (const a of amenities) {
    const dist = Math.round(
      Math.sqrt(
        Math.pow((a.lat - userLat) * 111000, 2) +
        Math.pow((a.lng - userLng) * 111000 * Math.cos(userLat * Math.PI / 180), 2)
      )
    );

    if (!categoryMap.has(a.category)) {
      categoryMap.set(a.category, []);
    }
    categoryMap.get(a.category)!.push({ name: a.name, distance: dist });
  }

  // Score each category
  const categoryScores: AmenityScore[] = [];
  let totalScore = 0;

  for (const [category, items] of categoryMap) {
    const config = CATEGORY_CONFIG[category] || { labelFr: category, icon: '📍', maxDistance: 2000 };
    items.sort((a, b) => a.distance - b.distance);

    const nearestDistance = items[0]?.distance ?? config.maxDistance;
    let score = 0;

    // Score based on count and proximity
    if (nearestDistance <= config.maxDistance) {
      score += Math.min(50, (1 - nearestDistance / config.maxDistance) * 50);
    }
    score += Math.min(50, items.length * 10);

    categoryScores.push({
      category,
      categoryFr: config.labelFr,
      icon: config.icon,
      count: items.length,
      nearestDistance,
      score: Math.round(score),
      items: items.slice(0, 5),
    });

    totalScore += score;
  }

  // Normalize total score
  const maxCategories = Object.keys(CATEGORY_CONFIG).length;
  const varietyScore = Math.round((categoryMap.size / maxCategories) * 100);

  return {
    totalScore: Math.min(100, Math.round(totalScore / maxCategories)),
    categoryScores,
    amenityCount: amenities.length,
    varietyScore,
  };
}
