'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Calendar } from 'lucide-react';
import { easeOut } from './constants';
import { EventSkeleton, eventTypeIcon } from './utils';
import type { CommunityEvent } from './types';

interface EventsPanelProps {
  events: CommunityEvent[];
  eventsLoading: boolean;
  eventsError: { message?: string } | null;
  registeringEventId: string | null;
  isRegisterPending: boolean;
  onSelectEvent: (id: string) => void;
  onRegisterEvent: (id: string) => void;
}

export default function EventsPanel({
  events,
  eventsLoading,
  eventsError,
  registeringEventId,
  isRegisterPending,
  onSelectEvent,
  onRegisterEvent,
}: EventsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { label: 'Tous', type: '' },
          { label: 'Summit mensuel', type: 'Summit' },
          { label: 'Networking trimestriel', type: 'Networking' },
          { label: 'Portes ouvertes virtuelles', type: 'Portes ouvertes' },
          { label: 'Formation communautaire', type: 'Formation' },
        ].map(et => (
          <button key={et.label} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-gray-600 border hover:bg-gray-50 whitespace-nowrap">{et.label}</button>
        ))}
      </div>
      {eventsLoading && Array.from({ length: 4 }).map((_, i) => <EventSkeleton key={i} />)}
      {eventsError && (
        <div className="text-center py-12">
          <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold mb-1">Impossible de charger les événements</p>
        </div>
      )}
      {!eventsLoading && !eventsError && events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold mb-1">Aucun événement à venir</p>
        </div>
      )}
      {!eventsLoading && !eventsError && events.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.08, ease: easeOut }}
          className="bg-white rounded-2xl p-5 shadow-sm border flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelectEvent(event.id)}
        >
          <div className="w-14 h-14 rounded-2xl bg-[#003087]/10 flex flex-col items-center justify-center shrink-0">
            <span className="text-lg font-bold text-[#003087]">{event.date.split(' ')[0]}</span>
            <span className="text-[10px] text-[#003087]/60">{event.date.split(' ')[1]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-[#2C2E2F] hover:text-[#003087] transition-colors">{event.title}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1 px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full font-medium">{eventTypeIcon(event.type)} {event.type}</span>
              <span>{event.location}</span>
              <span>{event.attendees} participants</span>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onRegisterEvent(event.id); }}
            disabled={registeringEventId === event.id && isRegisterPending}
            className="px-4 py-2 bg-[#003087] text-white rounded-full text-xs font-semibold shrink-0 disabled:opacity-60"
          >
            {registeringEventId === event.id && isRegisterPending ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </motion.div>
      ))}
    </div>
  );
}
