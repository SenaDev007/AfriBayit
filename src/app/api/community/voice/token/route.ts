import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { db } from '@/lib/db';
import crypto from 'crypto';

/**
 * GET /api/community/voice/token?room=<key>
 *
 * Jeton d'accès LiveKit pour rejoindre un salon vocal du workspace
 * Communauté (Discord-like). Le jeton est un JWT HS256 signé avec
 * LIVEKIT_API_SECRET — format exact des jetons livekit-server-sdk
 * (grants `video.roomJoin`), ici signé à la main avec le module crypto
 * de Node : zéro dépendance serveur supplémentaire.
 *
 * Variables d'environnement requises (Vercel → Settings → Environment
 * Variables) :
 *   - LIVEKIT_URL          ex. wss://votre-projet.livekit.cloud
 *   - LIVEKIT_API_KEY      clé API LiveKit ( Projects → API keys )
 *   - LIVEKIT_API_SECRET   secret associé
 *
 * Sans ces variables, la route répond 200 { configured: false } — l'UI
 * affiche alors un état « salons vocaux non configurés » au lieu de
 * planter (dégradation professionnelle).
 */

const VOICE_ROOMS: Record<string, string> = {
  general: 'Salon vocal — Général',
  investisseurs: 'Salon vocal — Investisseurs',
  btp: 'Salon vocal — Artisans BTP',
};

const ROOM_KEY_RE = /^[a-z0-9_-]{1,32}$/;
const TOKEN_TTL_SECONDS = 3600; // 1 h — l'utilisateur re-demande s'il reste plus longtemps

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/** JWT HS256 — format LiveKit AccessToken (iss = apiKey, grants.video). */
function signLiveKitJwt(apiKey: string, apiSecret: string, payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(`${header}.${body}`)
    .digest();
  return `${header}.${body}.${base64url(signature)}`;
}

export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const roomKey = (searchParams.get('room') || 'general').toLowerCase();
    if (!ROOM_KEY_RE.test(roomKey)) {
      return NextResponse.json({ error: 'Invalid room key' }, { status: 400 });
    }

    const url = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!url || !apiKey || !apiSecret) {
      // État « non configuré » — pas une erreur : l'UI doit pouvoir afficher
      // un guide de configuration propre au lieu d'un crash.
      return NextResponse.json({
        configured: false,
        room: roomKey,
        hint: 'Ajoutez LIVEKIT_URL, LIVEKIT_API_KEY et LIVEKIT_API_SECRET dans les variables d\'environnement pour activer les salons vocaux.',
      });
    }

    // Identité stable + nom d'affichage (pour la liste des participants)
    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: { name: true, avatar: true },
    });
    const displayName = user?.name || auth.email || 'Membre';
    const identity = auth.userId;

    // Namespace les rooms par déploiement pour éviter les collisions
    const roomName = `afribayit-${roomKey}`;

    const now = Math.floor(Date.now() / 1000);
    const token = signLiveKitJwt(apiKey, apiSecret, {
      iss: apiKey,
      sub: identity,
      jti: crypto.randomUUID(),
      nbf: now - 60,
      exp: now + TOKEN_TTL_SECONDS,
      name: displayName,
      metadata: JSON.stringify({ avatar: user?.avatar ?? null, roomKey }),
      video: {
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
      },
    });

    return NextResponse.json({
      configured: true,
      url,
      token,
      room: roomName,
      roomKey,
      roomLabel: VOICE_ROOMS[roomKey] ?? `Salon vocal — ${roomKey}`,
      identity,
      displayName,
      expiresIn: TOKEN_TTL_SECONDS,
    });
  } catch (error) {
    console.error('LiveKit token error:', error);
    return NextResponse.json({ error: 'Failed to issue voice token' }, { status: 500 });
  }
}
