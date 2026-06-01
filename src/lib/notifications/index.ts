// AfriBayit — Notification Orchestrator
// Central notification dispatch system

import { db } from '@/lib/db';
import type {
  NotificationPayload,
  NotificationDeliveryResult,
  NotificationChannel,
  NotificationCategory,
  NotificationPriority,
} from './types';
import { getAllowedChannels, shouldSendToChannel } from './preferences';
import { sendEmail } from './channels/email';
import { sendSms } from './channels/sms';
import { sendPush, getVapidPublicKey, type PushSubscriptionData } from './channels/push';
import { sendWhatsApp } from './channels/whatsapp';

// Priority escalation: urgent always bypasses quiet hours
const PRIORITY_CHANNELS: Record<NotificationPriority, NotificationChannel[]> = {
  urgent: ['in_app', 'email', 'sms', 'push', 'whatsapp'],
  high: ['in_app', 'email', 'push'],
  normal: ['in_app', 'email'],
  low: ['in_app'],
};

/**
 * Main notification sending function
 * 1. Always create in-app notification (DB record)
 * 2. Check user preferences
 * 3. Respect quiet hours
 * 4. Send via preferred channels
 * 5. Log delivery status
 */
export async function sendNotification(payload: NotificationPayload): Promise<{
  notificationId: string;
  deliveryResults: NotificationDeliveryResult[];
}> {
  const deliveryResults: NotificationDeliveryResult[] = [];

  // Determine which channels to use
  const channels = await getAllowedChannels(
    payload.userId,
    payload.category,
    payload.channels
  );

  // Always create in-app notification record
  const notification = await db.notification.create({
    data: {
      userId: payload.userId,
      type: mapCategoryToType(payload.category),
      category: payload.category,
      title: payload.title,
      message: payload.message,
      actionUrl: payload.actionUrl || null,
      actorId: payload.actorId || null,
      actorName: payload.actorName || null,
      metadata: payload.data ? JSON.stringify(payload.data) : null,
      channels: JSON.stringify(channels),
      sentVia: JSON.stringify([]),
    },
  });

  deliveryResults.push({
    channel: 'in_app',
    success: true,
    messageId: notification.id,
    sentAt: new Date(),
  });

  // Send via other channels in parallel (non-blocking)
  const channelPromises = channels
    .filter(ch => ch !== 'in_app')
    .map(async (channel) => {
      try {
        const allowed = await shouldSendToChannel(
          payload.userId,
          payload.category,
          channel
        );

        if (!allowed) {
          return { channel, success: false, error: 'Channel not allowed by preferences', sentAt: new Date() };
        }

        const result = await deliverToChannel(channel, payload);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[Notifications] Channel ${channel} delivery error:`, error);
        return { channel, success: false, error, sentAt: new Date() } as NotificationDeliveryResult;
      }
    });

  const channelResults = await Promise.allSettled(channelPromises);

  // Collect results
  const successfulChannels: NotificationChannel[] = ['in_app'];
  channelResults.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.success) {
      deliveryResults.push(result.value);
      successfulChannels.push(result.value.channel);
    } else if (result.status === 'fulfilled') {
      deliveryResults.push(result.value);
    }
  });

  // Update notification with sent channels
  await db.notification.update({
    where: { id: notification.id },
    data: {
      sentVia: JSON.stringify(successfulChannels),
    },
  });

  return {
    notificationId: notification.id,
    deliveryResults,
  };
}

/**
 * Deliver a notification to a specific channel
 */
async function deliverToChannel(
  channel: NotificationChannel,
  payload: NotificationPayload
): Promise<NotificationDeliveryResult> {
  switch (channel) {
    case 'email':
      return deliverEmail(payload);
    case 'sms':
      return deliverSms(payload);
    case 'push':
      return deliverPush(payload);
    case 'whatsapp':
      return deliverWhatsApp(payload);
    default:
      return { channel, success: false, error: `Unknown channel: ${channel}`, sentAt: new Date() };
  }
}

/**
 * Send email notification
 */
async function deliverEmail(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { email: true, name: true, country: true },
  });

  if (!user) {
    return { channel: 'email', success: false, error: 'User not found', sentAt: new Date() };
  }

  return sendEmail(user.email, payload.title, payload.message, {
    actionUrl: payload.actionUrl,
  });
}

/**
 * Send SMS notification
 */
async function deliverSms(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { phone: true, country: true },
  });

  if (!user?.phone) {
    return { channel: 'sms', success: false, error: 'User has no phone number', sentAt: new Date() };
  }

  return sendSms({
    to: user.phone,
    message: `AfriBayit: ${payload.message}`.substring(0, 160),
    country: user.country || undefined,
  });
}

/**
 * Send push notification
 */
async function deliverPush(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
  // Get user's push subscriptions from metadata
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { specialties: true }, // temporarily using specialties for push subscriptions
  });

  if (!user?.specialties) {
    return { channel: 'push', success: false, error: 'No push subscriptions found', sentAt: new Date() };
  }

  try {
    const subscriptions: PushSubscriptionData[] = JSON.parse(user.specialties);
    if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
      return { channel: 'push', success: false, error: 'No push subscriptions found', sentAt: new Date() };
    }

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        sendPush(sub, {
          title: payload.title,
          body: payload.message,
          url: payload.actionUrl,
          tag: payload.category,
        })
      )
    );

    const anySuccess = results.some(r => r.status === 'fulfilled' && r.value.success);
    return {
      channel: 'push',
      success: anySuccess,
      sentAt: new Date(),
    };
  } catch {
    return { channel: 'push', success: false, error: 'Failed to parse push subscriptions', sentAt: new Date() };
  }
}

/**
 * Send WhatsApp notification
 */
async function deliverWhatsApp(payload: NotificationPayload): Promise<NotificationDeliveryResult> {
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { phone: true, country: true },
  });

  if (!user?.phone) {
    return { channel: 'whatsapp', success: false, error: 'User has no phone number', sentAt: new Date() };
  }

  return sendWhatsApp({
    to: user.phone,
    textBody: `*${payload.title}*\n\n${payload.message}`,
  });
}

/**
 * Map notification category to the legacy type field in DB
 */
function mapCategoryToType(category: NotificationCategory): string {
  const mapping: Record<NotificationCategory, string> = {
    transaction: 'transaction',
    property: 'alert',
    community: 'community',
    security: 'security',
    marketing: 'promotion',
    system: 'system',
    alert: 'alert',
  };
  return mapping[category] || 'system';
}

/**
 * Send notification to multiple users
 */
export async function sendBulkNotification(
  userIds: string[],
  payload: Omit<NotificationPayload, 'userId'>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    userIds.map(userId => sendNotification({ ...payload, userId }))
  );

  results.forEach(result => {
    if (result.status === 'fulfilled') {
      sent++;
    } else {
      failed++;
    }
  });

  return { sent, failed };
}

/**
 * Get VAPID public key for push notification subscription
 */
export { getVapidPublicKey };
