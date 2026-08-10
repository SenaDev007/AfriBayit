// AfriBayit — Push Notification Channel (Enhanced)
// Web Push notifications using web-push with VAPID
// Supports: subscription management via DB, notification types for
// messages, escrow updates, booking confirmations, price alerts

import { db } from '@/lib/db';
import type { NotificationDeliveryResult, NotificationChannel } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  url?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

// Notification type templates for consistent push messaging
export type PushNotificationType =
  | 'new_message'
  | 'escrow_update'
  | 'booking_confirmation'
  | 'price_alert'
  | 'property_update'
  | 'kyc_status'
  | 'system_alert';

interface PushNotificationTemplate {
  icon: string;
  badge: string;
  tag: string;
  requireInteraction: boolean;
}

const NOTIFICATION_TEMPLATES: Record<PushNotificationType, PushNotificationTemplate> = {
  new_message: {
    icon: '/icons/message.png',
    badge: '/icons/badge-message.png',
    tag: 'message',
    requireInteraction: false,
  },
  escrow_update: {
    icon: '/icons/escrow.png',
    badge: '/icons/badge-escrow.png',
    tag: 'escrow',
    requireInteraction: true,
  },
  booking_confirmation: {
    icon: '/icons/booking.png',
    badge: '/icons/badge-booking.png',
    tag: 'booking',
    requireInteraction: true,
  },
  price_alert: {
    icon: '/icons/alert.png',
    badge: '/icons/badge-alert.png',
    tag: 'price-alert',
    requireInteraction: false,
  },
  property_update: {
    icon: '/icons/property.png',
    badge: '/icons/badge-property.png',
    tag: 'property',
    requireInteraction: false,
  },
  kyc_status: {
    icon: '/icons/kyc.png',
    badge: '/icons/badge-kyc.png',
    tag: 'kyc',
    requireInteraction: true,
  },
  system_alert: {
    icon: '/icons/system.png',
    badge: '/icons/badge-system.png',
    tag: 'system',
    requireInteraction: true,
  },
};

// ─── VAPID Configuration ──────────────────────────────────────────────────────

// Lazy-load web-push to avoid issues during build
let webPush: typeof import('web-push') | null = null;

async function getWebPush() {
  if (!webPush) {
    webPush = await import('web-push');
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webPush.setVapidDetails(
        'mailto:notifications@afribayit.com',
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
  }
  return webPush;
}

export async function generateVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const wp = await import('web-push');
  return wp.generateVAPIDKeys();
}

export function getVapidPublicKey(): string | undefined {
  return process.env.VAPID_PUBLIC_KEY;
}

// ─── Subscription Management ──────────────────────────────────────────────────

/**
 * Store a push subscription in the database for a user.
 * Uses the PushSubscription Prisma model for proper storage.
 */
export async function storePushSubscription(
  userId: string,
  subscription: PushSubscriptionData,
  userAgent?: string
): Promise<{ success: boolean; id?: string }> {
  try {
    // Upsert: create or update the subscription for this endpoint
    const record = await db.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId,
          endpoint: subscription.endpoint,
        },
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null,
      },
      update: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent: userAgent || null,
      },
    });

    return { success: true, id: record.id };
  } catch (error) {
    console.error('[Push] Failed to store subscription:', error);
    return { success: false };
  }
}

/**
 * Remove a push subscription from the database.
 */
export async function removePushSubscription(
  userId: string,
  endpoint: string
): Promise<boolean> {
  try {
    await db.pushSubscription.deleteMany({
      where: { userId, endpoint },
    });
    return true;
  } catch (error) {
    console.error('[Push] Failed to remove subscription:', error);
    return false;
  }
}

/**
 * Get all push subscriptions for a user.
 */
export async function getUserPushSubscriptions(userId: string): Promise<PushSubscriptionData[]> {
  try {
    const records = await db.pushSubscription.findMany({
      where: { userId },
    });

    return records.map(record => ({
      endpoint: record.endpoint,
      keys: {
        p256dh: record.p256dh,
        auth: record.auth,
      },
    }));
  } catch (error) {
    console.error('[Push] Failed to get subscriptions:', error);
    return [];
  }
}

/**
 * Remove expired/invalid subscriptions (called when we get 410 Gone)
 */
export async function removeExpiredSubscription(endpoint: string): Promise<void> {
  try {
    await db.pushSubscription.deleteMany({
      where: { endpoint },
    });
  } catch (error) {
    console.error('[Push] Failed to remove expired subscription:', error);
  }
}

// ─── Push Notification Sending ────────────────────────────────────────────────

/**
 * Send a push notification to a specific subscription.
 */
export async function sendPush(
  subscription: PushSubscriptionData,
  payload: PushNotificationPayload
): Promise<NotificationDeliveryResult> {
  const channel: NotificationChannel = 'push';

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('[Notifications] VAPID keys not configured, skipping push');
    return { channel, success: false, error: 'VAPID keys not configured', sentAt: new Date() };
  }

  try {
    const wp = await getWebPush();

    const result = await wp.sendNotification(
      subscription as unknown as import('web-push').PushSubscription,
      JSON.stringify(payload)
    );

    return {
      channel,
      success: result.statusCode === 201,
      messageId: result.headers?.['location'] as string | undefined,
      sentAt: new Date(),
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown push error';

    // If subscription is no longer valid (410 Gone), remove it
    if (err instanceof Error && (err as any).statusCode === 410) {
      console.warn('[Notifications] Push subscription expired (410 Gone)');
      // Remove the expired subscription from DB
      await removeExpiredSubscription(subscription.endpoint);
      return { channel, success: false, error: 'Subscription expired', sentAt: new Date() };
    }

    console.error('[Notifications] Push exception:', error);
    return { channel, success: false, error, sentAt: new Date() };
  }
}

/**
 * Send a typed push notification to all subscriptions for a user.
 * Uses notification type templates for consistent formatting.
 */
export async function sendTypedPush(
  userId: string,
  type: PushNotificationType,
  title: string,
  body: string,
  options?: {
    url?: string;
    data?: Record<string, unknown>;
    actions?: PushNotificationPayload['actions'];
  }
): Promise<NotificationDeliveryResult> {
  const channel: NotificationChannel = 'push';

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return { channel, success: false, error: 'VAPID keys not configured', sentAt: new Date() };
  }

  const subscriptions = await getUserPushSubscriptions(userId);
  if (subscriptions.length === 0) {
    return { channel, success: false, error: 'No push subscriptions found', sentAt: new Date() };
  }

  const template = NOTIFICATION_TEMPLATES[type];
  const payload: PushNotificationPayload = {
    title,
    body,
    icon: template.icon,
    badge: template.badge,
    tag: template.tag,
    requireInteraction: template.requireInteraction,
    url: options?.url,
    data: options?.data,
    actions: options?.actions,
  };

  // Send to all subscriptions
  const results = await Promise.allSettled(
    subscriptions.map(sub => sendPush(sub, payload))
  );

  const anySuccess = results.some(r => r.status === 'fulfilled' && r.value.success);
  const failCount = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

  return {
    channel,
    success: anySuccess,
    error: failCount > 0 ? `${failCount} subscription(s) failed` : undefined,
    sentAt: new Date(),
  };
}

/**
 * Send push notifications for new messages
 */
export async function pushNewMessage(
  userId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
): Promise<NotificationDeliveryResult> {
  return sendTypedPush(userId, 'new_message', `${senderName} vous a envoyé un message`, messagePreview, {
    url: `/messages/${conversationId}`,
    data: { conversationId, senderName },
    actions: [
      { action: 'reply', title: 'Répondre' },
      { action: 'mark_read', title: 'Marquer comme lu' },
    ],
  });
}

/**
 * Send push notifications for escrow updates
 */
export async function pushEscrowUpdate(
  userId: string,
  status: string,
  amount: number,
  currency: string,
  transactionId: string
): Promise<NotificationDeliveryResult> {
  const statusMessages: Record<string, string> = {
    FUNDED: `Escrow approvisionné: ${amount.toLocaleString()} ${currency}`,
    DOCS_VALIDATED: 'Documents validés — en attente de validation GeoTrust',
    NOTARY_ASSIGNED: 'Un notaire a été assigné à votre transaction',
    DEED_SIGNED: 'L\'acte a été signé!',
    RELEASED: `Fonds libérés: ${amount.toLocaleString()} ${currency}`,
    DISPUTED: 'Un litige a été ouvert sur la transaction',
    REFUNDED: `Remboursement effectué: ${amount.toLocaleString()} ${currency}`,
  };

  const body = statusMessages[status] || `Statut mis à jour: ${status}`;

  return sendTypedPush(userId, 'escrow_update', 'Mise à jour Escrow', body, {
    url: `/transactions/${transactionId}`,
    data: { transactionId, status, amount, currency },
  });
}

/**
 * Send push notifications for booking confirmations
 */
export async function pushBookingConfirmation(
  userId: string,
  bookingRef: string,
  propertyName: string,
  checkIn: string
): Promise<NotificationDeliveryResult> {
  return sendTypedPush(
    userId,
    'booking_confirmation',
    'Réservation confirmée!',
    `${propertyName} — Arrivée: ${checkIn}`,
    {
      url: `/bookings/${bookingRef}`,
      data: { bookingRef, propertyName, checkIn },
      actions: [
        { action: 'view', title: 'Voir la réservation' },
        { action: 'cancel', title: 'Annuler' },
      ],
    }
  );
}

/**
 * Send push notifications for price alerts
 */
export async function pushPriceAlert(
  userId: string,
  propertyTitle: string,
  oldPrice: number,
  newPrice: number,
  currency: string,
  propertyId: string
): Promise<NotificationDeliveryResult> {
  const change = newPrice < oldPrice ? 'baisse' : 'hausse';
  const body = `${propertyTitle}: ${change} de ${oldPrice.toLocaleString()} à ${newPrice.toLocaleString()} ${currency}`;

  return sendTypedPush(userId, 'price_alert', `Alerte prix — ${change.toUpperCase()}`, body, {
    url: `/properties/${propertyId}`,
    data: { propertyId, oldPrice, newPrice, currency },
  });
}

