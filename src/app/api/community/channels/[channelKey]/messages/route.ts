import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

/**
 * GET /api/community/channels/[channelKey]/messages
 *
 * Messages temps réel du canal (chat Discord-like).
 *   - sans `after`  : les N derniers messages (ordre chronologique)
 *   - avec `after`  : uniquement les messages postérieurs à l'horodatage ISO
 *                     (synchro incrémentale pour le polling temps réel)
 *
 * Lecture publique (le forum est navigable sans compte — CDC §5.7).
 * Filtre pays optionnel : `?country=BJ`.
 */

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;
const MAX_CONTENT_LENGTH = 2000;

// Clés de canal autorisées : canaux du forum + groupes privés (group:<cuid>)
const CHANNEL_KEY_RE = /^[a-z0-9_:-]{0,40}$/;

function normalizeChannelKey(raw: string): string {
  // Le canal « accueil » utilise la clé 'accueil' (jamais vide côté API —
  // une segment d'URL vide n'existe pas).
  const key = decodeURIComponent(raw).trim().toLowerCase();
  if (!key || key === 'accueil' || key === 'all') return 'accueil';
  return key;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ channelKey: string }> }
) {
  try {
    const { channelKey: rawKey } = await params;
    const channelKey = normalizeChannelKey(rawKey);
    if (!CHANNEL_KEY_RE.test(channelKey)) {
      return NextResponse.json({ error: 'Invalid channel key' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const after = searchParams.get('after');
    const country = searchParams.get('country');
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, 1),
      MAX_LIMIT
    );

    const where: Record<string, unknown> = { channelKey };
    if (country) where.country = country;

    let afterDate: Date | null = null;
    if (after) {
      afterDate = new Date(after);
      if (Number.isNaN(afterDate.getTime())) {
        return NextResponse.json({ error: 'Invalid `after` date' }, { status: 400 });
      }
      where.createdAt = { gt: afterDate };
    }

    // Incremental sync: ASC directly. Initial load: DESC limit N puis inversé.
    const messages = await db.channelMessage.findMany({
      where,
      orderBy: afterDate ? { createdAt: 'asc' } : { createdAt: 'desc' },
      take: afterDate ? MAX_LIMIT : limit,
      include: {
        author: { select: { id: true, name: true, avatar: true, reputation: true } },
      },
    });

    return NextResponse.json({
      channelKey,
      incremental: !!afterDate,
      messages: afterDate ? messages : [...messages].reverse(),
    });
  } catch (error) {
    console.error('Channel messages GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

/**
 * POST /api/community/channels/[channelKey]/messages
 *
 * Envoi d'un message dans le canal. Authentification requise (le chat
 * est réservé aux membres — les visiteurs publics restent en lecture).
 * Anti-spam basique : contenu 1–2000 caractères + 1 message / 750 ms par
 * auteur (déni applicatif simple, le throttler global couvre le reste).
 */
const lastPostAt = new Map<string, number>();
const THROTTLE_MS = 750;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ channelKey: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { channelKey: rawKey } = await params;
    const channelKey = normalizeChannelKey(rawKey);
    if (!CHANNEL_KEY_RE.test(channelKey)) {
      return NextResponse.json({ error: 'Invalid channel key' }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!content) {
      return NextResponse.json({ error: 'Message vide' }, { status: 400 });
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `Message trop long (${content.length}/${MAX_CONTENT_LENGTH} caractères)` },
        { status: 400 }
      );
    }

    // Throttle applicatif (best-effort — par instance serverless)
    const now = Date.now();
    const prev = lastPostAt.get(auth.userId) ?? 0;
    if (now - prev < THROTTLE_MS) {
      return NextResponse.json({ error: 'Trop rapide — patientez un instant' }, { status: 429 });
    }
    lastPostAt.set(auth.userId, now);
    if (lastPostAt.size > 5000) lastPostAt.clear();

    const message = await db.channelMessage.create({
      data: {
        channelKey,
        authorId: auth.userId,
        content,
        country: typeof body?.country === 'string' ? body.country : null,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true, reputation: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error('Channel message POST error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
