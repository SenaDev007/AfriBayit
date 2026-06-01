// AfriBayit ProMatch — Weighted Scoring Algorithm
// CDC Section 5.5.2 weights for artisan matching

export interface ArtisanData {
  id: string;
  userId: string;
  trade: string;
  specialties: string[];
  certified: boolean;
  available: boolean;
  emergency: boolean;
  dailyRate: number | null;
  rating: number;
  reviews: number;
  zone: string | null;
  city: string | null;
  country: string | null;
  responseTime: number | null;
  completedMissions: number;
  lat: number | null;
  lng: number | null;
}

export interface MatchRequest {
  jobDescription: string;
  skills: string[];
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  emergency?: boolean;
  maxBudget?: number; // max daily rate
}

export interface ScoredArtisan {
  artisan: ArtisanData;
  totalScore: number;
  scores: {
    proximity: number;   // 0-1, weight 35%
    specialty: number;   // 0-1, weight 30%
    availability: number; // 0-1, weight 20%
    trust: number;       // 0-1, weight 15%
  };
}

/**
 * Calculate proximity score between artisan location and request location
 * Weight: 35%
 */
export function calculateProximityScore(
  artisan: ArtisanData,
  request: MatchRequest
): number {
  // If we have coordinates, use distance-based scoring
  if (request.lat && request.lng && artisan.lat && artisan.lng) {
    const distance = haversineDistance(request.lat, request.lng, artisan.lat, artisan.lng);
    // Score decreases with distance: 1.0 at 0km, 0.5 at 10km, 0.2 at 30km
    if (distance <= 2) return 1.0;
    if (distance <= 5) return 0.9;
    if (distance <= 10) return 0.7;
    if (distance <= 20) return 0.5;
    if (distance <= 50) return 0.3;
    return 0.1;
  }

  // Fallback: city/country matching
  let score = 0;

  if (request.city && artisan.city) {
    if (artisan.city.toLowerCase() === request.city.toLowerCase()) {
      score = 0.9;
    } else {
      // Check if same metro area
      score = 0.3;
    }
  }

  if (request.country && artisan.country) {
    if (artisan.country === request.country) {
      score = Math.max(score, 0.5); // At least 0.5 if same country
    } else {
      score = Math.min(score, 0.2); // Cap at 0.2 if different country
    }
  }

  // Zone text matching
  if (artisan.zone && request.city) {
    if (artisan.zone.toLowerCase().includes(request.city.toLowerCase())) {
      score = Math.max(score, 0.8);
    }
  }

  return score || 0.3; // Default moderate score
}

/**
 * Calculate specialty/skill match score
 * Weight: 30%
 */
export function calculateSpecialtyScore(
  artisan: ArtisanData,
  request: MatchRequest
): number {
  if (request.skills.length === 0) {
    // If no specific skills requested, just match the trade
    return 0.7;
  }

  const artisanSkills = [
    artisan.trade.toLowerCase(),
    ...artisan.specialties.map((s) => s.toLowerCase()),
  ];

  const requestSkills = request.skills.map((s) => s.toLowerCase());

  // Exact match counting
  let matches = 0;
  for (const skill of requestSkills) {
    if (artisanSkills.some((a) => a.includes(skill) || skill.includes(a))) {
      matches++;
    }
  }

  const matchRate = matches / requestSkills.length;

  // Bonus for trade match
  const tradeMatch = requestSkills.some((s) =>
    artisan.trade.toLowerCase().includes(s) || s.includes(artisan.trade.toLowerCase())
  );

  let score = matchRate * 0.8;
  if (tradeMatch) score = Math.min(score + 0.2, 1.0);

  return score;
}

/**
 * Calculate availability score
 * Weight: 20%
 */
export function calculateAvailabilityScore(
  artisan: ArtisanData,
  request: MatchRequest
): number {
  let score = 0;

  // Basic availability
  if (artisan.available) score += 0.5;

  // Emergency availability
  if (request.emergency && artisan.emergency) {
    score += 0.3;
  } else if (request.emergency && !artisan.emergency) {
    score -= 0.1;
  }

  // Response time
  if (artisan.responseTime) {
    if (artisan.responseTime <= 30) score += 0.2;
    else if (artisan.responseTime <= 60) score += 0.15;
    else if (artisan.responseTime <= 120) score += 0.1;
    else score += 0.05;
  }

  // Budget compatibility
  if (request.maxBudget && artisan.dailyRate) {
    if (artisan.dailyRate <= request.maxBudget) {
      score += 0.1; // Within budget
    } else {
      score -= 0.2; // Over budget
    }
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate trust/reputation score
 * Weight: 15%
 */
export function calculateTrustScore(
  artisan: ArtisanData
): number {
  let score = 0;

  // Rating (0-5 scale, normalized to 0-0.4)
  score += (artisan.rating / 5) * 0.4;

  // Certification
  if (artisan.certified) score += 0.25;

  // Completed missions (logarithmic scaling)
  if (artisan.completedMissions > 0) {
    const missionScore = Math.min(Math.log10(artisan.completedMissions + 1) / 2, 0.2);
    score += missionScore;
  }

  // Reviews count (more reviews = more trustworthy rating)
  if (artisan.reviews >= 10) score += 0.15;
  else if (artisan.reviews >= 5) score += 0.1;
  else if (artisan.reviews >= 1) score += 0.05;

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate the full ProMatch score using CDC §5.5.2 weights
 */
export function calculateProMatchScore(
  artisan: ArtisanData,
  request: MatchRequest
): ScoredArtisan {
  const proximity = calculateProximityScore(artisan, request);
  const specialty = calculateSpecialtyScore(artisan, request);
  const availability = calculateAvailabilityScore(artisan, request);
  const trust = calculateTrustScore(artisan);

  const totalScore = (proximity * 0.35) + (specialty * 0.30) + (availability * 0.20) + (trust * 0.15);

  return {
    artisan,
    totalScore: Math.round(totalScore * 100) / 100,
    scores: {
      proximity: Math.round(proximity * 100) / 100,
      specialty: Math.round(specialty * 100) / 100,
      availability: Math.round(availability * 100) / 100,
      trust: Math.round(trust * 100) / 100,
    },
  };
}

/**
 * Haversine distance between two coordinates
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
