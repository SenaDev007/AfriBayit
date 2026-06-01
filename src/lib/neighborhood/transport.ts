/**
 * AfriBayit — Transport Accessibility Scoring
 * Evaluates transport connectivity for a property location
 */

export interface TransportScore {
  score: number;
  level: string;
  color: string;
  details: {
    mainRoadDistance: number;
    publicTransitDistance: number;
    taxiRankDistance: number;
    airportDistance: number;
  };
  transportOptions: {
    type: string;
    name: string;
    distance: number;
    accessible: boolean;
  }[];
}

const TRANSPORT_LEVELS = [
  { min: 80, level: 'Excellent', color: '#00A651' },
  { min: 60, level: 'Bon', color: '#009CDE' },
  { min: 40, level: 'Moyen', color: '#D4AF37' },
  { min: 20, level: 'Limité', color: '#FF6B35' },
  { min: 0, level: 'Très limité', color: '#D93025' },
];

/**
 * Calculate transport accessibility score
 */
export function calculateTransportScore(
  lat: number,
  lng: number,
  options: {
    mainRoadDistance?: number;
    publicTransitDistance?: number;
    taxiRankDistance?: number;
    airportDistance?: number;
    transportOptions?: { type: string; name: string; distance: number }[];
  } = {}
): TransportScore {
  const mainRoad = options.mainRoadDistance ?? estimateDistance(lat, lng, 'road');
  const publicTransit = options.publicTransitDistance ?? estimateDistance(lat, lng, 'transit');
  const taxiRank = options.taxiRankDistance ?? estimateDistance(lat, lng, 'taxi');
  const airport = options.airportDistance ?? estimateDistance(lat, lng, 'airport');

  // Score each factor (0-25 each, total max 100)
  let score = 0;

  // Main road proximity (0-25)
  if (mainRoad <= 200) score += 25;
  else if (mainRoad <= 500) score += 20;
  else if (mainRoad <= 1000) score += 15;
  else if (mainRoad <= 2000) score += 10;
  else score += 5;

  // Public transit (0-25)
  if (publicTransit <= 300) score += 25;
  else if (publicTransit <= 700) score += 20;
  else if (publicTransit <= 1500) score += 12;
  else if (publicTransit <= 3000) score += 6;
  else score += 0;

  // Taxi rank (0-25)
  if (taxiRank <= 300) score += 25;
  else if (taxiRank <= 700) score += 20;
  else if (taxiRank <= 1500) score += 12;
  else if (taxiRank <= 3000) score += 6;
  else score += 0;

  // Airport (0-25) - less weight for daily living
  if (airport <= 10000) score += 25;
  else if (airport <= 25000) score += 20;
  else if (airport <= 50000) score += 12;
  else score += 5;

  // Determine level
  let level = TRANSPORT_LEVELS[TRANSPORT_LEVELS.length - 1].level;
  let color = TRANSPORT_LEVELS[TRANSPORT_LEVELS.length - 1].color;
  for (const l of TRANSPORT_LEVELS) {
    if (score >= l.min) {
      level = l.level;
      color = l.color;
      break;
    }
  }

  const defaultOptions = options.transportOptions || [
    { type: 'road', name: 'Route principale', distance: mainRoad },
    { type: 'transit', name: 'Transport en commun', distance: publicTransit },
    { type: 'taxi', name: 'Station taxi / zem', distance: taxiRank },
    { type: 'airport', name: 'Aéroport', distance: airport },
  ];

  return {
    score,
    level,
    color,
    details: {
      mainRoadDistance: mainRoad,
      publicTransitDistance: publicTransit,
      taxiRankDistance: taxiRank,
      airportDistance: airport,
    },
    transportOptions: defaultOptions.map(o => ({
      ...o,
      accessible: o.distance <= getThreshold(o.type),
    })),
  };
}

function getThreshold(type: string): number {
  const thresholds: Record<string, number> = {
    road: 1000,
    transit: 1500,
    taxi: 1000,
    airport: 50000,
  };
  return thresholds[type] || 2000;
}

/**
 * Estimate distance based on city center proximity (rough heuristic)
 */
function estimateDistance(lat: number, lng: number, type: string): number {
  // Simple heuristic: estimate based on distance from city center
  // In production, would use real geocoding and routing APIs
  const baseDistances: Record<string, number> = {
    road: 500,
    transit: 800,
    taxi: 600,
    airport: 15000,
  };

  const noise = (Math.random() - 0.5) * 0.5;
  return Math.round((baseDistances[type] || 1000) * (1 + noise));
}
