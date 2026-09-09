/**
 * AfriBayit — Neighborhood Analysis Main Module (audit-12)
 * Orchestrates walk score, amenity scoring, transport accessibility, and safety.
 * CDC §5.1.1: "Carte interactive : couches prix, écoles, transports, sécurité, commodités"
 */

export { calculateWalkScore, getDemoAmenities, type WalkScoreResult, type AmenityPoint } from './walk-score';
export { scoreAmenities, type AmenityScore, type AmenityProximityResult } from './amenities';
export { calculateTransportScore, type TransportScore } from './transport';
export { calculateSafetyScore } from './safety';

import { calculateWalkScore, getDemoAmenities } from './walk-score';
import { scoreAmenities } from './amenities';
import { calculateTransportScore } from './transport';
import { calculateSafetyScore } from './safety';

export interface NeighborhoodAnalysis {
  walkScore: import('./walk-score').WalkScoreResult;
  amenities: import('./amenities').AmenityProximityResult;
  transport: import('./transport').TransportScore;
  safety: {
    score: number | null;
    level: string;
    note: string;
    factors?: Record<string, unknown>;
  };
  overallScore: number;
}

/**
 * Perform complete neighborhood analysis.
 * The safety score is calculated asynchronously from AfriBayit data
 * (property verification density, transaction history, GeoTrust coverage).
 */
export async function analyzeNeighborhood(
  lat: number,
  lng: number,
  city: string,
  country?: string,
  transportOptions?: Parameters<typeof calculateTransportScore>[2]
): Promise<NeighborhoodAnalysis> {
  const amenities = getDemoAmenities(city, lat, lng);
  const walkScore = calculateWalkScore(lat, lng, amenities);
  const amenityResult = scoreAmenities(amenities, lat, lng);
  const transport = calculateTransportScore(lat, lng, transportOptions);

  // Calculate real safety score from AfriBayit data (audit-12)
  const safetyResult = await calculateSafetyScore(lat, lng, city, country);

  // Overall score: walkScore 35%, amenities 25%, transport 25%, safety 15%
  const overallScore = Math.round(
    walkScore.score * 0.35 +
    amenityResult.totalScore * 0.25 +
    transport.score * 0.25 +
    safetyResult.score * 0.15
  );

  return {
    walkScore,
    amenities: amenityResult,
    transport,
    safety: {
      score: safetyResult.score,
      level: safetyResult.level,
      note: safetyResult.note,
      factors: safetyResult.factors,
    },
    overallScore,
  };
}
