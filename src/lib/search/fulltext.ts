// AfriBayit — PostgreSQL Full-Text Search Engine
// Uses tsvector/tsquery with French language configuration for property search
// Supports: relevance ranking (ts_rank), fuzzy matching (pg_trgm similarity),
// combined filters, and auto-suggest

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// ============ Types ============

export interface SearchFilters {
  q?: string;              // Search query string
  country?: string;        // BJ, CI, BF, TG, SN
  type?: string;           // villa, appartement, terrain, bureau, commerce, chambre, guesthouse
  transaction?: string;    // achat, location, investissement, location_courte_duree
  priceMin?: number;
  priceMax?: number;
  city?: string;
  quartier?: string;
  bedrooms?: number;
  bathrooms?: number;
  surfaceMin?: number;
  surfaceMax?: number;
  rooms?: number;
  verified?: boolean;
  geoTrust?: boolean;
  premium?: boolean;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'surface_desc';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  slug: string | null;
  type: string;
  transaction: string;
  price: number;
  currency: string;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  country: string;
  quartier: string;
  address: string | null;
  description: string;
  images: string | null;
  verified: boolean;
  geoTrust: boolean;
  premium: boolean;
  investmentScore: number | null;
  publishedAt: Date | null;
  relevanceScore: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  filters: SearchFilters;
  suggestions?: string[];
}

// ============ Full-Text Search Builder ============

/**
 * Build and execute a full-text search query using PostgreSQL tsvector/tsquery.
 * Combines relevance ranking with structured filters.
 */
export async function buildSearchQuery(
  filters: SearchFilters
): Promise<SearchResponse> {
  const {
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
    rooms,
    verified,
    geoTrust,
    premium,
    sortBy = 'relevance',
    page = 1,
    limit = 20,
  } = filters;

  const offset = (page - 1) * limit;
  const hasTextQuery = !!q && q.trim().length > 0;

  // Build WHERE clause conditions
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Only search published properties
  conditions.push(`p.status = 'published'`);

  // Full-text search condition
  if (hasTextQuery) {
    // Use to_tsquery with prefix matching for partial words
    // French configuration since most content is in French
    const sanitizedQuery = sanitizeTsQuery(q!);
    conditions.push(`(
      p."searchVector" @@ to_tsquery('french', $${paramIndex})
      OR p.title ILIKE $${paramIndex + 1}
      OR p.description ILIKE $${paramIndex + 1}
      OR p.city ILIKE $${paramIndex + 1}
      OR p.quartier ILIKE $${paramIndex + 1}
    )`);
    params.push(sanitizedQuery);
    params.push(`%${q!.trim()}%`);
    paramIndex += 2;
  }

  // Country filter
  if (country) {
    conditions.push(`p.country = $${paramIndex}`);
    params.push(country.toUpperCase());
    paramIndex++;
  }

  // Type filter
  if (type) {
    conditions.push(`p.type = $${paramIndex}`);
    params.push(type);
    paramIndex++;
  }

  // Transaction type filter
  if (transaction) {
    conditions.push(`p.transaction = $${paramIndex}`);
    params.push(transaction);
    paramIndex++;
  }

  // Price range
  if (priceMin !== undefined) {
    conditions.push(`p.price >= $${paramIndex}`);
    params.push(priceMin);
    paramIndex++;
  }
  if (priceMax !== undefined) {
    conditions.push(`p.price <= $${paramIndex}`);
    params.push(priceMax);
    paramIndex++;
  }

  // City filter (case-insensitive)
  if (city) {
    conditions.push(`p.city ILIKE $${paramIndex}`);
    params.push(`%${city}%`);
    paramIndex++;
  }

  // Quartier filter
  if (quartier) {
    conditions.push(`p.quartier ILIKE $${paramIndex}`);
    params.push(`%${quartier}%`);
    paramIndex++;
  }

  // Bedrooms
  if (bedrooms !== undefined) {
    conditions.push(`p.bedrooms >= $${paramIndex}`);
    params.push(bedrooms);
    paramIndex++;
  }

  // Bathrooms
  if (bathrooms !== undefined) {
    conditions.push(`p.bathrooms >= $${paramIndex}`);
    params.push(bathrooms);
    paramIndex++;
  }

  // Surface range
  if (surfaceMin !== undefined) {
    conditions.push(`p.surface >= $${paramIndex}`);
    params.push(surfaceMin);
    paramIndex++;
  }
  if (surfaceMax !== undefined) {
    conditions.push(`p.surface <= $${paramIndex}`);
    params.push(surfaceMax);
    paramIndex++;
  }

  // Rooms
  if (rooms !== undefined) {
    conditions.push(`p.rooms >= $${paramIndex}`);
    params.push(rooms);
    paramIndex++;
  }

  // Verified
  if (verified !== undefined) {
    conditions.push(`p.verified = $${paramIndex}`);
    params.push(verified);
    paramIndex++;
  }

  // GeoTrust
  if (geoTrust !== undefined) {
    conditions.push(`p."geoTrust" = $${paramIndex}`);
    params.push(geoTrust);
    paramIndex++;
  }

  // Premium
  if (premium !== undefined) {
    conditions.push(`p.premium = $${paramIndex}`);
    params.push(premium);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Build ORDER BY clause
  let orderByClause: string;
  if (hasTextQuery && sortBy === 'relevance') {
    // Use ts_rank for relevance scoring when there's a text query
    const sanitizedQuery = sanitizeTsQuery(q!);
    orderByClause = `
      CASE
        WHEN p."searchVector" IS NOT NULL THEN ts_rank(p."searchVector", to_tsquery('french', '${sanitizedQuery.replace(/'/g, "''")}'))
        ELSE 0
      END DESC,
      CASE
        WHEN p.title ILIKE '%${q!.replace(/'/g, "''")}%' THEN 2
        WHEN p.city ILIKE '%${q!.replace(/'/g, "''")}%' THEN 1.5
        ELSE 0
      END DESC,
      p.premium DESC,
      p.views DESC
    `;
  } else {
    switch (sortBy) {
      case 'price_asc':
        orderByClause = 'p.price ASC';
        break;
      case 'price_desc':
        orderByClause = 'p.price DESC';
        break;
      case 'newest':
        orderByClause = 'p."publishedAt" DESC NULLS LAST, p."createdAt" DESC';
        break;
      case 'surface_desc':
        orderByClause = 'p.surface DESC';
        break;
      default:
        orderByClause = 'p.premium DESC, p.views DESC, p."createdAt" DESC';
    }
  }

  // Build the relevance score expression for the SELECT clause
  let relevanceExpression = '0';
  if (hasTextQuery) {
    const sanitizedQuery = sanitizeTsQuery(q!);
    relevanceExpression = `
      COALESCE(
        ts_rank(p."searchVector", to_tsquery('french', '${sanitizedQuery.replace(/'/g, "''")}')),
        0
      ) * 10 +
      CASE WHEN p.title ILIKE '%${q!.replace(/'/g, "''")}%' THEN 5 ELSE 0 END +
      CASE WHEN p.city ILIKE '%${q!.replace(/'/g, "''")}%' THEN 3 ELSE 0 END +
      CASE WHEN p.quartier ILIKE '%${q!.replace(/'/g, "''")}%' THEN 2 ELSE 0 END +
      CASE WHEN p.premium THEN 1 ELSE 0 END
    `;
  }

  // Count query
  const countQuery = `
    SELECT COUNT(*) as total
    FROM properties p
    WHERE ${whereClause}
  `;

  // Main search query
  const searchQuery = `
    SELECT
      p.id,
      p.title,
      p.slug,
      p.type,
      p.transaction,
      p.price,
      p.currency,
      p.surface,
      p.rooms,
      p.bedrooms,
      p.bathrooms,
      p.city,
      p.country,
      p.quartier,
      p.address,
      p.description,
      p.images,
      p.verified,
      p."geoTrust",
      p.premium,
      p."investmentScore",
      p."publishedAt",
      (${relevanceExpression}) as "relevanceScore"
    FROM properties p
    WHERE ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit);
  params.push(offset);

  try {
    // Execute both queries in parallel
    const [countResult, searchResult] = await Promise.all([
      db.$queryRawUnsafe(countQuery, ...params.slice(0, -2)),
      db.$queryRawUnsafe(searchQuery, ...params),
    ]);

    const total = Number((countResult as any[])?.[0]?.total || 0);
    const results = (searchResult as any[]).map((row: any) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      type: row.type,
      transaction: row.transaction,
      price: Number(row.price),
      currency: row.currency,
      surface: Number(row.surface),
      rooms: Number(row.rooms),
      bedrooms: Number(row.bedrooms),
      bathrooms: Number(row.bathrooms),
      city: row.city,
      country: row.country,
      quartier: row.quartier,
      address: row.address,
      description: row.description,
      images: row.images,
      verified: row.verified,
      geoTrust: row.geoTrust,
      premium: row.premium,
      investmentScore: row.investmentScore,
      publishedAt: row.publishedAt,
      relevanceScore: Number(row.relevanceScore),
    }));

    // Get suggestions if there's a text query
    let suggestions: string[] | undefined;
    if (hasTextQuery && results.length === 0) {
      suggestions = await getSearchSuggestions(q!);
    }

    return {
      results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      query: q || '',
      filters,
      suggestions,
    };
  } catch (error) {
    console.error('Full-text search error:', error);
    // Fallback to basic Prisma query on error
    return fallbackSearch(filters);
  }
}

// ============ Fuzzy / Auto-Suggest ============

/**
 * Get search suggestions using pg_trgm similarity for fuzzy matching.
 * Returns city names, quartier names, hotel names, artisan trades, and course titles
 * that are similar to the query — across ALL models.
 */
export async function getSearchSuggestions(query: string): Promise<string[]> {
  if (!query || query.trim().length < 2) return [];

  const sanitizedQuery = query.trim().replace(/'/g, "''");

  try {
    // Try using similarity from pg_trgm (if extension is available)
    // Multi-model suggestions
    const result = await db.$queryRawUnsafe(`
      SELECT DISTINCT city AS suggestion, similarity(city, '${sanitizedQuery}') AS sim
      FROM properties
      WHERE status = 'published'
        AND similarity(city, '${sanitizedQuery}') > 0.1
      UNION ALL
      SELECT DISTINCT quartier AS suggestion, similarity(quartier, '${sanitizedQuery}') AS sim
      FROM properties
      WHERE status = 'published'
        AND similarity(quartier, '${sanitizedQuery}') > 0.1
      UNION ALL
      SELECT DISTINCT title AS suggestion, similarity(title, '${sanitizedQuery}') AS sim
      FROM properties
      WHERE status = 'published'
        AND similarity(title, '${sanitizedQuery}') > 0.2
      UNION ALL
      SELECT DISTINCT name AS suggestion, similarity(name, '${sanitizedQuery}') AS sim
      FROM hotels
      WHERE status = 'active'
        AND similarity(name, '${sanitizedQuery}') > 0.2
      UNION ALL
      SELECT DISTINCT name AS suggestion, similarity(name, '${sanitizedQuery}') AS sim
      FROM guesthouses
      WHERE status = 'active'
        AND similarity(name, '${sanitizedQuery}') > 0.2
      UNION ALL
      SELECT DISTINCT trade AS suggestion, similarity(trade, '${sanitizedQuery}') AS sim
      FROM artisans
      WHERE available = true
        AND similarity(trade, '${sanitizedQuery}') > 0.2
      UNION ALL
      SELECT DISTINCT title AS suggestion, similarity(title, '${sanitizedQuery}') AS sim
      FROM courses
      WHERE published = true
        AND similarity(title, '${sanitizedQuery}') > 0.2
      ORDER BY sim DESC
      LIMIT 15
    `);

    return (result as any[]).map((row: any) => row.suggestion);
  } catch {
    // pg_trgm not available — use simple ILIKE fallback
    try {
      const result = await db.$queryRawUnsafe(`
        SELECT DISTINCT city AS suggestion
        FROM properties
        WHERE status = 'published' AND city ILIKE '%${sanitizedQuery}%'
        LIMIT 5
        UNION ALL
        SELECT DISTINCT quartier AS suggestion
        FROM properties
        WHERE status = 'published' AND quartier ILIKE '%${sanitizedQuery}%'
        LIMIT 5
        UNION ALL
        SELECT DISTINCT name AS suggestion
        FROM hotels
        WHERE status = 'active' AND name ILIKE '%${sanitizedQuery}%'
        LIMIT 3
        UNION ALL
        SELECT DISTINCT name AS suggestion
        FROM guesthouses
        WHERE status = 'active' AND name ILIKE '%${sanitizedQuery}%'
        LIMIT 3
        UNION ALL
        SELECT DISTINCT trade AS suggestion
        FROM artisans
        WHERE available = true AND trade ILIKE '%${sanitizedQuery}%'
        LIMIT 3
        UNION ALL
        SELECT DISTINCT title AS suggestion
        FROM courses
        WHERE published = true AND title ILIKE '%${sanitizedQuery}%'
        LIMIT 3
      `);

      return (result as any[]).map((row: any) => row.suggestion);
    } catch {
      return [];
    }
  }
}

/**
 * Auto-suggest endpoint: returns matching cities, quartiers, and titles across ALL models.
 * Used for the search bar typeahead.
 * Includes: properties, hotels, guesthouses, artisans, courses
 */
export async function autoComplete(
  query: string,
  country?: string,
  limit = 8
): Promise<{
  cities: string[];
  quartiers: string[];
  titles: { id: string; title: string; slug: string | null; type?: string }[];
}> {
  if (!query || query.trim().length < 2) {
    return { cities: [], quartiers: [], titles: [] };
  }

  const sanitizedQuery = query.trim();
  const params: any[] = [];
  let paramIndex = 1;

  const countryFilter = country
    ? `AND country = $${paramIndex++}`
    : '';
  if (country) params.push(country);

  params.push(`%${sanitizedQuery}%`);
  const likeParam = `$${paramIndex}`;

  try {
    // Cities and quartiers from properties, hotels, guesthouses
    const [cities, quartiers, propertyTitles, hotelTitles, guesthouseTitles, artisanTitles, courseTitles] = await Promise.all([
      // Cities from properties + hotels + guesthouses
      db.$queryRawUnsafe(`
        SELECT DISTINCT city FROM (
          SELECT city FROM properties WHERE status = 'published' ${countryFilter} AND city ILIKE ${likeParam}
          UNION ALL
          SELECT city FROM hotels WHERE status = 'active' ${countryFilter} AND city ILIKE ${likeParam}
          UNION ALL
          SELECT city FROM guesthouses WHERE status = 'active' ${countryFilter} AND city ILIKE ${likeParam}
        ) sub
        ORDER BY city
        LIMIT ${limit}
      `, ...params),
      // Quartiers from properties + guesthouses
      db.$queryRawUnsafe(`
        SELECT DISTINCT quartier FROM (
          SELECT quartier FROM properties WHERE status = 'published' ${countryFilter} AND quartier ILIKE ${likeParam}
          UNION ALL
          SELECT quartier FROM guesthouses WHERE status = 'active' ${countryFilter} AND quartier ILIKE ${likeParam}
        ) sub
        ORDER BY quartier
        LIMIT ${limit}
      `, ...params),
      // Property titles
      db.$queryRawUnsafe(`
        SELECT id, title, slug FROM properties
        WHERE status = 'published' ${countryFilter} AND title ILIKE ${likeParam}
        ORDER BY premium DESC, views DESC
        LIMIT ${limit}
      `, ...params),
      // Hotel names
      db.$queryRawUnsafe(`
        SELECT id, name AS title, slug FROM hotels
        WHERE status = 'active' ${countryFilter} AND name ILIKE ${likeParam}
        ORDER BY rating DESC
        LIMIT ${limit}
      `, ...params),
      // Guesthouse names
      db.$queryRawUnsafe(`
        SELECT id, name AS title, slug FROM guesthouses
        WHERE status = 'active' ${countryFilter} AND name ILIKE ${likeParam}
        ORDER BY overall_rating DESC
        LIMIT ${limit}
      `, ...params),
      // Artisan trades
      db.$queryRawUnsafe(`
        SELECT id, trade AS title, NULL AS slug FROM artisans
        WHERE available = true ${countryFilter} AND trade ILIKE ${likeParam}
        ORDER BY rating DESC
        LIMIT ${limit}
      `, ...params),
      // Course titles
      db.$queryRawUnsafe(`
        SELECT id, title, slug FROM courses
        WHERE published = true ${countryFilter} AND title ILIKE ${likeParam}
        ORDER BY rating DESC
        LIMIT ${limit}
      `, ...params),
    ]);

    // Merge titles from all models with type label
    const allTitles: { id: string; title: string; slug: string | null; type?: string }[] = [
      ...(propertyTitles as any[]).map((r: any) => ({ id: r.id, title: r.title, slug: r.slug, type: 'property' })),
      ...(hotelTitles as any[]).map((r: any) => ({ id: r.id, title: r.title, slug: r.slug, type: 'hotel' })),
      ...(guesthouseTitles as any[]).map((r: any) => ({ id: r.id, title: r.title, slug: r.slug, type: 'guesthouse' })),
      ...(artisanTitles as any[]).map((r: any) => ({ id: r.id, title: r.title, slug: r.slug, type: 'artisan' })),
      ...(courseTitles as any[]).map((r: any) => ({ id: r.id, title: r.title, slug: r.slug, type: 'course' })),
    ].slice(0, limit);

    return {
      cities: (cities as any[]).map((r: any) => r.city),
      quartiers: (quartiers as any[]).map((r: any) => r.quartier),
      titles: allTitles,
    };
  } catch {
    return { cities: [], quartiers: [], titles: [] };
  }
}

// ============ Helpers ============

/**
 * Sanitize a search query for use with to_tsquery.
 * Converts user input to a PostgreSQL tsquery-compatible format.
 * - Splits words and joins with & (AND)
 * - Adds prefix matching (:*) for partial word matches
 * - Removes special characters
 */
function sanitizeTsQuery(query: string): string {
  return query
    .trim()
    .replace(/[^\w\sàâäéèêëïîôùûüÿçœæÀÂÄÉÈÊËÏÎÔÙÛÜŸÇŒÆ-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0)
    .map(word => `${word}:*`)
    .join(' & ');
}

/**
 * Fallback search using Prisma ORM when raw SQL fails.
 * Less feature-rich but always works.
 */
async function fallbackSearch(filters: SearchFilters): Promise<SearchResponse> {
  const {
    q, country, type, transaction, priceMin, priceMax,
    city, quartier, bedrooms, bathrooms, surfaceMin, surfaceMax,
    rooms, verified, geoTrust, premium,
    sortBy = 'relevance', page = 1, limit = 20,
  } = filters;

  const where: Prisma.PropertyWhereInput = {
    status: 'published',
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { city: { contains: q, mode: 'insensitive' } },
      { quartier: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (country) where.country = country.toUpperCase();
  if (type) where.type = type;
  if (transaction) where.transaction = transaction;
  if (priceMin !== undefined || priceMax !== undefined) {
    where.price = {};
    if (priceMin !== undefined) (where.price as any).gte = priceMin;
    if (priceMax !== undefined) (where.price as any).lte = priceMax;
  }
  if (city) where.city = { contains: city, mode: 'insensitive' };
  if (quartier) where.quartier = { contains: quartier, mode: 'insensitive' };
  if (bedrooms !== undefined) where.bedrooms = { gte: bedrooms };
  if (bathrooms !== undefined) where.bathrooms = { gte: bathrooms };
  if (rooms !== undefined) where.rooms = { gte: rooms };
  if (surfaceMin !== undefined || surfaceMax !== undefined) {
    where.surface = {};
    if (surfaceMin !== undefined) (where.surface as any).gte = surfaceMin;
    if (surfaceMax !== undefined) (where.surface as any).lte = surfaceMax;
  }
  if (verified !== undefined) where.verified = verified;
  if (geoTrust !== undefined) where.geoTrust = geoTrust;
  if (premium !== undefined) where.premium = premium;

  const orderBy: Prisma.PropertyOrderByWithRelationInput =
    sortBy === 'price_asc' ? { price: 'asc' } :
    sortBy === 'price_desc' ? { price: 'desc' } :
    sortBy === 'newest' ? { publishedAt: { sort: 'desc', nulls: 'last' } } :
    sortBy === 'surface_desc' ? { surface: 'desc' } :
    { premium: 'desc', views: 'desc', createdAt: 'desc' };

  const [results, total] = await Promise.all([
    db.property.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, title: true, slug: true, type: true, transaction: true,
        price: true, currency: true, surface: true, rooms: true,
        bedrooms: true, bathrooms: true, city: true, country: true,
        quartier: true, address: true, description: true, images: true,
        verified: true, geoTrust: true, premium: true,
        investmentScore: true, publishedAt: true,
      },
    }),
    db.property.count({ where }),
  ]);

  return {
    results: results.map(p => ({
      ...p,
      relevanceScore: 0,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    query: q || '',
    filters,
  };
}
