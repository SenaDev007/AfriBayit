// AfriBayit — Pricing Orchestrator
// Point d'entrée principal pour le moteur de tarification

export { calculateDynamicPrice, getPricingBreakdown } from './dynamic';
export type { DynamicPricingParams } from './dynamic';

export {
  getCountrySeasons,
  isPeakSeason,
  isLowSeason,
  getSeasonalMultiplier,
  getSeasonName,
  getAllCountrySeasons,
} from './seasonal';
export type { SeasonalPeriod, CountrySeasons } from './seasonal';

export {
  calculateRevPAR,
  calculateADR,
  calculateYieldMetrics,
  suggestYieldStrategy,
  compareToPreviousPeriod,
} from './yield';
export type { YieldMetrics, YieldRecommendation, HistoricalData } from './yield';
