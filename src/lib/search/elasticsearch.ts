// AfriBayit — Elasticsearch Integration
// Real Elasticsearch client with graceful fallback to PostgreSQL full-text search
// When ELASTICSEARCH_URL is configured, uses ES for powerful full-text search
// Otherwise, falls back to Prisma/PostgreSQL with contains queries

import { db } from '@/lib/db';

// ─── Types ─────────────────────────────────────────────────────────────────

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

export type SearchModelType = 'property' | 'hotel' | 'guesthouse' | 'course' | 'artisan';

export const ALL_TYPES: SearchModelType[] = ['property', 'hotel', 'guesthouse', 'course', 'artisan'];

export const TYPE_LABELS: Record<SearchModelType, string> = {
  property: 'Bien immobilier',
  hotel: 'Hôtel',
  guesthouse: 'Guesthouse',
  course: 'Formation',
  artisan: 'Artisan',
};

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

// ─── Elasticsearch Index Mappings ──────────────────────────────────────────

const INDEX_MAPPINGS: Record<string, object> = {
  properties: {
    mappings: {
      properties: {
        id: { type: 'keyword' },
        type: { type: 'keyword' },
        title: {
          type: 'text',
          fields: {
            keyword: { type: 'keyword' },
            search: { type: 'text', analyzer: 'standard', search_analyzer: 'standard' },
          },
        },
        description: { type: 'text', analyzer: 'standard' },
        city: { type: 'keyword' },
        quartier: { type: 'keyword' },
        country: { type: 'keyword' },
        price: { type: 'double' },
        features: { type: 'keyword' },
        createdAt: { type: 'date' },
      },
    },
  },
  hotels: {
    mappings: {
      properties: {
        id: { type: 'keyword' },
        type: { type: 'keyword' },
        title: { type: 'text', fields: { keyword: { type: 'keyword' } } },
        description: { type: 'text', analyzer: 'standard' },
        city: { type: 'keyword' },
        country: { type: 'keyword' },
        price: { type: 'double' },
        stars: { type: 'integer' },
        amenities: { type: 'keyword' },
        createdAt: { type: 'date' },
      },
    },
  },
  artisans: {
    mappings: {
      properties: {
        id: { type: 'keyword' },
        type: { type: 'keyword' },
        title: { type: 'text', fields: { keyword: { type: 'keyword' } } },
        description: { type: 'text', analyzer: 'standard' },
        city: { type: 'keyword' },
        country: { type: 'keyword' },
        price: { type: 'double' },
        specialties: { type: 'keyword' },
        createdAt: { type: 'date' },
      },
    },
  },
};

// ─── Elasticsearch Client ─────────────────────────────────────────────────

interface ESClientConfig {
  url: string;
  apiKey?: string;
  username?: string;
  password?: string;
}

class ElasticsearchClient {
  private config: ESClientConfig | null = null;
  private available: boolean = false;
  private lastHealthCheck: number = 0;
  private healthCheckInterval = 30_000; // 30 seconds between health checks

  constructor() {
    const url = process.env.ELASTICSEARCH_URL;
    if (url) {
      this.config = {
        url: url.replace(/\/$/, ''), // Remove trailing slash
        apiKey: process.env.ELASTICSEARCH_API_KEY,
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      };
      // We'll check availability on first request
      this.available = true; // Optimistic; will be set to false on first failure
    }
  }

  get isConfigured(): boolean {
    return this.config !== null;
  }

  get isAvailable(): boolean {
    return this.config !== null && this.available;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config?.apiKey) {
      headers['Authorization'] = `ApiKey ${this.config.apiKey}`;
    } else if (this.config?.username && this.config?.password) {
      const encoded = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${encoded}`;
    }

    return headers;
  }

  private async request(
    method: string,
    path: string,
    body?: unknown
  ): Promise<{ ok: boolean; status: number; data: unknown }> {
    if (!this.config) {
      return { ok: false, status: 0, data: null };
    }

    try {
      const url = `${this.config.url}${path}`;
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(10_000), // 10 second timeout
      });

      const data = await response.json().catch(() => null);
      return { ok: response.ok, status: response.status, data };
    } catch (error) {
      // Mark as unavailable on connection errors
      this.available = false;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Elasticsearch] Request failed: ${method} ${path} — ${message}`);
      return { ok: false, status: 0, data: null };
    }
  }

  /**
   * Check cluster health. Caches result for healthCheckInterval.
   */
  async checkHealth(): Promise<boolean> {
    if (!this.config) return false;

    const now = Date.now();
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.available;
    }

    this.lastHealthCheck = now;
    const result = await this.request('GET', '/_cluster/health');
    this.available = result.ok;
    return this.available;
  }

  /**
   * Create an index with the defined mapping if it doesn't exist.
   */
  async createIndex(indexName: string): Promise<boolean> {
    const mapping = INDEX_MAPPINGS[indexName];
    if (!mapping) {
      console.warn(`[Elasticsearch] No mapping defined for index: ${indexName}`);
      return false;
    }

    // Check if index exists
    const exists = await this.request('HEAD', `/${indexName}`);
    if (exists.ok) return true; // Already exists

    const result = await this.request('PUT', `/${indexName}`, mapping);
    if (result.ok) {
      console.log(`[Elasticsearch] Created index: ${indexName}`);
      return true;
    }

    console.error(`[Elasticsearch] Failed to create index ${indexName}:`, result.data);
    return false;
  }

  /**
   * Index a single document.
   */
  async indexDocument(indexName: string, doc: SearchDocument): Promise<boolean> {
    const result = await this.request('PUT', `/${indexName}/_doc/${doc.id}`, doc);
    return result.ok;
  }

  /**
   * Bulk index documents for efficient batch operations.
   */
  async bulkIndex(indexName: string, documents: SearchDocument[]): Promise<{ success: number; failed: number }> {
    if (documents.length === 0) return { success: 0, failed: 0 };

    // Build NDJSON bulk body
    const lines: string[] = [];
    for (const doc of documents) {
      lines.push(JSON.stringify({ index: { _index: indexName, _id: doc.id } }));
      lines.push(JSON.stringify(doc));
    }

    const result = await this.request('POST', '/_bulk', lines.join('\n') + '\n');
    const data = result.data as Record<string, unknown> | null;

    if (!result.ok || !data) {
      console.error('[Elasticsearch] Bulk index failed:', data);
      return { success: 0, failed: documents.length };
    }

    const items = (data.items as Record<string, unknown>[]) || [];
    let success = 0;
    let failed = 0;

    for (const item of items) {
      const indexResult = item.index as Record<string, unknown>;
      if (indexResult?.status === 200 || indexResult?.status === 201) {
        success++;
      } else {
        failed++;
        console.error('[Elasticsearch] Bulk item failed:', indexResult?.error);
      }
    }

    return { success, failed };
  }

  /**
   * Delete a document from the index.
   */
  async deleteDocument(indexName: string, docId: string): Promise<boolean> {
    const result = await this.request('DELETE', `/${indexName}/_doc/${docId}`);
    return result.ok || result.status === 404; // 404 is ok (already deleted)
  }

  /**
   * Search documents using Elasticsearch DSL.
   */
  async search(indexName: string, query: object): Promise<SearchResult | null> {
    const result = await this.request('POST', `/${indexName}/_search`, query);
    if (!result.ok) {
      console.error('[Elasticsearch] Search failed:', result.data);
      return null;
    }

    const data = result.data as Record<string, unknown>;
    const hits = data?.hits as Record<string, unknown>;
    const total = (hits?.total as Record<string, unknown>)?.value as number || 0;
    const hitsArray = (hits?.hits as Record<string, unknown>[]) || [];

    const documents: SearchDocument[] = hitsArray.map((hit) => hit._source as SearchDocument);

    return {
      documents,
      total,
      page: 1,
      limit: documents.length,
      pages: 1,
    };
  }

  /**
   * Delete an entire index.
   */
  async deleteIndex(indexName: string): Promise<boolean> {
    const result = await this.request('DELETE', `/${indexName}`);
    return result.ok || result.status === 404;
  }
}

// ─── Singleton Client ─────────────────────────────────────────────────────

let _client: ElasticsearchClient | null = null;

function getESClient(): ElasticsearchClient {
  if (!_client) {
    _client = new ElasticsearchClient();
  }
  return _client;
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Check if Elasticsearch is configured and available.
 * Returns true only if ELASTICSEARCH_URL is set AND the cluster is reachable.
 */
export async function isElasticsearchAvailable(): Promise<boolean> {
  const client = getESClient();
  if (!client.isConfigured) return false;
  return client.checkHealth();
}

/**
 * Check if Elasticsearch is configured (doesn't check connectivity).
 */
export function isElasticsearchConfigured(): boolean {
  return getESClient().isConfigured;
}

/**
 * Index a document in Elasticsearch.
 * Falls back silently if ES is not available (data is already in PostgreSQL).
 */
export async function indexDocument(doc: SearchDocument): Promise<void> {
  const client = getESClient();
  if (!client.isAvailable) {
    console.log(`[Elasticsearch] Skipping index — not available. Document: ${doc.type}/${doc.id}`);
    return;
  }

  try {
    const indexName = doc.type === 'guesthouse' ? 'properties' : `${doc.type}s`;
    await client.createIndex(indexName); // Ensure index exists
    const success = await client.indexDocument(indexName, doc);

    if (success) {
      console.log(`[Elasticsearch] Indexed document: ${doc.type}/${doc.id}`);
    } else {
      console.warn(`[Elasticsearch] Failed to index document: ${doc.type}/${doc.id}`);
    }
  } catch (error) {
    console.error(`[Elasticsearch] Error indexing document ${doc.type}/${doc.id}:`, error);
    // Don't throw — ES failure should not break the main flow
  }
}

/**
 * Bulk index documents in Elasticsearch.
 * Falls back silently if ES is not available.
 */
export async function bulkIndexDocuments(
  documents: SearchDocument[]
): Promise<{ success: number; failed: number; skipped: boolean }> {
  const client = getESClient();
  if (!client.isAvailable) {
    console.log(`[Elasticsearch] Skipping bulk index — not available. ${documents.length} documents.`);
    return { success: 0, failed: 0, skipped: true };
  }

  // Group documents by index
  const byIndex: Record<string, SearchDocument[]> = {};
  for (const doc of documents) {
    const indexName = doc.type === 'guesthouse' ? 'properties' : `${doc.type}s`;
    if (!byIndex[indexName]) byIndex[indexName] = [];
    byIndex[indexName].push(doc);
  }

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const [indexName, docs] of Object.entries(byIndex)) {
    await client.createIndex(indexName); // Ensure index exists
    const result = await client.bulkIndex(indexName, docs);
    totalSuccess += result.success;
    totalFailed += result.failed;
  }

  return { success: totalSuccess, failed: totalFailed, skipped: false };
}

/**
 * Delete a document from the Elasticsearch index.
 */
export async function deleteDocument(id: string, type?: string): Promise<void> {
  const client = getESClient();
  if (!client.isAvailable) {
    console.log(`[Elasticsearch] Skipping delete — not available. Document: ${id}`);
    return;
  }

  try {
    const indexName = type
      ? (type === 'guesthouse' ? 'properties' : `${type}s`)
      : '_all';
    const success = await client.deleteDocument(indexName, id);

    if (success) {
      console.log(`[Elasticsearch] Deleted document: ${id} from ${indexName}`);
    } else {
      console.warn(`[Elasticsearch] Failed to delete document: ${id}`);
    }
  } catch (error) {
    console.error(`[Elasticsearch] Error deleting document ${id}:`, error);
  }
}

/**
 * Create a per-tenant Elasticsearch index for a country.
 */
export async function createIndex(country: string): Promise<boolean> {
  const client = getESClient();
  if (!client.isAvailable) {
    console.log(`[Elasticsearch] Skipping index creation — not available. Country: ${country}`);
    return false;
  }

  // For now we use global indices (properties, hotels, artisans)
  // In a multi-tenant setup, you could use country-prefixed indices like bj_properties
  const indices = ['properties', 'hotels', 'artisans'];
  let allSuccess = true;

  for (const indexName of indices) {
    const success = await client.createIndex(indexName);
    if (!success) allSuccess = false;
  }

  console.log(`[Elasticsearch] Index creation for country ${country}: ${allSuccess ? 'success' : 'partial'}`);
  return allSuccess;
}

/**
 * Search documents using full-text search.
 * Tries Elasticsearch first, falls back to PostgreSQL if unavailable.
 */
export async function searchDocuments(
  query: string,
  filters: SearchFilters = {},
  country?: string
): Promise<SearchResult> {
  const client = getESClient();

  // Try Elasticsearch first
  if (client.isAvailable) {
    try {
      const esResult = await searchWithElasticsearch(client, query, filters, country);
      if (esResult) return esResult;
    } catch (error) {
      console.error('[Elasticsearch] Search failed, falling back to PostgreSQL:', error);
    }
  }

  // Fallback to PostgreSQL
  return searchWithPostgreSQL(query, filters, country);
}

// ─── Elasticsearch Search Implementation ───────────────────────────────────

async function searchWithElasticsearch(
  client: ElasticsearchClient,
  query: string,
  filters: SearchFilters,
  country?: string
): Promise<SearchResult | null> {
  const indexName = filters.type
    ? (filters.type === 'guesthouse' ? 'properties' : `${filters.type}s`)
    : 'properties,hotels,artisans';

  const page = filters.page || 1;
  const limit = filters.limit || 24;

  // Build Elasticsearch query DSL
  const must: object[] = [];
  const filter: object[] = [];

  // Text search
  if (query) {
    must.push({
      multi_match: {
        query,
        fields: ['title^3', 'description^1', 'city^2', 'quartier^2'],
        fuzziness: 'AUTO',
        type: 'best_fields',
      },
    });
  }

  // Filters
  if (filters.type) {
    filter.push({ term: { type: filters.type } });
  }
  if (filters.city) {
    filter.push({ term: { city: filters.city } });
  }
  if (country || filters.country) {
    filter.push({ term: { country: country || filters.country } });
  }
  if (filters.minPrice || filters.maxPrice) {
    const range: Record<string, number> = {};
    if (filters.minPrice) range.gte = filters.minPrice;
    if (filters.maxPrice) range.lte = filters.maxPrice;
    filter.push({ range: { price: range } });
  }
  if (filters.features && filters.features.length > 0) {
    filter.push({ terms: { features: filters.features } });
  }

  // Sort
  let sort: object[] = [];
  switch (filters.sortBy) {
    case 'price_asc':
      sort = [{ price: 'asc' }];
      break;
    case 'price_desc':
      sort = [{ price: 'desc' }];
      break;
    case 'newest':
      sort = [{ createdAt: 'desc' }];
      break;
    case 'relevance':
    default:
      if (query) {
        sort = ['_score', { createdAt: 'desc' }];
      } else {
        sort = [{ createdAt: 'desc' }];
      }
  }

  const esQuery = {
    query: {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }],
        filter: filter.length > 0 ? filter : undefined,
      },
    },
    sort,
    from: (page - 1) * limit,
    size: limit,
  };

  const result = await client.search(indexName, esQuery);
  if (!result) return null;

  return {
    ...result,
    page,
    limit,
    pages: Math.ceil(result.total / limit),
  };
}

// ─── PostgreSQL Fallback Search Implementation ────────────────────────────

async function searchWithPostgreSQL(
  query: string,
  filters: SearchFilters = {},
  country?: string
): Promise<SearchResult> {
  const where: Record<string, unknown> = { status: 'published' };
  if (filters.type) where.type = filters.type;
  if (filters.city) where.city = filters.city;
  if (country || filters.country) where.country = country || filters.country;
  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) (where.price as Record<string, number>).gte = filters.minPrice;
    if (filters.maxPrice) (where.price as Record<string, number>).lte = filters.maxPrice;
  }

  // Text search using contains for now (SQLite doesn't support tsvector)
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
