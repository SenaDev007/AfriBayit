// AfriBayit AVM — Market Data Aggregation
// Aggregates market statistics for property valuation context

import { db } from '@/lib/db';

export interface MarketStats {
  totalListings: number;
  averagePrice: number;
  medianPrice: number;
  pricePerM2: number;
  priceByType: Record<string, { avg: number; count: number; pricePerM2: number }>;
  priceByQuartier: Record<string, { avg: number; count: number }>;
  trend: 'rising' | 'stable' | 'declining';
  trendPercentage: number;
}

/**
 * Get market statistics for a specific area
 */
export async function getMarketStats(
  city: string,
  country: string,
  propertyType?: string
): Promise<MarketStats | null> {
  try {
    const where: Record<string, unknown> = {
      status: 'published',
      city,
      country,
    };
    if (propertyType) where.type = propertyType;

    const properties = await db.property.findMany({
      where,
      select: {
        price: true,
        surface: true,
        type: true,
        quartier: true,
        createdAt: true,
      },
      take: 200,
      orderBy: { createdAt: 'desc' },
    });

    if (properties.length === 0) return null;

    // Calculate aggregates
    const prices = properties.map((p) => p.price).sort((a, b) => a - b);
    const totalListings = prices.length;
    const averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / totalListings);
    const medianPrice = prices[Math.floor(totalListings / 2)];

    const validSurfaces = properties.filter((p) => p.surface > 0);
    const avgPricePerM2 = validSurfaces.length > 0
      ? Math.round(validSurfaces.reduce((sum, p) => sum + (p.price / p.surface), 0) / validSurfaces.length)
      : 0;

    // By type
    const priceByType: Record<string, { avg: number; count: number; pricePerM2: number }> = {};
    for (const p of properties) {
      if (!priceByType[p.type]) priceByType[p.type] = { avg: 0, count: 0, pricePerM2: 0 };
      priceByType[p.type].avg += p.price;
      priceByType[p.type].count += 1;
      if (p.surface > 0) priceByType[p.type].pricePerM2 += p.price / p.surface;
    }
    for (const key of Object.keys(priceByType)) {
      const entry = priceByType[key];
      entry.avg = Math.round(entry.avg / entry.count);
      entry.pricePerM2 = Math.round(entry.pricePerM2 / entry.count);
    }

    // By quartier
    const priceByQuartier: Record<string, { avg: number; count: number }> = {};
    for (const p of properties) {
      if (!priceByQuartier[p.quartier]) priceByQuartier[p.quartier] = { avg: 0, count: 0 };
      priceByQuartier[p.quartier].avg += p.price;
      priceByQuartier[p.quartier].count += 1;
    }
    for (const key of Object.keys(priceByQuartier)) {
      const entry = priceByQuartier[key];
      entry.avg = Math.round(entry.avg / entry.count);
    }

    // Trend analysis (simple: compare recent vs older)
    const halfPoint = Math.floor(properties.length / 2);
    const older = properties.slice(halfPoint);
    const newer = properties.slice(0, halfPoint);

    const avgOlder = older.reduce((s, p) => s + p.price, 0) / older.length;
    const avgNewer = newer.reduce((s, p) => s + p.price, 0) / newer.length;
    const change = ((avgNewer - avgOlder) / avgOlder) * 100;

    let trend: 'rising' | 'stable' | 'declining' = 'stable';
    let trendPercentage = 0;
    if (change > 3) { trend = 'rising'; trendPercentage = Math.round(change * 10) / 10; }
    else if (change < -3) { trend = 'declining'; trendPercentage = Math.round(change * 10) / 10; }

    return {
      totalListings,
      averagePrice,
      medianPrice,
      pricePerM2: avgPricePerM2,
      priceByType,
      priceByQuartier,
      trend,
      trendPercentage,
    };
  } catch (error) {
    console.error('Market stats error:', error);
    return null;
  }
}
