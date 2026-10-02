'use client';

/**
 * useVoiceSearch — Recherche vocale AfriBayit (barre de recherche Hero + /search).
 *
 * Deux chemins complémentaires, choisis automatiquement :
 *
 *  1. Web Speech API (Chrome, Edge, Brave — desktop ET Android) : natif,
 *     instantané, gratuit, transcription en direct (résultats intermédiaires).
 *     C'est le chemin emprunté par la quasi-totalité des visiteurs d'Afrique
 *     de l'Ouest (Chrome dominant).
 *
 *  2. Enregistrement MediaRecorder → ré-encodage WAV 16 kHz mono →
 *     POST /api/voice-search → NVIDIA NIM (modèle omni, API REST compatible
 *     OpenAI, entrée audio base64). Couvre Firefox et Safari iOS où la
 *     Web Speech API n'est pas disponible. Nécessite NVIDIA_API côté serveur
 *     (dégradation propre sinon).
 *
 * Le hook expose : status ('idle' | 'listening' | 'transcribing' | 'error'),
 * interim (texte en direct), error (message FR), supported (au moins un
 * chemin disponible sur ce navigateur), start(), stop(), cancel().
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceSearchStatus = 'idle' | 'listening' | 'transcribing' | 'error';

// ─── Typages minimaux Web Speech API (absents de lib.dom) ───────────────────

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  readonly length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternativeLike;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    item(index: number): SpeechRecognitionResultLike;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

// ─── Nettoyage de la transcription ──────────────────────────────────────────

export function cleanTranscript(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/^["«»'\s]+|["«»'\s.]+$/g, '')
    .trim()
    .slice(0, 200);
}

// ─── Encodage WAV 16 kHz mono (chemin serveur) ──────────────────────────────

function writeAscii(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

/**
 * Convertit un blob audio (webm/mp4/opus…) en WAV PCM 16 bits mono 16 kHz,
 * format accepté par le NIM NVIDIA. Passe par OfflineAudioContext pour le
 * sous-échantillonnage + mixage mono, disponibles sur tous les navigateurs
 * modernes (Firefox et Safari inclus).
 */
async function encodeWav16kMono(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx =
    (typeof AudioContext !== 'undefined' && AudioContext) ||
    ((window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!AudioCtx) throw new Error('unsupported');

  const decodeCtx = new AudioCtx();
  try {
    const decoded = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
    const targetRate = 16000;
    const length = Math.max(1, Math.ceil(decoded.duration * targetRate));
    const offline = new OfflineAudioContext(1, length, targetRate);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start(0);
    const rendered = await offline.startRendering();
    const channel = rendered.getChannelData(0);

    const buffer = new ArrayBuffer(44 + channel.length * 2);
    const view = new DataView(buffer);
    writeAscii(view, 0, 'RIFF');
    view.setUint32(4, 36 + channel.length * 2, true);
    writeAscii(view, 8, 'WAVE');
    writeAscii(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // taille chunk fmt
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, targetRate, true);
    view.setUint32(28, targetRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits/sample
    writeAscii(view, 36, 'data');
    view.setUint32(40, channel.length * 2, true);
    let offset = 44;
    for (let i = 0; i < channel.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, channel[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Blob([buffer], { type: 'audio/wav' });
  } finally {
    void decodeCtx.close().catch(() => {});
  }
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export interface UseVoiceSearchOptions {
  /** Langue de reconnaissance — défaut fr-FR (marché AfriBayit). */
  lang?: string;
  /** Appelé avec la transcription finale nettoyée. */
  onResult: (transcript: string) => void;
  /** Durée max d'enregistrement (chemin serveur), ms. */
  maxDurationMs?: number;
}

export interface UseVoiceSearchReturn {
  status: VoiceSearchStatus;
  /** Texte intermédiaire en direct (Web Speech API uniquement). */
  interim: string;
  /** Message d'erreur FR prêt à afficher. */
  error: string | null;
  /** Vrai si au moins un chemin vocal est disponible sur ce navigateur. */
  supported: boolean;
  /** 'webspeech' | 'server' | null selon le chemin actif. */
  mode: 'webspeech' | 'server' | null;
  start: () => void;
  stop: () => void;
  cancel: () => void;
  /** Efface l'état d'erreur (retour à idle) — auto-dismiss UI. */
  dismissError: () => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  unsupported:
    "La recherche vocale n'est pas disponible sur ce navigateur. Essayez Chrome, Edge ou Brave.",
  permission:
    "Accès au micro refusé. Autorisez le microphone dans les réglages du navigateur pour utiliser la recherche vocale.",
  'not-allowed': "Accès au micro refusé. Autorisez le microphone puis réessayez.",
  'service-not-allowed':
    "Le service de reconnaissance vocale a été bloqué par le navigateur. Réessayez dans quelques instants.",
  'no-speech': "Aucune parole détectée. Cliquez sur le micro et parlez clairement.",
  'audio-capture': 'Aucun micro détecté sur cet appareil.',
  network: 'Connexion perdue pendant la transcription. Réessayez.',
  not_configured:
    "La reconnaissance vocale serveur n'est pas configurée (clé NVIDIA manquante). Utilisez Chrome, Edge ou Brave.",
  server: 'Erreur lors de la transcription. Réessayez dans quelques instants.',
  empty: 'Aucune parole détectée dans cet enregistrement. Réessayez.',
};

function errorText(code: string): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES.server;
}

export function useVoiceSearch({
  lang = 'fr-FR',
  onResult,
  maxDurationMs = 15000,
}: UseVoiceSearchOptions): UseVoiceSearchReturn {
  const [status, setStatus] = useState<VoiceSearchStatus>('idle');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'webspeech' | 'server' | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultSentRef = useRef(false);
  const cancelledRef = useRef(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const supported =
    typeof window !== 'undefined' &&
    (getSpeechRecognitionCtor() !== null ||
      (typeof navigator !== 'undefined' &&
        !!navigator.mediaDevices?.getUserMedia &&
        typeof window.MediaRecorder !== 'undefined'));

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const cleanupServerPath = useCallback(() => {
    clearTimer();
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      try { recorderRef.current.stop(); } catch { /* déjà arrêté */ }
    }
    recorderRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [clearTimer]);

  const teardown = useCallback(() => {
    clearTimer();
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* déjà arrêté */ }
      recognitionRef.current = null;
    }
    cleanupServerPath();
    setInterim('');
  }, [clearTimer, cleanupServerPath]);

  useEffect(() => () => teardown(), [teardown]);

  // ─── Chemin 1 : Web Speech API ────────────────────────────────────────────

  const startWebSpeech = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return false;
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    resultSentRef.current = false;
    cancelledRef.current = false;

    recognition.onstart = () => {
      setStatus('listening');
      setMode('webspeech');
      setError(null);
    };

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (interimText) setInterim(interimText);
      const cleaned = cleanTranscript(finalText);
      if (cleaned && !resultSentRef.current) {
        resultSentRef.current = true;
        try { recognition.stop(); } catch { /* fin de session */ }
        if (!cancelledRef.current) {
          setStatus('transcribing'); // très court — le résultat est déjà là
          onResultRef.current(cleaned);
        }
        teardown();
        setStatus('idle');
        setMode(null);
      }
    };

    recognition.onerror = (event) => {
      const code = event.error;
      if (code === 'aborted' || code === 'no-speech') {
        // 'aborted' = arrêt volontaire ; 'no-speech' géré dans onend
        teardown();
        setStatus(cancelledRef.current ? 'idle' : 'error');
        if (!cancelledRef.current && code === 'no-speech') {
          setError(errorText('no-speech'));
        } else {
          setError(null);
        }
        setMode(null);
        return;
      }
      teardown();
      setStatus('error');
      setError(errorText(code));
      setMode(null);
    };

    recognition.onend = () => {
      // Fin de session sans résultat final → no-speech
      if (!resultSentRef.current) {
        teardown();
        setStatus('error');
        setError(errorText(cancelledRef.current ? '' : 'no-speech') || null);
        if (cancelledRef.current) setStatus('idle');
        setMode(null);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      return true;
    } catch {
      recognitionRef.current = null;
      return false;
    }
  }, [lang, teardown]);

  // ─── Chemin 2 : MediaRecorder → /api/voice-search (NVIDIA) ────────────────

  const transcribeBlob = useCallback(
    async (blob: Blob) => {
      setStatus('transcribing');
      try {
        const wav = await encodeWav16kMono(blob);
        const dataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('read-error'));
          reader.readAsDataURL(wav);
        });
        const res = await fetch('/api/voice-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: dataUri }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          transcript?: string;
          error?: string;
        };
        if (!res.ok || !json.transcript) {
          const code = res.status === 503 ? 'not_configured' : json.error || 'server';
          throw new Error(errorText(code));
        }
        const cleaned = cleanTranscript(json.transcript);
        if (!cleaned) throw new Error(errorText('empty'));
        if (!cancelledRef.current) onResultRef.current(cleaned);
        setStatus('idle');
        setError(null);
      } catch (err) {
        if (cancelledRef.current) {
          setStatus('idle');
          return;
        }
        const message = err instanceof Error ? err.message : '';
        setStatus('error');
        setError(
          message && ERROR_MESSAGES[message] ? ERROR_MESSAGES[message] : message || errorText('server'),
        );
      } finally {
        setMode(null);
        setInterim('');
      }
    },
    [],
  );

  const startServerPath = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === 'undefined') {
      throw new Error('unsupported');
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    streamRef.current = stream;
    chunksRef.current = [];

    const mimeCandidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', ''];
    let mimeType = '';
    for (const candidate of mimeCandidates) {
      if (!candidate || MediaRecorder.isTypeSupported(candidate)) {
        mimeType = candidate;
        break;
      }
    }
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      stream.getTracks().forEach((t) => t.stop());
      if (streamRef.current === stream) streamRef.current = null;
      if (blob.size < 2000) {
        // trop court = clic accidentel
        if (!cancelledRef.current) {
          setStatus('error');
          setError(errorText('no-speech'));
        } else {
          setStatus('idle');
        }
        setMode(null);
        return;
      }
      await transcribeBlob(blob);
    };

    recorder.start(250);
    setStatus('listening');
    setMode('server');
    setError(null);
    clearTimer();
    timeoutRef.current = setTimeout(() => {
      // Garde-fou : arrêt automatique après maxDurationMs
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        try { recorderRef.current.stop(); } catch { /* déjà arrêté */ }
      }
    }, maxDurationMs);
  }, [clearTimer, maxDurationMs, transcribeBlob]);

  // ─── API publique du hook ─────────────────────────────────────────────────

  const start = useCallback(() => {
    if (status === 'listening' || status === 'transcribing') return;
    setError(null);
    setInterim('');
    resultSentRef.current = false;
    cancelledRef.current = false;

    if (getSpeechRecognitionCtor()) {
      const started = startWebSpeech();
      if (started) return;
    }
    // Chemin serveur (Firefox, Safari…)
    startServerPath().catch((err: unknown) => {
      const code =
        err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'SecurityError')
          ? 'permission'
          : err instanceof Error && ERROR_MESSAGES[err.message]
            ? err.message
            : 'server';
      setStatus('error');
      setError(errorText(code));
      cleanupServerPath();
      setMode(null);
    });
  }, [status, startWebSpeech, startServerPath, cleanupServerPath]);

  const stop = useCallback(() => {
    if (mode === 'webspeech' && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* déjà arrêté */ }
      return;
    }
    if (mode === 'server' && recorderRef.current && recorderRef.current.state === 'recording') {
      try { recorderRef.current.stop(); } catch { /* déjà arrêté */ }
      clearTimer();
    }
  }, [mode, clearTimer]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    teardown();
    setStatus('idle');
    setError(null);
    setMode(null);
  }, [teardown]);

  const dismissError = useCallback(() => {
    setError(null);
    setStatus((prev) => (prev === 'error' ? 'idle' : prev));
  }, []);

  return { status, interim, error, supported, mode, start, stop, cancel, dismissError };
}
