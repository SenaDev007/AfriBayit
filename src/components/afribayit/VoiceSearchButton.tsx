'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void;
  currentQuery?: string;
}

// Types for the Web Speech API
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'error' | 'unsupported';

export default function VoiceSearchButton({ onTranscript, currentQuery = '' }: VoiceSearchButtonProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const showUnsupportedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if Web Speech API is supported
  const isSpeechRecognitionSupported = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    return !!SpeechRecognition;
  }, []);

  // Whisper AI fallback: record audio and send to /api/voice-search
  const startWhisperFallback = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Determine best supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const reader = new FileReader();

        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          if (!base64Audio) {
            setVoiceState('error');
            setErrorMessage('Impossible de traiter l\'audio');
            return;
          }

          try {
            setVoiceState('processing');
            const response = await fetch('/api/voice-search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64Audio }),
            });

            if (!response.ok) {
              throw new Error('Erreur du service de transcription');
            }

            const data = await response.json();
            if (data.text && data.text.trim()) {
              const combinedText = currentQuery
                ? `${currentQuery} ${data.text.trim()}`
                : data.text.trim();
              onTranscript(combinedText);
            }
            setVoiceState('idle');
          } catch {
            setVoiceState('error');
            setErrorMessage('Erreur de transcription Whisper IA');
          }
        };

        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setVoiceState('listening');

      // Auto-stop recording after 10 seconds max
      autoStopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, 10000);
    } catch {
      setVoiceState('error');
      setErrorMessage('Accès au microphone refusé');
    }
  }, [currentQuery, onTranscript]);

  const stopWhisperFallback = useCallback(() => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Start listening with Web Speech API
  const startListening = useCallback(() => {
    setErrorMessage('');

    if (!isSpeechRecognitionSupported()) {
      // Fallback to Whisper AI
      startWhisperFallback();
      return;
    }

    const SpeechRecognition = (
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    ) as new () => SpeechRecognitionInstance;

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceState('listening');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      // Show interim results in the search field as user speaks
      if (interimTranscript) {
        const combinedText = currentQuery
          ? `${currentQuery} ${interimTranscript.trim()}`
          : interimTranscript.trim();
        onTranscript(combinedText);
      }

      // Final result — override with confirmed text
      if (finalTranscript) {
        const combinedText = currentQuery
          ? `${currentQuery} ${finalTranscript.trim()}`
          : finalTranscript.trim();
        onTranscript(combinedText);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);

      if (event.error === 'not-allowed') {
        setVoiceState('error');
        setErrorMessage('Accès au microphone refusé');
      } else if (event.error === 'no-speech') {
        setVoiceState('error');
        setErrorMessage('Aucune parole détectée. Réessayez.');
      } else if (event.error === 'network') {
        // Network error — fallback to Whisper
        recognition.abort();
        startWhisperFallback();
        return;
      } else {
        setVoiceState('error');
        setErrorMessage('Erreur de reconnaissance vocale');
      }
    };

    recognition.onend = () => {
      // Only set idle if we're still in listening state (not already processing or error)
      setVoiceState((prev) => prev === 'listening' ? 'idle' : prev);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      // If start fails, fallback to Whisper
      startWhisperFallback();
    }
  }, [isSpeechRecognitionSupported, currentQuery, onTranscript, startWhisperFallback]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    stopWhisperFallback();
    setVoiceState('idle');
  }, [stopWhisperFallback]);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (voiceState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  }, [voiceState, startListening, stopListening]);

  // Auto-dismiss error/unsupported states
  useEffect(() => {
    if (voiceState === 'error' || voiceState === 'unsupported') {
      if (showUnsupportedTimerRef.current) {
        clearTimeout(showUnsupportedTimerRef.current);
      }
      showUnsupportedTimerRef.current = setTimeout(() => {
        setVoiceState('idle');
        setErrorMessage('');
      }, 4000);
    }
    return () => {
      if (showUnsupportedTimerRef.current) {
        clearTimeout(showUnsupportedTimerRef.current);
      }
    };
  }, [voiceState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
      }
    };
  }, []);

  const isListening = voiceState === 'listening';
  const isProcessing = voiceState === 'processing';
  const isError = voiceState === 'error';

  return (
    <div className="flex items-center gap-2">
      <motion.button
        type="button"
        onClick={toggleListening}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        disabled={isProcessing}
        className={`
          relative flex items-center justify-center
          w-10 h-10 rounded-lg
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#009CDE] focus-visible:ring-offset-2
          ${isListening
            ? 'bg-red-500 text-white'
            : isProcessing
              ? 'bg-[#D4AF37]/20 text-[#D4AF37] cursor-wait'
              : 'bg-[#003087]/5 text-[#003087] hover:bg-[#003087]/10'
          }
          ${isProcessing ? 'cursor-wait' : 'cursor-pointer'}
        `}
        aria-label={isListening ? 'Arrêter la recherche vocale' : 'Démarrer la recherche vocale'}
        title={isListening ? 'Arrêter' : 'Recherche vocale'}
      >
        {/* Pulsing red ring when listening */}
        <AnimatePresence>
          {isListening && (
            <>
              <motion.span
                key="pulse-ring-1"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-lg bg-red-500 pointer-events-none"
              />
              <motion.span
                key="pulse-ring-2"
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 2.2, opacity: 0 }}
                exit={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                className="absolute inset-0 rounded-lg bg-red-400 pointer-events-none"
              />
            </>
          )}
        </AnimatePresence>

        {/* Microphone SVG Icon */}
        {(isListening || (!isProcessing && !isError)) && (
          <svg
            className="w-5 h-5 relative z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 10v2a7 7 0 01-14 0v-2"
            />
            <line
              strokeLinecap="round"
              strokeLinejoin="round"
              x1="12"
              y1="19"
              x2="12"
              y2="23"
            />
            <line
              strokeLinecap="round"
              strokeLinejoin="round"
              x1="8"
              y1="23"
              x2="16"
              y2="23"
            />
          </svg>
        )}

        {/* Processing spinner */}
        {isProcessing && (
          <motion.svg
            key="spinner"
            className="w-5 h-5 relative z-10"
            viewBox="0 0 24 24"
            fill="none"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="31.4 31.4"
            />
          </motion.svg>
        )}

        {/* Error icon */}
        {isError && (
          <svg
            className="w-5 h-5 relative z-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </motion.button>

      {/* Status indicator text */}
      <AnimatePresence>
        {isListening && (
          <motion.span
            key="listening-text"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-red-500 font-body font-medium whitespace-nowrap flex items-center gap-1"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-lg bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-lg h-2 w-2 bg-red-500" />
            </span>
            Écoute en cours...
          </motion.span>
        )}
        {isProcessing && (
          <motion.span
            key="processing-text"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-[#D4AF37] font-body font-medium whitespace-nowrap"
          >
            Transcription IA...
          </motion.span>
        )}
        {isError && errorMessage && (
          <motion.span
            key="error-text"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="text-xs text-red-500 font-body font-medium whitespace-nowrap"
          >
            {errorMessage}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
