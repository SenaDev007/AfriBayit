// AfriBayit — Elasticsearch Integration
// Provides Elasticsearch-compatible interface with graceful fallback to Prisma search
// In production, swap to real Elasticsearch for full-text search capabilities

import { db } from '@/lib/db';

export interface SearchDocument {
  id: string;
  type: 'property' | 'hotel' | 'guesthouse' | 'course' | 'artisan';
  title: string;
  description: string;
  city: string;
  quartier: string;
  country: string;
  price: number;
  features: string[];
  createdAt: string;
  [key: string]: unknown;
}

export interface SearchFilters {
  query?: string;
  type?: string;
  city?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  features?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'relevance';
  page?: number;
  limit?: number;
}

export interface SearchResult {
  documents: SearchDocument[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  facets?: {
    types: { value: string; count: number }[];
    cities: { value: string; count: number }[];
    countries: { value: string; count: number }[];
    priceRange: { min: number; max: number };
  };
}

// ── Elasticsearch-compatible functions (with Prisma fallback) ──

/**
 * Index a document in Elasticsearch
 * Currently falls back to Prisma (data is already in DB)
 */
export async function indexDocument(doc: SearchDocument): Promise<void> {
  // TODO: Index in Elasticsearch when available
  // For now, data is already stored in Prisma DB and searchable
  console.log(`[Elasticsearch] Would index document: ${doc.type}/${doc.id}`);
}

/**
 * Search documents using full-text search
 * Uses Prisma as fallback when Elasticsearch is not configured
 */
export async function searchDocuments(
  query: string,
  filters: SearchFilters = {},
  country?: string
): Promise<SearchResult> {
  // TODO: Use Elasticsearch when available
  // Falls back to Prisma search

  const where: Record<string, unknown> = { status: 'published' };
  if (filters.type) where.type = filters.type;
  if (filters.city) where.city = filters.city;
  if (country || filters.country) where.country = country || filters.country;
  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) (where.price as Record<string, number>).gte = filters.minPrice;
    if (filters.maxPrice) (where.price as Record<string, number>).lte = filters.maxPrice;
  }

  // Text search using contains for now
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { quartier: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
    ];
  }

  const page = filters.page || 1;
  const limit = filters.limit || 24;
  const skip = (page - 1) * limit;

  const orderBy: Record<string, string> = {};
  switch (filters.sortBy) {
    case 'price_asc': orderBy.price = 'asc'; break;
    case 'price_desc': orderBy.price = 'desc'; break;
    case 'newest': orderBy.createdAt = 'desc'; break;
    default: orderBy.createdAt = 'desc';
  }

  const [properties, total] = await Promise.all([
    db.property.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        owner: { select: { name: true, verified: true } },
      },
    }),
    db.property.count({ where }),
  ]);

  const documents: SearchDocument[] = properties.map((p) => {
    let features: string[] = [];
    try { features = p.features ? JSON.parse(p.features) : []; } catch { features = []; }

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
    };
  });

  return {
    documents,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

/**
 * Delete a document from Elasticsearch index
 */
export async function deleteDocument(id: string): Promise<void> {
  // TODO: Remove from Elasticsearch index
  console.log(`[Elasticsearch] Would delete document: ${id}`);
}

/**
 * Create a per-tenant Elasticsearch index
 */
export async function createIndex(country: string): Promise<void> {
  // TODO: Create per-tenant Elasticsearch index
  console.log(`[Elasticsearch] Would create index for country: ${country}`);
}

/**
 * Check if Elasticsearch is configured and available
 */
export function isElasticsearchConfigured(): boolean {
  return !!(process.env.ELASTICSEARCH_URL && process.env.ELASTICSEARCH_API_KEY);
}
