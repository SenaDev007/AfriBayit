'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Calendar, Clock, MapPin, Users, Video, Mic } from 'lucide-react';
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
      {/* Event type filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 bg-white rounded-2xl p-2 border">
        {[
          { label: 'Tous', type: '' },
          { label: 'Summit mensuel', type: 'Summit' },
          { label: 'Networking', type: 'Networking' },
          { label: 'Portes ouvertes', type: 'Portes ouvertes' },
          { label: 'Formation', type: 'Formation' },
        ].map(et => (
          <button key={et.label} className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-50 text-gray-600 hover:bg-[#003087]/5 hover:text-[#003087] whitespace-nowrap transition-colors">
            {et.label}
          </button>
        ))}
      </div>

      {/* CDC §5.7.3 info banner */}
      <div className="bg-gradient-to-r from-[#009CDE]/5 to-[#003087]/5 rounded-2xl p-4 border flex items-start gap-3">
        <Video className="w-5 h-5 text-[#009CDE] shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">
          <strong className="text-[#0a2a5e]">Événements AfriBayit</strong> — Summit mensuel par pays (webinaire live,
          replay 30 jours), Networking trimestriel (physique, 50-200 participants), Portes ouvertes virtuelles
          (visites VR simultanées), Formation communautaire hebdomadaire (gratuite).
        </p>
      </div>

      {eventsLoading && Array.from({ length: 4 }).map((_, i) => <EventSkeleton key={i} />)}
      {eventsError && (
        <div className="text-center py-12 bg-white rounded-2xl border">
          <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold mb-1">Impossible de charger les événements</p>
        </div>
      )}
      {!eventsLoading && !eventsError && events.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold mb-1">Aucun événement à venir</p>
          <p className="text-sm text-gray-400">Les prochains événements seront annoncés ici.</p>
        </div>
      )}
      {!eventsLoading && !eventsError && events.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.08, ease: easeOut }}
          className="bg-white rounded-2xl shadow-sm border hover:shadow-lg hover:border-[#009CDE]/20 transition-all overflow-hidden group cursor-pointer"
          onClick={() => onSelectEvent(event.id)}
        >
          {/* Gradient top border */}
          <div className="h-1 bg-gradient-to-r from-[#009CDE] via-[#003087] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-5 flex items-center gap-4">
            {/* Date block */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#003087] to-[#0047b3] flex flex-col items-center justify-center shrink-0 text-white">
              <span className="text-xl font-bold leading-none">{event.date.split(' ')[0]}</span>
              <span className="text-[10px] uppercase tracking-wide mt-0.5">{event.date.split(' ')[1]}</span>
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-[#0a2a5e] group-hover:text-[#003087] transition-colors mb-1">{event.title}</h3>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="flex items-center gap-1 px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full font-medium">
                  {eventTypeIcon(event.type)} {event.type}
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <Users className="w-3 h-3" />
                  {event.attendees} participants
                </span>
              </div>
            </div>
            {/* Register button */}
            <button
              onClick={(e) => { e.stopPropagation(); onRegisterEvent(event.id); }}
              disabled={registeringEventId === event.id && isRegisterPending}
              className="px-4 py-2 bg-[#003087] text-white rounded-lg text-xs font-semibold shrink-0 disabled:opacity-60 hover:bg-[#0047b3] transition-colors flex items-center gap-1.5"
            >
              {registeringEventId === event.id && isRegisterPending ? (
                <>Inscription...</>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  S&apos;inscrire
                </>
              )}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
