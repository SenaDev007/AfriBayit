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
    score: number | null;
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

  const safetyScore: number | null = null;
  const safetyLevel = 'Données non disponibles';
  const safetyNote = 'Aucune source de données de sécurité fiable n\'est actuellement intégrée.';
  const knownWeight = 0.85;
  const weightedKnown = walkScore.score * 0.35 + amenityResult.totalScore * 0.25 + transport.score * 0.25;
  const overallScore = Math.round(weightedKnown / knownWeight);
  return { walkScore, amenities: amenityResult, transport, safety: { score: safetyScore, level: safetyLevel, note: safetyNote }, overallScore };
}
