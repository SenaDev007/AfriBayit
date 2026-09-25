'use client';

/**
 * VoiceChannelPanel — salon vocal LiveKit intégré au workspace Communauté.
 *
 * - Rejoint la room LiveKit `afribayit-<roomKey>` via un jeton signé côté
 *   serveur (GET /api/community/voice/token — HS256 main, zéro dépendance).
 * - Contrôles Discord : micro on/off, quitter, liste des participants avec
 *   halo doré quand un membre parle (événements ActiveSpeakersChanged).
 * - Dégradation professionnelle : sans variables LIVEKIT_* configurées, le
 *   panneau affiche un guide de configuration clair au lieu d'un crash.
 *
 * Le SDK `livekit-client` est importé dynamiquement — il n'alourdit le
 * bundle initial d'aucune page tant qu'un salon vocal n'est pas rejoint.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic, MicOff, PhoneOff, Volume2, Loader2, ShieldAlert, Users, Signal,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';

// Types livekit-client — import dynamique, typage structurel minimal
type LkRoom = {
  connect: (url: string, token: string, opts?: Record<string, unknown>) => Promise<void>;
  disconnect: () => void;
  setMicrophoneEnabled: (enabled: boolean) => Promise<void>;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  remoteParticipants: Map<string, { identity: string; name?: string; metadata?: string }>;
  localParticipant: { identity: string; name?: string };
};

interface VoiceTokenResponse {
  configured: boolean;
  url?: string;
  token?: string;
  room?: string;
  roomKey?: string;
  roomLabel?: string;
  displayName?: string;
  hint?: string;
}

interface Participant {
  identity: string;
  name: string;
  avatar: string | null;
  speaking: boolean;
  isLocal: boolean;
}

export interface VoiceChannelDef {
  key: string;
  label: string;
  desc: string;
}

export const VOICE_CHANNELS: VoiceChannelDef[] = [
  { key: 'general', label: 'Général', desc: 'Salon vocal ouvert à toute la communauté' },
  { key: 'investisseurs', label: 'Investisseurs', desc: 'Discussions stratégies et opportunités' },
  { key: 'btp', label: 'Artisans BTP', desc: 'Coordination chantiers et devis' },
];

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error' | 'unconfigured';

export default function VoiceChannelPanel({ room }: { room: VoiceChannelDef }) {
  const { user } = useAuthStore();
  const router = useRouter();

  const [state, setState] = useState<ConnectionState>('idle');
  const [micOn, setMicOn] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const roomRef = useRef<LkRoom | null>(null);
  const mountedRef = useRef(true);

  // Nettoyage strict au démontage (changement de salon / navigation)
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      try {
        roomRef.current?.disconnect();
      } catch {
        /* ignore */
      }
      roomRef.current = null;
    };
  }, []);

  const refreshParticipants = useCallback((lkRoom: LkRoom, speakingIds: string[] = []) => {
    const parseAvatar = (metadata?: string): string | null => {
      try {
        return metadata ? (JSON.parse(metadata)?.avatar ?? null) : null;
      } catch {
        return null;
      }
    };
    const list: Participant[] = [
      {
        identity: lkRoom.localParticipant.identity,
        name: lkRoom.localParticipant.name || 'Vous',
        avatar: null,
        speaking: false,
        isLocal: true,
      },
    ];
    lkRoom.remoteParticipants.forEach((p) => {
      list.push({
        identity: p.identity,
        name: p.name || 'Membre',
        avatar: parseAvatar(p.metadata),
        speaking: speakingIds.includes(p.identity),
        isLocal: false,
      });
    });
    setParticipants(list);
  }, []);

  const join = useCallback(async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    setState('connecting');
    setErrorMsg(null);
    try {
      const tokenRes = await api.get<VoiceTokenResponse>(
        `/api/community/voice/token?room=${encodeURIComponent(room.key)}`
      );
      if (!tokenRes?.configured) {
        setState('unconfigured');
        return;
      }

      // Import dynamique — le SDK n'entre dans le bundle qu'au clic « Rejoindre »
      const lk = await import('livekit-client');
      const lkRoom = new lk.Room({ adaptiveStream: true, dynacast: true }) as unknown as LkRoom;
      roomRef.current = lkRoom;

      lkRoom.on('participantConnected', () => refreshParticipants(lkRoom));
      lkRoom.on('participantDisconnected', () => refreshParticipants(lkRoom));
      lkRoom.on('activeSpeakersChanged', (...args: unknown[]) => {
        const speakers = (args[0] as { identity?: string }[] | undefined) ?? [];
        refreshParticipants(lkRoom, speakers.map((s) => s.identity ?? ''));
      });
      lkRoom.on('disconnected', () => {
        if (mountedRef.current) {
          setState('idle');
          setParticipants([]);
        }
        roomRef.current = null;
      });

      await lkRoom.connect(tokenRes.url!, tokenRes.token!);
      await lkRoom.setMicrophoneEnabled(true);
      setMicOn(true);
      refreshParticipants(lkRoom);
      if (mountedRef.current) setState('connected');
    } catch (error) {
      console.error('[VoiceChannelPanel] LiveKit connection failed:', error);
      if (mountedRef.current) {
        setState('error');
        setErrorMsg(
          error instanceof Error && /token|401|403/i.test(error.message)
            ? 'Jeton vocal refusé — vérifiez la clé API LiveKit.'
            : 'Connexion au salon vocal impossible. Réessayez dans un instant.'
        );
      }
    }
  }, [user, room.key, router, refreshParticipants]);

  const leave = useCallback(() => {
    try {
      roomRef.current?.disconnect();
    } catch {
      /* ignore */
    }
    roomRef.current = null;
    setState('idle');
    setParticipants([]);
  }, []);

  const toggleMic = useCallback(async () => {
    const lkRoom = roomRef.current;
    if (!lkRoom) return;
    try {
      await lkRoom.setMicrophoneEnabled(!micOn);
      setMicOn(!micOn);
    } catch {
      setErrorMsg('Impossible de basculer le micro.');
    }
  }, [micOn]);

  /* ── État : non configuré ── */
  if (state === 'unconfigured') {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-accent-yellow/25 bg-accent-yellow/5 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent-yellow/15 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-accent-yellow" />
            </div>
            <h3 className="text-white text-base font-bold">Salons vocaux — configuration requise</h3>
          </div>
          <p className="text-white/60 text-sm leading-relaxed mb-4">
            Le moteur vocal (LiveKit) est intégré mais pas encore activé sur ce déploiement.
            Ajoutez les trois variables d&apos;environnement ci-dessous dans Vercel
            (Settings → Environment Variables), puis redéployez :
          </p>
          <ul className="space-y-1.5 font-mono text-xs text-white/70 mb-4">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent-yellow" /> LIVEKIT_URL</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent-yellow" /> LIVEKIT_API_KEY</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent-yellow" /> LIVEKIT_API_SECRET</li>
          </ul>
          <p className="text-white/40 text-xs leading-relaxed">
            Vos clés LiveKit / Agora / Daily sont utilisables : LiveKit est le moteur actif des
            salons vocaux de la Communauté. L&apos;état de configuration de chaque provider est
            visible dans le back-office → Paramètres → Temps réel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 h-full flex flex-col">
      {/* ── En-tête du salon vocal ── */}
      <div className="flex items-center gap-3 px-5 py-4 rounded-t-2xl bg-[#0D1B38] border border-white/10 border-b-0">
        <div className="w-10 h-10 rounded-xl bg-primary-green/15 flex items-center justify-center shrink-0">
          <Volume2 className="w-5 h-5 text-primary-green" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white text-sm font-bold truncate">🔊 {room.label}</p>
          <p className="text-white/40 text-[11px] truncate">{room.desc}</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold shrink-0">
          {state === 'connected' && (
            <span className="flex items-center gap-1 text-green-400"><Signal className="w-3.5 h-3.5" /> Connecté</span>
          )}
          {state === 'connecting' && (
            <span className="flex items-center gap-1 text-white/50"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Connexion…</span>
          )}
          {state === 'idle' && <span className="text-white/40">Inactif</span>}
          {state === 'error' && <span className="text-red-400">Erreur</span>}
        </div>
      </div>

      {/* ── Zone principale ── */}
      <div className="flex-1 min-h-0 rounded-b-2xl bg-[#0D1B38] border border-white/10 border-t-0 p-5 flex flex-col">
        {errorMsg && (
          <p className="mb-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{errorMsg}</p>
        )}

        {/* Participants */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-3 flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Participants — {participants.length}
          </p>

          {state !== 'connected' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <Volume2 className="w-7 h-7 text-white/25" />
              </div>
              <p className="text-white/70 text-sm font-semibold mb-1">Rejoignez la conversation vocale</p>
              <p className="text-white/35 text-xs mb-5 max-w-sm mx-auto">
                Discutez en direct avec les membres de la communauté — micro coupé en arrivant
                possible, aucun enregistrement.
              </p>
              <button
                onClick={join}
                disabled={state === 'connecting'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-green text-white text-sm font-bold hover:bg-primary-deep transition-colors disabled:opacity-50"
              >
                {state === 'connecting' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                Rejoindre le salon vocal
              </button>
            </div>
          )}

          {state === 'connected' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {participants.map((p) => (
                <div
                  key={p.identity}
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                    p.speaking
                      ? 'border-accent-yellow/60 bg-accent-yellow/10 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                      : 'border-white/10 bg-white/5'
                  )}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10">
                      <ImageWithFallback src={p.avatar || ''} alt={p.name} className="w-full h-full object-cover" fallbackType="avatar" fill />
                    </div>
                    {!micOn && p.isLocal && (
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-[#0D1B38] flex items-center justify-center">
                        <MicOff className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                  </div>
                  <p className="text-white text-xs font-semibold truncate max-w-full">
                    {p.name} {p.isLocal && <span className="text-white/40 font-normal">(vous)</span>}
                  </p>
                  {p.speaking && <span className="text-[9px] text-accent-yellow font-bold uppercase tracking-wide">parle…</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contrôles */}
        {state === 'connected' && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-3">
            <button
              onClick={toggleMic}
              className={cn(
                'inline-flex items-center justify-center w-11 h-11 rounded-full text-sm font-bold transition-colors',
                micOn
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-red-500/90 text-white hover:bg-red-500'
              )}
              title={micOn ? 'Couper le micro' : 'Activer le micro'}
              aria-label={micOn ? 'Couper le micro' : 'Activer le micro'}
            >
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button
              onClick={leave}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-red-500/90 text-white hover:bg-red-500 transition-colors"
              title="Quitter le salon vocal"
              aria-label="Quitter le salon vocal"
            >
              <PhoneOff className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
