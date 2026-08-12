// AfriBayit — API Response Cache (Redis-backed with in-memory fallback)
// Caches API responses with configurable TTL and pattern-based invalidation

import { get, set, del, delPattern, isRedisAvailable } from './redis';

const API_CACHE_PREFIX = 'api:';

export interface CacheOptions {
  /** TTL in seconds (default: 300 = 5 minutes) */
  ttl?: number;
  /** Cache key prefix for namespace isolation */
  prefix?: string;
  /** Whether to skip caching (e.g., for authenticated endpoints) */
  noCache?: boolean;
}

const DEFAULT_TTL = 300; // 5 minutes

/**
 * Cache an API response
 */
export async function cacheResponse<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<void> {
  if (options.noCache) return;

  const fullKey = `${API_CACHE_PREFIX}${options.prefix || ''}${key}`;
  const ttl = options.ttl ?? DEFAULT_TTL;

  await set(fullKey, {
    data,
    cachedAt: new Date().toISOString(),
    ttl,
  }, ttl);
}

/**
 * Get a cached API response
 */
export async function getCached<T>(
  key: string,
  options: CacheOptions = {}
): Promise<{ data: T; cachedAt: string } | null> {
  if (options.noCache) return null;

  const fullKey = `${API_CACHE_PREFIX}${options.prefix || ''}${key}`;
  const result = await get<{ data: T; cachedAt: string; ttl: number }>(fullKey);

  if (!result) return null;

  return {
    data: result.data,
    cachedAt: result.cachedAt,
  };
}

/**
 * Invalidate a specific cache key
 */
export async function invalidateCache(
  key: string,
  options: CacheOptions = {}
): Promise<void> {
  const fullKey = `${API_CACHE_PREFIX}${options.prefix || ''}${key}`;
  await del(fullKey);
}

/**
 * Invalidate all cache keys matching a pattern
 * Example: invalidatePattern('properties:*') clears all property caches
 */
export async function invalidatePattern(
  pattern: string,
  options: CacheOptions = {}
): Promise<number> {
  const fullPattern = `${API_CACHE_PREFIX}${options.prefix || ''}${pattern}`;
  return delPattern(fullPattern);
}

/**
 * Helper: Fetch with cache-through pattern
 * If cached, returns cached data. Otherwise, calls fetcher, caches, and returns.
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  if (options.noCache) {
    return fetcher();
  }

  // Try cache first
  const cached = await getCached<T>(key, options);
  if (cached) {
    return cached.data;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Cache the result (non-blocking)
  cacheResponse(key, data, options).catch((err) => {
    console.error('Cache write error (non-critical):', err);
  });

  return data;
}

/**
 * Predefined cache TTLs for different content types
 */
export const CACHE_TTL = {
  /** 30 seconds — for rapidly changing data (e.g., live availability) */
  REALTIME: 30,
  /** 1 minute — for frequently accessed data */
  SHORT: 60,
  /** 5 minutes — default for most API responses */
  DEFAULT: 300,
  /** 15 minutes — for semi-static data (e.g., property details) */
  MEDIUM: 900,
  /** 1 hour — for static data (e.g., country configs) */
  LONG: 3600,
  /** 24 hours — for very static data (e.g., currency rates) */
  DAILY: 86400,
} as const;

/**
 * Predefined cache prefix namespaces
 */
export const CACHE_NAMESPACES = {
  PROPERTIES: 'properties:',
  SEARCH: 'search:',
  STATS: 'stats:',
  USER: 'user:',
  HOTEL: 'hotel:',
  GUESTHOUSE: 'guesthouse:',
  ACADEMY: 'academy:',
  COMMUNITY: 'community:',
  ARTISAN: 'artisan:',
  NOTARY: 'notary:',
} as const;
