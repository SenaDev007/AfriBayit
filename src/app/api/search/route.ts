// AfriBayit — GET /api/search
// Full-text search with PostgreSQL tsvector/tsquery
// Supports: query, filters, pagination, auto-suggest

import { NextRequest, NextResponse } from 'next/server';
import { buildSearchQuery, autoComplete, getSearchSuggestions } from '@/lib/search/fulltext';
import type { SearchFilters } from '@/lib/search/fulltext';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse search parameters
    const q = searchParams.get('q') || undefined;
    const country = searchParams.get('country') || undefined;
    const type = searchParams.get('type') || undefined;
    const transaction = searchParams.get('transaction') || undefined;
    const priceMin = searchParams.get('priceMin')
      ? Number(searchParams.get('priceMin')) : undefined;
    const priceMax = searchParams.get('priceMax')
      ? Number(searchParams.get('priceMax')) : undefined;
    const city = searchParams.get('city') || undefined;
    const quartier = searchParams.get('quartier') || undefined;
    const bedrooms = searchParams.get('bedrooms')
      ? Number(searchParams.get('bedrooms')) : undefined;
    const bathrooms = searchParams.get('bathrooms')
      ? Number(searchParams.get('bathrooms')) : undefined;
    const surfaceMin = searchParams.get('surfaceMin')
      ? Number(searchParams.get('surfaceMin')) : undefined;
    const surfaceMax = searchParams.get('surfaceMax')
      ? Number(searchParams.get('surfaceMax')) : undefined;
    const verified = searchParams.get('verified') === 'true' ? true :
                     searchParams.get('verified') === 'false' ? false : undefined;
    const geoTrust = searchParams.get('geoTrust') === 'true' ? true :
                     searchParams.get('geoTrust') === 'false' ? false : undefined;
    const premium = searchParams.get('premium') === 'true' ? true :
                    searchParams.get('premium') === 'false' ? false : undefined;
    const sortBy = (searchParams.get('sortBy') as SearchFilters['sortBy']) || 'relevance';
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20));

    // Auto-suggest mode — returns matching cities, quartiers, and property titles
    const suggest = searchParams.get('suggest');
    if (suggest === 'true' && q) {
      const suggestions = await autoComplete(q, country, limit);
      return NextResponse.json({
        query: q,
        suggestions,
      });
    }

    // Quick suggestions for "did you mean" when no results
    const suggestOnly = searchParams.get('suggestOnly');
    if (suggestOnly === 'true' && q) {
      const suggestions = await getSearchSuggestions(q);
      return NextResponse.json({
        query: q,
        suggestions,
      });
    }

    // Build and execute the search query
    const filters: SearchFilters = {
      q,
      country,
      type,
      transaction,
      priceMin,
      priceMax,
      city,
      quartier,
      bedrooms,
      bathrooms,
      surfaceMin,
      surfaceMax,
      verified,
      geoTrust,
      premium,
      sortBy,
      page,
      limit,
    };

    const results = await buildSearchQuery(filters);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET /api/search error:', error);
    return NextResponse.json(
      {
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        query: '',
        filters: {},
      },
      { status: 500 }
    );
  }
}
