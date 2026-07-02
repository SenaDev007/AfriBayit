// P3.7-2 — Notifications tab content: loading/error/empty states and
// the grouped list (collapsible groups + flat items).

import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Users } from 'lucide-react';
import NotificationItem, { NotificationItemSkeleton } from './NotificationItem';
import { ChevronIcon, isGroup } from './utils';
import type { GroupedItem, NotificationData, QuickAction } from './types';

interface NotificationListProps {
  filtered: NotificationData[];
  grouped: GroupedItem[];
  isLoading: boolean;
  isError: boolean;
  expandedGroups: Set<string>;
  onToggleGroup: (groupKey: string) => void;
  onAction: (notif: NotificationData, action: QuickAction) => void;
  actionLoading: string | null;
}

export default function NotificationList(props: NotificationListProps) {
  const {
    filtered,
    grouped,
    isLoading,
    isError,
    expandedGroups,
    onToggleGroup,
    onAction,
    actionLoading,
  } = props;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Error State */}
      {isError && (
        <div className="p-6 text-center">
          <p className="text-sm text-[#D93025]">Erreur lors du chargement des notifications</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <NotificationItemSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="p-8 text-center">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Aucune notification</p>
          <p className="text-xs text-gray-400 mt-1">Vos notifications apparaissent ici</p>
        </div>
      )}

      {/* Notification List */}
      {!isLoading && !isError && (
        <div className="divide-y">
          {grouped.map((item, idx) => {
            // Grouped notification
            if (isGroup(item)) {
              const isExpanded = expandedGroups.has(item.groupKey);
              return (
                <div key={item.groupKey}>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer bg-[#003087]/3"
                    onClick={() => onToggleGroup(item.groupKey)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[#003087]/10">
                        <Users className="w-4 h-4 text-[#003087]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[#003087] truncate">
                            {item.count} {item.groupLabel}
                          </h4>
                          <span className="w-2 h-2 bg-[#D4AF37] rounded-full shrink-0" />
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {isExpanded ? 'Cliquez pour reduire' : 'Cliquez pour voir les details'}
                        </p>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronIcon className="w-4 h-4 text-gray-400" />
                      </motion.div>
                    </div>
                  </motion.div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-gray-50"
                      >
                        {item.notifications.map((notif) => (
                          <NotificationItem
                            key={String(notif.id)}
                            notif={notif}
                            onAction={onAction}
                            actionLoading={actionLoading}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            // Single notification
            const notif = item as NotificationData;
            return (
              <NotificationItem
                key={String(notif.id)}
                notif={notif}
                onAction={onAction}
                actionLoading={actionLoading}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
