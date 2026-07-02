// P3.7-2 — Shared utilities for the NotificationsCenter module.
// Quick-action factory, notification grouping, time-ago formatter,
// and the chevron icon used by expandable groups.

import {
  CheckCircle,
  ClipboardList,
  ExternalLink,
  Eye,
  Reply,
  X,
} from 'lucide-react';
import type {
  GroupedItem,
  NotificationData,
  NotificationQuickAction,
  QuickAction,
} from './types';

// Build the list of quick actions for a given notification (reply / view /
// validate / dismiss depending on type).
export function getQuickActions(notif: NotificationData): NotificationQuickAction[] {
  const notifType = String(notif.type ?? notif.category ?? 'system');
  const actions: NotificationQuickAction[] = [];

  switch (notifType) {
    case 'message':
    case 'community':
      actions.push({ type: 'reply', label: 'Repondre', icon: Reply });
      actions.push({ type: 'view', label: 'Voir', icon: ExternalLink });
      break;
    case 'transaction':
      actions.push({ type: 'validate', label: 'Valider', icon: CheckCircle });
      actions.push({ type: 'view', label: 'Details', icon: ExternalLink });
      break;
    case 'property':
      actions.push({ type: 'view', label: 'Voir le bien', icon: ExternalLink });
      break;
    case 'announcement':
      actions.push({ type: 'view', label: 'Lire', icon: ExternalLink });
      break;
    case 'rebecca':
      actions.push({ type: 'reply', label: 'Repondre', icon: Reply });
      break;
    case 'profile_view':
    case 'matching_inverse':
      actions.push({ type: 'view', label: 'Voir', icon: Eye });
      break;
    default:
      actions.push({ type: 'view', label: 'Voir', icon: ExternalLink });
  }

  actions.push({ type: 'dismiss', label: 'Ignorer', icon: X });
  return actions;
}

// Group similar notifications (favoris / views / likes) so the list
// shows "5 personnes ont ajouté votre bien aux favoris" instead of 5 rows.
export function groupNotifications(notifications: NotificationData[]): GroupedItem[] {
  const groups: Map<string, { items: NotificationData[]; label: string }> = new Map();
  const singles: GroupedItem[] = [];
  const processed = new Set<string>();

  for (const notif of notifications) {
    const id = String(notif.id);
    if (processed.has(id)) continue;
    processed.add(id);

    const notifType = String(notif.type ?? notif.category ?? 'system');
    const notifRead = Boolean(notif.read);
    const title = String(notif.title ?? '');

    const groupKey = `${notifType}:${notifRead ? 'read' : 'unread'}:${title.replace(/\d+/g, 'X')}`;

    const favorisMatch = title.match(/(\d+)\s*personnes?\s+ont\s+ajoute.*favoris/i);
    const viewMatch = title.match(/(\d+)\s*personnes?\s+ont\s+consult/i);
    const likeMatch = title.match(/(\d+)\s*likes?/i);

    if (favorisMatch || viewMatch || likeMatch) {
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          items: [],
          label: favorisMatch
            ? 'personnes ont ajoute votre bien aux favoris'
            : viewMatch
              ? 'personnes ont consulte votre profil'
              : 'interactions sur votre contenu',
        });
      }
      groups.get(groupKey)!.items.push(notif);
    } else {
      singles.push(notif);
    }
  }

  for (const [, group] of groups) {
    if (group.items.length >= 2) {
      singles.unshift({
        isGroup: true,
        groupKey: `group-${group.items.map((i) => String(i.id)).join('-')}`,
        groupLabel: `${group.items.length} ${group.label}`,
        count: group.items.length,
        notifications: group.items,
      });
    } else {
      singles.push(...group.items);
    }
  }

  return singles;
}

// Human-readable "il y a X min/heure/jour" formatter.
export function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "A l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// Chevron icon used for expandable groups.
export function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// Helper used by the orchestrator to type-narrow a grouped item.
export function isGroup(item: GroupedItem): item is {
  isGroup: true;
  groupKey: string;
  groupLabel: string;
  count: number;
  notifications: NotificationData[];
} {
  return typeof item === 'object' && item !== null && 'isGroup' in item && item.isGroup === true;
}

// Re-export QuickAction type for convenience (used by index.tsx).
export type { QuickAction };
