// AfriBayit — Redis Session Store
// Store NextAuth sessions in Redis for server-side session management
// Supports session invalidation, multi-device logout, and TTL-based expiry

import { redis, isRedisConfigured, memoryFallback } from '@/lib/redis';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SessionData {
  sessionId: string;
  userId: string;
  role: string;
  email: string;
  name?: string;
  avatar?: string;
  country?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  createdAt: number;
  lastAccessedAt: number;
}

export interface SessionCreateOptions {
  userId: string;
  role: string;
  email: string;
  name?: string;
  avatar?: string;
  country?: string;
  deviceFingerprint?: string;
  ipAddress?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SESSION_PREFIX = 'session:';
const USER_SESSIONS_PREFIX = 'user_sessions:';
const STANDARD_SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds
const EXTENDED_SESSION_TTL = 30 * 24 * 60 * 60; // 30 days for "remember me"

// ─── Session Store Interface ─────────────────────────────────────────────────

export const sessionStore = {
  /**
   * Create a new session and store it in Redis.
   * Returns the session data with the generated session ID.
   */
  async create(options: SessionCreateOptions, rememberMe = false): Promise<SessionData> {
    const sessionId = generateSessionId();
    const now = Date.now();

    const session: SessionData = {
      sessionId,
      userId: options.userId,
      role: options.role,
      email: options.email,
      name: options.name,
      avatar: options.avatar,
      country: options.country,
      deviceFingerprint: options.deviceFingerprint,
      ipAddress: options.ipAddress,
      createdAt: now,
      lastAccessedAt: now,
    };

    const ttl = rememberMe ? EXTENDED_SESSION_TTL : STANDARD_SESSION_TTL;
    const sessionKey = `${SESSION_PREFIX}${sessionId}`;
    const userSessionsKey = `${USER_SESSIONS_PREFIX}${options.userId}`;

    try {
      // Store the session data
      await redis.set(sessionKey, JSON.stringify(session), { ex: ttl });

      // Add session ID to the user's session set
      if (isRedisConfigured) {
        // Use Redis SET for tracking user sessions
        const redisClient = redis as unknown as {
          sadd: (key: string, ...members: string[]) => Promise<number>;
          srem: (key: string, ...members: string[]) => Promise<number>;
          smembers: (key: string) => Promise<string[]>;
          expire: (key: string, seconds: number) => Promise<number>;
        };
        await redisClient.sadd(userSessionsKey, sessionId);
        // Set expiry on the user sessions set to match session TTL
        await redisClient.expire(userSessionsKey, ttl);
      } else {
        // In-memory fallback: store as a simple set
        const existing = await memoryFallback.get(userSessionsKey);
        const sessionIds: string[] = existing ? JSON.parse(existing) : [];
        if (!sessionIds.includes(sessionId)) {
          sessionIds.push(sessionId);
        }
        await memoryFallback.set(userSessionsKey, JSON.stringify(sessionIds), { ex: ttl });
      }
    } catch (error) {
      console.warn('[session-store] Error creating session:', error);
    }

    return session;
  },

  /**
   * Get a session by its ID.
   * Returns null if session not found or expired.
   */
  async get(sessionId: string): Promise<SessionData | null> {
    const sessionKey = `${SESSION_PREFIX}${sessionId}`;

    try {
      const raw = await redis.get(sessionKey);
      if (!raw) return null;

      const session: SessionData = JSON.parse(raw as string);

      // Update last accessed time (fire and forget)
      session.lastAccessedAt = Date.now();
      redis.set(sessionKey, JSON.stringify(session), { ex: STANDARD_SESSION_TTL }).catch(() => {});

      return session;
    } catch (error) {
      console.warn('[session-store] Error getting session:', error);
      return null;
    }
  },

  /**
   * Update session data.
   */
  async update(sessionId: string, updates: Partial<SessionData>): Promise<SessionData | null> {
    const sessionKey = `${SESSION_PREFIX}${sessionId}`;

    try {
      const raw = await redis.get(sessionKey);
      if (!raw) return null;

      const session: SessionData = {
        ...JSON.parse(raw as string),
        ...updates,
        sessionId, // Ensure sessionId cannot be overwritten
        lastAccessedAt: Date.now(),
      };

      await redis.set(sessionKey, JSON.stringify(session), { ex: STANDARD_SESSION_TTL });
      return session;
    } catch (error) {
      console.warn('[session-store] Error updating session:', error);
      return null;
    }
  },

  /**
   * Delete a specific session (single device logout).
   */
  async delete(sessionId: string): Promise<boolean> {
    const sessionKey = `${SESSION_PREFIX}${sessionId}`;

    try {
      // Get the session first to remove from user's session set
      const raw = await redis.get(sessionKey);
      if (raw) {
        const session: SessionData = JSON.parse(raw as string);
        const userSessionsKey = `${USER_SESSIONS_PREFIX}${session.userId}`;

        if (isRedisConfigured) {
          const redisClient = redis as unknown as {
            srem: (key: string, ...members: string[]) => Promise<number>;
          };
          await redisClient.srem(userSessionsKey, sessionId);
        } else {
          const existing = await memoryFallback.get(userSessionsKey);
          if (existing) {
            const sessionIds: string[] = JSON.parse(existing);
            const filtered = sessionIds.filter((id) => id !== sessionId);
            await memoryFallback.set(userSessionsKey, JSON.stringify(filtered), { ex: STANDARD_SESSION_TTL });
          }
        }
      }

      const deleted = await redis.del(sessionKey);
      return deleted > 0;
    } catch (error) {
      console.warn('[session-store] Error deleting session:', error);
      return false;
    }
  },

  /**
   * Invalidate all sessions for a user (logout from all devices).
   * Returns the number of sessions invalidated.
   */
  async invalidateAll(userId: string): Promise<number> {
    const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;

    try {
      // Get all session IDs for this user
      let sessionIds: string[] = [];

      if (isRedisConfigured) {
        const redisClient = redis as unknown as {
          smembers: (key: string) => Promise<string[]>;
          del: (...keys: string[]) => Promise<number>;
        };
        sessionIds = await redisClient.smembers(userSessionsKey);
      } else {
        const existing = await memoryFallback.get(userSessionsKey);
        if (existing) {
          sessionIds = JSON.parse(existing);
        }
      }

      if (sessionIds.length === 0) return 0;

      // Delete all sessions
      const sessionKeys = sessionIds.map((id) => `${SESSION_PREFIX}${id}`);
      if (sessionKeys.length > 0) {
        await redis.del(...sessionKeys);
      }

      // Delete the user sessions set
      await redis.del(userSessionsKey);

      return sessionIds.length;
    } catch (error) {
      console.warn('[session-store] Error invalidating all sessions:', error);
      return 0;
    }
  },

  /**
   * Get all active sessions for a user.
   * Returns session data for each active session.
   */
  async getUserSessions(userId: string): Promise<SessionData[]> {
    const userSessionsKey = `${USER_SESSIONS_PREFIX}${userId}`;

    try {
      let sessionIds: string[] = [];

      if (isRedisConfigured) {
        const redisClient = redis as unknown as {
          smembers: (key: string) => Promise<string[]>;
        };
        sessionIds = await redisClient.smembers(userSessionsKey);
      } else {
        const existing = await memoryFallback.get(userSessionsKey);
        if (existing) {
          sessionIds = JSON.parse(existing);
        }
      }

      // Fetch all session data in parallel
      const sessions: SessionData[] = [];
      const results = await Promise.allSettled(
        sessionIds.map((id) => sessionStore.get(id))
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          sessions.push(result.value);
        }
      }

      return sessions;
    } catch (error) {
      console.warn('[session-store] Error getting user sessions:', error);
      return [];
    }
  },

  /**
   * Extend a session's TTL (e.g., on activity).
   */
  async extend(sessionId: string, rememberMe = false): Promise<boolean> {
    const sessionKey = `${SESSION_PREFIX}${sessionId}`;
    const ttl = rememberMe ? EXTENDED_SESSION_TTL : STANDARD_SESSION_TTL;

    try {
      const result = await redis.expire(sessionKey, ttl);
      return result > 0;
    } catch (error) {
      console.warn('[session-store] Error extending session:', error);
      return false;
    }
  },

  /**
   * Count active sessions for a user.
   */
  async countUserSessions(userId: string): Promise<number> {
    const sessions = await sessionStore.getUserSessions(userId);
    return sessions.length;
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSessionId(): string {
  // Generate a cryptographically random session ID
  const bytes = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
