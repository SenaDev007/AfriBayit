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
      // Default retries (5 attempts, e^n×50ms backoff) turn a single
      // unreachable endpoint into ~4.5s of retry sleep PER COMMAND — and a
      // listing route issues cache.get() + cache.set(), i.e. ~9s added to
      // every uncached request (measured in production: 8.9–9.5s MISSes
      // while the database answered SELECT 1 in 47ms). One retry with a
      // 100ms backoff keeps the worst case short; the per-command timeout
      // below bounds it further.
      retry: { retries: 1, backoff: () => 100 },
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

// ─── Resilience: per-command timeout + circuit breaker ──────────────────────
// A dead/misconfigured Upstash endpoint must degrade to "no shared cache",
// never to seconds of retry backoff on user-facing requests.

const REDIS_COMMAND_TIMEOUT_MS = 750;
const CIRCUIT_FAILURE_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 60_000;

let consecutiveFailures = 0;
let circuitOpenUntil = 0;

function isCircuitOpen(): boolean {
  return Date.now() < circuitOpenUntil;
}

function recordRedisFailure(): void {
  consecutiveFailures++;
  if (consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD) {
    circuitOpenUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
    consecutiveFailures = 0;
    console.warn(
      `[redis] ${CIRCUIT_FAILURE_THRESHOLD} consecutive command failures — bypassing Upstash for ${
        CIRCUIT_COOLDOWN_MS / 1000
      }s (in-memory fallback)`
    );
  }
}

function recordRedisSuccess(): void {
  consecutiveFailures = 0;
}

function withCommandTimeout<T>(label: string, promise: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[redis] ${label} timed out after ${REDIS_COMMAND_TIMEOUT_MS}ms`));
    }, REDIS_COMMAND_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/**
 * Wrap the real Upstash client so that EVERY command is guarded by:
 *   1. a hard per-command timeout (REDIS_COMMAND_TIMEOUT_MS), and
 *   2. a circuit breaker — after CIRCUIT_FAILURE_THRESHOLD consecutive
 *      failures, commands bypass Upstash entirely and use the in-memory
 *      fallback for CIRCUIT_COOLDOWN_MS, then automatically retry.
 * Callers already treat Redis errors as cache misses (try/catch in
 * cache.ts and rate-limiter.ts), so a dead endpoint costs a few hundred
 * ms once instead of ~9s on every request.
 */
function createGuardedRedisClient(base: Redis): Redis {
  const target = base as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
  const fallback = memoryFallback as unknown as Record<
    string,
    (...args: unknown[]) => Promise<unknown>
  >;

  return new Proxy(target, {
    get(obj, prop) {
      const original = obj[prop as string];
      if (typeof original !== 'function') return original;

      return (...args: unknown[]) => {
        // Circuit open → serve from the in-memory fallback without
        // touching the (currently unreachable) Upstash endpoint.
        if (isCircuitOpen()) {
          const fb = fallback[prop as string];
          if (typeof fb === 'function') {
            return Promise.resolve(fb.apply(memoryFallback, args)).catch(() => null);
          }
          // Method not available in the fallback (e.g. pipeline) — fail fast.
          return Promise.reject(new Error(`[redis] circuit open: ${String(prop)}() unavailable`));
        }
        return withCommandTimeout(
          String(prop),
          Promise.resolve(original.apply(base, args))
        ).then(
          (value) => {
            recordRedisSuccess();
            return value;
          },
          (error) => {
            recordRedisFailure();
            throw error;
          }
        );
      };
    },
  }) as unknown as Redis;
}

// ─── Unified Redis Interface ─────────────────────────────────────────────────

/**
 * Use this for all Redis operations. Automatically uses Redis when configured,
 * or falls back to in-memory store when not.
 */
export const redis: Redis = isRedisConfigured
  ? createGuardedRedisClient(getRedis()!)
  : (memoryFallback as unknown as Redis);
