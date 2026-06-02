// AfriBayit — Pusher Authentication Endpoint
// Validates user identity and authorizes private channel access

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPusherServer } from '@/lib/realtime/pusher-server';
import { extractChannelEntity } from '@/lib/realtime/channels';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    if (!userId) {
      return NextResponse.json(
        { error: 'ID utilisateur manquant' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const socketId = body.socket_id as string;
    const channelName = body.channel_name as string;

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: 'socket_id et channel_name requis' },
        { status: 400 }
      );
    }

    // 3. Get Pusher server instance
    const pusher = getPusherServer();
    if (!pusher) {
      return NextResponse.json(
        { error: 'Pusher non configuré' },
        { status: 503 }
      );
    }

    // 4. Authorize based on channel type
    const entity = extractChannelEntity(channelName);
    if (!entity) {
      return NextResponse.json(
        { error: 'Canal non reconnu' },
        { status: 403 }
      );
    }

    const authorized = await authorizeChannelAccess(entity, userId);
    if (!authorized) {
      return NextResponse.json(
        { error: 'Accès non autorisé à ce canal' },
        { status: 403 }
      );
    }

    // 5. Generate auth response
    const authResponse = pusher.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error) {
    console.error('[Pusher Auth] Error:', error);
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    );
  }
}

/**
 * Check if a user is authorized to access a specific channel
 */
async function authorizeChannelAccess(
  entity: { type: string; id: string },
  userId: string
): Promise<boolean> {
  switch (entity.type) {
    case 'user':
      // User can only subscribe to their own notification channel
      return entity.id === userId;

    case 'escrow':
      // User must be buyer or seller in the transaction
      try {
        const transaction = await db.transaction.findFirst({
          where: {
            id: entity.id,
            OR: [
              { buyerId: userId },
              { sellerId: userId },
            ],
          },
          select: { id: true },
        });
        return !!transaction;
      } catch {
        return false;
      }

    case 'chat':
      // User must be a participant in the conversation
      try {
        const conversation = await db.conversation.findFirst({
          where: {
            id: entity.id,
            participants: {
              some: { id: userId },
            },
          },
          select: { id: true },
        });
        return !!conversation;
      } catch {
        // Fallback: allow access if conversation lookup fails (graceful degradation)
        console.warn(`[Pusher Auth] Could not verify chat access for ${entity.id}`);
        return false;
      }

    case 'property':
      // Property channels are readable by anyone (view counts, etc.)
      return true;

    default:
      return false;
  }
}
