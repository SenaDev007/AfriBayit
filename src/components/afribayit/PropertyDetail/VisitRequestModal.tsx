'use client';

/**
 * VisitRequestModal — demande de visite d'un bien (CDC §5.1.3).
 *
 * RETOUR CLIENT 02/10 : « Demander une visite dit de se connecter alors qu'on
 * est déjà connecté » — le bouton redirigeait bêtement vers /auth/login.
 * Cette modale branche le VRAI flux : choix du créneau (date + heure parmi
 * les horaires ouvrés), notes, puis POST /api/properties/appointments
 * (persisté en base — modèle Appointment).
 */

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, Clock, Loader2, CheckCircle2, MapPin } from 'lucide-react';
import { apiFetch, apiPost } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n/use-translate';

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface VisitRequestModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  propertyId: string;
  propertyTitle: string;
  agentName?: string;
}

interface SentState {
  scheduledAt: string;
}

export default function VisitRequestModal({
  open,
  onOpenChange,
  propertyId,
  propertyTitle,
  agentName,
}: VisitRequestModalProps) {
  const { t } = useTranslation();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState<SentState | null>(null);

  // Chargement des créneaux ouverts (14 jours)
  useEffect(() => {
    if (!open || slots.length > 0 || slotsLoading) return;
    setSlotsLoading(true);
    apiFetch<{ slots: TimeSlot[] }>('/api/properties/appointments?available=true')
      .then((d) => setSlots(Array.isArray(d?.slots) ? d.slots : []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [open, slots.length, slotsLoading]);

  // Dates distinctes disponibles
  const dates = useMemo(() => {
    const seen = new Set<string>();
    const list: { iso: string; label: string }[] = [];
    for (const s of slots) {
      const d = new Date(s.start);
      const key = d.toISOString().slice(0, 10);
      if (!seen.has(key)) {
        seen.add(key);
        list.push({
          iso: key,
          label: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }),
        });
      }
    }
    return list.slice(0, 10);
  }, [slots]);

  // Créneaux du jour sélectionné
  const daySlots = useMemo(() => {
    if (!selectedDate) return [];
    return slots.filter((s) => s.start.slice(0, 10) === selectedDate);
  }, [slots, selectedDate]);

  useEffect(() => {
    setSelectedSlot('');
  }, [selectedDate]);

  const handleSubmit = async () => {
    if (!selectedSlot) {
      setError('Veuillez choisir un créneau de visite');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiPost<{ success: boolean; message?: string }>(
        '/api/properties/appointments',
        {
          propertyId,
          scheduledAt: selectedSlot,
          durationMinutes: 60,
          notes: notes.trim() || undefined,
        },
      );
      if (res?.success) {
        setSent({ scheduledAt: selectedSlot });
      } else {
        setError(res?.message || 'La demande n’a pas pu être envoyée');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l’envoi de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSelectedDate('');
    setSelectedSlot('');
    setNotes('');
    setError('');
    setSent(null);
  };

  const fmtSlot = (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const fmtFull = (iso: string) =>
    new Date(iso).toLocaleString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden rounded-3xl bg-white border border-primary-pale">
        <DialogTitle className="sr-only">
          {t('propertyDetail.visit.title', 'Demander une visite')} — {propertyTitle}
        </DialogTitle>

        {sent ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-serif text-xl font-bold text-primary-deep mb-2">
              Demande de visite envoyée
            </h3>
            <p className="text-sm text-gray-text mb-1">
              {agentName ? `${agentName} vous confirmera le créneau sous 24 h.` : 'L’agent vous confirmera le créneau sous 24 h.'}
            </p>
            <p className="text-sm font-bold text-primary-deep mb-6">{fmtFull(sent.scheduledAt)}</p>
            <button
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              className="px-8 py-3 rounded-full bg-primary-green text-white text-sm font-bold hover:bg-primary-deep transition-colors"
            >
              Parfait, merci
            </button>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-primary-pale flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-primary-green" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-primary-deep leading-tight">
                  Demander une visite
                </h3>
                <p className="text-xs text-gray-text flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" /> {propertyTitle}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-600 text-center mb-4">
                {error}
              </div>
            )}

            {slotsLoading ? (
              <div className="py-10 flex flex-col items-center gap-3 text-gray-text">
                <Loader2 className="w-6 h-6 animate-spin text-primary-green" />
                <p className="text-xs">Chargement des créneaux disponibles…</p>
              </div>
            ) : dates.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-text">
                Aucun créneau disponible pour le moment. Contactez l’agent directement.
              </div>
            ) : (
              <>
                <label className="block text-xs font-bold text-primary-deep uppercase tracking-wider mb-2">
                  Choisissez un jour
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5 max-h-40 overflow-y-auto pr-1">
                  {dates.map((d) => (
                    <button
                      key={d.iso}
                      onClick={() => setSelectedDate(d.iso)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                        selectedDate === d.iso
                          ? 'bg-primary-green text-white border-primary-green'
                          : 'bg-white text-gray-text border-primary-pale hover:border-primary-green/40'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {selectedDate && (
                  <>
                    <label className="block text-xs font-bold text-primary-deep uppercase tracking-wider mb-2">
                      <Clock className="w-3 h-3 inline mr-1" /> Choisissez un horaire
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mb-5">
                      {daySlots.map((s) => (
                        <button
                          key={s.start}
                          onClick={() => setSelectedSlot(s.start)}
                          disabled={!s.available}
                          className={`px-2 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                            selectedSlot === s.start
                              ? 'bg-primary-green text-white border-primary-green'
                              : 'bg-white text-gray-text border-primary-pale hover:border-primary-green/40'
                          } ${!s.available ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          {fmtSlot(s.start)}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <label className="block text-xs font-bold text-primary-deep uppercase tracking-wider mb-2">
                  Message (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="Ex. : Je suis disponible en fin de journée, la visite pourrait-elle se faire après 16 h ?"
                  className="w-full px-4 py-3 rounded-xl border border-primary-pale bg-white text-sm text-gray-text outline-none focus:ring-2 focus:ring-primary-green/40 resize-none placeholder:text-gray-400"
                />

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !selectedSlot}
                  className="w-full mt-5 py-3.5 rounded-full bg-primary-green hover:bg-primary-deep text-white font-bold text-sm shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Envoi…' : 'Confirmer la demande de visite'}
                </button>
                <p className="text-[11px] text-gray-text/70 text-center mt-3">
                  Visite gratuite et sans engagement — l’agent confirme sous 24 h.
                </p>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
