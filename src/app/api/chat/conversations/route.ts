import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    // Users can only see their own conversations
    const conversations = await db.conversation.findMany({
      where: {
        participants: { some: { userId: auth.userId } },
        status: 'active',
      },
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

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Chat conversations API error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    // Ensure the authenticated user is included as a participant
    const participantIds = (body.participantIds as string[] || []);
    if (!participantIds.includes(auth.userId)) {
      participantIds.push(auth.userId);
    }

    const conversation = await db.conversation.create({
      data: {
        type: body.type || 'user_to_user',
        status: 'active',
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        participants: {
          create: participantIds.map((userId: string) => ({
            userId,
            role: userId === auth.userId ? 'participant' : 'participant',
          })),
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, isOnline: true },
            },
          },
        },
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error('Conversation creation error:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
