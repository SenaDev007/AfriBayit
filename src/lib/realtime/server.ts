// AfriBayit — Socket.io Real-time Server
// Manages WebSocket connections for notifications, chat, and typing indicators

import { Server } from 'socket.io';

let io: Server;

export function initRealtimeServer(httpServer: any) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // ── Authentication ──
    socket.on('authenticate', (userId: string) => {
      socket.join(`user:${userId}`);
      socket.data.userId = userId;
      console.log(`[Socket.io] User authenticated: ${userId}`);

      // Notify others that user is online
      io.emit('user-online', userId);
    });

    // ── Join conversation rooms ──
    socket.on('join-conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`[Socket.io] User ${socket.data.userId} joined conversation: ${conversationId}`);
    });

    // ── Leave conversation rooms ──
    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ── Typing indicators ──
    socket.on('typing', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user-typing', {
        userId: socket.data.userId,
        conversationId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('stop-typing', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user-stop-typing', {
        userId: socket.data.userId,
        conversationId,
      });
    });

    // ── New message ──
    socket.on('send-message', (data: { conversationId: string; content: string; type?: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('new-message', {
        ...data,
        senderId: socket.data.userId,
        timestamp: new Date().toISOString(),
      });
    });

    // ── Read receipts ──
    socket.on('mark-read', (data: { conversationId: string; messageId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message-read', {
        userId: socket.data.userId,
        conversationId: data.conversationId,
        messageId: data.messageId,
      });
    });

    // ── Disconnect ──
    socket.on('disconnect', () => {
      if (socket.data.userId) {
        socket.leave(`user:${socket.data.userId}`);
        io.emit('user-offline', socket.data.userId);
      }
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function getIO(): Server {
  return io;
}

/**
 * Send a real-time notification to a specific user
 */
export function sendToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Send a real-time event to all members of a conversation
 */
export function sendToConversation(conversationId: string, event: string, data: any) {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
}

/**
 * Broadcast an event to all connected clients
 */
export function broadcast(event: string, data: any) {
  if (io) {
    io.emit(event, data);
  }
}
