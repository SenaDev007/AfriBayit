import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

// GET /api/messages/[conversationId] — Get messages in a conversation
export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Verify user is a participant
    const participant = await db.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: auth.userId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant in this conversation' }, { status: 403 });
    }

    const [messages, total] = await Promise.all([
      db.chatMessage.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          sender: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      db.chatMessage.count({ where: { conversationId } }),
    ]);

    // Mark messages as read
    await db.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: auth.userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Update participant's lastReadAt
    await db.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: auth.userId,
        },
      },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json({
      messages: messages.reverse(),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
