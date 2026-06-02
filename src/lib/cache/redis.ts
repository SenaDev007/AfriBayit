// AfriBayit — Upstash Redis Client with In-Memory Fallback
// Provides caching, session storage, and rate limiting backend
// Falls back to in-memory Map when Redis is not configured

import { Redis } from '@upstash/redis';

// Check if Redis is configured
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const isRedisConfigured = !!(REDIS_URL && REDIS_TOKEN);

// Upstash Redis client (only initialized if configured)
let redis: Redis | null = null;
if (isRedisConfigured) {
  redis = new Redis({
    url: REDIS_URL!,
    token: REDIS_TOKEN!,
  });
}

// ============ In-Memory Fallback ============

interface CacheEntry {
  value: string;
  expiresAt: number | null; // null = no expiry
}

const memoryStore = new Map<string, CacheEntry>();

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (entry.expiresAt && now > entry.expiresAt) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

/** Get a value from cache */
export async function get<T = unknown>(key: string): Promise<T | null> {
  if (redis) {
    try {
      const result = await redis.get<T>(key);
      return result;
    } catch (error) {
      console.error('Redis GET error, falling back to memory:', error);
    }
  }

  // In-memory fallback
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  try {
    return JSON.parse(entry.value) as T;
  } catch {
    return entry.value as unknown as T;
  }
}

/** Set a value in cache with optional TTL in seconds */
export async function set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
  if (redis) {
    try {
      if (ttlSeconds) {
        await redis.set(key, value, { ex: ttlSeconds });
      } else {
        await redis.set(key, value);
      }
      return;
    } catch (error) {
      console.error('Redis SET error, falling back to memory:', error);
    }
  }

  // In-memory fallback
  const serialized = typeof value === 'string' ? value : JSON.stringify(value);
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
  memoryStore.set(key, { value: serialized, expiresAt });
}

/** Delete a key from cache */
export async function del(key: string): Promise<void> {
  if (redis) {
    try {
      await redis.del(key);
      return;
    } catch (error) {
      console.error('Redis DEL error, falling back to memory:', error);
    }
  }

  memoryStore.delete(key);
}

/** Set expiration on an existing key */
export async function expire(key: string, ttlSeconds: number): Promise<boolean> {
  if (redis) {
    try {
      const result = await redis.expire(key, ttlSeconds);
      return result;
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  // In-memory fallback
  const entry = memoryStore.get(key);
  if (!entry) return false;
  entry.expiresAt = Date.now() + ttlSeconds * 1000;
  return true;
}

/** Increment a counter (returns new value) */
export async function incr(key: string): Promise<number> {
  if (redis) {
    try {
      const result = await redis.incr(key);
      return result;
    } catch (error) {
      console.error('Redis INCR error, falling back to memory:', error);
    }
  }

  // In-memory fallback
  const entry = memoryStore.get(key);
  const current = entry ? parseInt(entry.value, 10) || 0 : 0;
  const newValue = current + 1;
  memoryStore.set(key, { value: String(newValue), expiresAt: entry?.expiresAt ?? null });
  return newValue;
}

/** Add a member to a set */
export async function sadd(key: string, ...members: string[]): Promise<number> {
  if (redis) {
    try {
      const result = await redis.sadd(key, ...members);
      return result;
    } catch (error) {
      console.error('Redis SADD error, falling back to memory:', error);
    }
  }

  // In-memory fallback — store sets as JSON array
  const entry = memoryStore.get(key);
  const existing: string[] = entry ? JSON.parse(entry.value) : [];
  let added = 0;
  for (const member of members) {
    if (!existing.includes(member)) {
      existing.push(member);
      added++;
    }
  }
  memoryStore.set(key, { value: JSON.stringify(existing), expiresAt: entry?.expiresAt ?? null });
  return added;
}

/** Check if a member exists in a set */
export async function sismember(key: string, member: string): Promise<boolean> {
  if (redis) {
    try {
      const result = await redis.sismember(key, member);
      return result === 1 || result === true;
    } catch (error) {
      console.error('Redis SISMEMBER error, falling back to memory:', error);
    }
  }

  // In-memory fallback
  const entry = memoryStore.get(key);
  if (!entry) return false;
  try {
    const members: string[] = JSON.parse(entry.value);
    return members.includes(member);
  } catch {
    return false;
  }
}

/** Check if Redis is available */
export function isRedisAvailable(): boolean {
  return isRedisConfigured;
}

/** Get the raw Redis client (for advanced operations) */
export function getRedisClient(): Redis | null {
  return redis;
}

/** Delete keys matching a pattern (for cache invalidation) */
export async function delPattern(pattern: string): Promise<number> {
  if (redis) {
    try {
      // Use SCAN to find matching keys
      const keys: string[] = [];
      let cursor = '0';
      do {
        const result = await redis.scan(cursor, { match: pattern, count: 100 });
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== '0');

      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error('Redis DEL_PATTERN error:', error);
      return 0;
    }
  }

  // In-memory fallback — simple pattern matching
  let deleted = 0;
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
  for (const [key] of memoryStore) {
    if (regex.test(key)) {
      memoryStore.delete(key);
      deleted++;
    }
  }
  return deleted;
}

export default redis;
