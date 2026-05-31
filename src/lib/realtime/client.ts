// AfriBayit — Socket.io Real-time Client
// Client-side utilities for WebSocket connections

'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const SOCKET_PATH = '/api/socketio';

/**
 * Get or create the socket instance
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: SOCKET_PATH,
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket.io] Disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket.io] Connection error:', error.message);
    });
  }
  return socket;
}

/**
 * Connect to the socket server and authenticate
 */
export function connectSocket(userId: string) {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.emit('authenticate', userId);
  }
  return s;
}

/**
 * Disconnect from the socket server
 */
export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}

/**
 * Check if socket is connected
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
