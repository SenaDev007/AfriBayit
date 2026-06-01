// AfriBayit — Rebecca AI Chat Endpoint
// POST /api/rebecca/chat — Main chat endpoint with agent orchestrator + RAG + guardrails + handoff + memory
// V2: Now uses multi-step agent orchestrator for intent-based routing

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processQuery, REBECCA_SYSTEM_PROMPT } from '@/lib/rag';
import { executeRebeccaFunction, REBECCA_FUNCTIONS } from '../functions/route';
import { applyGuardrails, validateRebeccaResponse } from '@/lib/rebecca/guardrails';
import { shouldHandoffToHuman, buildHandoffMessage } from '@/lib/rebecca/handoff';
import { checkPromptInjection, validateOutputSecurity, buildProtectedSystemPrompt } from '@/lib/rebecca/prompt-injection-guard';
import {
  getConversationMemory,
  storeConversationMemory,
  getUserContext,
  getOrCreateRebeccaSession,
} from '@/lib/rebecca/memory';
import { executeAgentGraph } from '@/lib/rebecca/agent-orchestrator';
import { classifyIntent } from '@/lib/rebecca/intent-classifier';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  name?: string; // function name if role=function
}

// Track consecutive failures per session (in-memory, resets on server restart)
const failureTracker = new Map<string, number>();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, sessionId, userId, country, city, useAgent } = body as {
      messages: ChatMessage[];
      sessionId?: string;
      userId?: string;
      country?: string;
      city?: string;
      useAgent?: boolean; // V2: opt-in to agent orchestrator
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

    //  Step 0: Apply guardrails
    const guardResult = applyGuardrails(lastUserMessage.content);
    if (!guardResult.allowed) {
      return NextResponse.json({
        message: 'Je suis désolée, je ne peux pas traiter ce type de message. Pourriez-vous reformuler votre demande ?',
        blocked: true,
        reason: guardResult.reason,
        sessionId,
      });
    }

    const guardSanitized = guardResult.sanitized || lastUserMessage.content;

    //  Step 0.1: Prompt injection detection (CDC §10.6)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || undefined;
    const injectionCheck = checkPromptInjection(guardSanitized, {
      userId,
      sessionId,
      ip: clientIp,
    });

    if (!injectionCheck.isSafe) {
      return NextResponse.json({
        message: 'Je suis désolée, je ne peux pas traiter cette demande. Si vous avez une question immobilière, je suis là pour vous aider.',
        blocked: true,
        reason: injectionCheck.blockedReason,
        injectionConfidence: injectionCheck.confidence,
        auditId: injectionCheck.auditId,
        sessionId,
      });
    }

    const sanitizedMessage = injectionCheck.sanitizedInput;

    //  Step 0.5: Check for human handoff
    const effectiveSessionId = sessionId || (userId ? await getOrCreateRebeccaSession(userId) : undefined);
    const consecutiveFailures = failureTracker.get(effectiveSessionId || 'default') || 0;

    const handoffResult = shouldHandoffToHuman({
      message: sanitizedMessage,
      sentiment: 'neutral',
      consecutiveFailures,
      userId,
      sessionId: effectiveSessionId,
    });

    if (handoffResult.shouldHandoff) {
      const handoffMsg = buildHandoffMessage({
        message: sanitizedMessage,
        sentiment: 'neutral',
        consecutiveFailures,
        userId,
        sessionId: effectiveSessionId,
      });

      return NextResponse.json({
        message: 'Je vais vous mettre en contact avec un de nos conseillers. Un instant svp...\n\nUn agent va prendre le relais pour mieux vous accompagner.',
        handoff: true,
        handoffReason: handoffResult.reason,
        handoffPriority: handoffResult.priority,
        handoffDepartment: handoffResult.department,
        sessionId: effectiveSessionId,
      });
    }

    // ─── V2: Agent Orchestrator Path ──────────────────────────────────────
    // Use the agent orchestrator for all requests (useAgent flag is deprecated,
    // the orchestrator is now the default path for better routing)

    const intentResult = classifyIntent(sanitizedMessage);
    const shouldUseOrchestrator = useAgent !== false &&
      ['PROPERTY_SEARCH', 'FINANCIAL_INQUIRY', 'LEGAL_QUESTION', 'NEIGHBORHOOD_INFO', 'ESCROW_HELP', 'BOOKING'].includes(intentResult.intent);

    if (shouldUseOrchestrator) {
      // Use the multi-step agent orchestrator
      const conversationHistory = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const agentState = await executeAgentGraph(
        sanitizedMessage,
        conversationHistory,
        { userId, sessionId: effectiveSessionId, country, city }
      );

      // Validate output security
      let finalResponse = agentState.finalResponse || '';
      const outputSecurity = validateOutputSecurity(finalResponse);
      if (!outputSecurity.isSafe) {
        finalResponse = 'Je suis désolée, je ne peux pas fournir cette information. Pourriez-vous reformuler votre question ?';
      }

      // Save to DB
      if (effectiveSessionId && userId) {
        await saveConversationToDB(effectiveSessionId, userId, sanitizedMessage, finalResponse, {
          agentUsed: true,
          intent: agentState.intent,
          executedNodes: agentState.executedNodes,
        });
      }

      return NextResponse.json({
        message: finalResponse,
        intent: agentState.intent,
        intentConfidence: agentState.intentConfidence,
        entities: agentState.entities,
        agentSteps: agentState.agentSteps,
        executedNodes: agentState.executedNodes,
        shouldHandoff: agentState.shouldHandoff,
        functionsCalled: agentState.executedNodes.filter((n) => n !== 'intent_classifier' && n !== 'response_generator'),
        contextUsed: agentState.executedNodes.length > 1,
        sessionId: effectiveSessionId,
      });
    }

    // ─── Legacy Path: RAG + Function Calling ─────────────────────────────

    //  Step 1: Load conversation memory
    let memoryMessages: ChatMessage[] = [];
    if (effectiveSessionId) {
      const memory = await getConversationMemory(effectiveSessionId);
      memoryMessages = memory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
    }

    //  Step 2: Build user context
    let userContext = '';
    if (userId) {
      userContext = await getUserContext(userId);
    }

    //  Step 3: Run RAG pipeline to get context-augmented response
    const ragResult = await processQuery(sanitizedMessage, { country, city, sessionId: effectiveSessionId });

    //  Step 4: Build conversation with history for LLM
    const contextPrefix = userContext ? `\n\nContexte utilisateur: ${userContext}` : '';
    const protectedSystemPrompt = buildProtectedSystemPrompt(REBECCA_SYSTEM_PROMPT);

    const conversationMessages = [
      { role: 'system' as const, content: protectedSystemPrompt + contextPrefix },
      ...memoryMessages.slice(-10),
      ...messages.slice(-5).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    //  Step 5: Call LLM with function calling support
    let aiResponse = ragResult.answer;
    let functionResults: Array<{ name: string; result: unknown }> = [];

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      // First LLM call — check if function calling is needed
      const completion = await zai.chat.completions.create({
        model: 'glm-4-flash',
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 800,
      });

      const responseContent = completion.choices?.[0]?.message?.content || '';

      // Keyword-based function detection
      const detectedFunction = detectFunctionCall(sanitizedMessage);

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

      // Validate Rebecca's response
      const validationResult = validateRebeccaResponse(aiResponse);
      if (!validationResult.allowed) {
        aiResponse = 'Je suis désolée, je ne peux pas fournir cette information. Pourriez-vous reformuler votre question ?';
      }

      // Step 5.5: Output security validation (CDC §10.6)
      const outputSecurity = validateOutputSecurity(aiResponse);
      if (!outputSecurity.isSafe) {
        console.warn('[REBECCA-SECURITY] Output blocked:', outputSecurity.details);
        aiResponse = 'Je suis désolée, je ne peux pas fournir cette information. Pourriez-vous reformuler votre question ?';
      }

      // Reset failure tracker on success
      if (effectiveSessionId) {
        failureTracker.delete(effectiveSessionId);
      }
    } catch (llmError) {
      console.error('Rebecca LLM error:', llmError);
      // Fallback to RAG response
      aiResponse = ragResult.answer;

      // Increment failure tracker
      if (effectiveSessionId) {
        const current = failureTracker.get(effectiveSessionId) || 0;
        failureTracker.set(effectiveSessionId, current + 1);
      }
    }

    //  Step 6: Save conversation to DB
    if (effectiveSessionId && userId) {
      await saveConversationToDB(effectiveSessionId, userId, sanitizedMessage, aiResponse, {
        agentUsed: false,
        sources: ragResult.sources.map((s) => s.source),
        functionsCalled: functionResults.map((f) => f.name),
        contextUsed: ragResult.contextUsed,
      });
    }

    //  Step 7: Return response
    return NextResponse.json({
      message: aiResponse,
      sources: ragResult.sources.map((s) => ({
        type: s.sourceType,
        source: s.source,
        score: s.score,
      })),
      functionsCalled: functionResults.map((f) => f.name),
      contextUsed: ragResult.contextUsed,
      intent: intentResult.intent,
      intentConfidence: intentResult.confidence,
      sessionId: effectiveSessionId,
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
 * Save conversation messages to database.
 */
async function saveConversationToDB(
  sessionId: string,
  userId: string,
  userMessage: string,
  aiResponse: string,
  metadata: Record<string, unknown>
): Promise<void> {
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
        content: userMessage,
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
          ...metadata,
        }),
      },
    });

    // Update conversation
    await db.conversation.upsert({
      where: { id: sessionId },
      update: { updatedAt: new Date() },
      create: {
        id: sessionId,
        type: 'rebecca',
        status: 'active',
        metadata: JSON.stringify({ source: 'rebecca_chat' }),
      },
    });
  } catch (dbError) {
    console.error('Rebecca DB save error:', dbError);
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
    lower.includes('electricien') || lower.includes('peintre') ||
    lower.includes('devis') || lower.includes('réparation') ||
    lower.includes('reparation') || lower.includes('construction')
  ) {
    return {
      name: 'find_artisans',
      args: extractArtisanParams(lower),
    };
  }

  // Financing simulation
  if (
    lower.includes('financement') || lower.includes('crédit') ||
    lower.includes('credit') || lower.includes('emprunt') ||
    lower.includes('mensualité') || lower.includes('mensualite') ||
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

  const typeMap: Record<string, string> = {
    'villa': 'villa', 'maison': 'villa',
    'appartement': 'appartement', 'studio': 'chambre',
    'terrain': 'terrain', 'bureau': 'bureau',
    'commerce': 'commerce',
  };
  for (const [keyword, type] of Object.entries(typeMap)) {
    if (text.includes(keyword)) { params.type = type; break; }
  }

  if (text.includes('louer') || text.includes('location')) params.transaction = 'location';
  else if (text.includes('acheter') || text.includes('achat')) params.transaction = 'achat';
  else if (text.includes('investir') || text.includes('investissement')) params.transaction = 'investissement';

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

  const amountMatch = text.match(/(\d[\d\s]*)\s*(?:fcfa|xof|cfa|franc)/i);
  if (amountMatch) {
    params.amount = parseInt(amountMatch[1].replace(/\s/g, ''), 10);
  }

  const durationMatch = text.match(/(\d+)\s*(?:an|année|ans)/i);
  if (durationMatch) {
    params.durationYears = parseInt(durationMatch[1], 10);
  }

  return params;
}

// Export function definitions for reference
export { REBECCA_FUNCTIONS };
