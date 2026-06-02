// AfriBayit — POST /api/properties/search
// Advanced property search with boost algorithm
// Also supports multi-model search via the `modelType` parameter

import { NextResponse } from 'next/server';
import { searchProperties } from '@/lib/search';
import { searchDocuments, type SearchModelType, TYPE_LABELS, ALL_TYPES } from '@/lib/search/elasticsearch';
import { applyBoostAlgorithm, type BoostableProperty } from '@/lib/search/boost-algorithm';
import type { SearchFilters } from '@/lib/search/filters';

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;

    // Check if this is a multi-model search request
    const modelType = body.modelType as SearchModelType | SearchModelType[] | undefined;

    // If modelType is specified and it's not just 'property', use multi-model search
    if (modelType && (Array.isArray(modelType) ? !modelType.every(t => t === 'property') : modelType !== 'property')) {
      return handleMultiModelSearch(body, modelType);
    }

    // Validate and sanitize inputs for property search
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
      bounds: body.bounds && typeof body.bounds === 'object' ? body.bounds as SearchFilters['bounds'] : undefined,
      sortBy: typeof body.sortBy === 'string' ? body.sortBy as SearchFilters['sortBy'] : 'newest',
      page: typeof body.page === 'number' ? Math.max(1, body.page) : 1,
      limit: typeof body.limit === 'number' ? Math.min(100, Math.max(1, body.limit)) : 24,
    };

    // Determine if boost algorithm should be applied
    const applyBoost = !filters.sortBy || filters.sortBy === 'newest' || filters.sortBy === 'popular';

    const result = await searchProperties(filters);

    if (applyBoost && result.properties.length > 0) {
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
          favorites: 0,
          premium: p.premium,
          publishedAt: p.publishedAt,
          createdAt: p.createdAt,
          agentId: p.agent?.id || '',
          agentVerified: p.agent?.certified,
          agentCertified: p.agent?.certified,
        };
      });

      const boosted = applyBoostAlgorithm(
        boostableProperties,
        filters.query,
        filters.city,
        filters.type
      );

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
    console.error('Erreur de recherche avancée:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche' },
      { status: 500 }
    );
  }
}

/**
 * Handle multi-model search using the enhanced Elasticsearch module
 */
async function handleMultiModelSearch(
  body: Record<string, unknown>,
  modelType: SearchModelType | SearchModelType[]
): Promise<NextResponse> {
  const types = Array.isArray(modelType) ? modelType : [modelType];

  // Validate types
  for (const t of types) {
    if (!ALL_TYPES.includes(t)) {
      return NextResponse.json(
        {
          error: 'Type de recherche invalide',
          message: `Le type "${t}" n'est pas supporté. Types valides: ${ALL_TYPES.join(', ')}`,
          validTypes: ALL_TYPES,
        },
        { status: 400 }
      );
    }
  }

  const searchResult = await searchDocuments(
    typeof body.query === 'string' ? body.query : '',
    {
      query: typeof body.query === 'string' ? body.query : undefined,
      type: types,
      country: typeof body.country === 'string' ? body.country : undefined,
      city: typeof body.city === 'string' ? body.city : undefined,
      minPrice: typeof body.priceMin === 'number' ? body.priceMin : undefined,
      maxPrice: typeof body.priceMax === 'number' ? body.priceMax : undefined,
      sortBy: typeof body.sortBy === 'string' ? body.sortBy as any : 'relevance',
      page: typeof body.page === 'number' ? Math.max(1, body.page) : 1,
      limit: typeof body.limit === 'number' ? Math.min(100, Math.max(1, body.limit)) : 24,
      certified: typeof body.certified === 'boolean' ? body.certified : undefined,
      stars: typeof body.stars === 'number' ? body.stars : undefined,
      category: typeof body.category === 'string' ? body.category : undefined,
      level: typeof body.level === 'string' ? body.level : undefined,
    },
    typeof body.country === 'string' ? body.country : undefined
  );

  // Build grouped response
  const groupedResults: Record<string, unknown> = {};
  for (const type of types) {
    const docs = searchResult.groupedByType[type];
    groupedResults[type] = {
      label: TYPE_LABELS[type],
      count: searchResult.typeCounts[type],
      items: docs || [],
    };
  }

  return NextResponse.json({
    // Unified flat list (paginated)
    results: searchResult.documents,
    total: searchResult.total,
    page: searchResult.page,
    limit: searchResult.limit,
    totalPages: searchResult.pages,

    // Grouped by type
    groupedByType: groupedResults,
    typeCounts: searchResult.typeCounts,

    // Facets for filtering UI
    facets: searchResult.facets,

    // Search metadata
    modelTypes: types,
    boostApplied: false,
  });
}
