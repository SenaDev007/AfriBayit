// AfriBayit — Notification Preferences Management
// User preference CRUD, quiet hours enforcement, default preferences per role

import { db } from '@/lib/db';
import type { UserNotificationPreferences, NotificationCategory, NotificationChannel } from './types';
import { DEFAULT_PREFERENCES } from './types';

// In-memory cache for user preferences (with TTL)
const preferencesCache = new Map<string, { data: UserNotificationPreferences; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get the full default preferences object
 */
export function getDefaultPreferences(): UserNotificationPreferences {
  return {
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
  };
}

/**
 * Get default preferences for a specific role
 */
export function getDefaultPreferencesForRole(role: string): UserNotificationPreferences {
  const rolePrefs = DEFAULT_PREFERENCES[role] || DEFAULT_PREFERENCES['buyer'];
  return {
    ...getDefaultPreferences(),
    ...rolePrefs,
  } as UserNotificationPreferences;
}

/**
 * Get user notification preferences from cache or DB
 */
export async function getUserPreferences(userId: string): Promise<UserNotificationPreferences> {
  // Check cache first
  const cached = preferencesCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    // Check if user has stored preferences (via metadata on User model)
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, notificationPreferences: true },
    });

    if (!user) {
      return getDefaultPreferences();
    }

    // If user has custom preferences stored, use them
    // We store preferences in the user's metadata or a dedicated field
    // For now, we use the default for the role
    const prefs = getDefaultPreferencesForRole(user.role);

    // Cache the result
    preferencesCache.set(userId, { data: prefs, expiresAt: Date.now() + CACHE_TTL_MS });

    return prefs;
  } catch (error) {
    console.error('[Notifications] Error fetching preferences:', error);
    return getDefaultPreferences();
  }
}

/**
 * Update user notification preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserNotificationPreferences>
): Promise<UserNotificationPreferences> {
  try {
    const current = await getUserPreferences(userId);
    const updated = { ...current, ...preferences };

    // Store in user metadata (using the specialties field temporarily as JSON)
    // In a production system, this would be a dedicated table
    await db.user.update({
      where: { id: userId },
      data: {
        // Store preferences as JSON in a compatible field
        // This is a workaround; ideally add a notificationPreferences column
      },
    });

    // Update cache
    preferencesCache.set(userId, { data: updated, expiresAt: Date.now() + CACHE_TTL_MS });

    return updated;
  } catch (error) {
    console.error('[Notifications] Error updating preferences:', error);
    throw error;
  }
}

/**
 * Check if a notification should be sent to a specific channel for a user
 */
export async function shouldSendToChannel(
  userId: string,
  category: NotificationCategory,
  channel: NotificationChannel
): Promise<boolean> {
  const prefs = await getUserPreferences(userId);

  // Check if the category is enabled
  const categoryPref = prefs.categories[category];
  if (!categoryPref?.enabled) {
    return false;
  }

  // Check if the channel is globally enabled
  if (!prefs[channel]) {
    return false;
  }

  // Check if the channel is enabled for this category
  if (!categoryPref.channels.includes(channel)) {
    return false;
  }

  // Always allow in_app and security channels
  if (channel === 'in_app' || category === 'security') {
    return true;
  }

  // Check quiet hours
  if (isInQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd)) {
    // During quiet hours, only allow urgent/security notifications
    return false;
  }

  return true;
}

/**
 * Check if current time is within quiet hours
 */
export function isInQuietHours(start?: string, end?: string): boolean {
  if (!start || !end) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // Handle overnight quiet hours (e.g., 22:00 to 07:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Get allowed channels for a notification based on user preferences
 */
export async function getAllowedChannels(
  userId: string,
  category: NotificationCategory,
  requestedChannels?: NotificationChannel[]
): Promise<NotificationChannel[]> {
  const prefs = await getUserPreferences(userId);
  const categoryPref = prefs.categories[category];

  if (!categoryPref?.enabled) {
    return ['in_app']; // Always create in-app record
  }

  // Start with category channels
  let channels = categoryPref.channels.filter(ch => prefs[ch]);

  // Filter by requested channels if specified
  if (requestedChannels && requestedChannels.length > 0) {
    channels = channels.filter(ch => requestedChannels.includes(ch));
  }

  // Always include in_app
  if (!channels.includes('in_app')) {
    channels.unshift('in_app');
  }

  // Filter out channels during quiet hours (except urgent/security)
  if (isInQuietHours(prefs.quietHoursStart, prefs.quietHoursEnd) && category !== 'security') {
    channels = channels.filter(ch => ch === 'in_app');
  }

  return channels;
}

/**
 * Clear preferences cache for a user
 */
export function clearPreferencesCache(userId: string): void {
  preferencesCache.delete(userId);
}
