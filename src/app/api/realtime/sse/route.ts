// AfriBayit — Server-Sent Events (SSE) Real-time Endpoint
// Fallback for environments where Socket.io WebSocket is not available
// (e.g., Vercel serverless). Clients subscribe with their userId
// and receive real-time events via SSE.

import { redis, isRedisConfigured, memoryFallback } from '@/lib/redis';
import { authGuard } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for SSE connections

// ─── In-Memory Event Store (for when Redis is not configured) ─────────────────

interface SSEEvent {
  id: string;
  event: string;
  data: unknown;
  timestamp: string;
  userId?: string; // If targeting a specific user
}

// Store recent events with 5-minute TTL
const EVENT_TTL = 5 * 60; // 5 minutes in seconds

// Active SSE connections tracking
interface SSEConnection {
  userId: string;
  controller: ReadableStreamDefaultController;
  connectedAt: number;
  lastEventId?: string;
}

const activeConnections = new Map<string, SSEConnection[]>();

// ─── Helper: Push event to connected SSE clients ──────────────────────────────

function pushToSSEClients(userId: string, event: SSEEvent) {
  const connections = activeConnections.get(userId);
  if (!connections || connections.length === 0) return;

  for (const conn of connections) {
    try {
      const data = `event: ${event.event}\nid: ${event.id}\ndata: ${JSON.stringify(event.data)}\n\n`;
      conn.controller.enqueue(new TextEncoder().encode(data));
    } catch (err) {
      // Connection might be closed
      console.warn(`[SSE] Failed to push to connection for user ${userId}:`, err);
    }
  }
}

// ─── Helper: Store event for replay/recovery ──────────────────────────────────

async function storeEvent(event: SSEEvent): Promise<void> {
  const key = `sse:events:${event.userId || 'global'}:${event.id}`;
  const store = isRedisConfigured ? redis : memoryFallback;
  try {
    await store.set(key, JSON.stringify(event), { ex: EVENT_TTL });
  } catch (err) {
    console.warn('[SSE] Failed to store event:', err);
  }
}

// ─── GET /api/realtime/sse ────────────────────────────────────────────────────

export async function GET(request: Request) {
  // Authenticate the user
  const auth = await authGuard(request);
  if (!auth.success) return auth.response;

  const { searchParams } = new URL(request.url);
  const userId = auth.userId;
  const lastEventId = request.headers.get('Last-Event-ID') || undefined;

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      const connection: SSEConnection = {
        userId,
        controller,
        connectedAt: Date.now(),
        lastEventId,
      };

      // Track this connection
      const existing = activeConnections.get(userId) || [];
      existing.push(connection);
      activeConnections.set(userId, existing);

      // Send initial connection event
      const connectEvent = `event: connected\ndata: ${JSON.stringify({ userId, timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(new TextEncoder().encode(connectEvent));

      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const heartbeatData = `event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`;
          controller.enqueue(new TextEncoder().encode(heartbeatData));
        } catch {
          clearInterval(heartbeat);
        }
      }, 30_000);

      // If Redis is configured, subscribe to user-specific events
      // (Note: Upstash Redis REST API doesn't support pub/sub directly,
      //  so we use polling or in-memory event queue)

      // Cleanup on close
      const cleanup = () => {
        clearInterval(heartbeat);
        const connections = activeConnections.get(userId) || [];
        const idx = connections.indexOf(connection);
        if (idx >= 0) {
          connections.splice(idx, 1);
          if (connections.length === 0) {
            activeConnections.delete(userId);
          }
        }
      };

      // Handle abort signal
      if (request.signal) {
        request.signal.addEventListener('abort', cleanup);
      }
    },
    cancel() {
      // Clean up connection
      const connections = activeConnections.get(userId) || [];
      const idx = connections.findIndex(c => c.userId === userId);
      if (idx >= 0) {
        connections.splice(idx, 1);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || '*',
    },
  });
}

// ─── POST /api/realtime/sse ───────────────────────────────────────────────────
// Internal endpoint to push events to SSE-connected clients

export async function POST(request: Request) {
  try {
    // This endpoint is called internally by the server to push events
    // In production, this would be called by the notification system
    const body = await request.json();
    const { userId, event, data } = body as {
      userId: string;
      event: string;
      data: unknown;
    };

    if (!userId || !event) {
      return new Response(
        JSON.stringify({ error: 'userId and event are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sseEvent: SSEEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      event,
      data,
      timestamp: new Date().toISOString(),
      userId,
    };

    // Store event for potential replay
    await storeEvent(sseEvent);

    // Push to connected SSE clients
    pushToSSEClients(userId, sseEvent);

    return new Response(
      JSON.stringify({ success: true, eventId: sseEvent.id }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SSE] POST error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to push SSE event' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
