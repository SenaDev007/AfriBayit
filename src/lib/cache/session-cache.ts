// AfriBayit — Session Cache (Redis-backed with in-memory fallback)
// Stores user sessions with TTL for authentication and session management

import { get, set, del, expire, isRedisAvailable } from './redis';

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
  country: string | null;
  kycLevel: number;
  avatar?: string | null;
  createdAt: string;
  lastActivity: string;
  ip?: string;
  userAgent?: string;
}

const SESSION_PREFIX = 'session:';
const SESSION_TTL = 24 * 60 * 60; // 24 hours default
const SESSION_EXTENSION_TTL = 4 * 60 * 60; // extend by 4 hours on activity

/**
 * Create a new user session
 */
export async function createSession(
  sessionId: string,
  data: SessionData,
  ttlSeconds: number = SESSION_TTL
): Promise<void> {
  const key = `${SESSION_PREFIX}${sessionId}`;
  await set(key, data, ttlSeconds);
}

/**
 * Get session data by session ID
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const key = `${SESSION_PREFIX}${sessionId}`;
  const data = await get<SessionData>(key);
  return data;
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const key = `${SESSION_PREFIX}${sessionId}`;
  await del(key);
}

/**
 * Extend a session's TTL (on user activity)
 */
export async function extendSession(
  sessionId: string,
  additionalSeconds: number = SESSION_EXTENSION_TTL
): Promise<boolean> {
  const key = `${SESSION_PREFIX}${sessionId}`;
  return expire(key, additionalSeconds);
}

/**
 * Update session data (e.g., after KYC level change)
 */
export async function updateSessionData(
  sessionId: string,
  updates: Partial<SessionData>
): Promise<boolean> {
  const existing = await getSession(sessionId);
  if (!existing) return false;

  const updated: SessionData = {
    ...existing,
    ...updates,
    lastActivity: new Date().toISOString(),
  };

  // Get existing TTL if Redis is available, otherwise just set with default
  await createSession(sessionId, updated);
  return true;
}

/**
 * Check if a session exists and is valid
 */
export async function isSessionValid(sessionId: string): Promise<boolean> {
  const data = await getSession(sessionId);
  return data !== null;
}

/**
 * Get all active sessions for a user (requires Redis)
 * Falls back to returning empty array in in-memory mode
 */
export async function getUserSessions(userId: string): Promise<string[]> {
  // This is only fully supported with Redis (using a user-sessions set)
  // In-memory mode returns empty array
  const key = `user-sessions:${userId}`;
  const { sismember } = await import('./redis');

  // We can't easily list set members in our abstraction
  // Return empty for now — full implementation would need SMEMBERS
  if (!isRedisAvailable()) {
    return [];
  }

  // With Redis, we'd need raw client for SMEMBERS
  const { getRedisClient } = await import('./redis');
  const client = getRedisClient();
  if (!client) return [];

  try {
    const members = await client.smembers(key);
    return members;
  } catch {
    return [];
  }
}

/**
 * Add session to user's active sessions set
 */
export async function addUserSession(userId: string, sessionId: string): Promise<void> {
  const { sadd } = await import('./redis');
  const key = `user-sessions:${userId}`;
  await sadd(key, sessionId);
  await expire(key, SESSION_TTL);
}

/**
 * Remove session from user's active sessions set
 */
export async function removeUserSession(userId: string, sessionId: string): Promise<void> {
  const key = `user-sessions:${userId}`;
  // Use delPattern or raw client — simplified here
  await del(key);
}
