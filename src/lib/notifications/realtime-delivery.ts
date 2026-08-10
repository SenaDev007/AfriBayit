// AfriBayit — Real-time Notification Delivery
// Sends notifications via both DB storage and Pusher private channels
// Falls back to DB-only if Pusher is not configured

import { db } from '@/lib/db';
import { triggerEvent, isPusherConfigured } from '@/lib/realtime/pusher-server';
import {
  userChannel,
  escrowChannel,
  chatChannel,
  propertyChannel,
  RealtimeEvents,
} from '@/lib/realtime/channels';
import type { NotificationCategory, NotificationPriority } from './types';

// ── Types ──────────────────────────────────────────────────────────────

interface RealtimeNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  category: NotificationCategory;
  actionUrl?: string;
  priority?: NotificationPriority;
  actorId?: string;
  actorName?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

interface EscrowNotificationPayload {
  transactionId: string;
  status: string;
  message: string;
  amount?: number;
  currency?: string;
  actorId?: string;
  actorName?: string;
}

interface ChatMessagePayload {
  conversationId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
  type?: string;
  createdAt: string;
}

interface DeliveryResult {
  dbStored: boolean;
  pusherDelivered: boolean;
  notificationId?: string;
  error?: string;
}

// ── Main Delivery Functions ──────────────────────────────────────────────

/**
 * Deliver a notification via both DB storage and Pusher real-time channel
 * This is the primary function for sending notifications with real-time delivery
 */
export async function deliverNotification(
  userId: string,
  notification: Omit<RealtimeNotification, 'id' | 'userId' | 'createdAt'>
): Promise<DeliveryResult> {
  let notificationId: string | undefined;
  let dbStored = false;
  let pusherDelivered = false;

  // 1. Always store in database
  try {
    const dbNotification = await db.notification.create({
      data: {
        userId,
        type: notification.type,
        category: notification.category,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl || null,
        actorId: notification.actorId || null,
        actorName: notification.actorName || null,
        metadata: notification.data ? JSON.stringify(notification.data) : null,
        channels: JSON.stringify(['in_app', 'realtime']),
        sentVia: JSON.stringify(['in_app']),
      },
    });
    notificationId = dbNotification.id;
    dbStored = true;
  } catch (error) {
    console.error('[RealtimeDelivery] DB storage failed:', error);
    return { dbStored: false, pusherDelivered: false, error: 'DB storage failed' };
  }

  // 2. Push via Pusher if configured
  const now = new Date().toISOString();
  const payload: RealtimeNotification = {
    id: notificationId,
    userId,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    category: notification.category,
    actionUrl: notification.actionUrl,
    priority: notification.priority,
    actorId: notification.actorId,
    actorName: notification.actorName,
    data: notification.data,
    createdAt: now,
  };

  try {
    const channelName = userChannel(userId);
    pusherDelivered = await triggerEvent(
      channelName,
      RealtimeEvents.NOTIFICATION_NEW,
      payload as unknown as Record<string, unknown>
    );
  } catch (error) {
    console.error('[RealtimeDelivery] Pusher delivery failed:', error);
    // Non-fatal: DB record exists, client will get it on next poll
  }

  // 3. Update unread count on user channel
  try {
    const unreadCount = await db.notification.count({
      where: { userId, read: false },
    });

    await triggerEvent(userChannel(userId), RealtimeEvents.NOTIFICATION_COUNT_UPDATE, {
      unreadCount,
    });
  } catch {
    // Non-critical
  }

  return { dbStored, pusherDelivered, notificationId };
}

/**
 * Deliver a notification to multiple users (batch delivery)
 * Each user gets their own DB record and Pusher event
 */
export async function deliverToMultiple(
  userIds: string[],
  notification: Omit<RealtimeNotification, 'id' | 'userId' | 'createdAt'>
): Promise<{ sent: number; failed: number; results: DeliveryResult[] }> {
  const results = await Promise.allSettled(
    userIds.map(userId => deliverNotification(userId, notification))
  );

  let sent = 0;
  let failed = 0;
  const deliveryResults: DeliveryResult[] = [];

  results.forEach(result => {
    if (result.status === 'fulfilled' && result.value.dbStored) {
      sent++;
      deliveryResults.push(result.value);
    } else {
      failed++;
      deliveryResults.push(
        result.status === 'fulfilled'
          ? result.value
          : { dbStored: false, pusherDelivered: false, error: 'Unknown error' }
      );
    }
  });

  return { sent, failed, results: deliveryResults };
}

/**
 * Deliver an escrow status update
 * Sends to the escrow channel AND individual user notification channels
 */
export async function deliverEscrowUpdate(
  transactionId: string,
  status: string,
  message: string,
  options?: {
    amount?: number;
    currency?: string;
    buyerId?: string;
    sellerId?: string;
    actorId?: string;
    actorName?: string;
  }
): Promise<DeliveryResult[]> {
  const results: DeliveryResult[] = [];
  const escrowData: EscrowNotificationPayload = {
    transactionId,
    status,
    message,
    amount: options?.amount,
    currency: options?.currency,
    actorId: options?.actorId,
    actorName: options?.actorName,
  };

  // 1. Push to escrow channel
  const channelName = escrowChannel(transactionId);

  // Map status to event type
  const eventMap: Record<string, string> = {
    funded: RealtimeEvents.ESCROW_FUNDED,
    released: RealtimeEvents.ESCROW_RELEASED,
    disputed: RealtimeEvents.ESCROW_DISPUTED,
  };

  const event = eventMap[status] || RealtimeEvents.ESCROW_STATUS_UPDATE;

  await triggerEvent(channelName, event, escrowData as unknown as Record<string, unknown>);
  await triggerEvent(channelName, RealtimeEvents.ESCROW_STATUS_UPDATE, escrowData as unknown as Record<string, unknown>);

  // 2. Send individual notifications to buyer and seller
  const category: NotificationCategory = 'transaction';

  if (options?.buyerId) {
    const result = await deliverNotification(options.buyerId, {
      title: `Escrow ${status}`,
      message,
      type: 'transaction',
      category,
      actionUrl: `/escrow?id=${transactionId}`,
      priority: status === 'disputed' ? 'urgent' : 'high',
      data: { transactionId, status, amount: options.amount, currency: options.currency },
    });
    results.push(result);
  }

  if (options?.sellerId) {
    const result = await deliverNotification(options.sellerId, {
      title: `Escrow ${status}`,
      message,
      type: 'transaction',
      category,
      actionUrl: `/escrow?id=${transactionId}`,
      priority: status === 'disputed' ? 'urgent' : 'high',
      data: { transactionId, status, amount: options.amount, currency: options.currency },
    });
    results.push(result);
  }

  return results;
}

/**
 * Deliver a chat message in real-time
 * Sends to the chat channel with typing indicator cleanup
 */
export async function deliverChatMessage(
  conversationId: string,
  message: Omit<ChatMessagePayload, 'conversationId'>
): Promise<{ pusherDelivered: boolean }> {
  const channelName = chatChannel(conversationId);
  const payload: ChatMessagePayload = {
    conversationId,
    messageId: message.messageId,
    senderId: message.senderId,
    senderName: message.senderName,
    content: message.content,
    type: message.type || 'text',
    createdAt: message.createdAt,
  };

  const pusherDelivered = await triggerEvent(
    channelName,
    RealtimeEvents.CHAT_MESSAGE,
    payload as unknown as Record<string, unknown>
  );

  // Also send stop-typing indicator for the sender
  await triggerEvent(channelName, RealtimeEvents.CHAT_STOP_TYPING, {
    userId: message.senderId,
  });

  return { pusherDelivered };
}

/**
 * Deliver a property update (view count, price change, status update)
 */
export async function deliverPropertyUpdate(
  propertyId: string,
  update: {
    viewCount?: number;
    status?: string;
    price?: number;
    currency?: string;
  }
): Promise<{ pusherDelivered: boolean }> {
  const channelName = propertyChannel(propertyId);
  let pusherDelivered = false;

  if (update.viewCount !== undefined) {
    pusherDelivered = await triggerEvent(channelName, RealtimeEvents.PROPERTY_VIEW_COUNT, {
      propertyId,
      viewCount: update.viewCount,
    });
  }

  if (update.status) {
    const delivered = await triggerEvent(channelName, RealtimeEvents.PROPERTY_STATUS_UPDATE, {
      propertyId,
      status: update.status,
    });
    pusherDelivered = pusherDelivered || delivered;
  }

  if (update.price !== undefined) {
    const delivered = await triggerEvent(channelName, RealtimeEvents.PROPERTY_PRICE_CHANGE, {
      propertyId,
      price: update.price,
      currency: update.currency || 'XOF',
    });
    pusherDelivered = pusherDelivered || delivered;
  }

  return { pusherDelivered };
}

/**
 * Mark a notification as read and push the update
 */
export async function markNotificationReadRealtime(
  notificationId: string,
  userId: string
): Promise<void> {
  try {
    await db.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });

    // Push real-time update
    await triggerEvent(userChannel(userId), RealtimeEvents.NOTIFICATION_READ, {
      id: notificationId,
    });

    // Update unread count
    const unreadCount = await db.notification.count({
      where: { userId, read: false },
    });

    await triggerEvent(userChannel(userId), RealtimeEvents.NOTIFICATION_COUNT_UPDATE, {
      unreadCount,
    });
  } catch (error) {
    console.error('[RealtimeDelivery] Mark read failed:', error);
    throw error;
  }
}
