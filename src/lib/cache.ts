// AfriBayit — Caching Layer
// Redis-backed caching with in-memory fallback
// Supports TTL, pattern-based invalidation, and multi-tenant key prefixes

import { redis, isRedisConfigured, memoryFallback } from '@/lib/redis';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CacheOptions {
  /** TTL in seconds */
  ttl?: number;
  /** Country prefix for multi-tenant isolation (e.g., 'bj', 'tg') */
  country?: string;
}

// ─── Key Builder ─────────────────────────────────────────────────────────────

/**
 * Build a cache key with optional country prefix for multi-tenant isolation.
 * Format: `{country}:{namespace}:{identifier}`
 * Example: `bj:properties:list:page1`, `tg:avm:estimate:abc123`
 */
export function buildCacheKey(namespace: string, identifier: string, country?: string): string {
  const parts: string[] = [];
  if (country) parts.push(country);
  parts.push(namespace, identifier);
  return parts.join(':');
}

// ─── Cache Interface ─────────────────────────────────────────────────────────

export const cache = {
  /**
   * Get a value from cache.
   * Returns the parsed value or null if not found / expired.
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const raw = await redis.get(key) as string | null;
      if (raw === null || raw === undefined) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        // If not valid JSON, return the raw value as-is (for simple string values)
        return raw as unknown as T;
      }
    } catch (error) {
      console.warn(`[cache] GET error for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Set a value in cache with optional TTL.
   * @param key Cache key
   * @param value Value to cache (will be JSON-serialized)
   * @param ttl TTL in seconds (default: 300 = 5 minutes)
   */
  async set<T = unknown>(key: string, value: T, ttl: number = 300): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await redis.set(key, serialized, { ex: ttl });
    } catch (error) {
      console.warn(`[cache] SET error for key "${key}":`, error);
    }
  },

  /**
   * Delete a specific key from cache.
   */
  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.warn(`[cache] DEL error for key "${key}":`, error);
    }
  },

  /**
   * Delete all keys matching a pattern.
   * Uses Redis KEYS + DEL when on Redis, or in-memory pattern matching.
   * Pattern uses glob-style: * matches any, ? matches single char.
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      if (isRedisConfigured) {
        // Upstash Redis: use KEYS to find matching keys, then DEL
        const keys = await redis.keys(pattern);
        if (keys.length === 0) return 0;
        // Delete in batches to avoid overwhelming Redis
        const batchSize = 100;
        let deleted = 0;
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          deleted += await redis.del(...batch);
        }
        return deleted;
      }
      // In-memory fallback
      return memoryFallback.delPattern(pattern);
    } catch (error) {
      console.warn(`[cache] DELPATTERN error for pattern "${pattern}":`, error);
      return 0;
    }
  },

  /**
   * Get remaining TTL for a key in seconds.
   * Returns -1 if key has no expiry, -2 if key doesn't exist.
   */
  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      console.warn(`[cache] TTL error for key "${key}":`, error);
      return -2;
    }
  },

  /**
   * Check if a key exists in cache.
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result > 0;
    } catch (error) {
      console.warn(`[cache] EXISTS error for key "${key}":`, error);
      return false;
    }
  },
};

// ─── Cache Decorator / Helper ────────────────────────────────────────────────

/**
 * Cache-aside pattern helper: get from cache, or compute and cache the result.
 *
 * @param key Cache key
 * @param fn Function to compute the value if not in cache
 * @param ttl TTL in seconds (default: 300)
 * @returns The cached or computed value
 *
 * @example
 * const properties = await cache.wrap('bj:properties:list:page1', () =>
 *   db.property.findMany({ ... }),
 *   300 // 5 min
 * );
 */
export async function cacheWrap<T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  const cached = await cache.get<T>(key);
  if (cached !== null) return cached;

  const value = await fn();
  await cache.set(key, value, ttl);
  return value;
}

// ─── Cache Invalidation Helpers ──────────────────────────────────────────────

/**
 * Invalidate all property-related caches.
 * Call this on property create / update / delete.
 */
export async function invalidatePropertyCache(country?: string): Promise<void> {
  const patterns: string[] = [];
  if (country) {
    patterns.push(`${country}:properties:*`);
  } else {
    // Invalidate all countries
    patterns.push('*:properties:*');
    // Also invalidate the no-prefix version
    patterns.push('properties:*');
  }
  await Promise.all(patterns.map((p) => cache.delPattern(p)));
}

/**
 * Invalidate AVM estimate caches.
 */
export async function invalidateAvmCache(country?: string): Promise<void> {
  const patterns: string[] = [];
  if (country) {
    patterns.push(`${country}:avm:*`);
  } else {
    patterns.push('*:avm:*');
    patterns.push('avm:*');
  }
  await Promise.all(patterns.map((p) => cache.delPattern(p)));
}

/**
 * Invalidate platform stats caches.
 */
export async function invalidateStatsCache(country?: string): Promise<void> {
  const patterns: string[] = [];
  if (country) {
    patterns.push(`${country}:stats:*`);
  } else {
    patterns.push('*:stats:*');
    patterns.push('stats:*');
  }
  await Promise.all(patterns.map((p) => cache.delPattern(p)));
}
