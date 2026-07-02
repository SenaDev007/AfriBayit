// P3.7-2 — Shared types for the NotificationsCenter module.
// The orchestrator (`index.tsx`) owns all state and delegates
// rendering to NotificationList, NotificationItem, PreferencesPanel,
// PremiumPanel, and SilentHoursPanel.

export interface NotificationsCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export type FilterTabKey =
  | 'all'
  | 'unread'
  | 'transaction'
  | 'announcement'
  | 'community'
  | 'rebecca';

export type QuickAction = 'reply' | 'view' | 'validate' | 'dismiss';

export interface NotificationQuickAction {
  type: QuickAction;
  label: string;
  icon: React.ElementType;
}

// A raw notification record from the API (loosely typed — fields are
// accessed via string keys with sensible defaults).
export type NotificationData = Record<string, unknown>;

export interface NotificationGroup {
  isGroup: true;
  groupKey: string;
  groupLabel: string;
  count: number;
  notifications: NotificationData[];
}

export type GroupedItem = NotificationData | NotificationGroup;

export type CategoryKey = 'property' | 'community' | 'escrow' | 'academy' | 'marketing';
export type ChannelKey = 'email' | 'sms' | 'push' | 'whatsapp';
export type PreferencesMap = Record<CategoryKey, Record<ChannelKey, boolean>>;

export type ActiveTab = 'notifications' | 'preferences' | 'premium' | 'silent';
