// AfriBayit — Socket.io Real-time Server (Enhanced)
// Manages WebSocket connections for notifications, chat, escrow, property, and booking events
// Includes: JWT authentication, room management, rate limiting, structured events

import { Server, Socket } from 'socket.io';
import { verifyAccessToken, type JWTPayload } from '@/lib/security/jwt-security';

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
  | 'message-read';

interface SocketData {
  userId: string;
  email: string;
  role: string;
  country: string | null;
  kycLevel: number;
  connectedAt: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// ─── Rate Limiting (in-memory per socket) ─────────────────────────────────────

const MAX_MESSAGES_PER_MINUTE = 100;
const socketRateLimits = new Map<string, RateLimitEntry>();

// Cleanup rate limit entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of socketRateLimits) {
      if (now > entry.resetAt) {
        socketRateLimits.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

function checkSocketRateLimit(socketId: string): boolean {
  const now = Date.now();
  let entry = socketRateLimits.get(socketId);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + 60_000 };
    socketRateLimits.set(socketId, entry);
    return true;
  }

  entry.count++;
  if (entry.count > MAX_MESSAGES_PER_MINUTE) {
    return false;
  }

  return true;
}

// ─── Socket.io Server ─────────────────────────────────────────────────────────

let io: Server;

/**
 * Initialize the Socket.io real-time server with authentication,
 * room management, rate limiting, and structured event types.
 */
export function initRealtimeServer(httpServer: any) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    connectTimeout: 10000,
  });

  // ── Authentication Middleware ──
  io.use(async (socket: Socket, next) => {
    try {
      // Extract token from handshake auth or query
      const token =
        (socket.handshake.auth?.token as string) ||
        (socket.handshake.query?.token as string) ||
        (socket.handshake.headers?.authorization as string)?.replace('Bearer ', '');

      if (!token) {
        // Allow unauthenticated connections with limited access
        // They will need to authenticate via 'authenticate' event
        console.warn(`[Socket.io] Unauthenticated connection attempt: ${socket.id}`);
        (socket.data as Partial<SocketData>).connectedAt = Date.now();
        return next();
      }

      // Verify JWT
      const result = await verifyAccessToken(token);
      if (!result.valid || !result.payload) {
        console.warn(`[Socket.io] Invalid token for connection: ${socket.id}`);
        return next(new Error('Authentication failed: invalid token'));
      }

      const payload = result.payload;
      socket.data = {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        country: payload.country ?? null,
        kycLevel: payload.kycLevel ?? 0,
        connectedAt: Date.now(),
      } satisfies SocketData;

      console.log(`[Socket.io] Authenticated connection: ${socket.id} (user: ${payload.sub})`);
      next();
    } catch (error) {
      console.error('[Socket.io] Auth middleware error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const data = socket.data as Partial<SocketData>;
    console.log(`[Socket.io] Client connected: ${socket.id} (user: ${data.userId || 'anonymous'})`);

    // ── Auto-join rooms if authenticated at connect time ──
    if (data.userId) {
      socket.join(`user:${data.userId}`);
      if (data.country) {
        socket.join(`country:${data.country}`);
      }
      io.emit('user-online', data.userId);
    }

    // ── Authenticate (for clients that connect without token) ──
    socket.on('authenticate', (authData: { token?: string; userId?: string }) => {
      // Rate limit check
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit('error', { message: 'Rate limit exceeded. Slow down.' });
        return;
      }

      // JWT-based authentication
      if (authData.token) {
        const result = await verifyAccessToken(authData.token);
        if (!result.valid || !result.payload) {
          socket.emit('auth:error', { message: 'Invalid or expired token' });
          return;
        }

        const payload = result.payload;
        socket.data = {
          userId: payload.sub,
          email: payload.email,
          role: payload.role,
          country: payload.country ?? null,
          kycLevel: payload.kycLevel ?? 0,
          connectedAt: socket.data?.connectedAt ?? Date.now(),
        } satisfies SocketData;

        socket.join(`user:${payload.sub}`);
        if (payload.country) {
          socket.join(`country:${payload.country}`);
        }

        socket.emit('auth:success', { userId: payload.sub, role: payload.role });
        io.emit('user-online', payload.sub);
        console.log(`[Socket.io] User authenticated via event: ${payload.sub}`);
        return;
      }

      // Legacy: simple userId authentication (less secure, for backward compat)
      if (authData.userId) {
        socket.data = {
          ...socket.data,
          userId: authData.userId,
          connectedAt: socket.data?.connectedAt ?? Date.now(),
        } satisfies Partial<SocketData>;

        socket.join(`user:${authData.userId}`);
        socket.emit('auth:success', { userId: authData.userId });
        io.emit('user-online', authData.userId);
        console.log(`[Socket.io] User authenticated (legacy): ${authData.userId}`);
      }
    });

    // ── Room Management ──
    socket.on('join-conversation', (conversationId: string) => {
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }
      socket.join(`conversation:${conversationId}`);
      console.log(`[Socket.io] User ${data.userId} joined conversation: ${conversationId}`);
    });

    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('join-room', (room: string) => {
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }
      // Validate room name format to prevent abuse
      const allowedPrefixes = ['property:', 'booking:', 'escrow:', 'country:'];
      const isAllowed = allowedPrefixes.some(prefix => room.startsWith(prefix));
      if (!isAllowed) {
        socket.emit('error', { message: `Room "${room}" is not joinable` });
        return;
      }
      socket.join(room);
      console.log(`[Socket.io] User ${data.userId} joined room: ${room}`);
    });

    socket.on('leave-room', (room: string) => {
      socket.leave(room);
    });

    // ── Typing Indicators ──
    socket.on('typing', (conversationId: string) => {
      if (!checkSocketRateLimit(socket.id)) return;
      socket.to(`conversation:${conversationId}`).emit('user-typing', {
        userId: data.userId,
        conversationId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('stop-typing', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user-stop-typing', {
        userId: data.userId,
        conversationId,
      });
    });

    // ── New Message ──
    socket.on('send-message', (msgData: { conversationId: string; content: string; type?: string }) => {
      if (!checkSocketRateLimit(socket.id)) {
        socket.emit('error', { message: 'Rate limit exceeded. Max 100 messages/minute.' });
        return;
      }

      if (!data.userId) {
        socket.emit('error', { message: 'Must be authenticated to send messages' });
        return;
      }

      socket.to(`conversation:${msgData.conversationId}`).emit('message:new', {
        ...msgData,
        senderId: data.userId,
        timestamp: new Date().toISOString(),
      });
    });

    // ── Read Receipts ──
    socket.on('mark-read', (readData: { conversationId: string; messageId: string }) => {
      socket.to(`conversation:${readData.conversationId}`).emit('message-read', {
        userId: data.userId,
        conversationId: readData.conversationId,
        messageId: readData.messageId,
      });
    });

    // ── Disconnect ──
    socket.on('disconnect', (reason) => {
      if (data.userId) {
        socket.leave(`user:${data.userId}`);
        io.emit('user-offline', data.userId);
      }
      socketRateLimits.delete(socket.id);
      console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

/**
 * Get the Socket.io server instance
 */
export function getIO(): Server {
  return io;
}

/**
 * Send a real-time notification to a specific user
 */
export function sendToUser(userId: string, event: RealtimeEvent | string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Send a real-time event to all members of a conversation
 */
export function sendToConversation(conversationId: string, event: RealtimeEvent | string, data: any) {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
}

/**
 * Send a real-time event to all users in a country
 */
export function sendToCountry(country: string, event: RealtimeEvent | string, data: any) {
  if (io) {
    io.to(`country:${country}`).emit(event, data);
  }
}

/**
 * Send a real-time event to a specific room (e.g., property:, booking:, escrow:)
 */
export function sendToRoom(room: string, event: RealtimeEvent | string, data: any) {
  if (io) {
    io.to(room).emit(event, data);
  }
}

/**
 * Broadcast an event to all connected clients
 */
export function broadcast(event: RealtimeEvent | string, data: any) {
  if (io) {
    io.emit(event, data);
  }
}

/**
 * Get online user count
 */
export function getOnlineCount(): number {
  if (!io) return 0;
  return io.sockets.sockets.size;
}

/**
 * Get list of connected socket IDs for a user
 */
export function getUserSockets(userId: string): string[] {
  if (!io) return [];
  const room = io.sockets.adapter.rooms.get(`user:${userId}`);
  return room ? Array.from(room) : [];
}
