// AfriBayit — Rebecca AI Chat Endpoint
// POST /api/rebecca/chat — Main chat endpoint with RAG + function calling

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processQuery, REBECCA_SYSTEM_PROMPT } from '@/lib/rag';
import { executeRebeccaFunction, REBECCA_FUNCTIONS } from '../functions/route';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  name?: string; // function name if role=function
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, sessionId, userId, country, city } = body as {
      messages: ChatMessage[];
      sessionId?: string;
      userId?: string;
      country?: string;
      city?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages est requis (tableau non vide)' },
        { status: 400 }
      );
    }

    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'Au moins un message utilisateur est requis' },
        { status: 400 }
      );
    }

    // Step 1: Run RAG pipeline to get context-augmented response
    const ragResult = await processQuery(lastUserMessage.content, { country, city, sessionId });

    // Step 2: Build conversation with history for LLM
    const conversationMessages = [
      { role: 'system' as const, content: REBECCA_SYSTEM_PROMPT },
      ...messages.slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Step 3: Call LLM with function calling support
    let aiResponse = ragResult.answer;
    let functionResults: Array<{ name: string; result: unknown }> = [];

    try {
      const { default: ZAI } = await import('z-ai-web-dev-sdk');
      const zai = new ZAI();

      // First LLM call — check if function calling is needed
      const completion = await zai.chat.completions.create({
        model: 'glm-4-flash',
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 800,
      });

      const responseContent = completion.choices?.[0]?.message?.content || '';

      // Simple keyword-based function detection since z-ai may not support native function calling
      const detectedFunction = detectFunctionCall(lastUserMessage.content);

      if (detectedFunction) {
        // Execute the function
        const fnResult = await executeRebeccaFunction(detectedFunction.name, detectedFunction.args, userId);
        functionResults.push({ name: detectedFunction.name, result: fnResult });

        // Second LLM call with function results
        const augmentedMessages = [
          ...conversationMessages,
          { role: 'assistant' as const, content: responseContent },
          {
            role: 'function' as const,
            content: JSON.stringify(fnResult),
            name: detectedFunction.name,
          },
        ];

        const secondCompletion = await zai.chat.completions.create({
          model: 'glm-4-flash',
          messages: augmentedMessages as Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
          temperature: 0.7,
          max_tokens: 800,
        });

        aiResponse = secondCompletion.choices?.[0]?.message?.content || responseContent;
      } else {
        // Use RAG-augmented response if no function call detected
        aiResponse = ragResult.contextUsed ? ragResult.answer : responseContent;
      }
    } catch (llmError) {
      console.error('Rebecca LLM error:', llmError);
      // Fallback to RAG response
      aiResponse = ragResult.answer;
    }

    // Step 4: Save conversation to DB if sessionId provided
    if (sessionId && userId) {
      try {
        // Find or create Rebecca user
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

        // Save user message
        await db.chatMessage.create({
          data: {
            conversationId: sessionId,
            senderId: userId,
            content: lastUserMessage.content,
            messageType: 'text',
            metadata: JSON.stringify({ source: 'rebecca_chat' }),
          },
        });

        // Save Rebecca's response
        await db.chatMessage.create({
          data: {
            conversationId: sessionId,
            senderId: rebeccaUser.id,
            content: aiResponse,
            messageType: 'text',
            metadata: JSON.stringify({
              aiGenerated: true,
              model: 'rebecca-ia',
              sources: ragResult.sources.map((s) => s.source),
              functionsCalled: functionResults.map((f) => f.name),
              contextUsed: ragResult.contextUsed,
            }),
          },
        });

        // Update conversation
        await db.conversation.update({
          where: { id: sessionId },
          data: { updatedAt: new Date() },
        });
      } catch (dbError) {
        console.error('Rebecca DB save error:', dbError);
        // Don't fail the request if DB save fails
      }
    }

    // Step 5: Return response
    return NextResponse.json({
      message: aiResponse,
      sources: ragResult.sources.map((s) => ({
        type: s.sourceType,
        source: s.source,
        score: s.score,
      })),
      functionsCalled: functionResults.map((f) => f.name),
      contextUsed: ragResult.contextUsed,
      sessionId,
    });
  } catch (error) {
    console.error('Rebecca chat API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de votre demande' },
      { status: 500 }
    );
  }
}

/**
 * Simple keyword-based function call detection
 * Detects intent from user message to trigger specific Rebecca functions
 */
function detectFunctionCall(message: string): { name: string; args: Record<string, unknown> } | null {
  const lower = message.toLowerCase();

  // Property search
  if (
    lower.includes('recherch') || lower.includes('cherche') ||
    lower.includes('bien') || lower.includes('maison') ||
    lower.includes('appartement') || lower.includes('villa') ||
    lower.includes('terrain') || lower.includes('louer') ||
    lower.includes('acheter') || lower.includes('investir')
  ) {
    return {
      name: 'search_properties',
      args: extractPropertyParams(lower),
    };
  }

  // Escrow check
  if (
    lower.includes('escrow') || lower.includes('transaction') ||
    lower.includes('suivi') || lower.includes('statut') ||
    lower.includes('paiement')
  ) {
    return {
      name: 'check_escrow',
      args: {},
    };
  }

  // Market stats
  if (
    lower.includes('marché') || lower.includes('prix du marché') ||
    lower.includes('statistique') || lower.includes('tendance') ||
    lower.includes('estim') || lower.includes('valeur')
  ) {
    return {
      name: 'get_market_stats',
      args: extractLocationParams(lower),
    };
  }

  // Find artisans
  if (
    lower.includes('artisan') || lower.includes('maçon') ||
    lower.includes('plombier') || lower.includes('électricien') ||
    lower.includes('peintre') || lower.includes('devis') ||
    lower.includes('réparation') || lower.includes('construction')
  ) {
    return {
      name: 'find_artisans',
      args: extractArtisanParams(lower),
    };
  }

  // Financing simulation
  if (
    lower.includes('financement') || lower.includes('crédit') ||
    lower.includes('emprunt') || lower.includes('mensualité') ||
    lower.includes('taux') || lower.includes('banque')
  ) {
    return {
      name: 'calculate_financing',
      args: extractFinancingParams(lower),
    };
  }

  return null;
}

function extractPropertyParams(text: string): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  // Detect property type
  const typeMap: Record<string, string> = {
    'villa': 'villa', 'maison': 'villa',
    'appartement': 'appartement', 'studio': 'chambre',
    'terrain': 'terrain', 'bureau': 'bureau',
    'commerce': 'commerce',
  };
  for (const [keyword, type] of Object.entries(typeMap)) {
    if (text.includes(keyword)) { params.type = type; break; }
  }

  // Detect transaction type
  if (text.includes('louer') || text.includes('location')) params.transaction = 'location';
  else if (text.includes('acheter') || text.includes('achat')) params.transaction = 'achat';
  else if (text.includes('investir') || text.includes('investissement')) params.transaction = 'investissement';

  // Extract location
  const locationParams = extractLocationParams(text);
  Object.assign(params, locationParams);

  return params;
}

function extractLocationParams(text: string): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  const countryMap: Record<string, string> = {
    'bénin': 'BJ', 'benin': 'BJ', 'cotonou': 'BJ',
    "côte d'ivoire": 'CI', 'cote d ivoire': 'CI', 'abidjan': 'CI', 'ivory coast': 'CI',
    'burkina': 'BF', 'ouagadougou': 'BF',
    'togo': 'TG', 'lomé': 'TG', 'lome': 'TG',
  };

  const cityList = ['cotonou', 'porto-novo', 'parakou', 'abidjan', 'yamoussoukro',
    'ouagadougou', 'bobo-dioulasso', 'lomé', 'sokodé', 'kara'];

  for (const [keyword, code] of Object.entries(countryMap)) {
    if (text.includes(keyword)) { params.country = code; break; }
  }

  for (const city of cityList) {
    if (text.includes(city)) { params.city = city.charAt(0).toUpperCase() + city.slice(1); break; }
  }

  return params;
}

function extractArtisanParams(text: string): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  const skillMap: Record<string, string> = {
    'maçon': 'maconnerie', 'plombier': 'plomberie', 'électricien': 'electricite',
    'electricien': 'electricite', 'peintre': 'peinture', 'carreleur': 'carrelage',
    'menuisier': 'menuiserie', 'soudeur': 'soudure', 'architecte': 'architecture',
    'paysagiste': 'paysagisme', 'climaticien': 'climatisation',
  };

  const skills: string[] = [];
  for (const [keyword, skill] of Object.entries(skillMap)) {
    if (text.includes(keyword)) skills.push(skill);
  }
  if (skills.length > 0) params.skills = skills;

  Object.assign(params, extractLocationParams(text));

  return params;
}

function extractFinancingParams(text: string): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  // Try to extract amount
  const amountMatch = text.match(/(\d[\d\s]*)\s*(?:fcfa|xof|cfa|franc)/i);
  if (amountMatch) {
    params.amount = parseInt(amountMatch[1].replace(/\s/g, ''), 10);
  }

  // Duration
  const durationMatch = text.match(/(\d+)\s*(?:an|année|ans)/i);
  if (durationMatch) {
    params.durationYears = parseInt(durationMatch[1], 10);
  }

  return params;
}

// Export function definitions for reference
export { REBECCA_FUNCTIONS };
