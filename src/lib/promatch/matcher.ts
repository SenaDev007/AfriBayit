// AfriBayit ProMatch — Artisan Matcher V2
// Finds and ranks artisans for a given job request
// Updated: uses V2 scoring with proximity 30%, specialty 25%, availability 20%, rating 15%, price 10%

import { db } from '@/lib/db';
import {
  calculateProMatchScore,
  matchArtisan,
  ArtisanData,
  MatchRequest,
  ProjectNeed,
  ScoredArtisan,
  RankedArtisan,
} from './scoring';

export type { ArtisanData, MatchRequest, ProjectNeed, ScoredArtisan, RankedArtisan } from './scoring';
export { matchArtisan, calculateProMatchScore } from './scoring';

/**
 * Find the best matching artisans for a job request
 */
export async function findMatchingArtisans(
  request: MatchRequest,
  maxResults = 10
): Promise<RankedArtisan[]> {
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

    // Build project need and use matchArtisan for ranked results
    const projectNeed: ProjectNeed = {
      description: request.jobDescription,
      requiredSkills: request.skills,
      city: request.city,
      country: request.country,
      lat: request.lat,
      lng: request.lng,
      emergency: request.emergency,
      maxBudget: request.maxBudget,
    };

    const ranked = matchArtisan(projectNeed, artisanDataList);

    return ranked.slice(0, maxResults);
  } catch (error) {
    console.error('ProMatch error:', error);
    return [];
  }
}
