// AfriBayit — Rebecca AI Conversation Memory
// Stores and retrieves conversation history for persistent AI conversations

import { db } from '@/lib/db';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  name?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

const MAX_MEMORY_MESSAGES = 20;

/**
 * Get conversation memory for a session — last 20 messages
 */
export async function getConversationMemory(sessionId: string): Promise<ConversationMessage[]> {
  try {
    const messages = await db.chatMessage.findMany({
      where: { conversationId: sessionId },
      orderBy: { createdAt: 'desc' },
      take: MAX_MEMORY_MESSAGES,
    });

    return messages.reverse().map((m) => {
      let metadata: Record<string, unknown> | undefined;
      try {
        metadata = m.metadata ? JSON.parse(m.metadata) : undefined;
      } catch {
        metadata = undefined;
      }

      const isAiGenerated = metadata?.aiGenerated === true;

      return {
        id: m.id,
        role: isAiGenerated ? 'assistant' : 'user',
        content: m.content,
        timestamp: m.createdAt,
        metadata,
      };
    });
  } catch (error) {
    console.error('Error loading conversation memory:', error);
    return [];
  }
}

/**
 * Store a conversation message in DB
 */
export async function storeConversationMemory(
  sessionId: string,
  role: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    // Find or create Rebecca user for AI messages
    let senderId: string | undefined;

    if (role === 'assistant' || role === 'system') {
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
      senderId = rebeccaUser.id;
    }

    // For user messages, we need a userId; use the metadata or a placeholder
    if (role === 'user' && metadata?.userId) {
      senderId = metadata.userId as string;
    }

    if (!senderId) {
      // Fallback: use Rebecca's ID for system messages
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
      senderId = rebeccaUser.id;
    }

    await db.chatMessage.create({
      data: {
        conversationId: sessionId,
        senderId,
        content,
        messageType: role === 'function' ? 'system' : 'text',
        metadata: JSON.stringify({
          ...metadata,
          role,
          source: 'rebecca_chat',
        }),
      },
    });
  } catch (error) {
    console.error('Error storing conversation memory:', error);
    // Don't throw — memory failures shouldn't break the chat
  }
}

/**
 * Build user context string for personalized responses
 */
export async function getUserContext(userId: string): Promise<string> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        professionalProfile: true,
        subscriptions: {
          where: { status: 'active' },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) return '';

    const parts: string[] = [];
    parts.push(`Utilisateur: ${user.name}`);
    if (user.country) parts.push(`Pays: ${user.country}`);
    if (user.city) parts.push(`Ville: ${user.city}`);
    parts.push(`Rôle: ${user.role}`);
    parts.push(`Niveau KYC: ${user.kycLevel}`);
    parts.push(`Langue préférée: ${user.preferredLanguage}`);

    if (user.professionalProfile) {
      parts.push(`Profil pro: ${user.professionalProfile.headline || 'Non défini'}`);
      if (user.professionalProfile.agencyName) {
        parts.push(`Agence: ${user.professionalProfile.agencyName}`);
      }
    }

    if (user.subscriptions.length > 0) {
      parts.push(`Abonnement actif: ${user.subscriptions[0].planType}`);
    }

    // Recent activity
    const recentProperties = await db.property.count({
      where: { agentId: userId, status: 'published' },
    });
    parts.push(`Annonces publiées: ${recentProperties}`);

    const recentTransactions = await db.transaction.count({
      where: { buyerId: userId },
    });
    parts.push(`Transactions: ${recentTransactions}`);

    return parts.join(' | ');
  } catch (error) {
    console.error('Error building user context:', error);
    return '';
  }
}

/**
 * Get or create a Rebecca conversation session for a user
 */
export async function getOrCreateRebeccaSession(userId: string): Promise<string> {
  try {
    // Look for existing active Rebecca conversation
    const existing = await db.conversation.findFirst({
      where: {
        type: 'rebecca',
        status: 'active',
        participants: {
          some: { userId },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (existing) return existing.id;

    // Create new conversation
    const conversation = await db.conversation.create({
      data: {
        type: 'rebecca',
        status: 'active',
        metadata: JSON.stringify({ source: 'rebecca_chat', createdAt: new Date().toISOString() }),
        participants: {
          create: { userId },
        },
      },
    });

    return conversation.id;
  } catch (error) {
    console.error('Error creating Rebecca session:', error);
    // Return a generated ID as fallback
    return `rebecca-session-${Date.now()}`;
  }
}
