// AfriBayit ProMatch — Artisan Matcher
// Finds and ranks artisans for a given job request

import { db } from '@/lib/db';
import { calculateProMatchScore, ArtisanData, MatchRequest, ScoredArtisan } from './scoring';

export type { ArtisanData, MatchRequest, ScoredArtisan } from './scoring';

/**
 * Find the best matching artisans for a job request
 */
export async function findMatchingArtisans(
  request: MatchRequest,
  maxResults = 10
): Promise<ScoredArtisan[]> {
  try {
    // Build search filter
    const where: Record<string, unknown> = { available: true };

    if (request.country) where.country = request.country;
    if (request.city) where.city = request.city;

    // Fetch candidate artisans
    const candidates = await db.artisan.findMany({
      where,
      take: 100,
      include: {
        services: true,
      },
    });

    // Convert to ArtisanData format
    const artisanDataList: ArtisanData[] = candidates.map((a) => ({
      id: a.id,
      userId: a.userId,
      trade: a.trade,
      specialties: (() => {
        try { return a.specialties ? JSON.parse(a.specialties) : [a.trade]; } catch { return [a.trade]; }
      })(),
      certified: a.certified,
      available: a.available,
      emergency: a.emergency,
      dailyRate: a.dailyRate,
      rating: a.rating,
      reviews: a.reviews,
      zone: a.zone,
      city: a.city,
      country: a.country,
      responseTime: a.responseTime,
      completedMissions: a.completedMissions,
      lat: null, // Artisan model doesn't have lat/lng, would need user join
      lng: null,
    }));

    // Score each artisan
    const scored = artisanDataList.map((artisan) =>
      calculateProMatchScore(artisan, request)
    );

    // Sort by total score descending
    return scored
      .filter((s) => s.totalScore > 0.1) // Filter out very low scores
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, maxResults);
  } catch (error) {
    console.error('ProMatch error:', error);
    return [];
  }
}
