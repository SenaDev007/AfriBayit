// AfriBayit — Elasticsearch Integration (Multi-Model)
// Provides Elasticsearch-compatible interface with graceful fallback to Prisma search
// Searches across: Property, Hotel, Guesthouse, Artisan, Course
// In production, swap to real Elasticsearch for full-text search capabilities

import { db } from '@/lib/db';

// ============ Types ============

export type SearchModelType = 'property' | 'hotel' | 'guesthouse' | 'artisan' | 'course';

export interface SearchDocument {
  id: string;
  type: SearchModelType;
  title: string;
  description: string;
  city: string;
  quartier: string;
  country: string;
  price: number;
  features: string[];
  createdAt: string;
  // Model-specific enriched fields
  image?: string | null;
  rating?: number;
  stars?: number;
  verified?: boolean;
  certified?: boolean;
  available?: boolean;
  slug?: string | null;
  category?: string;
  level?: string;
  trade?: string;
  dailyRate?: number | null;
  [key: string]: unknown;
}

export interface SearchFilters {
  query?: string;
  type?: SearchModelType | SearchModelType[];
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  features?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'relevance' | 'rating' | 'popular';
  page?: number;
  limit?: number;
  // Model-specific filters
  stars?: number;
  certified?: boolean;
  available?: boolean;
  category?: string;
  level?: string;
  verified?: boolean;
  geoTrust?: boolean;
  premium?: boolean;
}

export interface TypeFacet {
  value: SearchModelType;
  count: number;
  label: string;
}

export interface SearchResult {
  documents: SearchDocument[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  groupedByType: Record<SearchModelType, SearchDocument[]>;
  typeCounts: Record<SearchModelType, number>;
  facets?: {
    types: TypeFacet[];
    cities: { value: string; count: number }[];
    countries: { value: string; count: number }[];
    priceRange: { min: number; max: number };
  };
}

// ============ Type Labels (French) ============

export const TYPE_LABELS: Record<SearchModelType, string> = {
  property: 'Propriétés',
  hotel: 'Hôtels',
  guesthouse: 'Maisons d\'hôtes',
  artisan: 'Artisans',
  course: 'Formations',
};

export const ALL_TYPES: SearchModelType[] = ['property', 'hotel', 'guesthouse', 'artisan', 'course'];

// ============ Elasticsearch-compatible functions (with Prisma fallback) ============

/**
 * Index a document in Elasticsearch
 * Currently falls back to Prisma (data is already in DB)
 */
export async function indexDocument(doc: SearchDocument): Promise<void> {
  // TODO: Index in Elasticsearch when available
  // For now, data is already stored in Prisma DB and searchable
  console.log(`[Elasticsearch] Indexation du document: ${doc.type}/${doc.id}`);
}

/**
 * Search documents across all models using Prisma as fallback.
 * When `type` filter is provided, only searches that model.
 * When no type filter, searches across ALL models simultaneously.
 */
export async function searchDocuments(
  query: string,
  filters: SearchFilters = {},
  country?: string
): Promise<SearchResult> {
  const targetCountry = country || filters.country;
  const page = filters.page || 1;
  const limit = filters.limit || 24;

  // Determine which types to search
  let typesToSearch: SearchModelType[];
  if (filters.type) {
    typesToSearch = Array.isArray(filters.type) ? filters.type : [filters.type];
  } else {
    typesToSearch = ALL_TYPES;
  }

  // Search each model type in parallel
  const searchPromises = typesToSearch.map(type =>
    searchSingleModel(type, query, filters, targetCountry)
  );

  const searchResults = await Promise.all(searchPromises);

  // Aggregate results
  let allDocuments: SearchDocument[] = [];
  const groupedByType = {} as Record<SearchModelType, SearchDocument[]>;
  const typeCounts = {} as Record<SearchModelType, number>;

  for (let i = 0; i < typesToSearch.length; i++) {
    const type = typesToSearch[i];
    const result = searchResults[i];
    groupedByType[type] = result.documents;
    typeCounts[type] = result.total;

    // Add type info to documents
    const docsWithType = result.documents.map(doc => ({ ...doc, type }));
    allDocuments = allDocuments.concat(docsWithType);
  }

  // Compute total across all types
  const total = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);

  // Sort combined results based on sortBy
  allDocuments = sortDocuments(allDocuments, filters.sortBy, query);

  // Apply pagination to combined results
  const skip = (page - 1) * limit;
  const paginatedDocuments = allDocuments.slice(skip, skip + limit);

  // Compute facets
  const facets = await computeFacets(typesToSearch, query, filters, targetCountry);

  return {
    documents: paginatedDocuments,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    groupedByType,
    typeCounts,
    facets,
  };
}

// ============ Per-Model Search Functions ============

interface ModelSearchResult {
  documents: SearchDocument[];
  total: number;
}

async function searchSingleModel(
  type: SearchModelType,
  query: string,
  filters: SearchFilters,
  country?: string
): Promise<ModelSearchResult> {
  switch (type) {
    case 'property':
      return searchProperties(query, filters, country);
    case 'hotel':
      return searchHotels(query, filters, country);
    case 'guesthouse':
      return searchGuesthouses(query, filters, country);
    case 'artisan':
      return searchArtisans(query, filters, country);
    case 'course':
      return searchCourses(query, filters, country);
    default:
      return { documents: [], total: 0 };
  }
}

/**
 * Search properties with text matching across title, description, city, quartier
 */
async function searchProperties(
  query: string,
  filters: SearchFilters,
  country?: string
): Promise<ModelSearchResult> {
  const where: Record<string, unknown> = { status: 'published' };
  if (country) where.country = country;
  if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) (where.price as Record<string, number>).gte = filters.minPrice;
    if (filters.maxPrice) (where.price as Record<string, number>).lte = filters.maxPrice;
  }

  // Text search
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { quartier: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
      { type: { contains: query, mode: 'insensitive' } },
      { transaction: { contains: query, mode: 'insensitive' } },
    ];
  }

  // Feature filter
  if (filters.features && filters.features.length > 0) {
    where.AND = filters.features.map(f => ({
      features: { contains: f, mode: 'insensitive' },
    }));
  }

  if (filters.verified !== undefined) where.verified = filters.verified;
  if (filters.geoTrust !== undefined) where.geoTrust = filters.geoTrust;
  if (filters.premium !== undefined) where.premium = filters.premium;

  // Get all matching for grouping (limit per type for combined search)
  const perTypeLimit = 100;
  const [properties, total] = await Promise.all([
    db.property.findMany({
      where,
      take: perTypeLimit,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { name: true, verified: true } },
      },
    }),
    db.property.count({ where }),
  ]);

  const documents: SearchDocument[] = properties.map(p => {
    let features: string[] = [];
    try { features = p.features ? JSON.parse(p.features) : []; } catch { features = []; }
    let images: string[] = [];
    try { images = p.images ? JSON.parse(p.images) : []; } catch { images = []; }

    return {
      id: p.id,
      type: 'property',
      title: p.title,
      description: p.description,
      city: p.city,
      quartier: p.quartier,
      country: p.country,
      price: p.price,
      features: Array.isArray(features) ? features : [],
      createdAt: p.createdAt.toISOString(),
      image: images[0] || null,
      verified: p.verified,
      slug: p.slug,
    };
  });

  return { documents, total };
}

/**
 * Search hotels with text matching across name, city, amenities
 */
async function searchHotels(
  query: string,
  filters: SearchFilters,
  country?: string
): Promise<ModelSearchResult> {
  const where: Record<string, unknown> = { status: 'active', available: true };
  if (country) where.country = country;
  if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
  if (filters.minPrice || filters.maxPrice) {
    where.pricePerNight = {};
    if (filters.minPrice) (where.pricePerNight as Record<string, number>).gte = filters.minPrice;
    if (filters.maxPrice) (where.pricePerNight as Record<string, number>).lte = filters.maxPrice;
  }
  if (filters.stars) where.stars = { gte: filters.stars };

  // Text search
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
      { amenities: { contains: query, mode: 'insensitive' } },
      { country: { contains: query, mode: 'insensitive' } },
    ];
  }

  const perTypeLimit = 100;
  const [hotels, total] = await Promise.all([
    db.hotel.findMany({
      where,
      take: perTypeLimit,
      orderBy: { rating: 'desc' },
    }),
    db.hotel.count({ where }),
  ]);

  const documents: SearchDocument[] = hotels.map(h => {
    let amenities: string[] = [];
    try { amenities = h.amenities ? JSON.parse(h.amenities) : []; } catch { amenities = []; }
    let images: string[] = [];
    try { images = h.images ? JSON.parse(h.images) : []; } catch { images = []; }

    return {
      id: h.id,
      type: 'hotel',
      title: h.name,
      description: h.policies || '',
      city: h.city,
      quartier: '',
      country: h.country,
      price: h.pricePerNight,
      features: Array.isArray(amenities) ? amenities : [],
      createdAt: h.createdAt.toISOString(),
      image: images[0] || null,
      rating: h.rating,
      stars: h.stars,
      slug: h.slug,
    };
  });

  return { documents, total };
}

/**
 * Search guesthouses with text matching across name, description, city, quartier
 */
async function searchGuesthouses(
  query: string,
  filters: SearchFilters,
  country?: string
): Promise<ModelSearchResult> {
  const where: Record<string, unknown> = { status: 'active' };
  if (country) where.country = country;
  if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
  if (filters.minPrice || filters.maxPrice) {
    // Guesthouse rooms have individual prices; use a subquery approach
    // For simplicity, filter on overall rating or skip price filter here
  }

  // Text search
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
      { quartier: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (filters.certified !== undefined) {
    where.certificationStatus = filters.certified ? 'certified' : undefined;
  }

  const perTypeLimit = 100;
  const [guesthouses, total] = await Promise.all([
    db.guesthouse.findMany({
      where,
      take: perTypeLimit,
      orderBy: { overallRating: 'desc' },
      include: {
        rooms: {
          where: { available: true },
          select: { basePrice: true },
          take: 1,
          orderBy: { basePrice: 'asc' },
        },
      },
    }),
    db.guesthouse.count({ where }),
  ]);

  const documents: SearchDocument[] = guesthouses.map(g => {
    let images: string[] = [];
    try { images = g.images ? JSON.parse(g.images) : []; } catch { images = []; }
    let amenities: string[] = [];
    try { amenities = g.amenities ? JSON.parse(g.amenities) : []; } catch { amenities = []; }

    // Use the cheapest room price as the displayed price
    const minRoomPrice = g.rooms[0]?.basePrice || 0;

    return {
      id: g.id,
      type: 'guesthouse',
      title: g.name,
      description: g.description || '',
      city: g.city,
      quartier: g.quartier || '',
      country: g.country,
      price: minRoomPrice,
      features: Array.isArray(amenities) ? amenities : [],
      createdAt: g.createdAt.toISOString(),
      image: images[0] || null,
      rating: g.overallRating,
      certified: g.certificationStatus === 'certified',
      slug: g.slug,
    };
  });

  return { documents, total };
}

/**
 * Search artisans with text matching across trade, specialties, city, zone
 */
async function searchArtisans(
  query: string,
  filters: SearchFilters,
  country?: string
): Promise<ModelSearchResult> {
  const where: Record<string, unknown> = { available: true };
  if (country) where.country = country;
  if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };
  if (filters.certified !== undefined) where.certified = filters.certified;
  if (filters.available !== undefined) where.available = filters.available;

  // Text search
  if (query) {
    where.OR = [
      { trade: { contains: query, mode: 'insensitive' } },
      { specialties: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
      { zone: { contains: query, mode: 'insensitive' } },
    ];
  }

  // Price filter maps to dailyRate for artisans
  if (filters.minPrice || filters.maxPrice) {
    where.dailyRate = {};
    if (filters.minPrice) (where.dailyRate as Record<string, number>).gte = filters.minPrice;
    if (filters.maxPrice) (where.dailyRate as Record<string, number>).lte = filters.maxPrice;
  }

  const perTypeLimit = 100;
  const [artisans, total] = await Promise.all([
    db.artisan.findMany({
      where,
      take: perTypeLimit,
      orderBy: { rating: 'desc' },
      include: {
        services: { select: { serviceName: true, basePrice: true } },
      },
    }),
    db.artisan.count({ where }),
  ]);

  const documents: SearchDocument[] = artisans.map(a => {
    let specialties: string[] = [];
    try { specialties = a.specialties ? JSON.parse(a.specialties) : []; } catch { specialties = []; }

    return {
      id: a.id,
      type: 'artisan',
      title: a.trade,
      description: a.trade,
      city: a.city || '',
      quartier: a.zone || '',
      country: a.country || '',
      price: a.dailyRate || 0,
      features: Array.isArray(specialties) ? specialties : [],
      createdAt: a.createdAt.toISOString(),
      rating: a.rating,
      certified: a.certified,
      available: a.available,
      trade: a.trade,
      dailyRate: a.dailyRate,
    };
  });

  return { documents, total };
}

/**
 * Search courses with text matching across title, description, category, instructor
 */
async function searchCourses(
  query: string,
  filters: SearchFilters,
  country?: string
): Promise<ModelSearchResult> {
  const where: Record<string, unknown> = { published: true };
  if (country) where.country = country;
  if (filters.category) where.category = filters.category;
  if (filters.level) where.level = filters.level;
  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) (where.price as Record<string, number>).gte = filters.minPrice;
    if (filters.maxPrice) (where.price as Record<string, number>).lte = filters.maxPrice;
  }

  // Text search
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { category: { contains: query, mode: 'insensitive' } },
      { instructor: { contains: query, mode: 'insensitive' } },
    ];
  }

  const perTypeLimit = 100;
  const [courses, total] = await Promise.all([
    db.course.findMany({
      where,
      take: perTypeLimit,
      orderBy: { rating: 'desc' },
    }),
    db.course.count({ where }),
  ]);

  const documents: SearchDocument[] = courses.map(c => ({
    id: c.id,
    type: 'course',
    title: c.title,
    description: c.description || '',
    city: '',
    quartier: '',
    country: c.country,
    price: c.price,
    features: [],
    createdAt: c.createdAt.toISOString(),
    image: c.image || null,
    rating: c.rating,
    slug: c.slug,
    category: c.category,
    level: c.level,
  }));

  return { documents, total };
}

// ============ Sorting ============

function sortDocuments(
  documents: SearchDocument[],
  sortBy?: string,
  query?: string
): SearchDocument[] {
  switch (sortBy) {
    case 'price_asc':
      return [...documents].sort((a, b) => a.price - b.price);
    case 'price_desc':
      return [...documents].sort((a, b) => b.price - a.price);
    case 'newest':
      return [...documents].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    case 'rating':
      return [...documents].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'popular':
      return [...documents].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case 'relevance':
    default:
      if (query) {
        // Simple relevance: title match > city match > other
        const q = query.toLowerCase();
        return [...documents].sort((a, b) => {
          const scoreA = (a.title.toLowerCase().includes(q) ? 10 : 0) +
                         (a.city.toLowerCase().includes(q) ? 5 : 0) +
                         (a.description.toLowerCase().includes(q) ? 2 : 0) +
                         (a.verified || a.certified ? 3 : 0) +
                         (a.rating || 0) * 0.5;
          const scoreB = (b.title.toLowerCase().includes(q) ? 10 : 0) +
                         (b.city.toLowerCase().includes(q) ? 5 : 0) +
                         (b.description.toLowerCase().includes(q) ? 2 : 0) +
                         (b.verified || b.certified ? 3 : 0) +
                         (b.rating || 0) * 0.5;
          return scoreB - scoreA;
        });
      }
      return [...documents].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }
}

// ============ Facets ============

async function computeFacets(
  types: SearchModelType[],
  query: string,
  filters: SearchFilters,
  country?: string
): Promise<SearchResult['facets']> {
  try {
    // Compute type counts
    const typeCountPromises = ALL_TYPES.map(async (type): Promise<TypeFacet> => {
      let count = 0;
      try {
        count = await countModelType(type, query, filters, country);
      } catch {
        count = 0;
      }
      return { value: type, count, label: TYPE_LABELS[type] };
    });

    const typeFacets = await Promise.all(typeCountPromises);

    // Compute city facets across all models
    const cityFacets = await computeCityFacets(types, query, country);

    // Compute country facets
    const countryFacets = await computeCountryFacets(types, query);

    // Compute price range across all models
    const priceRange = await computePriceRange(types, filters, country);

    return {
      types: typeFacets,
      cities: cityFacets,
      countries: countryFacets,
      priceRange,
    };
  } catch (error) {
    console.error('[Elasticsearch] Erreur de calcul des facettes:', error);
    return {
      types: ALL_TYPES.map(t => ({ value: t, count: 0, label: TYPE_LABELS[t] })),
      cities: [],
      countries: [],
      priceRange: { min: 0, max: 0 },
    };
  }
}

async function countModelType(
  type: SearchModelType,
  query: string,
  filters: SearchFilters,
  country?: string
): Promise<number> {
  const baseWhere: Record<string, unknown> = {};
  if (country) baseWhere.country = country;

  // Text search
  if (query) {
    switch (type) {
      case 'property':
        baseWhere.status = 'published';
        baseWhere.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ];
        break;
      case 'hotel':
        baseWhere.status = 'active';
        baseWhere.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ];
        break;
      case 'guesthouse':
        baseWhere.status = 'active';
        baseWhere.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ];
        break;
      case 'artisan':
        baseWhere.available = true;
        baseWhere.OR = [
          { trade: { contains: query, mode: 'insensitive' } },
          { specialties: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ];
        break;
      case 'course':
        baseWhere.published = true;
        baseWhere.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ];
        break;
    }
  } else {
    switch (type) {
      case 'property': baseWhere.status = 'published'; break;
      case 'hotel': baseWhere.status = 'active'; break;
      case 'guesthouse': baseWhere.status = 'active'; break;
      case 'artisan': baseWhere.available = true; break;
      case 'course': baseWhere.published = true; break;
    }
  }

  try {
    switch (type) {
      case 'property': return db.property.count({ where: baseWhere });
      case 'hotel': return db.hotel.count({ where: baseWhere });
      case 'guesthouse': return db.guesthouse.count({ where: baseWhere });
      case 'artisan': return db.artisan.count({ where: baseWhere });
      case 'course': return db.course.count({ where: baseWhere });
      default: return 0;
    }
  } catch {
    return 0;
  }
}

async function computeCityFacets(
  types: SearchModelType[],
  query: string,
  country?: string
): Promise<{ value: string; count: number }[]> {
  // Collect cities from each model type
  const cityMap = new Map<string, number>();

  for (const type of types) {
    try {
      const where: Record<string, unknown> = {};
      if (country) where.country = country;

      switch (type) {
        case 'property':
          where.status = 'published';
          if (query) {
            where.OR = [
              { title: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } },
            ];
          }
          break;
        case 'hotel':
          where.status = 'active';
          break;
        case 'guesthouse':
          where.status = 'active';
          break;
        case 'artisan':
          where.available = true;
          break;
        case 'course':
          where.published = true;
          break;
      }

      let grouped: { city: string; _count: { city: number } }[] = [];
      switch (type) {
        case 'property':
          grouped = await db.property.groupBy({
            by: ['city'], where, _count: { city: true },
            orderBy: { _count: { city: 'desc' } }, take: 10,
          }) as any;
          break;
        case 'hotel':
          grouped = await db.hotel.groupBy({
            by: ['city'], where, _count: { city: true },
            orderBy: { _count: { city: 'desc' } }, take: 10,
          }) as any;
          break;
        case 'guesthouse':
          grouped = await db.guesthouse.groupBy({
            by: ['city'], where, _count: { city: true },
            orderBy: { _count: { city: 'desc' } }, take: 10,
          }) as any;
          break;
        case 'artisan': {
          const artisanCities = await db.artisan.findMany({
            where, select: { city: true }, distinct: ['city'], take: 10,
          });
          for (const ac of artisanCities) {
            if (ac.city) {
              cityMap.set(ac.city, (cityMap.get(ac.city) || 0) + 1);
            }
          }
          continue;
        }
        case 'course':
          // Courses don't have city
          continue;
      }

      for (const g of grouped) {
        const c = g.city;
        if (c) {
          cityMap.set(c, (cityMap.get(c) || 0) + g._count.city);
        }
      }
    } catch {
      continue;
    }
  }

  return Array.from(cityMap.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
}

async function computeCountryFacets(
  types: SearchModelType[],
  query: string
): Promise<{ value: string; count: number }[]> {
  const countryMap = new Map<string, number>();

  for (const type of types) {
    try {
      const where: Record<string, unknown> = {};
      switch (type) {
        case 'property': where.status = 'published'; break;
        case 'hotel': where.status = 'active'; break;
        case 'guesthouse': where.status = 'active'; break;
        case 'artisan': where.available = true; break;
        case 'course': where.published = true; break;
      }

      let grouped: { country: string; _count: { country: number } }[] = [];
      switch (type) {
        case 'property':
          grouped = await db.property.groupBy({
            by: ['country'], where, _count: { country: true },
          }) as any;
          break;
        case 'hotel':
          grouped = await db.hotel.groupBy({
            by: ['country'], where, _count: { country: true },
          }) as any;
          break;
        case 'guesthouse':
          grouped = await db.guesthouse.groupBy({
            by: ['country'], where, _count: { country: true },
          }) as any;
          break;
        case 'artisan':
          grouped = await db.artisan.groupBy({
            by: ['country'], where, _count: { country: true },
          }) as any;
          break;
        case 'course':
          grouped = await db.course.groupBy({
            by: ['country'], where, _count: { country: true },
          }) as any;
          break;
      }

      for (const g of grouped) {
        const c = g.country;
        if (c) {
          countryMap.set(c, (countryMap.get(c) || 0) + g._count.country);
        }
      }
    } catch {
      continue;
    }
  }

  return Array.from(countryMap.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

async function computePriceRange(
  types: SearchModelType[],
  filters: SearchFilters,
  country?: string
): Promise<{ min: number; max: number }> {
  let globalMin = Infinity;
  let globalMax = 0;

  // Only property, hotel, and course have a meaningful price field
  const priceableTypes: SearchModelType[] = ['property', 'hotel', 'course'];

  for (const type of types) {
    if (!priceableTypes.includes(type)) continue;

    try {
      const where: Record<string, unknown> = {};
      if (country) where.country = country;
      switch (type) {
        case 'property': where.status = 'published'; break;
        case 'hotel': where.status = 'active'; break;
        case 'course': where.published = true; break;
      }

      let aggMin: number | null = null;
      let aggMax: number | null = null;
      switch (type) {
        case 'property': {
          const r = await db.property.aggregate({ where, _min: { price: true }, _max: { price: true } });
          aggMin = r._min.price;
          aggMax = r._max.price;
          break;
        }
        case 'hotel': {
          const r = await db.hotel.aggregate({ where, _min: { pricePerNight: true }, _max: { pricePerNight: true } });
          aggMin = r._min.pricePerNight;
          aggMax = r._max.pricePerNight;
          break;
        }
        case 'course': {
          const r = await db.course.aggregate({ where, _min: { price: true }, _max: { price: true } });
          aggMin = r._min.price;
          aggMax = r._max.price;
          break;
        }
        default:
          continue;
      }

      const min = aggMin ?? Infinity;
      const max = aggMax ?? 0;
      if (min < globalMin) globalMin = min;
      if (max > globalMax) globalMax = max;
    } catch {
      continue;
    }
  }

  return {
    min: globalMin === Infinity ? 0 : globalMin,
    max: globalMax,
  };
}

// ============ Document Management ============

/**
 * Delete a document from Elasticsearch index
 */
export async function deleteDocument(id: string, type?: SearchModelType): Promise<void> {
  // TODO: Remove from Elasticsearch index
  console.log(`[Elasticsearch] Suppression du document: ${type || 'unknown'}/${id}`);
}

/**
 * Create a per-tenant Elasticsearch index
 */
export async function createIndex(country: string): Promise<void> {
  // TODO: Create per-tenant Elasticsearch index
  console.log(`[Elasticsearch] Création de l'index pour le pays: ${country}`);
}

/**
 * Check if Elasticsearch is configured and available
 */
export function isElasticsearchConfigured(): boolean {
  return !!(process.env.ELASTICSEARCH_URL && process.env.ELASTICSEARCH_API_KEY);
}

/**
 * Get count of searchable documents per type for a given country
 */
export async function getSearchIndexStats(country?: string): Promise<Record<SearchModelType, number>> {
  const where = country ? { country } : {};

  try {
    const [properties, hotels, guesthouses, artisans, courses] = await Promise.all([
      db.property.count({ where: { ...where, status: 'published' } }),
      db.hotel.count({ where: { ...where, status: 'active' } }),
      db.guesthouse.count({ where: { ...where, status: 'active' } }),
      db.artisan.count({ where: { ...where, available: true } }),
      db.course.count({ where: { ...where, published: true } }),
    ]);

    return { property: properties, hotel: hotels, guesthouse: guesthouses, artisan: artisans, course: courses };
  } catch {
    return { property: 0, hotel: 0, guesthouse: 0, artisan: 0, course: 0 };
  }
}
