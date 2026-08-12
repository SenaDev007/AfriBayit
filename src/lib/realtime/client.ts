// AfriBayit — Socket.io Real-time Client (Enhanced)
// Client-side React hook and utilities for WebSocket connections
// Features: useSocket() hook, auto-reconnect with exponential backoff,
// reactive event state, room management based on user session

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RealtimeEvent =
  | 'notification:new'
  | 'message:new'
  | 'escrow:update'
  | 'property:update'
  | 'booking:update'
  | 'user-online'
  | 'user-offline'
  | 'user-typing'
  | 'user-stop-typing'
  | 'message-read'
  | 'auth:success'
  | 'auth:error'
  | 'error';

export interface RealtimeEventPayload {
  event: RealtimeEvent | string;
  data: unknown;
  timestamp: string;
}

export interface UseSocketOptions {
  /** Auto-connect on mount (default: true) */
  autoConnect?: boolean;
  /** Auto-authenticate with session token (default: true) */
  autoAuth?: boolean;
  /** Maximum reconnection attempts (default: Infinity) */
  maxReconnectAttempts?: number;
  /** Initial reconnection delay in ms (default: 1000) */
  reconnectionDelay?: number;
  /** Maximum reconnection delay in ms (default: 30000) */
  maxReconnectionDelay?: number;
  /** Events to subscribe to */
  events?: (RealtimeEvent | string)[];
}

export interface UseSocketReturn {
  /** Whether the socket is connected */
  isConnected: boolean;
  /** Latest event received */
  lastEvent: RealtimeEventPayload | null;
  /** All events received (limited buffer) */
  events: RealtimeEventPayload[];
  /** Reconnect attempt counter */
  reconnectAttempt: number;
  /** Connect manually */
  connect: () => void;
  /** Disconnect manually */
  disconnect: () => void;
  /** Emit an event */
  emit: (event: string, data: unknown) => void;
  /** Join a room */
  joinRoom: (room: string) => void;
  /** Leave a room */
  leaveRoom: (room: string) => void;
  /** Subscribe to a specific event */
  subscribe: (event: string, callback: (data: unknown) => void) => () => void;
  /** Connection error, if any */
  error: string | null;
}

const SOCKET_PATH = '/api/socketio';
const MAX_EVENT_BUFFER = 50;

// ─── Singleton Socket Manager ─────────────────────────────────────────────────

let globalSocket: Socket | null = null;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Get or create the socket singleton
 */
function getSocketInstance(): Socket {
  if (!globalSocket) {
    globalSocket = io({
      path: SOCKET_PATH,
      autoConnect: false,
      reconnection: false, // We handle reconnection ourselves
      timeout: 10000,
    });

    globalSocket.on('connect', () => {
      reconnectAttempts = 0;
      console.log('[Socket.io] Connected:', globalSocket?.id);
    });

    globalSocket.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason);
    });

    globalSocket.on('connect_error', (error) => {
      console.error('[Socket.io] Connection error:', error.message);
    });
  }
  return globalSocket;
}

/**
 * Connect to the socket server with exponential backoff reconnection
 */
function connectWithBackoff(
  socket: Socket,
  token?: string,
  maxAttempts: number = Infinity,
  initialDelay: number = 1000,
  maxDelay: number = 30000
) {
  if (socket.connected) return;

  socket.connect();

  // Send auth token if available
  if (token) {
    socket.emit('authenticate', { token });
  }

  // Set up reconnection with exponential backoff
  const tryReconnect = () => {
    if (socket.connected || reconnectAttempts >= maxAttempts) return;

    reconnectAttempts++;
    const delay = Math.min(initialDelay * Math.pow(2, reconnectAttempts - 1), maxDelay);
    // Add jitter to prevent thundering herd
    const jitter = delay * (0.5 + Math.random() * 0.5);

    console.log(`[Socket.io] Reconnect attempt ${reconnectAttempts} in ${Math.round(jitter)}ms`);

    reconnectTimer = setTimeout(() => {
      if (!socket.connected) {
        socket.connect();
        if (token) {
          socket.emit('authenticate', { token });
        }
        tryReconnect();
      }
    }, jitter);
  };

  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') {
      // Server explicitly disconnected, don't auto-reconnect
      return;
    }
    tryReconnect();
  });
}

/**
 * Clean up the singleton
 */
function cleanupSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

// ─── Legacy Functions (backward compat) ───────────────────────────────────────

/**
 * Get or create the socket instance (legacy API)
 */
export function getSocket(): Socket {
  return getSocketInstance();
}

/**
 * Connect to the socket server and authenticate (legacy API)
 */
export function connectSocket(userId: string): Socket {
  const s = getSocketInstance();
  if (!s.connected) {
    s.connect();
    s.emit('authenticate', { userId });
  }
  return s;
}

/**
 * Connect with JWT token (preferred)
 */
export function connectSocketWithToken(token: string): Socket {
  const s = getSocketInstance();
  if (!s.connected) {
    connectWithBackoff(s, token);
  }
  return s;
}

/**
 * Disconnect from the socket server
 */
export function disconnectSocket() {
  cleanupSocket();
  if (globalSocket?.connected) {
    globalSocket.disconnect();
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return globalSocket?.connected ?? false;
}

// ─── React Hook ───────────────────────────────────────────────────────────────

/**
 * useSocket() — React hook for real-time Socket.io connections
 *
 * Features:
 * - Auto-connects on mount (configurable)
 * - Auto-authenticates with NextAuth session token
 * - Auto-reconnects with exponential backoff
 * - Subscribes to specified events and returns reactive state
 * - Handles room joining based on user session (userId, country)
 *
 * @example
 * ```tsx
 * const { isConnected, lastEvent, emit, joinRoom } = useSocket({
 *   events: ['notification:new', 'message:new', 'escrow:update'],
 * });
 * ```
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const {
    autoConnect = true,
    autoAuth = true,
    maxReconnectAttempts = Infinity,
    reconnectionDelay = 1000,
    maxReconnectionDelay = 30000,
    events: subscribedEvents = [],
  } = options;

  const { data: session } = useSession();
  const callbacksRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());

  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload | null>(null);
  const [eventBuffer, setEventBuffer] = useState<RealtimeEventPayload[]>([]);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Initialize socket and set up connection handlers
  useEffect(() => {
    const socket = getSocketInstance();

    // Connection state handlers
    const onConnect = () => {
      setIsConnected(true);
      setError(null);
      setReconnectAttempt(0);
    };

    const onDisconnect = (reason: string) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        setError('Server disconnected the session');
      }
    };

    const onConnectError = (err: Error) => {
      setIsConnected(false);
      setError(err.message);
      setReconnectAttempt(reconnectAttempts);
    };

    const onAuthSuccess = (data: { userId: string; role: string }) => {
      console.log('[Socket.io] Auth success:', data.userId);
    };

    const onAuthError = (data: { message: string }) => {
      setError(data.message);
      console.error('[Socket.io] Auth error:', data.message);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('auth:success', onAuthSuccess);
    socket.on('auth:error', onAuthError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('auth:success', onAuthSuccess);
      socket.off('auth:error', onAuthError);
    };
  }, []);

  // Auto-connect and authenticate
  useEffect(() => {
    const socket = getSocketInstance();
    if (!autoConnect) return;

    if (!socket.connected) {
      const accessToken = (session?.user as Record<string, unknown>)?.accessToken as string | undefined;

      if (autoAuth && accessToken) {
        connectWithBackoff(
          socket,
          accessToken,
          maxReconnectAttempts,
          reconnectionDelay,
          maxReconnectionDelay
        );
      } else {
        socket.connect();
      }
    }

    // Auto-join user room when session is available
    if (session?.user) {
      const userId = (session.user as Record<string, unknown>).id as string;
      const country = (session.user as Record<string, unknown>).country as string | undefined;

      if (userId) {
        socket.emit('authenticate', {
          userId,
          token: (session.user as Record<string, unknown>).accessToken,
        });

        if (country) {
          socket.emit('join-room', `country:${country}`);
        }
      }
    }
  }, [session, autoConnect, autoAuth, maxReconnectAttempts, reconnectionDelay, maxReconnectionDelay]);

  // Subscribe to specified events
  useEffect(() => {
    const socket = getSocketInstance();
    if (subscribedEvents.length === 0) return;

    const handlers: Array<[string, (data: unknown) => void]> = [];

    for (const event of subscribedEvents) {
      const handler = (data: unknown) => {
        const payload: RealtimeEventPayload = {
          event,
          data,
          timestamp: new Date().toISOString(),
        };
        setLastEvent(payload);
        setEventBuffer(prev => {
          const next = [...prev, payload];
          return next.length > MAX_EVENT_BUFFER ? next.slice(-MAX_EVENT_BUFFER) : next;
        });

        // Call any registered callbacks for this event
        const callbacks = callbacksRef.current.get(event);
        if (callbacks) {
          for (const cb of callbacks) {
            try {
              cb(data);
            } catch (err) {
              console.error(`[Socket.io] Event callback error for "${event}":`, err);
            }
          }
        }
      };

      socket.on(event, handler);
      handlers.push([event, handler]);
    }

    return () => {
      for (const [event, handler] of handlers) {
        socket.off(event, handler);
      }
    };
  }, [subscribedEvents]);

  // ── Action Functions ──

  const connect = useCallback(() => {
    const socket = getSocketInstance();
    const accessToken = (session?.user as Record<string, unknown>)?.accessToken as string | undefined;
    connectWithBackoff(socket, accessToken, maxReconnectAttempts, reconnectionDelay, maxReconnectionDelay);
  }, [session, maxReconnectAttempts, reconnectionDelay, maxReconnectionDelay]);

  const disconnect = useCallback(() => {
    cleanupSocket();
    getSocketInstance().disconnect();
    setIsConnected(false);
  }, []);

  const emit = useCallback((event: string, data: unknown) => {
    getSocketInstance().emit(event, data);
  }, []);

  const joinRoom = useCallback((room: string) => {
    getSocketInstance().emit('join-room', room);
  }, []);

  const leaveRoom = useCallback((room: string) => {
    getSocketInstance().emit('leave-room', room);
  }, []);

  const subscribe = useCallback((event: string, callback: (data: unknown) => void) => {
    if (!callbacksRef.current.has(event)) {
      callbacksRef.current.set(event, new Set());
    }
    callbacksRef.current.get(event)!.add(callback);

    const socket = getSocketInstance();
    socket.on(event, callback as (...args: unknown[]) => void);

    // Return unsubscribe function
    return () => {
      callbacksRef.current.get(event)?.delete(callback);
      socket.off(event, callback as (...args: unknown[]) => void);
    };
  }, []);

  return {
    isConnected,
    lastEvent,
    events: eventBuffer,
    reconnectAttempt,
    connect,
    disconnect,
    emit,
    joinRoom,
    leaveRoom,
    subscribe,
    error,
  };
}

// ─── SSE Fallback Hook ────────────────────────────────────────────────────────

/**
 * useSSE() — Server-Sent Events fallback for environments where
 * Socket.io WebSocket is not available (e.g., Vercel serverless).
 *
 * Falls back to polling the SSE endpoint for real-time events.
 */
export function useSSE(options: { userId?: string; events?: string[] } = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<RealtimeEventPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!options.userId) return;

    const params = new URLSearchParams({ userId: options.userId });
    if (options.events?.length) {
      params.set('events', options.events.join(','));
    }

    const es = new EventSource(`/api/realtime/sse?${params.toString()}`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastEvent({
          event: data.event || 'unknown',
          data: data.data || data,
          timestamp: data.timestamp || new Date().toISOString(),
        });
      } catch {
        // Non-JSON message
        setLastEvent({
          event: 'message',
          data: event.data,
          timestamp: new Date().toISOString(),
        });
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      setError('SSE connection error');
      // EventSource auto-reconnects
    };

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    };
  }, [options.userId, options.events]);

  return { isConnected, lastEvent, error };
}
