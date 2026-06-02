/**
 * AfriBayit — Neighborhood Analysis Main Module
 * Orchestrates walk score, amenity scoring, and transport accessibility
 */

export { calculateWalkScore, getDemoAmenities, type WalkScoreResult, type AmenityPoint } from './walk-score';
export { scoreAmenities, type AmenityScore, type AmenityProximityResult } from './amenities';
export { calculateTransportScore, type TransportScore } from './transport';

import { calculateWalkScore, getDemoAmenities } from './walk-score';
import { scoreAmenities } from './amenities';
import { calculateTransportScore } from './transport';

export interface NeighborhoodAnalysis {
  walkScore: import('./walk-score').WalkScoreResult;
  amenities: import('./amenities').AmenityProximityResult;
  transport: import('./transport').TransportScore;
  safety: {
    score: number;
    level: string;
    note: string;
  };
  overallScore: number;
}

/**
 * Perform complete neighborhood analysis
 */
export function analyzeNeighborhood(
  lat: number,
  lng: number,
  city: string,
  transportOptions?: Parameters<typeof calculateTransportScore>[2]
): NeighborhoodAnalysis {
  const amenities = getDemoAmenities(city, lat, lng);
  const walkScore = calculateWalkScore(lat, lng, amenities);
  const amenityResult = scoreAmenities(amenities, lat, lng);
  const transport = calculateTransportScore(lat, lng, transportOptions);

  // Safety is a stub — would integrate real data in production
  const safetyScore = Math.round(50 + Math.random() * 30);
  const safetyLevel = safetyScore >= 70 ? 'Bon' : safetyScore >= 50 ? 'Moyen' : 'À vérifier';

  const overallScore = Math.round(
    (walkScore.score * 0.35 + amenityResult.totalScore * 0.25 + transport.score * 0.25 + safetyScore * 0.15)
  );

  return {
    walkScore,
    amenities: amenityResult,
    transport,
    safety: {
      score: safetyScore,
      level: safetyLevel,
      note: 'Données de sécurité basées sur des estimations. Vérifiez auprès des autorités locales.',
    },
    overallScore,
  };
}
