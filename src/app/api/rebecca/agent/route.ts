// AfriBayit — Rebecca Agent API
// POST /api/rebecca/agent — Multi-step agent with streaming support

import { NextResponse } from 'next/server';
import { executeAgentGraph } from '@/lib/rebecca/agent-orchestrator';
import { applyGuardrails } from '@/lib/rebecca/guardrails';
import { checkPromptInjection, validateOutputSecurity } from '@/lib/rebecca/prompt-injection-guard';
import { getOrCreateRebeccaSession, storeConversationMemory } from '@/lib/rebecca/memory';

export const dynamic = 'force-dynamic';

interface AgentRequest {
  message: string;
  userId?: string;
  sessionId?: string;
  country?: string;
  city?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as AgentRequest;
    const { message, userId, sessionId, country, city, history } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'message est requis' },
        { status: 400 }
      );
    }

    // Step 1: Apply guardrails
    const guardResult = applyGuardrails(message);
    if (!guardResult.allowed) {
      return NextResponse.json({
        message: 'Je suis désolée, je ne peux pas traiter ce type de message. Pourriez-vous reformuler votre demande ?',
        blocked: true,
        reason: guardResult.reason,
      });
    }

    const sanitizedMessage = guardResult.sanitized || message;

    // Step 2: Check for prompt injection
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || undefined;
    const injectionCheck = checkPromptInjection(sanitizedMessage, {
      userId,
      sessionId,
      ip: clientIp,
    });

    if (!injectionCheck.isSafe) {
      return NextResponse.json({
        message: 'Je suis désolée, je ne peux pas traiter cette demande.',
        blocked: true,
        reason: injectionCheck.blockedReason,
      });
    }

    // Step 3: Get or create session
    const effectiveSessionId = sessionId || (userId ? await getOrCreateRebeccaSession(userId) : undefined);

    // Step 4: Execute the agent graph
    const agentState = await executeAgentGraph(
      sanitizedMessage,
      history,
      {
        userId,
        sessionId: effectiveSessionId,
        country,
        city,
      }
    );

    // Step 5: Validate output security
    if (agentState.finalResponse) {
      const outputSecurity = validateOutputSecurity(agentState.finalResponse);
      if (!outputSecurity.isSafe) {
        agentState.finalResponse = 'Je suis désolée, je ne peux pas fournir cette information. Pourriez-vous reformuler votre question ?';
      }
    }

    // Step 6: Save conversation to memory
    if (effectiveSessionId && userId) {
      try {
        await storeConversationMemory(effectiveSessionId, 'user', sanitizedMessage, { userId });
        await storeConversationMemory(effectiveSessionId, 'assistant', agentState.finalResponse || '', {
          userId,
          aiGenerated: true,
          intent: agentState.intent,
          executedNodes: agentState.executedNodes,
        });
      } catch (dbError) {
        console.error('[rebecca-agent] Memory save error:', dbError);
      }
    }

    // Step 7: Return the agent result with steps
    return NextResponse.json({
      message: agentState.finalResponse,
      intent: agentState.intent,
      intentConfidence: agentState.intentConfidence,
      entities: agentState.entities,
      agentSteps: agentState.agentSteps,
      executedNodes: agentState.executedNodes,
      shouldHandoff: agentState.shouldHandoff,
      handoffReason: agentState.handoffReason,
      sessionId: effectiveSessionId,
      // Include structured data from specialist nodes
      data: {
        propertySearch: agentState.propertySearch ? {
          properties: (agentState.propertySearch as Record<string, unknown>)?.properties,
          totalCount: (agentState.propertySearch as Record<string, unknown>)?.totalCount,
        } : undefined,
        financialCalc: agentState.financialCalc ? {
          simulation: (agentState.financialCalc as Record<string, unknown>)?.simulation,
          roiAnalysis: (agentState.financialCalc as Record<string, unknown>)?.roiAnalysis,
        } : undefined,
        legalAdvice: agentState.legalAdvice ? {
          requiredDocuments: (agentState.legalAdvice as Record<string, unknown>)?.requiredDocuments,
          disclaimer: (agentState.legalAdvice as Record<string, unknown>)?.disclaimer,
        } : undefined,
        neighborhood: agentState.neighborhood ? {
          overallScore: (agentState.neighborhood as Record<string, unknown>)?.analysis,
        } : undefined,
        escrowGuide: agentState.escrowGuide ? {
          currentStep: (agentState.escrowGuide as Record<string, unknown>)?.currentStep,
          nextActions: (agentState.escrowGuide as Record<string, unknown>)?.nextActions,
        } : undefined,
      },
    });
  } catch (error) {
    console.error('[rebecca-agent] API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de votre demande' },
      { status: 500 }
    );
  }
}

/**
 * GET handler — returns agent graph structure and capabilities for documentation.
 */
export async function GET() {
  return NextResponse.json({
    name: 'Rebecca Agent Orchestrator',
    version: '2.0',
    description: 'Multi-step agent system for AfriBayit AI assistant',
    nodes: [
      {
        name: 'intent_classifier',
        description: 'Classifies user intent using pattern matching + AI',
        intents: ['PROPERTY_SEARCH', 'FINANCIAL_INQUIRY', 'LEGAL_QUESTION', 'NEIGHBORHOOD_INFO', 'ESCROW_HELP', 'BOOKING', 'GENERAL', 'HANDOFF'],
      },
      {
        name: 'property_search',
        description: 'Searches properties based on extracted criteria',
        outputs: ['properties', 'totalCount', 'summary'],
      },
      {
        name: 'financial_calculator',
        description: 'Calculates mortgage, ROI, investment scores',
        outputs: ['simulation', 'roiAnalysis', 'bankOptions'],
      },
      {
        name: 'legal_advisor',
        description: 'Answers legal questions about property documents',
        outputs: ['answer', 'requiredDocuments', 'countryRules', 'recommendations'],
      },
      {
        name: 'neighborhood_analyzer',
        description: 'Provides neighborhood analysis and amenities',
        outputs: ['analysis', 'marketData', 'summary'],
      },
      {
        name: 'escrow_guide',
        description: 'Guides through escrow process step by step',
        outputs: ['currentStep', 'steps', 'nextActions'],
      },
      {
        name: 'response_generator',
        description: 'Generates the final response from all node outputs',
      },
      {
        name: 'handoff_agent',
        description: 'Transfers conversation to human agent',
      },
    ],
    routing: 'intent_classifier → specialist_node(s) → response_generator',
    supportedCountries: ['BJ', 'CI', 'BF', 'TG', 'SN'],
  });
}
