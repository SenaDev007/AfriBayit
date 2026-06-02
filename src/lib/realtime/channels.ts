// AfriBayit — Pusher Channel Naming Conventions
// Centralized channel name definitions and helpers

// ── Channel Name Patterns ──────────────────────────────────────────────
// private-user-{userId}        → User-specific notifications
// private-escrow-{transactionId} → Escrow status updates
// private-chat-{conversationId}  → Chat messages
// private-property-{propertyId}  → Property view count updates

/**
 * Generate a private user notification channel name
 * Used for delivering user-specific notifications in real-time
 */
export function userChannel(userId: string): string {
  return `private-user-${userId}`;
}

/**
 * Generate a private escrow channel name
 * Used for escrow transaction status updates (fund, release, dispute)
 */
export function escrowChannel(transactionId: string): string {
  return `private-escrow-${transactionId}`;
}

/**
 * Generate a private chat channel name
 * Used for real-time chat messages and typing indicators
 */
export function chatChannel(conversationId: string): string {
  return `private-chat-${conversationId}`;
}

/**
 * Generate a private property channel name
 * Used for property view count updates and real-time alerts
 */
export function propertyChannel(propertyId: string): string {
  return `private-property-${propertyId}`;
}

// ── Channel Name Validation ──────────────────────────────────────────────

/**
 * Extract the entity ID from a channel name
 * Returns null if the channel name doesn't match any known pattern
 */
export function extractChannelEntity(channelName: string): { type: string; id: string } | null {
  const patterns: Array<{ pattern: RegExp; type: string }> = [
    { pattern: /^private-user-(.+)$/, type: 'user' },
    { pattern: /^private-escrow-(.+)$/, type: 'escrow' },
    { pattern: /^private-chat-(.+)$/, type: 'chat' },
    { pattern: /^private-property-(.+)$/, type: 'property' },
  ];

  for (const { pattern, type } of patterns) {
    const match = channelName.match(pattern);
    if (match) {
      return { type, id: match[1] };
    }
  }

  return null;
}

/**
 * Validate that a user is authorized to access a channel
 * Checks channel type and ownership
 */
export function isChannelAuthorized(
  channelName: string,
  userId: string,
  additionalCheck?: (entityType: string, entityId: string) => boolean
): boolean {
  const entity = extractChannelEntity(channelName);
  if (!entity) return false;

  switch (entity.type) {
    case 'user':
      // User can only access their own notification channel
      return entity.id === userId;

    case 'escrow':
      // Escrow channel: user must be buyer or seller in the transaction
      // Additional check is required for escrow verification
      return additionalCheck ? additionalCheck(entity.type, entity.id) : false;

    case 'chat':
      // Chat channel: user must be a participant in the conversation
      // Additional check is required for chat verification
      return additionalCheck ? additionalCheck(entity.type, entity.id) : false;

    case 'property':
      // Property channel: public read access for view counts
      return true;

    default:
      return false;
  }
}

// ── Event Name Constants ──────────────────────────────────────────────

export const RealtimeEvents = {
  // User notification events
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_COUNT_UPDATE: 'notification:count-update',

  // Escrow events
  ESCROW_FUNDED: 'escrow:funded',
  ESCROW_RELEASED: 'escrow:released',
  ESCROW_DISPUTED: 'escrow:disputed',
  ESCROW_STATUS_UPDATE: 'escrow:status-update',

  // Chat events
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  CHAT_STOP_TYPING: 'chat:stop-typing',
  CHAT_READ: 'chat:read',

  // Property events
  PROPERTY_VIEW_COUNT: 'property:view-count',
  PROPERTY_STATUS_UPDATE: 'property:status-update',
  PROPERTY_PRICE_CHANGE: 'property:price-change',
} as const;

export type RealtimeEventType = typeof RealtimeEvents[keyof typeof RealtimeEvents];
