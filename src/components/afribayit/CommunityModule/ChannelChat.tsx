'use client';

/**
 * ChannelChat — flux de messages temps réel d'un canal (Discord-like).
 *
 * - Rendu façon Discord : groupe de messages consécutifs du même auteur
 *   (avatar une seule fois, horodatage discret), séparateur de jour.
 * - Composer réel : input multi-ligne + envoi Entrée (Maj+Entrée = saut de
 *   ligne), envoi optimiste (le message apparaît instantanément).
 * - Indicateur « temps réel » : pastille verte + synthèse de l'état.
 *
 * Transport : useChannelChat (polling incrémental 2,5 s — voir le hook).
 */

import { useEffect, useRef, useState } from 'react';
import { Send, Wifi, Loader2 } from 'lucide-react';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { useChannelChat, type ChannelChatMessage } from '@/hooks/useChannelChat';
import { useAuthStore } from '@/stores/authStore';
import { timeAgo } from '@/lib/afribayit-utils';

const MAX_LENGTH = 2000;

interface ChannelChatProps {
  channelKey: string;
  channelLabel: string;
  /** Canal en cours de visualisation → n'est pas notifié par toast */
  onMessageSent?: () => void;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function sameMinute(a: string, b: string): boolean {
  return Math.abs(Date.parse(a) - Date.parse(b)) < 60_000;
}

export default function ChannelChat({ channelKey, channelLabel, onMessageSent }: ChannelChatProps) {
  const { messages, isLoading, sendMessage } = useChannelChat(channelKey);
  const { user } = useAuthStore();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  // Auto-scroll si l'utilisateur est déjà en bas (comme Discord)
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const submit = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    if (!user) {
      setError('Connectez-vous pour participer au chat.');
      return;
    }
    setSending(true);
    setError(null);
    const res = await sendMessage(content, { id: user.id, name: (user as { name?: string }).name, avatar: (user as { avatar?: string }).avatar });
    if (res.ok) {
      setDraft('');
      stickToBottomRef.current = true;
      onMessageSent?.();
    } else {
      setError(res.error || 'Échec de l\'envoi');
    }
    setSending(false);
  };

  const isLoggedIn = !!user;
  const shown = messages.slice(-100); // fenêtre de rendu
  let prev: ChannelChatMessage | null = null;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Flux de messages ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-0.5"
        aria-label={`Messages du canal ${channelLabel}`}
      >
        {isLoading && (
          <div className="py-10 text-center">
            <Loader2 className="w-6 h-6 text-white/20 mx-auto mb-2 animate-spin" />
            <p className="text-xs text-white/40">Chargement des messages…</p>
          </div>
        )}

        {!isLoading && shown.length === 0 && (
          <div className="py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
              <Wifi className="w-5 h-5 text-primary-green/70" />
            </div>
            <p className="text-white/70 text-sm font-semibold">Canal silencieux</p>
            <p className="text-xs text-white/35 mt-1">
              Envoyez le premier message — tout le monde le verra en temps réel.
            </p>
          </div>
        )}

        {shown.map((m) => {
          const authorName = m.author?.name || 'Membre';
          const grouped =
            prev !== null &&
            prev.author?.id === m.author?.id &&
            sameMinute(prev.createdAt, m.createdAt) &&
            !prev.id.startsWith('optimistic-') === !m.id.startsWith('optimistic-');
          const showDay = prev === null || !sameMinute(prev.createdAt, m.createdAt) || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
          const isOptimistic = m.id.startsWith('optimistic-');
          const node = (
            <div key={m.id}>
              {showDay && (
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">{dayLabel(m.createdAt)}</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              )}
              <div className={`flex items-start gap-3 group ${grouped ? 'mt-0.5' : 'mt-3'}`}>
                <div className="shrink-0 w-10 flex justify-center">
                  {!grouped && (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10 mt-0.5">
                      <ImageWithFallback src={m.author?.avatar || ''} alt={authorName} className="absolute inset-0 w-full h-full" fallbackType="avatar" fill />
                      {isOptimistic && <span className="absolute inset-0 bg-noir-vert/40 flex items-center justify-center"><Loader2 className="w-4 h-4 text-white/80 animate-spin" /></span>}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {!grouped && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-white text-sm font-bold">{authorName}</span>
                      {m.author?.reputation != null && m.author.reputation > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 text-[9px] font-semibold">{m.author.reputation}</span>
                      )}
                      <span className="text-white/25 text-[10px]">{timeAgo(m.createdAt)}</span>
                      {isOptimistic && <span className="text-[9px] text-white/30 italic">envoi…</span>}
                    </div>
                  )}
                  <p className={`text-[13.5px] leading-relaxed break-words whitespace-pre-wrap ${isOptimistic ? 'text-white/50' : 'text-white/85'}`}>
                    {m.content}
                  </p>
                </div>
              </div>
            </div>
          );
          prev = m;
          return node;
        })}
      </div>

      {/* ── Composer ── */}
      <div className="shrink-0 px-4 sm:px-6 py-3">
        {error && (
          <p className="mb-2 text-[11px] text-red-400 flex items-center gap-1.5">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2 rounded-2xl bg-white/10 border border-white/10 focus-within:border-primary-green/50 transition-colors">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            disabled={!isLoggedIn || sending}
            placeholder={isLoggedIn ? `Message #${channelLabel}…` : 'Connectez-vous pour discuter en temps réel'}
            className="flex-1 bg-transparent text-white text-[13.5px] placeholder:text-white/30 outline-none resize-none px-4 py-3 max-h-32 disabled:cursor-not-allowed"
            style={{ height: Math.min(24 + draft.split('\n').length * 20, 128) }}
            aria-label={`Composer du canal ${channelLabel}`}
          />
          <button
            onClick={submit}
            disabled={!isLoggedIn || !draft.trim() || sending}
            className="m-2 shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-primary-green text-white hover:bg-primary-deep disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Envoyer (Entrée)"
            aria-label="Envoyer le message"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[9px] text-white/25">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Temps réel · Entrée pour envoyer · Maj+Entrée pour un saut de ligne
          </span>
          {draft.length > MAX_LENGTH * 0.8 && (
            <span className={draft.length >= MAX_LENGTH ? 'text-red-400' : ''}>
              {draft.length}/{MAX_LENGTH}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
