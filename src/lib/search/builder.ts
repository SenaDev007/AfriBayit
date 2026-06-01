// AfriBayit — Prisma Query Builder for Advanced Search
// Converts SearchFilters into Prisma where clauses

import { SearchFilters, FEATURE_MAP, type SortOption } from './filters';
import { Prisma } from '@prisma/client';

export function buildWhereClause(filters: SearchFilters): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = { status: 'published' };

  // Text search across title, description, city, quartier
  if (filters.query) {
    where.OR = [
      { title: { contains: filters.query, mode: 'insensitive' } },
      { description: { contains: filters.query, mode: 'insensitive' } },
      { city: { contains: filters.query, mode: 'insensitive' } },
      { quartier: { contains: filters.query, mode: 'insensitive' } },
      { address: { contains: filters.query, mode: 'insensitive' } },
    ];
  }

  // Location filters
  if (filters.country) {
    where.country = filters.country;
  }
  if (filters.city) {
    where.city = { contains: filters.city, mode: 'insensitive' };
  }
  if (filters.quartier) {
    where.quartier = { contains: filters.quartier, mode: 'insensitive' };
  }

  // Property type (array = OR)
  if (filters.type && filters.type.length > 0) {
    if (filters.type.length === 1) {
      where.type = filters.type[0];
    } else {
      where.type = { in: filters.type };
    }
  }

  // Transaction type (array = OR)
  if (filters.transaction && filters.transaction.length > 0) {
    if (filters.transaction.length === 1) {
      where.transaction = filters.transaction[0];
    } else {
      where.transaction = { in: filters.transaction };
    }
  }

  // Price range
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const priceFilter: Prisma.FloatFilter = {};
    if (filters.priceMin !== undefined) priceFilter.gte = filters.priceMin;
    if (filters.priceMax !== undefined) priceFilter.lte = filters.priceMax;
    where.price = priceFilter;
  }

  // Currency
  if (filters.currency) {
    where.currency = filters.currency;
  }

  // Surface range
  if (filters.surfaceMin !== undefined || filters.surfaceMax !== undefined) {
    const surfaceFilter: Prisma.FloatFilter = {};
    if (filters.surfaceMin !== undefined) surfaceFilter.gte = filters.surfaceMin;
    if (filters.surfaceMax !== undefined) surfaceFilter.lte = filters.surfaceMax;
    where.surface = surfaceFilter;
  }

  // Bedrooms
  if (filters.bedroomsMin !== undefined || filters.bedroomsMax !== undefined) {
    const bedFilter: Prisma.IntFilter = {};
    if (filters.bedroomsMin !== undefined) bedFilter.gte = filters.bedroomsMin;
    if (filters.bedroomsMax !== undefined) bedFilter.lte = filters.bedroomsMax;
    where.bedrooms = bedFilter;
  }

  // Bathrooms
  if (filters.bathroomsMin !== undefined) {
    where.bathrooms = { gte: filters.bathroomsMin };
  }

  // Rooms
  if (filters.roomsMin !== undefined) {
    where.rooms = { gte: filters.roomsMin };
  }

  // Feature filters (stored in JSON features field)
  // We check if the feature string exists in the JSON array
  const requiredFeatures: string[] = [];
  if (filters.hasPool) requiredFeatures.push(FEATURE_MAP.hasPool);
  if (filters.hasGarden) requiredFeatures.push(FEATURE_MAP.hasGarden);
  if (filters.hasGarage) requiredFeatures.push(FEATURE_MAP.hasGarage);
  if (filters.hasAirCon) requiredFeatures.push(FEATURE_MAP.hasAirCon);
  if (filters.hasSecurity) requiredFeatures.push(FEATURE_MAP.hasSecurity);
  if (filters.furnished) requiredFeatures.push(FEATURE_MAP.furnished);

  if (requiredFeatures.length > 0) {
    // Use arrayContains for each feature - features is stored as JSON string
    where.AND = requiredFeatures.map(feature => ({
      features: { contains: feature, mode: 'insensitive' as const },
    }));
  }

  // Quality flags
  if (filters.verified) where.verified = true;
  if (filters.geoTrust) where.geoTrust = true;
  if (filters.premium) where.premium = true;

  // Investment score
  if (filters.investmentScoreMin !== undefined) {
    where.investmentScore = { gte: filters.investmentScoreMin };
  }

  // Published date
  if (filters.publishedAfter) {
    where.publishedAt = { gte: new Date(filters.publishedAfter) };
  }

  // Map bounds (filter by lat/lng within viewport)
  if (filters.bounds) {
    const { north, south, east, west } = filters.bounds;
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      { lat: { gte: south, lte: north } },
      { lng: { gte: west, lte: east } },
    ];
  }

  return where;
}

export function buildOrderBy(sortBy: SortOption): Prisma.PropertyOrderByWithRelationInput {
  switch (sortBy) {
    case 'price_asc':
      return { price: 'asc' };
    case 'price_desc':
      return { price: 'desc' };
    case 'newest':
      return { createdAt: 'desc' };
    case 'popular':
      return { views: 'desc' };
    case 'surface_desc':
      return { surface: 'desc' };
    case 'investment_score':
      return { investmentScore: { sort: 'desc', nulls: 'last' } };
    default:
      return { createdAt: 'desc' };
  }
}

export function buildPagination(filters: SearchFilters): { skip: number; take: number } {
  const page = filters.page || 1;
  const limit = filters.limit || 24;
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
}
