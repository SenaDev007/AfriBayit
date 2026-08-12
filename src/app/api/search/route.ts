// AfriBayit — GET /api/search
// Multi-model full-text search with PostgreSQL tsvector/tsquery
// Supports: Property, Hotel, Guesthouse, Artisan, Course
// Features: query, filters, pagination, auto-suggest, type grouping

import { NextRequest, NextResponse } from 'next/server';
import { searchDocuments, type SearchModelType, TYPE_LABELS, ALL_TYPES } from '@/lib/search/elasticsearch';
import { buildSearchQuery, autoComplete, getSearchSuggestions } from '@/lib/search/fulltext';
import type { SearchFilters as FulltextFilters } from '@/lib/search/fulltext';

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
    const stars = searchParams.get('stars') ? Number(searchParams.get('stars')) : undefined;
    const certified = searchParams.get('certified') === 'true' ? true : undefined;
    const category = searchParams.get('category') || undefined;
    const level = searchParams.get('level') || undefined;
    const sortBy = searchParams.get('sortBy') as 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'popular' || 'relevance';
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

    // Validate type parameter
    const validTypes: SearchModelType[] = ALL_TYPES;
    const requestedType = type as SearchModelType | undefined;
    if (requestedType && !validTypes.includes(requestedType)) {
      return NextResponse.json(
        {
          error: 'Type de recherche invalide',
          validTypes,
          message: `Le type "${type}" n'est pas supporté. Types valides: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // ── Multi-model search using the enhanced Elasticsearch module ──
    const searchResult = await searchDocuments(q || '', {
      query: q,
      type: requestedType,
      country,
      city,
      minPrice: priceMin,
      maxPrice: priceMax,
      sortBy,
      page,
      limit,
      stars,
      certified,
      category,
      level,
    }, country);

    // Build response with grouped results by type
    const groupedResults: Record<string, unknown> = {};
    const groupedByType = searchResult.groupedByType || {};
    const typeCounts = searchResult.typeCounts || {};
    for (const modelType of validTypes) {
      const docs = groupedByType[modelType];
      if (docs && docs.length > 0) {
        groupedResults[modelType] = {
          label: TYPE_LABELS[modelType],
          count: typeCounts[modelType],
          items: docs,
        };
      }
    }

    return NextResponse.json({
      // Unified flat list (paginated)
      results: searchResult.documents,
      total: searchResult.total,
      page: searchResult.page,
      limit: searchResult.limit,
      totalPages: searchResult.pages,
      query: q || '',
      filters: {
        type: requestedType || 'all',
        country,
        city,
        priceMin,
        priceMax,
      },

      // Grouped by type
      groupedByType: groupedResults,
      typeCounts: typeCounts,

      // Facets for filtering UI
      facets: searchResult.facets,
    });
  } catch (error) {
    console.error('GET /api/search erreur:', error);
    return NextResponse.json(
      {
        error: 'La recherche a échoué',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
        query: '',
        filters: {},
        groupedByType: {},
        typeCounts: {},
      },
      { status: 500 }
    );
  }
}
