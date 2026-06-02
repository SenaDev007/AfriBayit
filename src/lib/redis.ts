// AfriBayit — Redis Client Module
// Upstash Redis REST API client with in-memory fallback
// Works in Vercel serverless / edge environments

import { Redis } from '@upstash/redis';

// ─── Configuration ───────────────────────────────────────────────────────────

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const isRedisConfigured = !!(UPSTASH_URL && UPSTASH_TOKEN);

// ─── Redis Client ────────────────────────────────────────────────────────────

let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (!isRedisConfigured) return null;
  if (!_redis) {
    _redis = new Redis({
      url: UPSTASH_URL!,
      token: UPSTASH_TOKEN!,
    });
  }
  return _redis;
}

// ─── In-Memory Fallback Store ────────────────────────────────────────────────

interface InMemoryEntry {
  value: string;
  expiresAt: number | null; // Unix ms, null = no expiry
}

const MAX_IN_MEMORY_KEYS = 1000;
const memoryStore = new Map<string, InMemoryEntry>();

// Periodic cleanup of expired entries (every 5 minutes)
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

/**
 * In-memory store that mimics a subset of the Upstash Redis interface.
 * Used when Redis is not configured (local dev, no Upstash account).
 */
export const memoryFallback = {
  async get(key: string): Promise<string | null> {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  },

  async set(key: string, value: string, options?: { ex?: number; px?: number; nx?: boolean; xx?: boolean }): Promise<string | null> {
    if (options?.nx) {
      if (memoryStore.has(key)) return null;
    }
    if (options?.xx) {
      if (!memoryStore.has(key)) return null;
    }

    // Evict oldest entries if at capacity
    if (!memoryStore.has(key) && memoryStore.size >= MAX_IN_MEMORY_KEYS) {
      const firstKey = memoryStore.keys().next().value;
      if (firstKey) memoryStore.delete(firstKey);
    }

    let expiresAt: number | null = null;
    if (options?.ex) expiresAt = Date.now() + options.ex * 1000;
    if (options?.px) expiresAt = Date.now() + options.px;

    memoryStore.set(key, { value, expiresAt });
    return 'OK';
  },

  async del(...keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (memoryStore.delete(key)) deleted++;
    }
    return deleted;
  },

  async incr(key: string): Promise<number> {
    const entry = memoryStore.get(key);
    const current = entry ? parseInt(entry.value, 10) : 0;
    const next = (isNaN(current) ? 0 : current) + 1;
    memoryStore.set(key, {
      value: String(next),
      expiresAt: entry?.expiresAt ?? null,
    });
    return next;
  },

  async expire(key: string, seconds: number): Promise<number> {
    const entry = memoryStore.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  },

  async ttl(key: string): Promise<number> {
    const entry = memoryStore.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  },

  async exists(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      const entry = memoryStore.get(key);
      if (entry && (!entry.expiresAt || Date.now() <= entry.expiresAt)) {
        count++;
      }
    }
    return count;
  },

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    const now = Date.now();
    const result: string[] = [];
    for (const [key, entry] of memoryStore) {
      if (entry.expiresAt && now > entry.expiresAt) continue;
      if (regex.test(key)) result.push(key);
    }
    return result;
  },

  async mget(...keys: string[]): Promise<(string | null)[]> {
    return keys.map((key) => {
      const entry = memoryStore.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        memoryStore.delete(key);
        return null;
      }
      return entry.value;
    });
  },

  /** Delete all keys matching a pattern */
  async delPattern(pattern: string): Promise<number> {
    const matched = await this.keys(pattern);
    let deleted = 0;
    for (const key of matched) {
      if (memoryStore.delete(key)) deleted++;
    }
    return deleted;
  },
};

// ─── Unified Redis Interface ─────────────────────────────────────────────────

/**
 * Use this for all Redis operations. Automatically uses Redis when configured,
 * or falls back to in-memory store when not.
 */
export const redis = isRedisConfigured ? getRedis()! : (memoryFallback as unknown as Redis);
