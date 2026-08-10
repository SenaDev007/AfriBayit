// AfriBayit — Pusher Client Instance
// Client-side Pusher singleton for real-time communication

'use client';

import Pusher from 'pusher-js';
import type { Channel } from 'pusher-js';

let _pusherClient: Pusher | null = null;

/**
 * Get or create the Pusher client instance (lazy singleton)
 * Automatically connects to Pusher using env vars
 */
export function getPusherClient(): Pusher | null {
  if (_pusherClient) return _pusherClient;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  if (!key || !cluster) {
    console.warn('[Pusher Client] Missing NEXT_PUBLIC_PUSHER_KEY or NEXT_PUBLIC_PUSHER_CLUSTER');
    return null;
  }

  _pusherClient = new Pusher(key, {
    cluster,
    forceTLS: true,
    // Authentication endpoint for private/presence channels
    authorizer: (channel) => ({
      authorize: async (socketId, callback) => {
        try {
          const response = await fetch('/api/realtime/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          });

          if (!response.ok) {
            callback(new Error(`Auth failed: ${response.status}`), null);
            return;
          }

          const data = await response.json();
          callback(null, data);
        } catch (error) {
          callback(error as Error, null);
        }
      },
    }),
  });

  // Connection state logging
  _pusherClient.connection.bind('connected', () => {
    console.log('[Pusher Client] Connected');
  });

  _pusherClient.connection.bind('disconnected', () => {
    console.log('[Pusher Client] Disconnected');
  });

  _pusherClient.connection.bind('error', (err: Error) => {
    console.error('[Pusher Client] Connection error:', err.message);
  });

  return _pusherClient;
}

/**
 * Subscribe to a Pusher channel
 * Returns the Channel object for binding events
 */
export function subscribeToChannel(channelName: string): Channel | null {
  const client = getPusherClient();
  if (!client) return null;

  try {
    return client.subscribe(channelName);
  } catch (error) {
    console.error(`[Pusher Client] Failed to subscribe to ${channelName}:`, error);
    return null;
  }
}

/**
 * Bind to an event on a specific channel
 * Returns an unbind function for cleanup
 */
export function bindEvent(
  channelName: string,
  event: string,
  callback: (data: any) => void
): (() => void) | null {
  const client = getPusherClient();
  if (!client) return null;

  try {
    const channel = client.subscribe(channelName);
    channel.bind(event, callback);

    // Return unbind function for cleanup
    return () => {
      channel.unbind(event, callback);
    };
  } catch (error) {
    console.error(`[Pusher Client] Failed to bind "${event}" on ${channelName}:`, error);
    return null;
  }
}

/**
 * Unsubscribe from a Pusher channel
 */
export function unsubscribe(channelName: string): void {
  const client = getPusherClient();
  if (!client) return;

  try {
    client.unsubscribe(channelName);
  } catch (error) {
    console.error(`[Pusher Client] Failed to unsubscribe from ${channelName}:`, error);
  }
}

/**
 * Disconnect the Pusher client entirely
 */
export function disconnectPusherClient(): void {
  if (_pusherClient) {
    _pusherClient.disconnect();
    _pusherClient = null;
  }
}

/**
 * Check if Pusher client is connected
 */
export function isPusherConnected(): boolean {
  if (!_pusherClient) return false;
  return _pusherClient.connection.state === 'connected';
}
