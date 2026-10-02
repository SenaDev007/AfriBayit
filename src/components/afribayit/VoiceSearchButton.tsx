'use client';

/**
 * VoiceSearchButton — Micro de recherche vocale AfriBayit.
 *
 * API publique historique (conservée pour les consommateurs existants —
 * AdvancedFilterSidebar, ConversationalSearchBar) :
 *   <VoiceSearchButton onTranscript={(texte) => …} currentQuery={query} language="fr" />
 *
 * Internaux modernisés :
 *   1. Web Speech API (Chrome, Edge, Brave — desktop et Android) : natif,
 *      instantané, gratuit. C'est le chemin de la quasi-totalité des
 *      visiteurs (Chrome dominant en Afrique de l'Ouest).
 *   2. MediaRecorder → WAV 16 kHz mono → POST /api/voice-search → NVIDIA NIM
 *      (modèle omni, API compatible OpenAI). Couvre Firefox / Safari iOS et
 *      répare l'ancien fallback qui postait vers une route inexistante
 *      (/api/search/voice-search) avec de l'audio webm non converti.
 *
 * Les parents voulant un rendu plus riche (texte intermédiaire en direct,
 * ligne d'état personnalisée) utilisent directement le hook useVoiceSearch
 * + VoiceSearchButtonCore + getVoiceStatusText (cf. Hero, /search).
 */

import React, { useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2 } from 'lucide-react';
import { useVoiceSearch, type VoiceSearchStatus } from '@/hooks/useVoiceSearch';

// ─── API publique ───────────────────────────────────────────────────────────

export interface VoiceSearchButtonProps {
  /** Reçoit la transcription finale (préfixée par currentQuery le cas échéant). */
  onTranscript: (text: string) => void;
  currentQuery?: string;
  /**
   * Langue parlée de l'UI. L'AfriBayit expose 4 langues ouest-africaines,
   * mais la Web Speech API des navigateurs n'embarque pas encore de modèles
   * fon/dyu/moor — toutes sont mappées sur fr-FR, comme auparavant. La
   * valeur est conservée pour brancher de futurs modèles côté serveur.
   */
  language?: 'fr' | 'fon' | 'dyu' | 'moor';
  /** Style : 'default' (fond clair) ou 'hero' (barre glass sur fond navy). */
  variant?: 'default' | 'hero';
  /** Afficher le texte d'état inline à côté du micro (défaut : true). */
  showInlineStatus?: boolean;
}

/** Map langues UI → codes BCP-47 de la Web Speech API. */
const SPEECH_LANG_MAP: Record<NonNullable<VoiceSearchButtonProps['language']>, string> = {
  fr: 'fr-FR',
  fon: 'fr-FR',
  dyu: 'fr-FR',
  moor: 'fr-FR',
};

// ─── Cœur présentationnel ───────────────────────────────────────────────────

export interface VoiceSearchButtonCoreProps {
  status: VoiceSearchStatus;
  mode: 'webspeech' | 'server' | null;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  variant?: 'default' | 'hero';
}

/**
 * Bouton rond seul (sans texte) — à combiner avec useVoiceSearch quand le
 * parent contrôle le rendu de l'état (Hero, barre de recherche /search).
 */
export function VoiceSearchButtonCore({
  status,
  mode,
  onStart,
  onStop,
  onCancel,
  variant = 'default',
}: VoiceSearchButtonCoreProps) {
  void mode; // mêmes actions pour les deux chemins
  const listening = status === 'listening';
  const transcribing = status === 'transcribing';

  const handleClick = () => {
    if (transcribing) {
      onCancel();
      return;
    }
    if (listening) {
      onStop();
      return;
    }
    onStart();
  };

  const isHero = variant === 'hero';
  const buttonClasses = isHero
    ? [
        'relative inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full shrink-0 cursor-pointer transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-yellow/60',
        listening
          ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
          : transcribing
            ? 'bg-white/25 text-white cursor-wait'
            : 'bg-white/15 text-white hover:bg-white/25 border border-white/30',
      ].join(' ')
    : [
        'relative inline-flex items-center justify-center w-10 h-10 rounded-lg shrink-0 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009CDE] focus-visible:ring-offset-2',
        listening
          ? 'bg-red-500 text-white'
          : transcribing
            ? 'bg-[#D4AF37]/20 text-[#D4AF37] cursor-wait'
            : 'bg-[#003087]/5 text-[#003087] hover:bg-[#003087]/10',
      ].join(' ');

  return (
    <div className="relative shrink-0">
      {/* Halo pulsé pendant l'écoute */}
      {listening && (
        <span
          aria-hidden="true"
          className={`absolute inset-0 bg-red-500/60 animate-ping ${isHero ? 'rounded-full' : 'rounded-lg'}`}
          style={{ animationDuration: '1.2s' }}
        />
      )}
      <motion.button
        type="button"
        onClick={handleClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={transcribing}
        aria-label={
          listening
            ? 'Terminer la recherche vocale et lancer la recherche'
            : transcribing
              ? 'Annuler la transcription'
              : 'Rechercher par la voix'
        }
        aria-pressed={listening}
        title={
          listening
            ? 'Terminer et lancer la recherche'
            : transcribing
              ? 'Annuler la transcription'
              : 'Recherche vocale — cliquez puis parlez'
        }
        className={buttonClasses}
      >
        {listening ? (
          <Square className="w-4 h-4 fill-current relative z-10" />
        ) : transcribing ? (
          <Loader2 className="w-4 h-4 animate-spin relative z-10" />
        ) : (
          <Mic className="w-5 h-5 relative z-10" />
        )}
      </motion.button>
    </div>
  );
}

// ─── Helpers d'état ─────────────────────────────────────────────────────────

/** Vrai si le navigateur propose au moins un chemin vocal (SSR-safe). */
export function isVoiceSearchSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  const hasWebSpeech = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
  const hasRecorder =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.MediaRecorder !== 'undefined';
  return hasWebSpeech || hasRecorder;
}

/**
 * Texte d'état FR à afficher (inline ou sous la barre).
 * Renvoie null quand il n'y a rien à afficher.
 */
export function getVoiceStatusText(
  status: VoiceSearchStatus,
  mode: 'webspeech' | 'server' | null,
  interim: string,
  error: string | null,
): string | null {
  if (status === 'listening') {
    if (interim) return `« ${interim} »`;
    return mode === 'server'
      ? 'Enregistrement en cours — parlez puis cliquez à nouveau sur le micro'
      : 'Je vous écoute… parlez maintenant';
  }
  if (status === 'transcribing') return 'Transcription IA en cours…';
  if (status === 'error' && error) return error;
  return null;
}

// ─── Statut inline (à côté du micro) — usage historique ─────────────────────

function InlineStatus({ status, error }: { status: VoiceSearchStatus; error: string | null }) {
  const listening = status === 'listening';
  const processing = status === 'transcribing';
  return (
    <AnimatePresence>
      {listening && (
        <motion.span
          key="listening-text"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-red-500 font-medium whitespace-nowrap flex items-center gap-1"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          Écoute en cours…
        </motion.span>
      )}
      {processing && (
        <motion.span
          key="processing-text"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-[#D4AF37] font-medium whitespace-nowrap"
        >
          Transcription IA…
        </motion.span>
      )}
      {status === 'error' && error && (
        <motion.span
          key="error-text"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-red-500 font-medium whitespace-nowrap"
        >
          {error}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

// ─── Composant complet (API publique historique) ────────────────────────────

export default function VoiceSearchButton({
  onTranscript,
  currentQuery = '',
  language = 'fr',
  variant = 'default',
  showInlineStatus = true,
}: VoiceSearchButtonProps) {
  const handleResult = useCallback(
    (transcript: string) => {
      const combined = currentQuery ? `${currentQuery} ${transcript}` : transcript;
      onTranscript(combined);
    },
    [currentQuery, onTranscript],
  );

  const voice = useVoiceSearch({
    lang: SPEECH_LANG_MAP[language] || 'fr-FR',
    onResult: handleResult,
  });

  // Auto-dismiss des erreurs après 4 s (comportement historique conservé)
  useEffect(() => {
    if (voice.status !== 'error' || !voice.error) return;
    const timer = setTimeout(() => voice.dismissError(), 4000);
    return () => clearTimeout(timer);
    // voice.dismissError est une ref stable du hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.status, voice.error]);

  if (!voice.supported) {
    // Aucun chemin vocal sur ce navigateur → pas de bouton mort
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <VoiceSearchButtonCore
        status={voice.status}
        mode={voice.mode}
        onStart={voice.start}
        onStop={voice.stop}
        onCancel={voice.cancel}
        variant={variant}
      />
      {showInlineStatus && (
        <InlineStatus status={voice.status} error={voice.error} />
      )}
    </div>
  );
}
