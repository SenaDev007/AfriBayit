// AfriBayit AVM — Weighted Scoring Engine
// CDC §4.3 — Automated Valuation Model with weighted factors
//
// Weights:
//   Location score (quartier avg price vs asking) — 30%
//   Market trends (price/sqm in city, historical) — 25%
//   Property features (bedrooms, surface, type)  — 20%
//   Verification status (verified, geoTrust)     — 15%
//   Market demand (views, favorites in area)     — 10%

import { db } from '@/lib/db';

// ============ Types ============

export interface AVMInput {
  propertyId?: string;
  type: string;
  transaction: string;
  price: number;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  country: string;
  quartier: string;
  lat?: number | null;
  lng?: number | null;
  verified: boolean;
  geoTrust: boolean;
  views: number;
  favorites: number;
  features?: string[];
}

export interface AVMFactor {
  name: string;
  weight: number;
  score: number;       // 0-100 normalized
  contribution: number; // weighted score
  detail: string;
}

export interface AVMScore {
  estimatedValue: number;
  confidenceScore: number;  // 0-100
  pricePerSqm: number;
  comparableCount: number;
  factors: AVMFactor[];
  marketTrend: 'rising' | 'stable' | 'declining';
  trendPercentage: number;
  range: { low: number; high: number };
}

// ============ Reference Data ============

/** Average price per m² in XOF by type and country */
const BASE_PRICE_PER_SQM: Record<string, Record<string, number>> = {
  villa:       { BJ: 350000, CI: 450000, BF: 250000, TG: 300000 },
  appartement: { BJ: 400000, CI: 550000, BF: 280000, TG: 350000 },
  terrain:     { BJ: 50000,  CI: 80000,  BF: 30000,  TG: 45000 },
  bureau:      { BJ: 300000, CI: 400000, BF: 200000, TG: 250000 },
  commerce:    { BJ: 350000, CI: 500000, BF: 220000, TG: 280000 },
  chambre:     { BJ: 200000, CI: 250000, BF: 150000, TG: 180000 },
  guesthouse:  { BJ: 280000, CI: 380000, BF: 200000, TG: 240000 },
};

/** Rental multiplier: monthly rent ≈ price * multiplier */
const RENTAL_MULTIPLIER: Record<string, number> = {
  achat: 0,               // not applicable
  location: 0.005,        // ~0.5% of sale price per month
  investissement: 0.005,
  location_courte_duree: 0.012, // higher yield for short-term
};

// ============ Main Function ============

/**
 * Calculate AVM score for a property using weighted factors.
 * Pulls comparable properties from the database for market analysis.
 */
export async function calculateAVM(input: AVMInput): Promise<AVMScore> {
  // Fetch comparable properties from the same city/quartier
  const { comparables, comparableCount, avgPricePerSqm, marketTrend, trendPercentage } =
    await fetchComparableData(input);

  // Calculate each weighted factor
  const locationFactor = calculateLocationFactor(input, comparables, avgPricePerSqm);
  const marketFactor = calculateMarketFactor(input, avgPricePerSqm, marketTrend, trendPercentage);
  const featuresFactor = calculateFeaturesFactor(input);
  const verificationFactor = calculateVerificationFactor(input);
  const demandFactor = await calculateDemandFactor(input);

  const factors: AVMFactor[] = [
    locationFactor,
    marketFactor,
    featuresFactor,
    verificationFactor,
    demandFactor,
  ];

  // Weighted total score (0-100)
  const totalScore = factors.reduce((sum, f) => sum + f.contribution, 0);

  // Estimate value based on market data and weighted score
  const basePricePerSqm = getBasePricePerSqm(input.type, input.country);
  const transactionMult = input.transaction === 'location'
    ? RENTAL_MULTIPLIER.location
    : input.transaction === 'location_courte_duree'
      ? RENTAL_MULTIPLIER.location_courte_duree
      : 1;

  // Adjusted price per m² using market data and scoring
  const adjustedPricePerSqm = avgPricePerSqm > 0
    ? avgPricePerSqm * (0.7 + 0.3 * (totalScore / 100))
    : basePricePerSqm * (0.7 + 0.3 * (totalScore / 100));

  const estimatedValue = Math.round(adjustedPricePerSqm * input.surface * transactionMult);

  // Confidence: based on number of comparables, data quality
  const confidenceScore = calculateConfidence(comparableCount, input, comparables);

  // Range based on confidence
  const marginPct = (100 - confidenceScore) / 2;
  const range = {
    low: Math.round(estimatedValue * (1 - marginPct / 100)),
    high: Math.round(estimatedValue * (1 + marginPct / 100)),
  };

  return {
    estimatedValue,
    confidenceScore,
    pricePerSqm: Math.round(adjustedPricePerSqm),
    comparableCount,
    factors,
    marketTrend,
    trendPercentage,
    range,
  };
}

// ============ Factor Calculators ============

/**
 * 30% — Location score: compares quartier avg price vs asking price
 */
function calculateLocationFactor(
  input: AVMInput,
  comparables: ComparableSummary[],
  avgPricePerSqm: number
): AVMFactor {
  let score = 50; // neutral start
  const detail: string[] = [];

  if (avgPricePerSqm > 0 && input.surface > 0) {
    const askingPerSqm = input.price / input.surface;
    const ratio = askingPerSqm / avgPricePerSqm;

    // Score inversely proportional to overpricing
    if (ratio <= 0.7) { score = 95; detail.push('Prix bien en dessous du marché'); }
    else if (ratio <= 0.85) { score = 85; detail.push('Prix en dessous du marché'); }
    else if (ratio <= 1.0) { score = 75; detail.push('Prix aligné sur le marché'); }
    else if (ratio <= 1.15) { score = 55; detail.push('Prix légèrement au-dessus du marché'); }
    else if (ratio <= 1.3) { score = 35; detail.push('Prix au-dessus du marché'); }
    else { score = 15; detail.push('Prix bien au-dessus du marché'); }

    detail.push(`Prix demandé: ${formatXOF(askingPerSqm)}/m² vs moyenne quartier: ${formatXOF(avgPricePerSqm)}/m²`);
  } else {
    detail.push('Données de quartier insuffisantes — score neutre');
  }

  // Bonus for quartier with high comp count (well-established area)
  if (comparables.length >= 10) { score = Math.min(score + 5, 100); detail.push('Quartier bien documenté'); }

  return {
    name: 'Localisation',
    weight: 30,
    score: Math.round(score),
    contribution: Math.round(score * 0.30),
    detail: detail.join('. '),
  };
}

/**
 * 25% — Market trends: price/sqm in city, historical data
 */
function calculateMarketFactor(
  input: AVMInput,
  avgPricePerSqm: number,
  trend: 'rising' | 'stable' | 'declining',
  trendPct: number
): AVMFactor {
  let score = 50;
  const detail: string[] = [];

  // Trend direction scoring
  if (trend === 'rising') {
    score = trendPct >= 10 ? 90 : trendPct >= 5 ? 80 : 70;
    detail.push(`Marché en hausse (+${trendPct}%)`);
  } else if (trend === 'stable') {
    score = 60;
    detail.push('Marché stable');
  } else {
    score = trendPct <= -10 ? 20 : trendPct <= -5 ? 30 : 40;
    detail.push(`Marché en baisse (${trendPct}%)`);
  }

  // City-level market size bonus
  const citySizes: Record<string, number> = {
    'Cotonou': 80, 'Abidjan': 90, 'Ouagadougou': 65, 'Lomé': 70,
    'Porto-Novo': 55, 'Yamoussoukro': 50, 'Bobo-Dioulasso': 55,
    'Bouaké': 50, 'Kara': 45,
  };
  const cityScore = citySizes[input.city] || 45;
  score = Math.round(score * 0.7 + cityScore * 0.3);
  detail.push(`Dynamisme marché ${input.city}: ${cityScore}/100`);

  if (avgPricePerSqm > 0) {
    detail.push(`Prix moyen ville: ${formatXOF(avgPricePerSqm)}/m²`);
  }

  return {
    name: 'Tendance marché',
    weight: 25,
    score: Math.round(score),
    contribution: Math.round(score * 0.25),
    detail: detail.join('. '),
  };
}

/**
 * 20% — Property features: bedrooms, surface, type
 */
function calculateFeaturesFactor(input: AVMInput): AVMFactor {
  let score = 50;
  const detail: string[] = [];

  // Surface adequacy (too small or too large relative to type)
  const idealSurfaces: Record<string, { min: number; max: number }> = {
    appartement: { min: 40, max: 200 },
    villa: { min: 80, max: 500 },
    terrain: { min: 100, max: 10000 },
    bureau: { min: 30, max: 300 },
    commerce: { min: 30, max: 500 },
    chambre: { min: 15, max: 50 },
    guesthouse: { min: 60, max: 400 },
  };

  const ideal = idealSurfaces[input.type] || idealSurfaces.villa;
  if (input.surface >= ideal.min && input.surface <= ideal.max) {
    score += 20;
    detail.push(`Surface ${input.surface}m² adaptée pour ${input.type}`);
  } else if (input.surface < ideal.min) {
    score -= 10;
    detail.push(`Surface ${input.surface}m² en dessous de la norme pour ${input.type}`);
  } else {
    score += 10;
    detail.push(`Surface ${input.surface}m² généreuse pour ${input.type}`);
  }

  // Bedroom count scoring (type-appropriate)
  const idealBedrooms: Record<string, number> = {
    appartement: 2, villa: 3, chambre: 1, bureau: 0, commerce: 0, terrain: 0, guesthouse: 4,
  };
  const target = idealBedrooms[input.type] ?? 2;
  if (input.bedrooms >= target) {
    score += 15;
    detail.push(`${input.bedrooms} chambres (conforme)`);
  } else {
    score -= 5;
    detail.push(`${input.bedrooms} chambres (attendu: ${target}+)`);
  }

  // Bathroom ratio
  if (input.bedrooms > 0) {
    const bathRatio = input.bathrooms / input.bedrooms;
    if (bathRatio >= 0.5) { score += 10; detail.push('Bon ratio salles de bain'); }
    else { score -= 5; detail.push('Ratio salles de bain insuffisant'); }
  }

  // Feature bonuses
  const premiumFeatures = ['piscine', 'jardin', 'garage', 'climatisation', 'meuble', 'terrasse', 'security'];
  const inputFeatures = (input.features || []).map(f => String(f).toLowerCase());
  const matchCount = premiumFeatures.filter(pf => inputFeatures.some(if_ => if_.includes(pf))).length;
  score += matchCount * 3;
  if (matchCount > 0) detail.push(`${matchCount} caractéristiques premium`);

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Caractéristiques',
    weight: 20,
    score: Math.round(score),
    contribution: Math.round(score * 0.20),
    detail: detail.join('. '),
  };
}

/**
 * 15% — Verification status (verified, geoTrust)
 */
function calculateVerificationFactor(input: AVMInput): AVMFactor {
  let score = 30; // base for unverified
  const detail: string[] = [];

  if (input.verified) {
    score += 30;
    detail.push('Bien vérifié AfriBayit');
  } else {
    detail.push('Bien non vérifié');
  }

  if (input.geoTrust) {
    score += 40;
    detail.push('Certification GeoTrust');
  } else {
    detail.push('Sans certification GeoTrust');
  }

  return {
    name: 'Vérification',
    weight: 15,
    score: Math.min(Math.round(score), 100),
    contribution: Math.min(Math.round(score * 0.15), 15),
    detail: detail.join('. '),
  };
}

/**
 * 10% — Market demand (views, favorites in area)
 */
async function calculateDemandFactor(input: AVMInput): Promise<AVMFactor> {
  let score = 50;
  const detail: string[] = [];

  try {
    // Get average views/favorites for comparable properties in the area
    const areaStats = await db.property.aggregate({
      where: {
        city: input.city,
        country: input.country,
        type: input.type,
        status: 'published',
      },
      _avg: { views: true, favorites: true },
      _count: true,
    });

    const avgViews = areaStats._avg.views || 0;
    const avgFavs = areaStats._avg.favorites || 0;

    // Compare this property's engagement vs area average
    if (avgViews > 0) {
      const viewsRatio = input.views / avgViews;
      if (viewsRatio >= 2) { score += 20; detail.push(`Très demandé (${input.views} vues vs moy. ${Math.round(avgViews)})`); }
      else if (viewsRatio >= 1) { score += 10; detail.push(`Demande normale (${input.views} vues)`); }
      else { score -= 5; detail.push(`Peu de vues (${input.views} vs moy. ${Math.round(avgViews)})`); }
    } else {
      detail.push(`${input.views} vues`);
      if (input.views >= 50) score += 10;
    }

    if (avgFavs > 0) {
      const favRatio = input.favorites / avgFavs;
      if (favRatio >= 2) { score += 15; detail.push(`Favoris élevés (${input.favorites})`); }
      else if (favRatio >= 1) { score += 5; detail.push(`${input.favorites} favoris`); }
    } else {
      detail.push(`${input.favorites} favoris`);
      if (input.favorites >= 10) score += 5;
    }
  } catch {
    // Fallback: use raw views/favorites
    if (input.views >= 100) score += 15;
    else if (input.views >= 30) score += 5;
    if (input.favorites >= 20) score += 10;
    else if (input.favorites >= 5) score += 5;
    detail.push(`${input.views} vues, ${input.favorites} favoris`);
  }

  score = Math.max(0, Math.min(100, score));

  return {
    name: 'Demande marché',
    weight: 10,
    score: Math.round(score),
    contribution: Math.round(score * 0.10),
    detail: detail.join('. '),
  };
}

// ============ Helper Functions ============

interface ComparableSummary {
  id: string;
  price: number;
  surface: number;
  pricePerSqm: number;
  quartier: string;
  city: string;
  createdAt: Date;
  verified: boolean;
  geoTrust: boolean;
}

async function fetchComparableData(input: AVMInput): Promise<{
  comparables: ComparableSummary[];
  comparableCount: number;
  avgPricePerSqm: number;
  marketTrend: 'rising' | 'stable' | 'declining';
  trendPercentage: number;
}> {
  try {
    const surfaceTolerance = 0.3;
    const candidates = await db.property.findMany({
      where: {
        status: 'published',
        type: input.type,
        transaction: input.transaction,
        country: input.country,
        surface: {
          gte: input.surface * (1 - surfaceTolerance),
          lte: input.surface * (1 + surfaceTolerance),
        },
      },
      select: {
        id: true,
        price: true,
        surface: true,
        quartier: true,
        city: true,
        createdAt: true,
        verified: true,
        geoTrust: true,
      },
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    const comparables: ComparableSummary[] = candidates
      .filter(c => c.surface > 0)
      .map(c => ({
        id: c.id,
        price: c.price,
        surface: c.surface,
        pricePerSqm: c.price / c.surface,
        quartier: c.quartier,
        city: c.city,
        createdAt: c.createdAt,
        verified: c.verified,
        geoTrust: c.geoTrust,
      }));

    const comparableCount = comparables.length;

    // Weighted average price per m² (quartier-matching gets higher weight)
    let totalWeight = 0;
    let weightedSum = 0;
    for (const c of comparables) {
      const weight = c.quartier.toLowerCase() === input.quartier.toLowerCase() ? 3 : 1;
      weightedSum += c.pricePerSqm * weight;
      totalWeight += weight;
    }
    const avgPricePerSqm = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Market trend
    let marketTrend: 'rising' | 'stable' | 'declining' = 'stable';
    let trendPercentage = 0;
    if (comparables.length >= 4) {
      const sorted = [...comparables].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const half = Math.floor(sorted.length / 2);
      const older = sorted.slice(0, half);
      const newer = sorted.slice(half);
      const avgOlder = older.reduce((s, c) => s + c.pricePerSqm, 0) / older.length;
      const avgNewer = newer.reduce((s, c) => s + c.pricePerSqm, 0) / newer.length;
      if (avgOlder > 0) {
        const change = ((avgNewer - avgOlder) / avgOlder) * 100;
        trendPercentage = Math.round(change * 10) / 10;
        if (change > 3) marketTrend = 'rising';
        else if (change < -3) marketTrend = 'declining';
      }
    }

    return { comparables, comparableCount, avgPricePerSqm, marketTrend, trendPercentage };
  } catch {
    return { comparables: [], comparableCount: 0, avgPricePerSqm: 0, marketTrend: 'stable', trendPercentage: 0 };
  }
}

function calculateConfidence(
  comparableCount: number,
  input: AVMInput,
  comparables: ComparableSummary[]
): number {
  let confidence = 30;

  // More comparables = higher confidence
  if (comparableCount >= 10) confidence += 25;
  else if (comparableCount >= 5) confidence += 18;
  else if (comparableCount >= 3) confidence += 12;
  else if (comparableCount >= 1) confidence += 5;

  // Verification boosts confidence
  if (input.verified) confidence += 8;
  if (input.geoTrust) confidence += 7;

  // Verified comparables boost
  const verifiedComps = comparables.filter(c => c.verified).length;
  if (comparableCount > 0) {
    confidence += Math.round((verifiedComps / comparableCount) * 10);
  }

  // Coordinate data boosts confidence
  if (input.lat && input.lng) confidence += 5;

  return Math.min(Math.max(confidence, 10), 95);
}

function getBasePricePerSqm(type: string, country: string): number {
  const typePrices = BASE_PRICE_PER_SQM[type] || BASE_PRICE_PER_SQM.villa;
  return typePrices[country] || typePrices.BJ || 300000;
}

function formatXOF(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value));
}
