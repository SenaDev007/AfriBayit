// AfriBayit — Pusher Server Instance
// Real-time event delivery compatible with Vercel serverless

import Pusher from 'pusher';

let _pusher: Pusher | null = null;

/**
 * Get or create the Pusher server instance (lazy singleton)
 */
export function getPusherServer(): Pusher | null {
  if (_pusher) return _pusher;

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!appId || !key || !secret || !cluster) {
    console.warn('[Pusher] Missing env vars — real-time events will be DB-only');
    return null;
  }

  _pusher = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return _pusher;
}

/**
 * Check if Pusher is configured and available
 */
export function isPusherConfigured(): boolean {
  return getPusherServer() !== null;
}

/**
 * Trigger a real-time event on a Pusher channel
 */
export async function triggerEvent(
  channel: string,
  event: string,
  data: Record<string, unknown>
): Promise<boolean> {
  const pusher = getPusherServer();
  if (!pusher) {
    console.warn(`[Pusher] Not configured — skipping event "${event}" on "${channel}"`);
    return false;
  }

  try {
    await pusher.trigger(channel, event, data);
    return true;
  } catch (error) {
    console.error(`[Pusher] Failed to trigger "${event}" on "${channel}":`, error);
    return false;
  }
}

/**
 * Trigger events on multiple channels at once
 */
export async function triggerBatch(
  batch: Array<{ channel: string; name: string; data: Record<string, unknown> }>
): Promise<boolean> {
  const pusher = getPusherServer();
  if (!pusher) return false;

  try {
    await pusher.triggerBatch(batch);
    return true;
  } catch (error) {
    console.error('[Pusher] Failed to trigger batch:', error);
    return false;
  }
}

/**
 * Authenticate a Pusher user connection (user authentication)
 * Used for private channels and presence channels
 */
export function authenticateUser(
  socketId: string,
  userId: string,
  userInfo?: Record<string, string>
): { auth: string } | null {
  const pusher = getPusherServer();
  if (!pusher) return null;

  try {
    const authResponse = pusher.authenticateUser(socketId, {
      id: userId,
      user_info: userInfo || { name: userId },
    });
    return authResponse;
  } catch (error) {
    console.error('[Pusher] User authentication failed:', error);
    return null;
  }
}

/**
 * Authorize access to a private channel
 * Validates that the user has access to the requested channel
 */
export function authorizeChannel(
  socketId: string,
  channelName: string,
  userId: string
): { auth: string } | null {
  const pusher = getPusherServer();
  if (!pusher) return null;

  try {
    const authResponse = pusher.authorizeChannel(socketId, channelName);
    return authResponse;
  } catch (error) {
    console.error(`[Pusher] Channel authorization failed for ${channelName}:`, error);
    return null;
  }
}
