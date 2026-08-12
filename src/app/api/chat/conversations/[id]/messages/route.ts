import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

const REBECCA_SYSTEM_PROMPT = `You are Rebecca, the AI assistant for AfriBayit — Africa's premier real estate platform. You help users find properties, understand the buying process in West Africa, navigate escrow transactions, and connect with certified agents, notaries, and geometers. You are professional, warm, and knowledgeable about African real estate law (OHADA, Code Foncier). You speak French primarily but can switch to English or local languages. Never give binding legal advice — always recommend consulting a certified notary.`;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    // Verify user is a participant in the conversation
    const participant = await db.conversationParticipant.findFirst({
      where: { conversationId: id, userId: auth.userId },
    });

    if (!participant && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const [messages, total] = await Promise.all([
      db.chatMessage.findMany({
        where: { conversationId: id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, name: true, avatar: true },
          },
        },
      }),
      db.chatMessage.count({ where: { conversationId: id } }),
    ]);

    return NextResponse.json({
      messages: messages.reverse(),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Chat messages API error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    // Verify user is a participant in the conversation
    const participant = await db.conversationParticipant.findFirst({
      where: { conversationId: id, userId: auth.userId },
    });

    if (!participant && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { content, messageType } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'content est requis' },
        { status: 400 }
      );
    }

    // Save user message — use auth.userId instead of body.senderId
    const message = await db.chatMessage.create({
      data: {
        conversationId: id,
        senderId: auth.userId,
        content,
        messageType: messageType || 'text',
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    // Update conversation updatedAt
    await db.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Check if this is a Rebecca conversation - generate AI response
    const conversation = await db.conversation.findUnique({
      where: { id },
    });

    if (conversation?.type === 'rebecca') {
      try {
        // Fetch recent messages for context
        const recentMessages = await db.chatMessage.findMany({
          where: { conversationId: id },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            sender: {
              select: { id: true, name: true },
            },
          },
        });

        // Build conversation history for AI
        const chatHistory = recentMessages
          .reverse()
          .map((msg) => ({
            role: msg.senderId === auth.userId ? 'user' as const : 'assistant' as const,
            content: msg.content,
          }));

        // Use z-ai-web-dev-sdk for AI response
        const ZAI = (await import('z-ai-web-dev-sdk')).default;
        const zai = await ZAI.create();

        const aiResponse = await zai.chat.completions.create({
          model: 'glm-4-flash',
          messages: [
            { role: 'system', content: REBECCA_SYSTEM_PROMPT },
            ...chatHistory,
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        const aiContent = aiResponse.choices?.[0]?.message?.content || 
          'Je suis Rebecca, votre assistante AfriBayit. Comment puis-je vous aider avec votre projet immobilier ?';

        // Find or create Rebecca system user
        let rebeccaUser = await db.user.findFirst({
          where: { email: 'rebecca@afribayit.com' },
        });

        if (!rebeccaUser) {
          rebeccaUser = await db.user.create({
            data: {
              email: 'rebecca@afribayit.com',
              name: 'Rebecca IA',
              role: 'admin',
              verified: true,
            },
          });
        }

        // Save Rebecca's response
        const rebeccaMessage = await db.chatMessage.create({
          data: {
            conversationId: id,
            senderId: rebeccaUser.id,
            content: aiContent,
            messageType: 'text',
            metadata: JSON.stringify({ aiGenerated: true, model: 'rebecca-ia' }),
          },
          include: {
            sender: {
              select: { id: true, name: true, avatar: true },
            },
          },
        });

        // Return both messages
        return NextResponse.json({
          userMessage: message,
          rebeccaMessage,
        }, { status: 201 });
      } catch (aiError) {
        console.error('Rebecca AI error:', aiError);
        // Return just the user message if AI fails
        return NextResponse.json(message, { status: 201 });
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Chat message creation error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
