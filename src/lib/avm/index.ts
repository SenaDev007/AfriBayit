// AfriBayit AVM — Automated Valuation Model Orchestrator
// Main entry point for property valuation

import { findComparables, PropertyData } from './comparables';
import { calculateValuation, ValuationResult } from './valuation';
import { getMarketStats, MarketStats } from './market-data';

export type { PropertyData, Comparable } from './comparables';
export type { ValuationResult, Adjustment } from './valuation';
export type { MarketStats } from './market-data';
export { findComparables } from './comparables';
export { calculateValuation } from './valuation';
export { getMarketStats } from './market-data';

export interface FullValuationReport {
  valuation: ValuationResult;
  marketStats: MarketStats | null;
  comparables: { id: string; title: string; price: number; pricePerM2: number; similarity: number }[];
}

/**
 * Run a full AVM valuation for a property
 */
export async function runValuation(
  property: PropertyData
): Promise<FullValuationReport> {
  // Step 1: Find comparable properties
  const comps = await findComparables(property);

  // Step 2: Calculate valuation
  const valuation = calculateValuation(property, comps);

  // Step 3: Get market statistics
  const marketStats = await getMarketStats(property.city, property.country, property.type);

  // Step 4: Format comparables for response
  const comparables = comps.slice(0, 5).map((c) => ({
    id: c.property.id,
    title: `${c.property.type} ${c.property.transaction} — ${c.property.quartier}, ${c.property.city}`,
    price: c.property.price,
    pricePerM2: Math.round(c.pricePerM2),
    similarity: Math.round(c.similarityScore * 100),
  }));

  return {
    valuation,
    marketStats,
    comparables,
  };
}
