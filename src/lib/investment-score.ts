// AfriBayit — Investment Score Algorithm
// Calculates a 0-100 investment score for properties based on weighted factors

import { db } from '@/lib/db';

interface InvestmentScoreInput {
  propertyId: string;
  price: number;
  surface: number;
  type: string;
  transaction: string;
  city: string;
  country: string;
  quartier: string;
  views: number;
  favorites: number;
  createdAt: Date;
  verified: boolean;
  geoTrust: boolean;
}

interface InvestmentScoreResult {
  total: number;
  breakdown: {
    location: number;       // 0-30
    priceCompetitiveness: number; // 0-25
    rentalYield: number;    // 0-20
    appreciationTrend: number; // 0-15
    liquidity: number;      // 0-10
  };
}

// Average rental yields by country and property type (annual %)
const RENTAL_YIELD_ESTIMATES: Record<string, Record<string, number>> = {
  BJ: { villa: 6.5, appartement: 7.2, terrain: 3.0, bureau: 8.0, commerce: 8.5, chambre: 9.0, guesthouse: 10.0 },
  CI: { villa: 6.0, appartement: 7.5, terrain: 3.5, bureau: 8.5, commerce: 9.0, chambre: 9.5, guesthouse: 10.5 },
  BF: { villa: 5.5, appartement: 6.5, terrain: 2.5, bureau: 7.0, commerce: 7.5, chambre: 8.0, guesthouse: 9.0 },
  TG: { villa: 6.0, appartement: 7.0, terrain: 3.0, bureau: 7.5, commerce: 8.0, chambre: 8.5, guesthouse: 9.5 },
};

// Popular quartiers by city (higher = more desirable)
const QUARTIER_POPULARITY: Record<string, Record<string, number>> = {
  Cotonou: { 'Ganhi': 90, 'Haie Vive': 85, 'Fidjrosse': 80, 'Cadjèhoun': 85, 'Akpakpa': 60, 'Aïbatin': 70, 'Zogbo': 65 },
  Abidjan: { 'Cocody': 95, 'Marcory': 85, 'Plateau': 90, 'Yopougon': 55, 'Deux Plateaux': 92, 'Riviera': 88 },
  Ouagadougou: { 'Ouaga 2000': 85, 'Koulouba': 80, 'Patte d\'Oie': 75, 'Cissin': 70 },
  Lomé: { 'Tokoin': 80, 'Bè': 70, 'Aflao': 55, 'Kodjoviakopé': 75 },
};

export async function calculateInvestmentScore(input: InvestmentScoreInput): Promise<InvestmentScoreResult> {
  const [locationScore, priceScore, rentalScore, appreciationScore, liquidityScore] = await Promise.all([
    calculateLocationScore(input),
    calculatePriceCompetitiveness(input),
    calculateRentalYieldScore(input),
    calculateAppreciationTrend(input),
    calculateLiquidityScore(input),
  ]);

  const total = Math.min(100, Math.max(0,
    locationScore +
    priceScore +
    rentalScore +
    appreciationScore +
    liquidityScore
  ));

  return {
    total: Math.round(total),
    breakdown: {
      location: Math.round(locationScore),
      priceCompetitiveness: Math.round(priceScore),
      rentalYield: Math.round(rentalScore),
      appreciationTrend: Math.round(appreciationScore),
      liquidity: Math.round(liquidityScore),
    },
  };
}

// 30% weight — Location score based on quartier popularity and infrastructure
async function calculateLocationScore(input: InvestmentScoreInput): Promise<number> {
  let score = 15; // base score

  // Quartier popularity
  const cityQuartiers = QUARTIER_POPULARITY[input.city];
  if (cityQuartiers && cityQuartiers[input.quartier]) {
    score = (cityQuartiers[input.quartier] / 100) * 30;
  }

  // Verified/GeoTrust bonus
  if (input.verified) score += 1;
  if (input.geoTrust) score += 1;

  // Capital cities bonus
  const capitalCities = ['Cotonou', 'Abidjan', 'Ouagadougou', 'Lomé', 'Porto-Novo', 'Yamoussoukro'];
  if (capitalCities.includes(input.city)) score += 2;

  return Math.min(30, score);
}

// 25% weight — Price competitiveness vs market average
async function calculatePriceCompetitiveness(input: InvestmentScoreInput): Promise<number> {
  try {
    // Get market average for same type/city
    const avgResult = await db.property.aggregate({
      where: {
        type: input.type,
        city: input.city,
        country: input.country,
        status: 'published',
        surface: { gte: input.surface * 0.5, lte: input.surface * 2 },
      },
      _avg: { price: true },
      _count: true,
    });

    const avgPrice = avgResult._avg.price;
    if (!avgPrice || avgResult._count < 3) {
      // Not enough data — give neutral score
      return 12;
    }

    const pricePerSqm = input.price / input.surface;
    const avgPerSqm = avgPrice / input.surface;

    // Score inversely proportional to price (cheaper = better)
    if (pricePerSqm <= avgPerSqm * 0.7) return 25;     // Great deal
    if (pricePerSqm <= avgPerSqm * 0.85) return 22;     // Good deal
    if (pricePerSqm <= avgPerSqm * 0.95) return 18;     // Fair
    if (pricePerSqm <= avgPerSqm * 1.05) return 15;     // Market rate
    if (pricePerSqm <= avgPerSqm * 1.15) return 12;     // Slightly above
    if (pricePerSqm <= avgPerSqm * 1.30) return 8;      // Above market
    return 5; // Significantly above market
  } catch {
    return 12;
  }
}

// 20% weight — Rental yield potential
async function calculateRentalYieldScore(input: InvestmentScoreInput): Promise<number> {
  const countryYields = RENTAL_YIELD_ESTIMATES[input.country];
  if (!countryYields) return 10;

  const estimatedYield = countryYields[input.type] || 6;

  // Score based on yield
  if (estimatedYield >= 9) return 20;
  if (estimatedYield >= 8) return 18;
  if (estimatedYield >= 7) return 16;
  if (estimatedYield >= 6) return 13;
  if (estimatedYield >= 5) return 10;
  if (estimatedYield >= 4) return 7;
  return 4;
}

// 15% weight — Area price appreciation trend
async function calculateAppreciationTrend(input: InvestmentScoreInput): Promise<number> {
  try {
    // Check recent vs older listings in same area
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [recent, older] = await Promise.all([
      db.property.aggregate({
        where: {
          city: input.city,
          country: input.country,
          type: input.type,
          status: 'published',
          createdAt: { gte: threeMonthsAgo },
        },
        _avg: { price: true },
        _count: true,
      }),
      db.property.aggregate({
        where: {
          city: input.city,
          country: input.country,
          type: input.type,
          status: 'published',
          createdAt: { gte: sixMonthsAgo, lt: threeMonthsAgo },
        },
        _avg: { price: true },
        _count: true,
      }),
    ]);

    const recentAvg = recent._avg.price;
    const olderAvg = older._avg.price;

    if (!recentAvg || !olderAvg || older._count < 2 || recent._count < 2) {
      return 7; // Neutral score if not enough data
    }

    const trend = ((recentAvg - olderAvg) / olderAvg) * 100;

    // Appreciation is positive for investment
    if (trend >= 10) return 15;  // Strong appreciation
    if (trend >= 5) return 13;   // Good appreciation
    if (trend >= 2) return 11;   // Moderate appreciation
    if (trend >= 0) return 8;    // Stable
    if (trend >= -5) return 5;   // Slight decline
    return 3; // Significant decline
  } catch {
    return 7;
  }
}

// 10% weight — Liquidity (how quickly properties sell in area)
async function calculateLiquidityScore(input: InvestmentScoreInput): Promise<number> {
  try {
    // Count how many properties in this area were recently marked as sold/rented
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [soldRecently, totalInArea] = await Promise.all([
      db.property.count({
        where: {
          city: input.city,
          country: input.country,
          type: input.type,
          status: { in: ['sold', 'rented'] },
          updatedAt: { gte: thirtyDaysAgo },
        },
      }),
      db.property.count({
        where: {
          city: input.city,
          country: input.country,
          type: input.type,
          status: 'published',
        },
      }),
    ]);

    if (totalInArea === 0) return 5;

    const liquidityRatio = soldRecently / totalInArea;

    if (liquidityRatio >= 0.3) return 10;  // Very liquid
    if (liquidityRatio >= 0.2) return 8;   // Good liquidity
    if (liquidityRatio >= 0.1) return 6;   // Moderate
    if (liquidityRatio >= 0.05) return 4;  // Slow
    return 2; // Very slow market
  } catch {
    return 5;
  }
}

// Utility: batch calculate investment scores for existing properties
export async function batchCalculateInvestmentScores() {
  const properties = await db.property.findMany({
    where: { status: 'published', investmentScore: null },
    select: {
      id: true,
      price: true,
      surface: true,
      type: true,
      transaction: true,
      city: true,
      country: true,
      quartier: true,
      views: true,
      favorites: true,
      createdAt: true,
      verified: true,
      geoTrust: true,
    },
    take: 50,
  });

  const results = [];
  for (const prop of properties) {
    const score = await calculateInvestmentScore(prop);
    await db.property.update({
      where: { id: prop.id },
      data: { investmentScore: score.total },
    });
    results.push({ id: prop.id, score: score.total });
  }

  return results;
}

// Get score label
export function getInvestmentScoreLabel(score: number | null): { label: string; color: string } {
  if (score === null || score === undefined) return { label: 'N/A', color: 'text-gray-400' };
  if (score >= 80) return { label: 'Excellent', color: 'text-[#00A651]' };
  if (score >= 60) return { label: 'Bon', color: 'text-[#00A651]' };
  if (score >= 40) return { label: 'Moyen', color: 'text-[#D4AF37]' };
  if (score >= 20) return { label: 'Faible', color: 'text-orange-500' };
  return { label: 'Très faible', color: 'text-red-500' };
}
