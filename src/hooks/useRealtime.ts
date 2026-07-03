// AfriBayit — useRealtime Hook (stub — realtime now handled by backend)
// The backend pushes realtime events via Pusher; the frontend just listens.
// This stub will be replaced with direct Pusher client integration.

import { useState, useEffect } from 'react';

export function useRealtimeNotifications(userId: string | undefined, options?: any) {
  const [lastNotification, setLastNotification] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;
    // TODO: Connect to Pusher using NEXT_PUBLIC_PUSHER_KEY
    // For now, this is a no-op stub
  }, [userId]);

  return { lastNotification };
}

export function useRealtimeTyping(conversationId: string, userId: string | undefined) {
  const [isTyping, setIsTyping] = useState(false);
  return { isTyping, setIsTyping };
}

export function useRealtimePresence(roomName: string) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  return { onlineUsers };
}
