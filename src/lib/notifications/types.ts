// AfriBayit — Notification Types & Interfaces
// Multi-channel notification system type definitions

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'whatsapp';
export type NotificationCategory =
  | 'transaction'
  | 'property'
  | 'community'
  | 'security'
  | 'marketing'
  | 'system'
  | 'alert';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationPayload {
  userId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  actionUrl?: string;
  actorId?: string;
  actorName?: string;
}

export interface UserNotificationPreferences {
  in_app: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp: boolean;
  quietHoursStart?: string; // "22:00"
  quietHoursEnd?: string; // "07:00"
  categories: {
    [key in NotificationCategory]: {
      enabled: boolean;
      channels: NotificationChannel[];
    };
  };
}

export interface NotificationTemplate {
  id: string;
  category: NotificationCategory;
  channel: NotificationChannel;
  subject?: string; // for email
  title: string;
  body: string;
  htmlBody?: string; // for email
}

export interface NotificationDeliveryResult {
  channel: NotificationChannel;
  success: boolean;
  messageId?: string;
  error?: string;
  sentAt: Date;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  actorId?: string;
  actorName?: string;
  data?: Record<string, unknown>;
  channels: NotificationChannel[];
  sentVia: NotificationChannel[];
  priority: NotificationPriority;
  createdAt: Date;
  readAt?: Date;
}

// Default notification preferences per role
export const DEFAULT_PREFERENCES: Record<string, Partial<UserNotificationPreferences>> = {
  buyer: {
    in_app: true,
    email: true,
    sms: false,
    push: true,
    whatsapp: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    categories: {
      transaction: { enabled: true, channels: ['in_app', 'email', 'push'] },
      property: { enabled: true, channels: ['in_app', 'push'] },
      community: { enabled: true, channels: ['in_app'] },
      security: { enabled: true, channels: ['in_app', 'email', 'sms'] },
      marketing: { enabled: false, channels: ['in_app'] },
      system: { enabled: true, channels: ['in_app'] },
      alert: { enabled: true, channels: ['in_app', 'push'] },
    },
  },
  seller: {
    in_app: true,
    email: true,
    sms: true,
    push: true,
    whatsapp: false,
    categories: {
      transaction: { enabled: true, channels: ['in_app', 'email', 'sms', 'push'] },
      property: { enabled: true, channels: ['in_app', 'email', 'push'] },
      community: { enabled: true, channels: ['in_app'] },
      security: { enabled: true, channels: ['in_app', 'email', 'sms'] },
      marketing: { enabled: true, channels: ['in_app', 'email'] },
      system: { enabled: true, channels: ['in_app'] },
      alert: { enabled: true, channels: ['in_app', 'push', 'sms'] },
    },
  },
  agent: {
    in_app: true,
    email: true,
    sms: true,
    push: true,
    whatsapp: true,
    categories: {
      transaction: { enabled: true, channels: ['in_app', 'email', 'sms', 'push'] },
      property: { enabled: true, channels: ['in_app', 'email', 'push', 'whatsapp'] },
      community: { enabled: true, channels: ['in_app'] },
      security: { enabled: true, channels: ['in_app', 'email', 'sms'] },
      marketing: { enabled: true, channels: ['in_app', 'email'] },
      system: { enabled: true, channels: ['in_app'] },
      alert: { enabled: true, channels: ['in_app', 'push', 'sms', 'whatsapp'] },
    },
  },
  admin: {
    in_app: true,
    email: true,
    sms: true,
    push: true,
    whatsapp: true,
    categories: {
      transaction: { enabled: true, channels: ['in_app', 'email', 'sms', 'push'] },
      property: { enabled: true, channels: ['in_app', 'email', 'push'] },
      community: { enabled: true, channels: ['in_app', 'email'] },
      security: { enabled: true, channels: ['in_app', 'email', 'sms', 'push'] },
      marketing: { enabled: true, channels: ['in_app', 'email'] },
      system: { enabled: true, channels: ['in_app', 'email'] },
      alert: { enabled: true, channels: ['in_app', 'email', 'sms', 'push', 'whatsapp'] },
    },
  },
};
