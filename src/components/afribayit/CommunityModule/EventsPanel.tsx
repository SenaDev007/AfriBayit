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
      <div className="flex gap-1.5 overflow-x-auto pb-2 bg-white rounded-3xl p-2 border border-primary-pale shadow-md">
        {[
          { label: 'Tous', type: '' },
          { label: 'Summit mensuel', type: 'Summit' },
          { label: 'Networking', type: 'Networking' },
          { label: 'Portes ouvertes', type: 'Portes ouvertes' },
          { label: 'Formation', type: 'Formation' },
        ].map(et => (
          <button key={et.label} className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary-pale/50 text-gray-text hover:bg-primary-pale hover:text-primary-deep whitespace-nowrap transition-colors">
            {et.label}
          </button>
        ))}
      </div>

      {/* CDC §5.7.3 info banner */}
      <div className="bg-primary-pale/50 rounded-2xl p-4 border border-primary-pale flex items-start gap-3">
        <Video className="w-5 h-5 text-primary-green shrink-0 mt-0.5" />
        <p className="text-xs text-gray-text">
          <strong className="text-primary-deep">Événements AfriBayit</strong> — Summit mensuel par pays (webinaire live,
          replay 30 jours), Networking trimestriel (physique, 50-200 participants), Portes ouvertes virtuelles
          (visites VR simultanées), Formation communautaire hebdomadaire (gratuite).
        </p>
      </div>

      {eventsLoading && Array.from({ length: 4 }).map((_, i) => <EventSkeleton key={i} />)}
      {eventsError && (
        <div className="text-center py-12 bg-white rounded-3xl border border-primary-pale shadow-lg">
          <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-text font-semibold mb-1">Impossible de charger les événements</p>
        </div>
      )}
      {!eventsLoading && !eventsError && events.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-primary-pale shadow-lg">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-text font-semibold mb-1">Aucun événement à venir</p>
          <p className="text-sm text-gray-400">Les prochains événements seront annoncés ici.</p>
        </div>
      )}
      {!eventsLoading && !eventsError && events.map((event, i) => (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.08, ease: easeOut }}
          className="bg-white rounded-3xl shadow-lg border border-primary-pale hover:shadow-xl hover:border-primary-green/30 transition-all overflow-hidden group cursor-pointer"
          onClick={() => onSelectEvent(event.id)}
        >
          {/* Gradient top border */}
          <div className="h-1 bg-gradient-to-r from-primary-green via-primary-deep to-accent-yellow opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-5 flex items-center gap-4">
            {/* Date block */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-deep to-primary-green flex flex-col items-center justify-center shrink-0 text-white shadow-md">
              <span className="text-xl font-bold leading-none">{event.date.split(' ')[0]}</span>
              <span className="text-[10px] uppercase tracking-wide mt-0.5">{event.date.split(' ')[1]}</span>
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-primary-deep group-hover:text-primary-green transition-colors mb-1">{event.title}</h3>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="flex items-center gap-1 px-2 py-0.5 bg-accent-yellow/15 text-accent-dark border border-accent-yellow/30 rounded-full font-medium">
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
              className="px-4 py-2 rounded-full bg-primary-green text-white text-xs font-bold shrink-0 disabled:opacity-60 hover:bg-primary-deep transition-all shadow-md flex items-center gap-1.5"
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
