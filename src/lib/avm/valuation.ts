// AfriBayit AVM — Valuation Calculator
// Calculates estimated property value based on comparable sales

import { PropertyData, Comparable } from './comparables';

export interface Adjustment {
  factor: string;
  impact: number; // percentage impact on value
  description: string;
}

export interface ValuationResult {
  estimatedValue: number;        // in XOF
  confidenceScore: number;       // 0-100
  range: { low: number; high: number }; // ± based on confidence
  pricePerM2: number;
  comparablesUsed: number;
  adjustments: Adjustment[];
  marketTrend: 'rising' | 'stable' | 'declining';
  trendPercentage: number;       // Annual %
  methodology: string;
}

/**
 * Calculate property valuation based on comparables
 */
export function calculateValuation(
  property: PropertyData,
  comps: Comparable[]
): ValuationResult {
  // If no comparables, use a basic estimation
  if (comps.length === 0) {
    return estimateWithoutComps(property);
  }

  // Step 1: Weighted average of adjusted comp prices
  const totalWeight = comps.reduce((sum, c) => sum + c.similarityScore, 0);

  if (totalWeight === 0) {
    return estimateWithoutComps(property);
  }

  // Calculate weighted average price per m²
  const weightedPricePerM2 = comps.reduce((sum, c) => {
    const adjustedPricePerM2 = c.pricePerM2 * c.adjustmentFactor;
    return sum + (adjustedPricePerM2 * c.similarityScore);
  }, 0) / totalWeight;

  // Step 2: Calculate adjustments
  const adjustments = calculateAdjustments(property, comps);

  // Step 3: Apply adjustments to base value
  const totalAdjustmentPct = adjustments.reduce((sum, a) => sum + a.impact, 0);
  const adjustedPricePerM2 = weightedPricePerM2 * (1 + totalAdjustmentPct / 100);

  // Step 4: Calculate estimated value
  const estimatedValue = Math.round(adjustedPricePerM2 * property.surface);

  // Step 5: Calculate confidence score
  const confidenceScore = calculateConfidence(comps, property);

  // Step 6: Calculate range based on confidence
  const marginPct = (100 - confidenceScore) / 2;
  const range = {
    low: Math.round(estimatedValue * (1 - marginPct / 100)),
    high: Math.round(estimatedValue * (1 + marginPct / 100)),
  };

  // Step 7: Determine market trend
  const { trend, percentage } = determineMarketTrend(comps);

  return {
    estimatedValue,
    confidenceScore,
    range,
    pricePerM2: Math.round(adjustedPricePerM2),
    comparablesUsed: comps.length,
    adjustments,
    marketTrend: trend,
    trendPercentage: percentage,
    methodology: `Estimation basée sur ${comps.length} biens comparables dans la zone de ${property.city}, ${property.country}. ` +
      `Prix moyen pondéré au m²: ${new Intl.NumberFormat('fr-FR').format(Math.round(weightedPricePerM2))} FCFA/m². ` +
      `Ajustements appliqués: ${adjustments.map((a) => `${a.factor} (${a.impact > 0 ? '+' : ''}${a.impact}%)`).join(', ')}. ` +
      `Score de confiance: ${confidenceScore}/100.`,
  };
}

/**
 * Calculate property-specific adjustments
 */
function calculateAdjustments(
  property: PropertyData,
  comps: Comparable[]
): Adjustment[] {
  const adjustments: Adjustment[] = [];

  // Surface area adjustment
  const avgCompSurface = comps.reduce((sum, c) => sum + c.property.surface, 0) / comps.length;
  const surfaceDiff = (property.surface - avgCompSurface) / avgCompSurface;
  if (Math.abs(surfaceDiff) > 0.05) {
    adjustments.push({
      factor: 'Surface',
      impact: Math.round(-surfaceDiff * 10 * 10) / 10, // Larger properties have slightly lower per-m² price
      description: `Surface de ${property.surface}m² vs moyenne comparables ${Math.round(avgCompSurface)}m²`,
    });
  }

  // Bedroom/bathroom adjustment
  const avgBedrooms = comps.reduce((sum, c) => sum + c.property.bedrooms, 0) / comps.length;
  const bedroomDiff = property.bedrooms - avgBedrooms;
  if (Math.abs(bedroomDiff) >= 1) {
    adjustments.push({
      factor: 'Chambres',
      impact: Math.round(bedroomDiff * 3 * 10) / 10,
      description: `${property.bedrooms} chambres vs moyenne ${Math.round(avgBedrooms * 10) / 10}`,
    });
  }

  // Feature adjustments
  const featurePremiums: Record<string, number> = {
    'piscine': 5,
    'jardin': 3,
    'garage': 4,
    'climatisation': 2,
    'meuble': 5,
    'terrasse': 2,
    'security': 2,
    'vue mer': 8,
    'vue lagune': 6,
  };

  if (Array.isArray(property.features)) {
    const compFeatures = new Set(
      comps.flatMap((c) => Array.isArray(c.property.features) ? c.property.features : [])
        .map((f) => String(f).toLowerCase())
    );

    for (const feature of property.features) {
      const featureLower = String(feature).toLowerCase();
      const premium = featurePremiums[featureLower];
      if (premium && !compFeatures.has(featureLower)) {
        adjustments.push({
          factor: `Feature: ${feature}`,
          impact: premium,
          description: `Présence de ${feature} (rare dans les comparables)`,
        });
      }
    }
  }

  // Verification bonus
  if (property.verified) {
    adjustments.push({
      factor: 'Vérification',
      impact: 2,
      description: 'Bien vérifié AfriBayit',
    });
  }

  if (property.geoTrust) {
    adjustments.push({
      factor: 'GeoTrust',
      impact: 3,
      description: 'Validation géomatique GeoTrust',
    });
  }

  return adjustments;
}

/**
 * Calculate confidence score based on comp quality and quantity
 */
function calculateConfidence(
  comps: Comparable[],
  _property: PropertyData
): number {
  let confidence = 50; // Base confidence

  // More comps = higher confidence
  if (comps.length >= 5) confidence += 15;
  else if (comps.length >= 3) confidence += 10;
  else if (comps.length >= 1) confidence += 5;

  // Higher similarity = higher confidence
  const avgSimilarity = comps.reduce((sum, c) => sum + c.similarityScore, 0) / comps.length;
  confidence += Math.round(avgSimilarity * 20);

  // Verified comps = higher confidence
  const verifiedCount = comps.filter((c) => c.property.verified).length;
  confidence += Math.round((verifiedCount / comps.length) * 10);

  // GeoTrust comps = higher confidence
  const geoTrustCount = comps.filter((c) => c.property.geoTrust).length;
  confidence += Math.round((geoTrustCount / comps.length) * 5);

  return Math.min(Math.max(confidence, 10), 95);
}

/**
 * Determine market trend from comp data
 */
function determineMarketTrend(comps: Comparable[]): { trend: 'rising' | 'stable' | 'declining'; percentage: number } {
  if (comps.length < 2) {
    return { trend: 'stable', percentage: 0 };
  }

  // Sort comps by date
  const sorted = [...comps].sort(
    (a, b) => new Date(a.property.createdAt).getTime() - new Date(b.property.createdAt).getTime()
  );

  // Simple trend: compare recent vs older comps
  const halfPoint = Math.floor(sorted.length / 2);
  const older = sorted.slice(0, halfPoint);
  const newer = sorted.slice(halfPoint);

  const avgOlderPrice = older.reduce((s, c) => s + c.pricePerM2, 0) / older.length;
  const avgNewerPrice = newer.reduce((s, c) => s + c.pricePerM2, 0) / newer.length;

  const change = ((avgNewerPrice - avgOlderPrice) / avgOlderPrice) * 100;

  if (change > 3) return { trend: 'rising', percentage: Math.round(change * 10) / 10 };
  if (change < -3) return { trend: 'declining', percentage: Math.round(change * 10) / 10 };
  return { trend: 'stable', percentage: Math.round(change * 10) / 10 };
}

/**
 * Fallback estimation when no comparables are available
 * Uses average market prices per m² by type and country
 */
function estimateWithoutComps(property: PropertyData): ValuationResult {
  // Average prices per m² in XOF by type and country (approximate market data)
  const avgPricePerM2: Record<string, Record<string, number>> = {
    villa: { BJ: 350000, CI: 450000, BF: 250000, TG: 300000 },
    appartement: { BJ: 400000, CI: 550000, BF: 280000, TG: 350000 },
    terrain: { BJ: 50000, CI: 80000, BF: 30000, TG: 45000 },
    bureau: { BJ: 300000, CI: 400000, BF: 200000, TG: 250000 },
    commerce: { BJ: 350000, CI: 500000, BF: 220000, TG: 280000 },
    chambre: { BJ: 200000, CI: 250000, BF: 150000, TG: 180000 },
  };

  const typePrices = avgPricePerM2[property.type] || avgPricePerM2.villa;
  const basePricePerM2 = typePrices[property.country as keyof typeof typePrices] || typePrices.BJ;

  // Adjust for transaction type
  const transactionMultiplier = property.transaction === 'location' ? 0.003 : 1;

  const estimatedValue = Math.round(basePricePerM2 * property.surface * transactionMultiplier);

  return {
    estimatedValue,
    confidenceScore: 20, // Low confidence without comps
    range: {
      low: Math.round(estimatedValue * 0.7),
      high: Math.round(estimatedValue * 1.3),
    },
    pricePerM2: basePricePerM2,
    comparablesUsed: 0,
    adjustments: [{
      factor: 'Estimation de base',
      impact: 0,
      description: `Prix moyen du marché pour ${property.type} au ${property.country} sans données comparables`,
    }],
    marketTrend: 'stable',
    trendPercentage: 0,
    methodology: `Estimation indicative basée sur les prix moyens du marché pour un ${property.type} en ${property.country}. ` +
      `Cette estimation a une faible confiance car aucun bien comparable n'a été trouvé. ` +
      `Recommandation: consulter un agent local pour une estimation plus précise.`,
  };
}
