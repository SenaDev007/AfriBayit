import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/community/channels/overview
 *
 * Vue d'ensemble temps réel de tous les canaux de chat :
 *   { channels: { [channelKey]: { count, lastMessageAt, lastPreview,
 *                                 lastAuthorName } } }
 *
 * Consommé par la sidebar du workspace Communauté pour :
 *   - les pastilles « non-lu » par canal (vs lastRead local)
 *   - les notifications toast quand un message arrive sur un autre canal
 *   - l'actualisation des compteurs de messages en direct
 *
 * Lecture publique — aucune donnée personnelle au-delà du pseudo de
 * l'auteur du dernier message.
 */

const OVERVIEW_CACHE_MS = 2000; // cache mémoire par instance serverless
let cache: { at: number; data: Record<string, unknown> } | null = null;

export async function GET() {
  try {
    if (cache && Date.now() - cache.at < OVERVIEW_CACHE_MS) {
      return NextResponse.json({ ...cache.data, cached: true });
    }

    const [grouped, lasts] = await Promise.all([
      db.channelMessage.groupBy({
        by: ['channelKey'],
        _count: { _all: true },
      }),
      db.channelMessage.findMany({
        distinct: ['channelKey'],
        orderBy: { createdAt: 'desc' },
        select: {
          channelKey: true,
          content: true,
          createdAt: true,
          author: { select: { name: true } },
        },
      }),
    ]);

    const channels: Record<string, {
      count: number;
      lastMessageAt: string | null;
      lastPreview: string | null;
      lastAuthorName: string | null;
    }> = {};

    for (const g of grouped) {
      channels[g.channelKey] = {
        count: g._count._all,
        lastMessageAt: null,
        lastPreview: null,
        lastAuthorName: null,
      };
    }
    for (const m of lasts) {
      const entry = channels[m.channelKey] ?? {
        count: 0,
        lastMessageAt: null,
        lastPreview: null,
        lastAuthorName: null,
      };
      entry.lastMessageAt = m.createdAt.toISOString();
      entry.lastPreview = m.content.length > 80 ? `${m.content.slice(0, 80)}…` : m.content;
      entry.lastAuthorName = m.author?.name ?? 'Membre';
      channels[m.channelKey] = entry;
    }

    const data = { channels, totalMessages: Object.values(channels).reduce((s, c) => s + c.count, 0) };
    cache = { at: Date.now(), data };
    return NextResponse.json(data);
  } catch (error) {
    console.error('Channels overview error:', error);
    return NextResponse.json({ error: 'Failed to build overview' }, { status: 500 });
  }
}
