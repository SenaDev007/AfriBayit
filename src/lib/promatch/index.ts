// AfriBayit ProMatch — Orchestrator
// Main entry point for artisan matching

export { findMatchingArtisans } from './matcher';
export { calculateProMatchScore, matchArtisan } from './scoring';
export type { ArtisanData, MatchRequest, ProjectNeed, ScoredArtisan, RankedArtisan } from './scoring';

// Emergency Dispatch (CDC §5.5)
export {
  createEmergencyDispatch,
  acceptEmergencyDispatch,
  escalateEmergencyDispatch,
  completeEmergencyDispatch,
  calculateEmergencyPricing,
  calculateETA,
  findEmergencyArtisans,
} from './emergency-dispatch';
export type {
  EmergencyType,
  EmergencyDispatchRequest,
  EmergencyDispatchStatus,
  EmergencyPricing,
  EmergencyDispatch,
  EmergencyMatchResult,
} from './emergency-dispatch';
