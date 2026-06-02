// AfriBayit — Investment Score Algorithm V2
// CDC §4.4 — Scoring d'investissement IA
//
// Score 0-100 based on:
//   - Rental yield potential     — 25%
//   - Price appreciation trend   — 25%
//   - Vacancy risk              — 15%
//   - Liquidity                 — 15%
//   - Infrastructure development — 20%
//
// Returns: { score, grade (A+ to F), factors, projectedROI }

import { db } from '@/lib/db';

// ============ Types ============

export interface InvestmentScoreInput {
  propertyId?: string;
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

export interface InvestmentFactor {
  name: string;
  weight: number;
  score: number;       // 0-100 normalized
  contribution: number; // weighted score
  detail: string;
}

export type InvestmentGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

export interface InvestmentScoreResult {
  score: number;                    // 0-100
  grade: InvestmentGrade;
  factors: InvestmentFactor[];
  projectedROI: {
    oneYear: number;    // % projected return after 1 year
    threeYear: number;  // % projected return after 3 years
    fiveYear: number;   // % projected return after 5 years
  };
  rentalYieldEstimate: number; // annual % yield
  riskAssessment: 'low' | 'medium' | 'high';
}

// ============ Reference Data ============

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

// Infrastructure development scores by city
const INFRA_SCORES: Record<string, number> = {
  'Cotonou': 75, 'Abidjan': 85, 'Ouagadougou': 60, 'Lomé': 65,
  'Porto-Novo': 50, 'Yamoussoukro': 55, 'Bobo-Dioulasso': 50,
  'Bouaké': 45, 'Kara': 40, 'Parakou': 45, 'Natitingou': 35,
};

// Vacancy risk by type (lower = better, less vacancy)
const VACANCY_RISK_BY_TYPE: Record<string, number> = {
  appartement: 15,   // 15% average vacancy
  villa: 20,
  chambre: 10,
  commerce: 25,
  bureau: 30,
  terrain: 50,       // land has no rental income -> high "vacancy"
  guesthouse: 20,
};

// ============ Main Function ============

export async function calculateInvestmentScore(input: InvestmentScoreInput): Promise<InvestmentScoreResult> {
  const [rentalFactor, appreciationFactor, vacancyFactor, liquidityFactor, infraFactor] = await Promise.all([
    calculateRentalYieldFactor(input),
    calculateAppreciationFactor(input),
    calculateVacancyRiskFactor(input),
    calculateLiquidityFactor(input),
    calculateInfrastructureFactor(input),
  ]);

  const factors: InvestmentFactor[] = [
    rentalFactor,
    appreciationFactor,
    vacancyFactor,
    liquidityFactor,
    infraFactor,
  ];

  const score = Math.min(100, Math.max(0, factors.reduce((sum, f) => sum + f.contribution, 0)));

  // Determine grade
  const grade = scoreToGrade(score);

  // Calculate projected ROI
  const rentalYield = getEstimatedRentalYield(input);
  const appreciationRate = getEstimatedAppreciationRate(appreciationFactor.score);
  const projectedROI = calculateProjectedROI(rentalYield, appreciationRate, vacancyFactor.score);

  // Risk assessment
  const riskAssessment = score >= 70 ? 'low' : score >= 40 ? 'medium' : 'high';

  return {
    score: Math.round(score),
    grade,
    factors,
    projectedROI,
    rentalYieldEstimate: rentalYield,
    riskAssessment,
  };
}

// Keep backward compatibility
export interface LegacyInvestmentScoreResult {
  total: number;
  breakdown: {
    location: number;
    priceCompetitiveness: number;
    rentalYield: number;
    appreciationTrend: number;
    liquidity: number;
  };
}

export async function calculateLegacyInvestmentScore(input: InvestmentScoreInput): Promise<LegacyInvestmentScoreResult> {
  const result = await calculateInvestmentScore(input);
  return {
    total: result.score,
    breakdown: {
      location: result.factors[4]?.contribution || 0,  // infrastructure
      priceCompetitiveness: 0,
      rentalYield: result.factors[0]?.contribution || 0,
      appreciationTrend: result.factors[1]?.contribution || 0,
      liquidity: result.factors[3]?.contribution || 0,
    },
  };
}

// ============ Factor Calculators ============

/**
 * 25% — Rental yield potential
 */
async function calculateRentalYieldFactor(input: InvestmentScoreInput): Promise<InvestmentFactor> {
  const rentalYield = getEstimatedRentalYield(input);
  let score = 50;
  const detail: string[] = [];

  if (rentalYield >= 9) { score = 95; detail.push(`Rendement locatif excellent (${rentalYield}%)`); }
  else if (rentalYield >= 7) { score = 80; detail.push(`Rendement locatif bon (${rentalYield}%)`); }
  else if (rentalYield >= 5) { score = 60; detail.push(`Rendement locatif moyen (${rentalYield}%)`); }
  else if (rentalYield >= 3) { score = 40; detail.push(`Rendement locatif faible (${rentalYield}%)`); }
  else { score = 20; detail.push(`Rendement locatif très faible (${rentalYield}%)`); }

  // Adjust based on actual market data if available
  try {
    const areaRentalCount = await db.property.count({
      where: {
        city: input.city,
        country: input.country,
        type: input.type,
        transaction: 'location',
        status: 'published',
      },
    });
    if (areaRentalCount >= 5) {
      score = Math.min(score + 5, 100);
      detail.push(`Marché locatif actif (${areaRentalCount} annonces)`);
    } else if (areaRentalCount === 0) {
      score = Math.max(score - 10, 0);
      detail.push('Aucune annonce locative dans la zone');
    }
  } catch {
    // ignore DB errors
  }

  return {
    name: 'Rendement locatif',
    weight: 25,
    score: Math.round(score),
    contribution: Math.round(score * 0.25),
    detail: detail.join('. '),
  };
}

/**
 * 25% — Price appreciation trend
 */
async function calculateAppreciationFactor(input: InvestmentScoreInput): Promise<InvestmentFactor> {
  let score = 50;
  const detail: string[] = [];

  try {
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

    if (recentAvg && olderAvg && older._count >= 2 && recent._count >= 2) {
      const trend = ((recentAvg - olderAvg) / olderAvg) * 100;

      if (trend >= 10) { score = 95; detail.push(`Forte appréciation (+${trend.toFixed(1)}%)`); }
      else if (trend >= 5) { score = 80; detail.push(`Bonne appréciation (+${trend.toFixed(1)}%)`); }
      else if (trend >= 2) { score = 65; detail.push(`Appréciation modérée (+${trend.toFixed(1)}%)`); }
      else if (trend >= 0) { score = 50; detail.push('Marché stable'); }
      else if (trend >= -5) { score = 35; detail.push(`Légère baisse (${trend.toFixed(1)}%)`); }
      else { score = 15; detail.push(`Baisse significative (${trend.toFixed(1)}%)`); }
    } else {
      detail.push('Données historiques insuffisantes');
    }
  } catch {
    detail.push('Données indisponibles');
  }

  return {
    name: 'Appréciation prix',
    weight: 25,
    score: Math.round(score),
    contribution: Math.round(score * 0.25),
    detail: detail.join('. '),
  };
}

/**
 * 15% — Vacancy risk (inverse: lower vacancy = higher score)
 */
async function calculateVacancyRiskFactor(input: InvestmentScoreInput): Promise<InvestmentFactor> {
  let baseVacancy = VACANCY_RISK_BY_TYPE[input.type] ?? 25;
  const detail: string[] = [];

  // Adjust for quartier desirability
  const cityQuartiers = QUARTIER_POPULARITY[input.city];
  if (cityQuartiers && cityQuartiers[input.quartier]) {
    const popularity = cityQuartiers[input.quartier];
    // Popular quartiers have lower vacancy
    baseVacancy = baseVacancy * (1 - popularity / 200);
  }

  // Adjust for market activity
  try {
    const activeListings = await db.property.count({
      where: {
        city: input.city,
        country: input.country,
        type: input.type,
        transaction: 'location',
        status: 'published',
      },
    });
    if (activeListings >= 10) baseVacancy *= 0.8; // active market = lower vacancy
    else if (activeListings <= 2) baseVacancy *= 1.2; // low market = higher vacancy
  } catch {
    // ignore
  }

  // Convert vacancy risk to score (lower vacancy = higher score)
  const score = Math.max(0, Math.min(100, 100 - baseVacancy));

  detail.push(`Risque de vacance estimé: ${Math.round(baseVacancy)}%`);
  if (baseVacancy <= 10) detail.push('Risque très faible');
  else if (baseVacancy <= 20) detail.push('Risque modéré');
  else detail.push('Risque élevé');

  return {
    name: 'Risque vacance',
    weight: 15,
    score: Math.round(score),
    contribution: Math.round(score * 0.15),
    detail: detail.join('. '),
  };
}

/**
 * 15% — Liquidity (how quickly properties sell/rent in area)
 */
async function calculateLiquidityFactor(input: InvestmentScoreInput): Promise<InvestmentFactor> {
  let score = 50;
  const detail: string[] = [];

  try {
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

    if (totalInArea > 0) {
      const liquidityRatio = soldRecently / totalInArea;
      if (liquidityRatio >= 0.3) { score = 95; detail.push('Marché très liquide'); }
      else if (liquidityRatio >= 0.2) { score = 80; detail.push('Bonne liquidité'); }
      else if (liquidityRatio >= 0.1) { score = 60; detail.push('Liquidité modérée'); }
      else if (liquidityRatio >= 0.05) { score = 40; detail.push('Liquidité faible'); }
      else { score = 20; detail.push('Marché très peu liquide'); }
      detail.push(`${soldRecently} biens vendus/loués sur ${totalInArea} en 30j`);
    } else {
      score = 30;
      detail.push('Aucune donnée de liquidité');
    }
  } catch {
    detail.push('Données indisponibles');
  }

  return {
    name: 'Liquidité',
    weight: 15,
    score: Math.round(score),
    contribution: Math.round(score * 0.15),
    detail: detail.join('. '),
  };
}

/**
 * 20% — Infrastructure development in the area
 */
async function calculateInfrastructureFactor(input: InvestmentScoreInput): Promise<InvestmentFactor> {
  let score = INFRA_SCORES[input.city] || 40;
  const detail: string[] = [];

  detail.push(`Score infrastructure ${input.city}: ${score}/100`);

  // Quartier popularity acts as proxy for infrastructure
  const cityQuartiers = QUARTIER_POPULARITY[input.city];
  if (cityQuartiers && cityQuartiers[input.quartier]) {
    const qScore = cityQuartiers[input.quartier];
    score = Math.round(score * 0.6 + qScore * 0.4);
    detail.push(`Quartier ${input.quartier}: ${qScore}/100`);
  }

  // Capital cities bonus
  const capitalCities = ['Cotonou', 'Abidjan', 'Ouagadougou', 'Lomé', 'Porto-Novo', 'Yamoussoukro'];
  if (capitalCities.includes(input.city)) {
    score = Math.min(score + 5, 100);
    detail.push('Capitale / ville principale');
  }

  // GeoTrust verification signals better infrastructure documentation
  if (input.geoTrust) {
    score = Math.min(score + 5, 100);
    detail.push('Documentation GeoTrust disponible');
  }

  // New development areas (identified by high recent listing count)
  try {
    const recentListings = await db.property.count({
      where: {
        quartier: input.quartier,
        city: input.city,
        country: input.country,
        status: 'published',
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
    });
    if (recentListings >= 5) {
      score = Math.min(score + 8, 100);
      detail.push(`Zone en développement (${recentListings} nouvelles annonces)`);
    }
  } catch {
    // ignore
  }

  return {
    name: 'Infrastructure',
    weight: 20,
    score: Math.round(score),
    contribution: Math.round(score * 0.20),
    detail: detail.join('. '),
  };
}

// ============ Utility Functions ============

function getEstimatedRentalYield(input: InvestmentScoreInput): number {
  const countryYields = RENTAL_YIELD_ESTIMATES[input.country];
  if (!countryYields) return 5;
  return countryYields[input.type] || 5;
}

function getEstimatedAppreciationRate(appreciationScore: number): number {
  // Convert 0-100 score to estimated annual appreciation %
  // score 90+ → ~8%, score 50 → ~3%, score 20 → -2%
  return Math.round(((appreciationScore - 30) / 10) * 10) / 10;
}

function calculateProjectedROI(
  rentalYield: number,
  appreciationRate: number,
  vacancyScore: number
): { oneYear: number; threeYear: number; fiveYear: number } {
  const vacancyImpact = (100 - vacancyScore) / 100 * 0.5; // vacancy reduces ROI
  const netRentalYield = rentalYield * (1 - vacancyImpact);
  const oneYear = Math.round((netRentalYield + appreciationRate) * 10) / 10;
  const threeYear = Math.round((oneYear * 3 + appreciationRate * 2) * 10) / 10; // compounding approximation
  const fiveYear = Math.round((oneYear * 5 + appreciationRate * 6) * 10) / 10;  // compounding approximation
  return { oneYear, threeYear, fiveYear };
}

function scoreToGrade(score: number): InvestmentGrade {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B+';
  if (score >= 65) return 'B';
  if (score >= 55) return 'C+';
  if (score >= 45) return 'C';
  if (score >= 25) return 'D';
  return 'F';
}

// ============ Batch & Label Utilities ============

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
      data: { investmentScore: score.score },
    });
    results.push({ id: prop.id, score: score.score, grade: score.grade });
  }

  return results;
}

// Get score label
export function getInvestmentScoreLabel(score: number | null): { label: string; color: string; grade: InvestmentGrade } {
  if (score === null || score === undefined) return { label: 'N/A', color: 'text-gray-400', grade: 'F' };
  const grade = scoreToGrade(score);
  const colorMap: Record<InvestmentGrade, string> = {
    'A+': 'text-[#00A651]',
    'A': 'text-[#00A651]',
    'B+': 'text-[#00A651]',
    'B': 'text-[#D4AF37]',
    'C+': 'text-[#D4AF37]',
    'C': 'text-[#D4AF37]',
    'D': 'text-orange-500',
    'F': 'text-red-500',
  };
  return { label: grade, color: colorMap[grade], grade };
}
