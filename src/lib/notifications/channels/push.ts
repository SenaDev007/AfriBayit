// AfriBayit — Push Notification Channel
// Web Push notifications using web-push

import type { NotificationDeliveryResult, NotificationChannel } from '../types';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushNotificationPayload {
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
}

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
  // This can be used to generate keys on first setup
  // In production, keys should be stored in env vars
  const wp = await import('web-push');
  return wp.generateVAPIDKeys();
}

export function getVapidPublicKey(): string | undefined {
  return process.env.VAPID_PUBLIC_KEY;
}

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
      subscription as webPush.PushSubscription,
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

    // If subscription is no longer valid (410 Gone), we should remove it
    if (err instanceof Error && (err as any).statusCode === 410) {
      console.warn('[Notifications] Push subscription expired (410 Gone)');
      return { channel, success: false, error: 'Subscription expired', sentAt: new Date() };
    }

    console.error('[Notifications] Push exception:', error);
    return { channel, success: false, error, sentAt: new Date() };
  }
}

export type { PushSubscriptionData, PushNotificationPayload };
