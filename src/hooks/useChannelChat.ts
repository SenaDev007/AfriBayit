'use client';

/**
 * useChannelChat — couche temps réel Discord-like des canaux Communauté.
 *
 * Transport : polling incrémental (2,5 s) sur
 *   GET /api/community/channels/<key>/messages?after=<dernier horodatage>
 * qui ne renvoie QUE les nouveaux messages — bande passante minimale,
 * latence perçue quasi-WebSocket, et 100 % compatible Vercel serverless
 * (aucune connexion persistante requise).
 *
 *   + envoi optimiste (le message apparaît instantanément, remplacé par
 *     la version serveur à la confirmation) ;
 *   + overview globale (5 s) : compteurs + dernier message de chaque canal
 *     → pastilles non-lu + notifications toast inter-canaux ;
 *   + lastRead par canal en localStorage (survit au rechargement).
 *
 * Évolution : si NEXT_PUBLIC_PUSHER_KEY ou NEXT_PUBLIC_REALTIME_WS est
 * configuré plus tard, ce hook reste la source de vérité — seul le
 * transport d'invalidation change (invalidateQueries sur événement push).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api, apiPost } from '@/lib/api-client';

// ─── Types ────────────────────────────────────────────────────────────────

export interface ChannelChatMessage {
  id: string;
  channelKey: string;
  content: string;
  country?: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    avatar: string | null;
    reputation: number | null;
  };
}

export interface ChannelOverviewEntry {
  count: number;
  lastMessageAt: string | null;
  lastPreview: string | null;
  lastAuthorName: string | null;
}

const POLL_MS = 2500;
const OVERVIEW_POLL_MS = 5000;
const LASTREAD_PREFIX = 'afribayit:lastread:';

function canonicalKey(key: string): string {
  const k = (key || '').trim().toLowerCase();
  return !k || k === 'all' ? 'accueil' : k;
}

// ─── Hook principal : messages d'un canal ─────────────────────────────────

export function useChannelChat(channelKey: string) {
  const key = canonicalKey(channelKey);
  const queryClient = useQueryClient();

  // Chargement initial (50 derniers) + rafraîchissement lent de sécurité
  const base = useQuery({
    queryKey: ['channel-messages', key],
    queryFn: async (): Promise<ChannelChatMessage[]> => {
      const res = await api.get<{ messages: ChannelChatMessage[] }>(
        `/api/community/channels/${encodeURIComponent(key)}/messages?limit=50`
      );
      return res?.messages ?? [];
    },
    staleTime: POLL_MS,
    refetchInterval: 30_000, // filet de sécurité (le curseur fait le travail)
    placeholderData: keepPreviousData,
  });

  const messages = useMemo(() => base.data ?? [], [base.data]);

  // Curseur incrémental : ne récupère que les messages > dernier connu
  const lastAt = messages.length > 0 ? messages[messages.length - 1].createdAt : null;
  const cursor = lastAt ?? new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const incremental = useQuery({
    queryKey: ['channel-messages-inc', key, cursor],
    queryFn: async (): Promise<ChannelChatMessage[]> => {
      const res = await api.get<{ messages: ChannelChatMessage[] }>(
        `/api/community/channels/${encodeURIComponent(key)}/messages?after=${encodeURIComponent(cursor)}`
      );
      return res?.messages ?? [];
    },
    refetchInterval: POLL_MS,
    // Évite la fenêtre vide pendant le premier fetch incrémental
    placeholderData: [] as ChannelChatMessage[],
  });

  // Fusion : base + nouveaux messages (dédupliqués par id)
  const liveMessages = useMemo(() => {
    if (!incremental.data || incremental.data.length === 0) return messages;
    const seen = new Set(messages.map((m) => m.id));
    const fresh = incremental.data.filter((m) => !seen.has(m.id));
    return fresh.length > 0 ? [...messages, ...fresh] : messages;
  }, [messages, incremental.data]);

  // Marque le canal comme lu à chaque affichage
  useEffect(() => {
    try {
      localStorage.setItem(`${LASTREAD_PREFIX}${key}`, new Date().toISOString());
    } catch {
      /* localStorage indisponible (mode privé) — sans conséquence */
    }
  }, [key]);

  // Envoi optimiste
  const [optimistic, setOptimistic] = useState<ChannelChatMessage[]>([]);
  useEffect(() => {
    // Purge les optimistes confirmés par le serveur
    setOptimistic((prev) => prev.filter((o) => !liveMessages.some((m) => m.id === o.id)));
  }, [liveMessages]);

  const sendMessage = useCallback(
    async (content: string, author: { id: string; name?: string | null; avatar?: string | null }) => {
      const trimmed = content.trim();
      if (!trimmed) return { ok: false, error: 'Message vide' };

      const temp: ChannelChatMessage = {
        id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        channelKey: key,
        content: trimmed,
        createdAt: new Date().toISOString(),
        author: {
          id: author.id,
          name: author.name ?? 'Vous',
          avatar: author.avatar ?? null,
          reputation: null,
        },
      };
      setOptimistic((prev) => [...prev, temp]);

      try {
        const res = await apiPost<{ message: ChannelChatMessage }>(
          `/api/community/channels/${encodeURIComponent(key)}/messages`,
          { content: trimmed }
        );
        // Invalide pour que base/incorporation reprennent la vérité serveur
        queryClient.invalidateQueries({ queryKey: ['channel-messages', key] });
        setOptimistic((prev) => prev.filter((o) => o.id !== temp.id));
        return { ok: true, message: res?.message };
      } catch (error) {
        setOptimistic((prev) => prev.filter((o) => o.id !== temp.id));
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Échec de l\'envoi',
        };
      }
    },
    [key, queryClient]
  );

  const allMessages = useMemo(() => [...liveMessages, ...optimistic], [liveMessages, optimistic]);

  return {
    channelKey: key,
    messages: allMessages,
    isLoading: base.isPending && allMessages.length === 0,
    sendMessage,
    connectedSince: base.dataUpdatedAt,
  };
}

// ─── Overview globale : non-lus + notifications inter-canaux ───────────────

export function useChannelsOverview(options: { onNewMessage?: (channelKey: string, entry: ChannelOverviewEntry) => void } = {}) {
  const { onNewMessage } = options;
  const onNewMessageRef = useRef(onNewMessage);
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  const prevOverviewRef = useRef<Record<string, ChannelOverviewEntry> | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  const query = useQuery({
    queryKey: ['channel-overview'],
    queryFn: async (): Promise<Record<string, ChannelOverviewEntry>> => {
      const res = await api.get<{ channels: Record<string, ChannelOverviewEntry> }>(
        '/api/community/channels/overview'
      );
      return res?.channels ?? {};
    },
    refetchInterval: OVERVIEW_POLL_MS,
  });

  // Détection de nouveaux messages par canal (notification toast côté UI)
  useEffect(() => {
    const current = query.data;
    if (!current) return;
    const prev = prevOverviewRef.current;
    if (prev) {
      for (const [channelKey, entry] of Object.entries(current)) {
        const before = prev[channelKey];
        const changed =
          !before ||
          (entry.lastMessageAt && before.lastMessageAt !== entry.lastMessageAt);
        if (changed && entry.lastMessageAt) {
          const dedupKey = `${channelKey}:${entry.lastMessageAt}`;
          if (!notifiedRef.current.has(dedupKey)) {
            notifiedRef.current.add(dedupKey);
            onNewMessageRef.current?.(channelKey, entry);
          }
        }
      }
    }
    prevOverviewRef.current = current;
  }, [query.data]);

  // Non-lus : lastMessageAt > lastRead local
  const [unread, setUnread] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!query.data) return;
    const result: Record<string, boolean> = {};
    for (const [channelKey, entry] of Object.entries(query.data)) {
      if (!entry.lastMessageAt) continue;
      let lastRead = 0;
      try {
        lastRead = Date.parse(localStorage.getItem(`${LASTREAD_PREFIX}${canonicalKey(channelKey)}`) || '');
      } catch {
        /* ignore */
      }
      if (Number.isNaN(lastRead)) lastRead = 0;
      result[canonicalKey(channelKey)] = Date.parse(entry.lastMessageAt) > lastRead;
    }
    setUnread(result);
  }, [query.data]);

  return {
    overview: query.data ?? {},
    unread,
    totalMessages: Object.values(query.data ?? {}).reduce((s, c) => s + (c?.count ?? 0), 0),
  };
}

// ─── Utilitaires exportés ─────────────────────────────────────────────────

export function getChannelLastRead(channelKey: string): number {
  try {
    return Date.parse(localStorage.getItem(`${LASTREAD_PREFIX}${canonicalKey(channelKey)}`) || '') || 0;
  } catch {
    return 0;
  }
}

export function markChannelRead(channelKey: string): void {
  try {
    localStorage.setItem(`${LASTREAD_PREFIX}${canonicalKey(channelKey)}`, new Date().toISOString());
  } catch {
    /* ignore */
  }
}
