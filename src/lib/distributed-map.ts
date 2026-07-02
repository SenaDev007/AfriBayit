// AfriBayit — Distributed Map (P2.6)
// Replaces in-memory `new Map<string, T>()` for serverless multi-instance safety.
// Uses Upstash Redis when configured, falls back to in-memory Map in dev.
//
// Usage:
//   import { createDistributedMap } from '@/lib/distributed-map';
//   const tokenBlacklist = createDistributedMap<BlacklistEntry>('jwt:blacklist', 3600); // 1h TTL
//
// Migrated modules (P2.6):
//   - lib/security/jwt-security.ts: tokenBlacklist, refreshTokens
//   - lib/security/anti-scraping.ts: requestTracker, failedAttempts
//   - lib/ussd/ussd-engine.ts: sessions
//   - lib/scheduling/index.ts: appointments (now persisted in DB Appointment model P2.9)
//   - lib/rebecca/agent-orchestrator.ts: failureTracker

import { getRedis, isRedisConfigured, memoryFallback } from '@/lib/redis';

interface DistributedMapOptions {
  /** TTL in seconds for entries (default: no expiry) */
  ttl?: number;
  /** Namespace prefix for keys (e.g. 'jwt:blacklist') */
  namespace: string;
}

/**
 * Create a distributed Map-like store backed by Upstash Redis.
 * Falls back to in-memory Map when Redis is not configured (dev environment).
 *
 * WARNING: In serverless multi-instance (Vercel), the in-memory fallback
 * is NOT shared across instances. Always configure UPSTASH_REDIS_REST_URL
 * and UPSTASH_REDIS_REST_TOKEN in production.
 */
export function createDistributedMap<T>(namespace: string, ttlSeconds?: number) {
  const redis = getRedis();
  const useRedis = isRedisConfigured && redis;
  const ttl = ttlSeconds ?? 0; // 0 = no expiry

  // In-memory fallback (used in dev or when Redis is not configured)
  const memoryMap = new Map<string, { value: T; expiresAt: number | null }>();

  const key = (k: string) => `${namespace}:${k}`;

  return {
    async get(k: string): Promise<T | null> {
      if (useRedis) {
        const raw = await redis!.get(key(k));
        if (!raw) return null;
        try {
          return typeof raw === 'string' ? JSON.parse(raw) : (raw as T);
        } catch {
          return null;
        }
      }
      const entry = memoryMap.get(k);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        memoryMap.delete(k);
        return null;
      }
      return entry.value;
    },

    async set(k: string, value: T, customTtl?: number): Promise<void> {
      const effectiveTtl = customTtl ?? ttl;
      if (useRedis) {
        const serialized = JSON.stringify(value);
        if (effectiveTtl > 0) {
          await redis!.set(key(k), serialized, { ex: effectiveTtl });
        } else {
          await redis!.set(key(k), serialized);
        }
        return;
      }
      memoryMap.set(k, {
        value,
        expiresAt: effectiveTtl > 0 ? Date.now() + effectiveTtl * 1000 : null,
      });
      // Cleanup old entries if memory grows too large
      if (memoryMap.size > 1000) {
        const oldestKey = memoryMap.keys().next().value;
        if (oldestKey) memoryMap.delete(oldestKey);
      }
    },

    async delete(k: string): Promise<boolean> {
      if (useRedis) {
        const result = await redis!.del(key(k));
        return result > 0;
      }
      return memoryMap.delete(k);
    },

    async has(k: string): Promise<boolean> {
      const value = await this.get(k);
      return value !== null;
    },

    async clear(): Promise<void> {
      if (useRedis) {
        // Note: KEYS can be slow on large datasets. For production with many keys,
        // consider using SCAN or maintaining a set of keys.
        const keys = await redis!.keys(`${namespace}:*`);
        if (keys.length > 0) {
          await redis!.del(...keys);
        }
        return;
      }
      memoryMap.clear();
    },

    /** Get count of entries (approximate in Redis mode) */
    async size(): Promise<number> {
      if (useRedis) {
        const keys = await redis!.keys(`${namespace}:*`);
        return keys.length;
      }
      return memoryMap.size;
    },

    /** Check if Redis backend is active (for logging/debugging) */
    isDistributed(): boolean {
      return !!useRedis;
    },
  };
}

/**
 * Helper to check if a key exists in a distributed map
 */
export async function distributedHas(namespace: string, key: string): Promise<boolean> {
  const map = createDistributedMap(namespace);
  return map.has(key);
}

/**
 * Increment a counter in Redis (atomic operation)
 * Useful for rate limiting and failure tracking
 */
export async function distributedIncrement(
  namespace: string,
  key: string,
  ttlSeconds: number = 3600
): Promise<number> {
  const redis = getRedis();
  if (!isRedisConfigured || !redis) {
    // In-memory fallback
    const fullKey = `${namespace}:${key}`;
    const current = parseInt(memoryFallback.get(fullKey) || '0', 10);
    const newValue = current + 1;
    memoryFallback.set(fullKey, String(newValue), ttlSeconds);
    return newValue;
  }

  const fullKey = `${namespace}:${key}`;
  const pipeline = redis.pipeline();
  pipeline.incr(fullKey);
  pipeline.expire(fullKey, ttlSeconds);
  const results = await pipeline.exec();
  return (results[0] as number) || 1;
}
