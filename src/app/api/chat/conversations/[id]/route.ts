import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, isOnline: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // User must be a participant to view the conversation
    const isParticipant = conversation.participants.some(
      (p) => p.userId === auth.userId
    );
    if (!isParticipant && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not a participant' }, { status: 403 });
    }

    return NextResponse.json({ data: conversation });
  } catch (error) {
    console.error('Conversation detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.conversation.findUnique({
      where: { id },
      include: { participants: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // User must be a participant to archive/close
    const isParticipant = existing.participants.some(
      (p) => p.userId === auth.userId
    );
    if (!isParticipant && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not a participant' }, { status: 403 });
    }

    const updated = await db.conversation.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.metadata !== undefined && { metadata: JSON.stringify(body.metadata) }),
      },
    });

    // Update lastReadAt for the current user if requested
    if (body.markRead) {
      await db.conversationParticipant.updateMany({
        where: { conversationId: id, userId: auth.userId },
        data: { lastReadAt: new Date() },
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Conversation update error:', error);
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
  }
}
