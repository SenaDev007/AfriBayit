import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';

/**
 * GET /api/admin/realtime/status — état de configuration des providers
 * temps réel / communications (section Temps réel du back-office).
 *
 * Vérifie la PRÉSENCE des variables (jamais leur valeur — aucun secret ne
 * sort de cette route) :
 *   - livekit : LIVEKIT_URL + LIVEKIT_API_KEY + LIVEKIT_API_SECRET
 *   - agora   : AGORA_APP_ID + AGORA_APP_CERTIFICATE
 *   - daily   : DAILY_API_KEY
 *   - pusher  : NEXT_PUBLIC_PUSHER_KEY (couche texte existante)
 *   - ws      : NEXT_PUBLIC_REALTIME_WS (WebSocket backend NestJS)
 */

function has(...vars: string[]): boolean {
  return vars.every((v) => !!process.env[v] && process.env[v]!.trim().length > 0);
}

export async function GET() {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const providers = {
      livekit: {
        configured: has('LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'),
        label: 'LiveKit — salons vocaux/vidéo Communauté',
        envVars: ['LIVEKIT_URL', 'LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET'],
        activeUse: 'Salons vocaux du workspace Communauté (join/leave, micro, participants)',
      },
      agora: {
        configured: has('AGORA_APP_ID', 'AGORA_APP_CERTIFICATE'),
        label: 'Agora — RTC de secours / visioconférence 1:1',
        envVars: ['AGORA_APP_ID', 'AGORA_APP_CERTIFICATE'],
        activeUse: 'Réservé — bascule possible si LiveKit indisponible',
      },
      daily: {
        configured: has('DAILY_API_KEY'),
        label: 'Daily.co — visioconférences payantes',
        envVars: ['DAILY_API_KEY'],
        activeUse: 'Réservé — consultations notaires / visites guidées à distance',
      },
      pusher: {
        configured: has('NEXT_PUBLIC_PUSHER_KEY'),
        label: 'Pusher — notifications push (couche texte)',
        envVars: ['NEXT_PUBLIC_PUSHER_KEY', 'NEXT_PUBLIC_PUSHER_CLUSTER', 'PUSHER_SECRET'],
        activeUse: 'Notifications + présence (optionnel — le polling incrémental assure déjà le temps réel)',
      },
      websocket: {
        configured: has('NEXT_PUBLIC_REALTIME_WS'),
        label: 'WebSocket API NestJS (afribayit-api)',
        envVars: ['NEXT_PUBLIC_REALTIME_WS'],
        activeUse: 'Bascule Socket.IO quand l\'API dédiée est déployée (Railway/Fly)',
      },
    };

    return NextResponse.json({
      providers,
      chatTransport: 'Polling incrémental (2,5 s) — actif par défaut, sans configuration',
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Realtime status error:', error);
    return NextResponse.json({ error: 'Failed to read realtime status' }, { status: 500 });
  }
}
