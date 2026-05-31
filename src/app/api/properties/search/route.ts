import { NextResponse } from 'next/server';
import { searchProperties } from '@/lib/search';
import { applyBoostAlgorithm, type BoostableProperty } from '@/lib/search/boost-algorithm';
import type { SearchFilters } from '@/lib/search/filters';

export async function POST(request: Request) {
  try {
    const body = await request.json() as SearchFilters;

    // Validate and sanitize inputs
    const filters: SearchFilters = {
      query: typeof body.query === 'string' ? body.query : undefined,
      country: typeof body.country === 'string' ? body.country : undefined,
      city: typeof body.city === 'string' ? body.city : undefined,
      quartier: typeof body.quartier === 'string' ? body.quartier : undefined,
      type: Array.isArray(body.type) ? body.type : undefined,
      transaction: Array.isArray(body.transaction) ? body.transaction : undefined,
      priceMin: typeof body.priceMin === 'number' ? body.priceMin : undefined,
      priceMax: typeof body.priceMax === 'number' ? body.priceMax : undefined,
      currency: typeof body.currency === 'string' ? body.currency : undefined,
      surfaceMin: typeof body.surfaceMin === 'number' ? body.surfaceMin : undefined,
      surfaceMax: typeof body.surfaceMax === 'number' ? body.surfaceMax : undefined,
      bedroomsMin: typeof body.bedroomsMin === 'number' ? body.bedroomsMin : undefined,
      bedroomsMax: typeof body.bedroomsMax === 'number' ? body.bedroomsMax : undefined,
      bathroomsMin: typeof body.bathroomsMin === 'number' ? body.bathroomsMin : undefined,
      roomsMin: typeof body.roomsMin === 'number' ? body.roomsMin : undefined,
      hasPool: typeof body.hasPool === 'boolean' ? body.hasPool : undefined,
      hasGarden: typeof body.hasGarden === 'boolean' ? body.hasGarden : undefined,
      hasGarage: typeof body.hasGarage === 'boolean' ? body.hasGarage : undefined,
      hasAirCon: typeof body.hasAirCon === 'boolean' ? body.hasAirCon : undefined,
      hasSecurity: typeof body.hasSecurity === 'boolean' ? body.hasSecurity : undefined,
      furnished: typeof body.furnished === 'boolean' ? body.furnished : undefined,
      verified: typeof body.verified === 'boolean' ? body.verified : undefined,
      geoTrust: typeof body.geoTrust === 'boolean' ? body.geoTrust : undefined,
      premium: typeof body.premium === 'boolean' ? body.premium : undefined,
      investmentScoreMin: typeof body.investmentScoreMin === 'number' ? body.investmentScoreMin : undefined,
      roiMin: typeof body.roiMin === 'number' ? body.roiMin : undefined,
      publishedAfter: typeof body.publishedAfter === 'string' ? body.publishedAfter : undefined,
      bounds: body.bounds && typeof body.bounds === 'object' ? body.bounds : undefined,
      sortBy: typeof body.sortBy === 'string' ? body.sortBy as SearchFilters['sortBy'] : 'newest',
      page: typeof body.page === 'number' ? Math.max(1, body.page) : 1,
      limit: typeof body.limit === 'number' ? Math.min(100, Math.max(1, body.limit)) : 24,
    };

    // Determine if boost algorithm should be applied
    // Apply boost for default/relevance sorting, or when explicitly requested
    const applyBoost = !filters.sortBy || filters.sortBy === 'newest' || filters.sortBy === 'popular';

    const result = await searchProperties(filters);

    if (applyBoost && result.properties.length > 0) {
      // Convert search results to boostable properties
      const boostableProperties: BoostableProperty[] = result.properties.map(p => {
        let images: string[] = [];
        try { images = Array.isArray(p.images) ? p.images : []; } catch { images = []; }

        return {
          id: p.id,
          title: p.title,
          description: p.description,
          images,
          hasVR: p.hasVR,
          verified: p.verified,
          geoTrust: p.geoTrust,
          views: p.views,
          favorites: 0, // Not in search results, default to 0
          premium: p.premium,
          publishedAt: p.publishedAt,
          createdAt: p.createdAt,
          agentId: p.agent?.id || '',
          agentVerified: p.agent?.certified,
          agentCertified: p.agent?.certified,
          agentScore: undefined, // Would need additional query
          agentReviewCount: undefined,
          agentMemberSince: undefined,
          agentPremiumTier: undefined,
          legalDocsValidated: undefined,
          clickCount: undefined,
          contactCount: undefined,
        };
      });

      // Apply boost algorithm
      const boosted = applyBoostAlgorithm(
        boostableProperties,
        filters.query,
        filters.city,
        filters.type
      );

      // Map boost data back to search results
      const boostedResults = boosted.map(bp => {
        const original = result.properties.find(p => p.id === bp.id);
        if (!original) return null;
        return {
          ...original,
          boostScore: bp.boostScore,
          isSponsored: bp.isSponsored,
          sponsoredLabel: bp.sponsoredLabel,
          boostBreakdown: bp.boostBreakdown,
        };
      }).filter(Boolean);

      return NextResponse.json({
        ...result,
        properties: boostedResults,
        boostApplied: true,
      });
    }

    return NextResponse.json({
      ...result,
      boostApplied: false,
    });
  } catch (error) {
    console.error('Advanced search error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    );
  }
}
