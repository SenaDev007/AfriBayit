'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Calendar, MapPin, Users, Globe, Clock,
  UserPlus, AlertTriangle, Loader2, Trophy, BookOpen, Video,
} from 'lucide-react';
import { useCommunityEvent, useRegisterEvent } from '@/hooks/useCommunity';
import { useAuthStore } from '@/stores/authStore';
import { formatDateTime, formatDate } from '@/lib/afribayit-utils';
import { toast } from '@/hooks/use-toast';

const easeOut = [0.16, 1, 0.3, 1] as const;

const EVENT_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  meetup: { label: 'Meetup', icon: <Users className="w-5 h-5" />, color: '#009CDE' },
  webinar: { label: 'Webinaire', icon: <Video className="w-5 h-5" />, color: '#00A651' },
  formation: { label: 'Formation', icon: <BookOpen className="w-5 h-5" />, color: '#003087' },
  visite: { label: 'Visite', icon: <MapPin className="w-5 h-5" />, color: '#D4AF37' },
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user } = useAuthStore();

  const { data: eventData, isLoading: eventLoading, error: eventError } = useCommunityEvent(eventId);
  const registerEvent = useRegisterEvent(eventId);

  const [registering, setRegistering] = useState(false);

  const event = eventData?.data as Record<string, unknown> | undefined;

  const handleRegister = () => {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour vous inscrire.' });
      return;
    }
    setRegistering(true);
    registerEvent.mutate(undefined, {
      onSuccess: () => {
        toast({ title: 'Inscription confirmée', description: 'Vous êtes inscrit à cet événement.' });
        setRegistering(false);
      },
      onError: (err: Error) => {
        toast({ title: 'Erreur', description: err.message || 'Impossible de s\'inscrire.', variant: 'destructive' });
        setRegistering(false);
      },
    });
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen pt-20 pb-24 bg-gray-50/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="bg-white rounded-3xl p-6 shadow-sm border space-y-4">
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen pt-20 pb-24 bg-gray-50/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Événement introuvable</h2>
          <p className="text-sm text-gray-400 mb-6">{eventError?.message || 'Cet événement n\'existe pas ou a été supprimé.'}</p>
          <button onClick={() => router.push('/community')} className="px-6 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors">Retour à la communauté</button>
        </div>
      </div>
    );
  }

  const eventType = String(event.eventType || '');
  const typeInfo = EVENT_TYPE_LABELS[eventType] || { label: eventType, icon: <Calendar className="w-5 h-5" />, color: '#D4AF37' };
  const isVirtual = event.isVirtual === true || event.isVirtual === 'true';
  const isFull = !!(event.maxAttendees && Number(event.attendees) >= Number(event.maxAttendees));

  const eventDate = event.eventDate ? new Date(String(event.eventDate)) : null;
  const endDate = event.endDate ? new Date(String(event.endDate)) : null;

  return (
    <div className="min-h-screen pt-20 pb-24 bg-gray-50/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <button onClick={() => router.push('/community')} className="inline-flex items-center gap-2 text-sm text-[#003087] font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" /> Retour à la communauté
          </button>
        </motion.div>

        {/* Event Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: easeOut }} className="bg-white rounded-3xl p-6 shadow-sm border mb-6">
          {/* Event type badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${typeInfo.color}15`, color: typeInfo.color }}>
              {typeInfo.icon} {typeInfo.label}
            </span>
            {isVirtual && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#00A651]/10 text-[#00A651]">
                <Globe className="w-3.5 h-3.5" /> Virtuel
              </span>
            )}
            {isFull && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#D93025]/10 text-[#D93025]">Complet</span>
            )}
          </div>

          {/* Title */}
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[#2C2E2F] mb-4">{String(event.title || '')}</h1>

          <p className="text-sm text-gray-600 leading-relaxed mb-5">{String(event.description || '')}</p>


          {/* Event details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {/* Date */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-[#003087]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p className="text-sm font-medium text-[#2C2E2F]">
                  {eventDate ? formatDate(eventDate) : 'Non définie'}
                </p>
              </div>
            </div>

            {/* Time */}
            {eventDate && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Heure</p>
                  <p className="text-sm font-medium text-[#2C2E2F]">
                    {eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    {endDate && ` — ${endDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
              </div>
            )}

            {/* Venue */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-[#00A651]/10 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#00A651]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Lieu</p>
                <p className="text-sm font-medium text-[#2C2E2F]">
                  {isVirtual ? 'En ligne' : String(event.venue || event.city || 'Non défini')}
                </p>
              </div>
            </div>

            {/* Attendees */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-[#009CDE]/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#009CDE]" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Participants</p>
                <p className="text-sm font-medium text-[#2C2E2F]">
                  {Number(event.attendees || 0)}{event.maxAttendees ? ` / ${Number(event.maxAttendees)}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Meeting URL for virtual events */}
          {isVirtual && Boolean(event.meetingUrl) && (
            <div className="mb-5 p-3 bg-[#00A651]/5 rounded-2xl border border-[#00A651]/20">
              <p className="text-xs text-[#00A651] font-medium mb-1">Lien de connexion</p>
              <a href={String(event.meetingUrl)} target="_blank" rel="noopener noreferrer" className="text-sm text-[#003087] underline break-all">{String(event.meetingUrl)}</a>
            </div>
          )}

          {/* Register button */}
          <button
            onClick={handleRegister}
            disabled={registering || registerEvent.isPending || isFull}
            className="w-full py-3 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {registering || registerEvent.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Inscription...</>
            ) : isFull ? (
              <><Users className="w-4 h-4" /> Événement complet</>
            ) : (
              <><UserPlus className="w-4 h-4" /> S&apos;inscrire</>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
