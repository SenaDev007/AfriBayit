import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

// GET /api/messages — List conversations for current user
export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {
      participants: { some: { userId: auth.userId } },
      status: 'active',
    };

    const conversations = await db.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
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
          take: 1,
        },
      },
    });

    // Calculate unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find((p) => p.userId === auth.userId);
        const lastReadAt = participant?.lastReadAt;

        const unreadCount = await db.chatMessage.count({
          where: {
            conversationId: conv.id,
            senderId: { not: auth.userId },
            isRead: false,
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });

        return {
          ...conv,
          unreadCount,
        };
      })
    );

    // Filter by search if provided
    const filtered = search
      ? conversationsWithUnread.filter((c) => {
          const otherParticipant = c.participants.find((p) => p.userId !== auth.userId);
          return otherParticipant?.user.name?.toLowerCase().includes(search.toLowerCase());
        })
      : conversationsWithUnread;

    return NextResponse.json({ conversations: filtered });
  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/messages — Send a message / create conversation
export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { recipientId, content, messageType, conversationId, metadata } = body as {
      recipientId?: string;
      content: string;
      messageType?: string;
      conversationId?: string;
      metadata?: Record<string, unknown>;
    };

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    let targetConversationId = conversationId;

    // Create conversation if not provided
    if (!targetConversationId && recipientId) {
      // Check if conversation already exists between these users
      const existing = await db.conversation.findFirst({
        where: {
          type: 'user_to_user',
          status: 'active',
          participants: {
            every: {
              userId: { in: [auth.userId, recipientId] },
            },
          },
        },
      });

      if (existing) {
        targetConversationId = existing.id;
      } else {
        const conversation = await db.conversation.create({
          data: {
            type: 'user_to_user',
            status: 'active',
            metadata: metadata ? JSON.stringify(metadata) : null,
            participants: {
              create: [
                { userId: auth.userId, role: 'participant' },
                { userId: recipientId, role: 'participant' },
              ],
            },
          },
        });
        targetConversationId = conversation.id;
      }
    }

    if (!targetConversationId) {
      return NextResponse.json({ error: 'conversationId or recipientId required' }, { status: 400 });
    }

    // Create the message
    const message = await db.chatMessage.create({
      data: {
        conversationId: targetConversationId,
        senderId: auth.userId,
        content: content.trim(),
        messageType: messageType || 'text',
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: targetConversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (error) {
    console.error('Message send error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
