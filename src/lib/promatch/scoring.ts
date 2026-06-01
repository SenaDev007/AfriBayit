// AfriBayit ProMatch — Weighted Scoring Algorithm V2
// CDC §5.5.2 — Updated weights for artisan matching
//
// Weights:
//   Proximity     — 30%
//   Specialty     — 25%
//   Availability  — 20%
//   Rating        — 15%
//   Price         — 10%

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

export interface RankedArtisan extends ScoredArtisan {
  matchReasons: string[];
}

export interface ScoredArtisan {
  artisan: ArtisanData;
  totalScore: number;
  scores: {
    proximity: number;    // 0-1, weight 30%
    specialty: number;    // 0-1, weight 25%
    availability: number; // 0-1, weight 20%
    rating: number;       // 0-1, weight 15%
    price: number;        // 0-1, weight 10%
  };
}

/**
 * Calculate proximity score between artisan location and request location
 * Weight: 30%
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
 * Weight: 25%
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

  // Certification bonus for specialty confidence
  const certBonus = artisan.certified ? 0.1 : 0;

  let score = matchRate * 0.7;
  if (tradeMatch) score = Math.min(score + 0.2, 1.0);
  score = Math.min(score + certBonus, 1.0);

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

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate rating score based on reviews and rating
 * Weight: 15%
 */
export function calculateRatingScore(artisan: ArtisanData): number {
  let score = 0;

  // Rating (0-5 scale, normalized to 0-0.5)
  score += (artisan.rating / 5) * 0.5;

  // Number of reviews (more reviews = more trustworthy rating)
  if (artisan.reviews >= 20) score += 0.25;
  else if (artisan.reviews >= 10) score += 0.2;
  else if (artisan.reviews >= 5) score += 0.12;
  else if (artisan.reviews >= 1) score += 0.05;

  // Certification bonus
  if (artisan.certified) score += 0.15;

  // Completed missions (logarithmic scaling)
  if (artisan.completedMissions > 0) {
    const missionScore = Math.min(Math.log10(artisan.completedMissions + 1) / 2, 0.1);
    score += missionScore;
  }

  return Math.max(0, Math.min(1, score));
}

/**
 * Calculate price competitiveness score
 * Weight: 10%
 */
export function calculatePriceScore(
  artisan: ArtisanData,
  request: MatchRequest
): number {
  // If no budget specified or no daily rate, give neutral score
  if (!request.maxBudget || !artisan.dailyRate) {
    return 0.5;
  }

  const ratio = artisan.dailyRate / request.maxBudget;

  // Price well within budget
  if (ratio <= 0.5) return 1.0;
  if (ratio <= 0.7) return 0.9;
  if (ratio <= 0.85) return 0.8;
  if (ratio <= 1.0) return 0.6;   // At budget limit
  if (ratio <= 1.15) return 0.4;  // Slightly over budget
  if (ratio <= 1.3) return 0.2;   // Over budget
  return 0.1;                       // Way over budget
}

/**
 * Calculate the full ProMatch score using CDC §5.5.2 weights
 * V2: proximity 30%, specialty 25%, availability 20%, rating 15%, price 10%
 */
export function calculateProMatchScore(
  artisan: ArtisanData,
  request: MatchRequest
): ScoredArtisan {
  const proximity = calculateProximityScore(artisan, request);
  const specialty = calculateSpecialtyScore(artisan, request);
  const availability = calculateAvailabilityScore(artisan, request);
  const rating = calculateRatingScore(artisan);
  const price = calculatePriceScore(artisan, request);

  const totalScore =
    (proximity * 0.30) +
    (specialty * 0.25) +
    (availability * 0.20) +
    (rating * 0.15) +
    (price * 0.10);

  return {
    artisan,
    totalScore: Math.round(totalScore * 100) / 100,
    scores: {
      proximity: Math.round(proximity * 100) / 100,
      specialty: Math.round(specialty * 100) / 100,
      availability: Math.round(availability * 100) / 100,
      rating: Math.round(rating * 100) / 100,
      price: Math.round(price * 100) / 100,
    },
  };
}

/**
 * Match artisans for a project need and return ranked results with match reasons.
 * This is the main function for ProMatch scoring per the CDC.
 */
export function matchArtisan(
  project: ProjectNeed,
  artisans: ArtisanData[]
): RankedArtisan[] {
  const request: MatchRequest = {
    jobDescription: project.description,
    skills: project.requiredSkills,
    city: project.city,
    country: project.country,
    lat: project.lat,
    lng: project.lng,
    emergency: project.emergency,
    maxBudget: project.maxBudget,
  };

  const ranked = artisans
    .map((artisan) => {
      const scored = calculateProMatchScore(artisan, request);
      const matchReasons = generateMatchReasons(scored, request);
      return { ...scored, matchReasons };
    })
    .filter((s) => s.totalScore > 0.1)
    .sort((a, b) => b.totalScore - a.totalScore);

  return ranked;
}

/**
 * Project need definition for ProMatch
 */
export interface ProjectNeed {
  description: string;
  requiredSkills: string[];
  city?: string;
  country?: string;
  lat?: number;
  lng?: number;
  emergency?: boolean;
  maxBudget?: number;
  preferredDate?: Date;
}

/**
 * Generate human-readable match reasons for display
 */
function generateMatchReasons(scored: ScoredArtisan, request: MatchRequest): string[] {
  const reasons: string[] = [];
  const s = scored.scores;
  const a = scored.artisan;

  if (s.proximity >= 0.8) {
    reasons.push(`Proximité excellente (${a.city || a.zone || 'zone locale'})`);
  } else if (s.proximity >= 0.5) {
    reasons.push(`Proximité acceptable (${a.city || 'zone'})`);
  }

  if (s.specialty >= 0.8) {
    reasons.push(`Spécialiste qualifié en ${a.trade}`);
  } else if (s.specialty >= 0.5) {
    reasons.push(`Compétences correspondantes`);
  }

  if (s.availability >= 0.8) {
    reasons.push('Disponible immédiatement');
    if (request.emergency && a.emergency) {
      reasons.push('Intervention d\'urgence possible');
    }
  }

  if (s.rating >= 0.8) {
    reasons.push(`Excellente réputation (${a.rating}/5, ${a.reviews} avis)`);
  } else if (s.rating >= 0.5) {
    reasons.push(`Bonne réputation (${a.rating}/5)`);
  }

  if (s.price >= 0.8) {
    reasons.push('Tarif compétitif');
  } else if (s.price >= 0.5 && a.dailyRate) {
    reasons.push(`Tarif: ${new Intl.NumberFormat('fr-FR').format(a.dailyRate)} FCFA/jour`);
  }

  if (a.certified) {
    reasons.push('Artisan certifié AfriBayit');
  }

  if (a.completedMissions >= 20) {
    reasons.push(`${a.completedMissions} missions complétées`);
  }

  return reasons;
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
