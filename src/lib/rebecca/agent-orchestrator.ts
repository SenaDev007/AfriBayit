// AfriBayit — Rebecca Agent Orchestrator
// LangGraph-style state machine for multi-step agent orchestration
// Implements nodes, edges, conditional routing, and state management

import {
  classifyIntentWithAI,
  type RebeccaIntent,
  type IntentResult,
} from './intent-classifier';
import { executePropertySearchNode } from './agent-nodes/property-search-node';
import { executeFinancialNode } from './agent-nodes/financial-node';
import { executeLegalNode } from './agent-nodes/legal-node';
import { executeNeighborhoodNode } from './agent-nodes/neighborhood-node';
import { executeEscrowNode } from './agent-nodes/escrow-node';
import { shouldHandoffToHuman } from './handoff';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface AgentState {
  // Input
  userMessage: string;
  userId?: string;
  sessionId?: string;
  country?: string;
  city?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;

  // Intent classification
  intent?: RebeccaIntent;
  intentConfidence?: number;
  entities?: Array<{ type: string; value: string; confidence: number }>;
  subIntents?: RebeccaIntent[];

  // Node outputs
  propertySearch?: Record<string, unknown>;
  financialCalc?: Record<string, unknown>;
  legalAdvice?: Record<string, unknown>;
  neighborhood?: Record<string, unknown>;
  escrowGuide?: Record<string, unknown>;

  // Orchestration
  executedNodes: string[];
  currentNode?: string;
  shouldHandoff: boolean;
  handoffReason?: string;

  // Final response
  finalResponse?: string;
  agentSteps: Array<{
    node: string;
    timestamp: string;
    summary: string;
  }>;
}

export interface AgentNode {
  name: string;
  execute: (state: AgentState) => Promise<AgentState>;
}

export interface AgentEdge {
  from: string;
  to: string | ((state: AgentState) => string);
  condition?: (state: AgentState) => boolean;
}

// ─── Node Registry ──────────────────────────────────────────────────────────────

const NODE_REGISTRY: Record<string, AgentNode> = {
  intent_classifier: {
    name: 'intent_classifier',
    execute: executeIntentClassifierNode,
  },
  property_search: {
    name: 'property_search',
    execute: executePropertySearchNodeWrapper,
  },
  financial_calculator: {
    name: 'financial_calculator',
    execute: executeFinancialNodeWrapper,
  },
  legal_advisor: {
    name: 'legal_advisor',
    execute: executeLegalNodeWrapper,
  },
  neighborhood_analyzer: {
    name: 'neighborhood_analyzer',
    execute: executeNeighborhoodNodeWrapper,
  },
  escrow_guide: {
    name: 'escrow_guide',
    execute: executeEscrowNodeWrapper,
  },
  response_generator: {
    name: 'response_generator',
    execute: executeResponseGeneratorNode,
  },
  handoff_agent: {
    name: 'handoff_agent',
    execute: executeHandoffNode,
  },
};

// ─── Graph Definition ───────────────────────────────────────────────────────────

/**
 * Define the agent graph edges.
 * After intent classification, route to the appropriate specialist node(s).
 * Each specialist node then routes to response_generator.
 */
function getEdges(): AgentEdge[] {
  return [
    // Intent classifier → specialist nodes (conditional routing)
    {
      from: 'intent_classifier',
      to: (state: AgentState) => routeFromClassifier(state),
    },
    // Specialist nodes → response generator
    { from: 'property_search', to: 'response_generator' },
    { from: 'financial_calculator', to: 'response_generator' },
    { from: 'legal_advisor', to: 'response_generator' },
    { from: 'neighborhood_analyzer', to: 'response_generator' },
    { from: 'escrow_guide', to: 'response_generator' },
    { from: 'handoff_agent', to: 'response_generator' },
    // Response generator → END
  ];
}

/**
 * Route from intent classifier to the appropriate node based on intent.
 */
function routeFromClassifier(state: AgentState): string {
  if (state.shouldHandoff) return 'handoff_agent';

  switch (state.intent) {
    case 'PROPERTY_SEARCH':
      return 'property_search';
    case 'FINANCIAL_INQUIRY':
      return 'financial_calculator';
    case 'LEGAL_QUESTION':
      return 'legal_advisor';
    case 'NEIGHBORHOOD_INFO':
      return 'neighborhood_analyzer';
    case 'ESCROW_HELP':
      return 'escrow_guide';
    case 'BOOKING':
      return 'property_search'; // Booking uses property search
    case 'HANDOFF':
      return 'handoff_agent';
    case 'GENERAL':
    default:
      return 'response_generator'; // Skip specialist nodes for general queries
  }
}

// ─── Node Implementations ───────────────────────────────────────────────────────

async function executeIntentClassifierNode(state: AgentState): Promise<AgentState> {
  const intentResult: IntentResult = await classifyIntentWithAI(
    state.userMessage,
    state.conversationHistory
  );

  // Check for handoff before proceeding
  const handoffResult = shouldHandoffToHuman({
    message: state.userMessage,
    sentiment: 'neutral',
    consecutiveFailures: 0,
    userId: state.userId,
    sessionId: state.sessionId,
  });

  return {
    ...state,
    intent: intentResult.intent,
    intentConfidence: intentResult.confidence,
    entities: intentResult.entities,
    subIntents: intentResult.subIntents,
    shouldHandoff: handoffResult.shouldHandoff,
    handoffReason: handoffResult.reason,
    executedNodes: [...state.executedNodes, 'intent_classifier'],
    agentSteps: [
      ...state.agentSteps,
      {
        node: 'intent_classifier',
        timestamp: new Date().toISOString(),
        summary: `Intent: ${intentResult.intent} (confidence: ${intentResult.confidence}, entities: ${intentResult.entities.length})`,
      },
    ],
  };
}

async function executePropertySearchNodeWrapper(state: AgentState): Promise<AgentState> {
  const updatedState = await executePropertySearchNode(state as unknown as Record<string, unknown>);
  return {
    ...state,
    propertySearch: updatedState.propertySearch,
    executedNodes: [...state.executedNodes, 'property_search'],
    agentSteps: [
      ...state.agentSteps,
      {
        node: 'property_search',
        timestamp: new Date().toISOString(),
        summary: (updatedState.propertySearch as Record<string, unknown>)?.summary as string || 'Property search completed',
      },
    ],
  };
}

async function executeFinancialNodeWrapper(state: AgentState): Promise<AgentState> {
  const updatedState = await executeFinancialNode(state as unknown as Record<string, unknown>);
  return {
    ...state,
    financialCalc: updatedState.financialCalc,
    executedNodes: [...state.executedNodes, 'financial_calculator'],
    agentSteps: [
      ...state.agentSteps,
      {
        node: 'financial_calculator',
        timestamp: new Date().toISOString(),
        summary: (updatedState.financialCalc as Record<string, unknown>)?.summary as string || 'Financial calculation completed',
      },
    ],
  };
}

async function executeLegalNodeWrapper(state: AgentState): Promise<AgentState> {
  const updatedState = await executeLegalNode(state as unknown as Record<string, unknown>);
  return {
    ...state,
    legalAdvice: updatedState.legalAdvice,
    executedNodes: [...state.executedNodes, 'legal_advisor'],
    agentSteps: [
      ...state.agentSteps,
      {
        node: 'legal_advisor',
        timestamp: new Date().toISOString(),
        summary: ((updatedState.legalAdvice as Record<string, unknown>)?.answer as string)?.substring(0, 100) || 'Legal advice generated',
      },
    ],
  };
}

async function executeNeighborhoodNodeWrapper(state: AgentState): Promise<AgentState> {
  const updatedState = await executeNeighborhoodNode(state as unknown as Record<string, unknown>);
  return {
    ...state,
    neighborhood: updatedState.neighborhood,
    executedNodes: [...state.executedNodes, 'neighborhood_analyzer'],
    agentSteps: [
      ...state.agentSteps,
      {
        node: 'neighborhood_analyzer',
        timestamp: new Date().toISOString(),
        summary: (updatedState.neighborhood as Record<string, unknown>)?.summary as string || 'Neighborhood analysis completed',
      },
    ],
  };
}

async function executeEscrowNodeWrapper(state: AgentState): Promise<AgentState> {
  const updatedState = await executeEscrowNode(state as unknown as Record<string, unknown>);
  return {
    ...state,
    escrowGuide: updatedState.escrowGuide,
    executedNodes: [...state.executedNodes, 'escrow_guide'],
    agentSteps: [
      ...state.agentSteps,
      {
        node: 'escrow_guide',
        timestamp: new Date().toISOString(),
        summary: ((updatedState.escrowGuide as Record<string, unknown>)?.summary as string)?.substring(0, 100) || 'Escrow guidance provided',
      },
    ],
  };
}

async function executeResponseGeneratorNode(state: AgentState): Promise<AgentState> {
  // Build the final response from all node outputs
  let response = '';

  // Include property search results
  if (state.propertySearch) {
    const ps = state.propertySearch as Record<string, unknown>;
    response += ps.summary as string || '';
    if (response) response += '\n\n';

    // Add property listings if available
    const properties = ps.properties as Array<Record<string, unknown>> | undefined;
    if (properties && properties.length > 0) {
      response += '🏠 **Biens trouvés:**\n';
      for (const p of properties.slice(0, 5)) {
        const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
        response += `• ${p.title} — ${fmt(p.price as number)} FCFA | ${(p.surface as number)}m² | ${(p.bedrooms as number)} ch. | ${p.city}, ${p.quartier}`;
        if (p.verified) response += ' ✓';
        response += '\n';
      }
    }
  }

  // Include financial calculation results
  if (state.financialCalc) {
    const fc = state.financialCalc as Record<string, unknown>;
    response += fc.summary as string || '';
  }

  // Include legal advice
  if (state.legalAdvice) {
    const la = state.legalAdvice as Record<string, unknown>;
    response += la.answer as string || '';
    if (la.disclaimer) response += `\n\n${la.disclaimer}`;
  }

  // Include neighborhood analysis
  if (state.neighborhood) {
    const na = state.neighborhood as Record<string, unknown>;
    response += na.summary as string || '';
  }

  // Include escrow guidance
  if (state.escrowGuide) {
    const eg = state.escrowGuide as Record<string, unknown>;
    response += eg.summary as string || '';
    const nextActions = eg.nextActions as string[] | undefined;
    if (nextActions && nextActions.length > 0) {
      response += '\n\n**Prochaines étapes:**\n';
      for (const action of nextActions) {
        response += `→ ${action}\n`;
      }
    }
  }

  // If no specialist node produced output, use AI to generate a general response
  if (!response && state.intent === 'GENERAL') {
    response = await generateGeneralResponse(state.userMessage, state.conversationHistory);
  }

  // Fallback if still empty
  if (!response) {
    response = 'Je suis Rebecca, votre assistante immobilière AfriBayit. Comment puis-je vous aider aujourd\'hui ?';
  }

  return {
    ...state,
    finalResponse: response,
    executedNodes: [...state.executedNodes, 'response_generator'],
    agentSteps: [
      ...state.agentSteps,
      {
        node: 'response_generator',
        timestamp: new Date().toISOString(),
        summary: 'Final response generated',
      },
    ],
  };
}

async function executeHandoffNode(state: AgentState): Promise<AgentState> {
  return {
    ...state,
    shouldHandoff: true,
    finalResponse: 'Je vais vous mettre en contact avec un de nos conseillers. Un instant svp...\n\nUn agent va prendre le relais pour mieux vous accompagner.',
    executedNodes: [...state.executedNodes, 'handoff_agent'],
    agentSteps: [
      ...state.agentSteps,
      {
        node: 'handoff_agent',
        timestamp: new Date().toISOString(),
        summary: `Handoff: ${state.handoffReason || 'User requested human agent'}`,
      },
    ],
  };
}

/**
 * Generate a general response using the LLM when no specialist node matches.
 */
async function generateGeneralResponse(
  message: string,
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const systemPrompt = `Tu es Rebecca, l'IA d'AfriBayit, la plateforme immobilière panafricaine. Tu aides les utilisateurs avec leurs questions immobilières en Afrique de l'Ouest (Bénin, Côte d'Ivoire, Burkina Faso, Togo, Sénégal). Tu es professionnelle, chaleureuse et concise. Réponds en français sauf si l'utilisateur utilise une autre langue. Si la question n'est pas liée à l'immobilier, redirige poliment vers tes compétences.`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(history || []).slice(-5).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const completion = await zai.chat.completions.create({
      model: 'glm-4-flash',
      messages,
      temperature: 0.7,
      max_tokens: 600,
    });

    return completion.choices?.[0]?.message?.content ||
      'Je suis désolée, je n\'ai pas pu traiter votre demande. Pourriez-vous reformuler ?';
  } catch (error) {
    console.error('[orchestrator] General response error:', error);
    return 'Je rencontre une difficulté technique temporaire. Veuillez réessayer dans quelques instants.';
  }
}

// ─── Main Orchestrator ──────────────────────────────────────────────────────────

/**
 * Execute the agent graph for a user message.
 * This is the main entry point for the multi-step agent system.
 *
 * Flow: intent_classifier → specialist_node(s) → response_generator → END
 */
export async function executeAgentGraph(
  userMessage: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: {
    userId?: string;
    sessionId?: string;
    country?: string;
    city?: string;
  }
): Promise<AgentState> {
  // Initialize state
  let state: AgentState = {
    userMessage,
    userId: options?.userId,
    sessionId: options?.sessionId,
    country: options?.country,
    city: options?.city,
    conversationHistory,
    executedNodes: [],
    shouldHandoff: false,
    agentSteps: [],
  };

  // Step 1: Always run intent classifier first
  state = await NODE_REGISTRY.intent_classifier.execute(state);

  // Step 2: Route to specialist node based on intent
  const edges = getEdges();
  const classifierEdge = edges.find((e) => e.from === 'intent_classifier');
  if (classifierEdge) {
    const nextNodeName = typeof classifierEdge.to === 'function'
      ? classifierEdge.to(state)
      : classifierEdge.to;

    if (nextNodeName !== 'response_generator' && NODE_REGISTRY[nextNodeName]) {
      state = await NODE_REGISTRY[nextNodeName].execute(state);

      // Check for sub-intents — if there are secondary intents, also execute those nodes
      if (state.subIntents && state.subIntents.length > 0) {
        for (const subIntent of state.subIntents) {
          const subNodeName = routeFromClassifier({ ...state, intent: subIntent });
          // Don't re-run the same node
          if (subNodeName !== nextNodeName && subNodeName !== 'response_generator' && NODE_REGISTRY[subNodeName]) {
            state = await NODE_REGISTRY[subNodeName].execute(state);
          }
        }
      }
    }
  }

  // Step 3: Generate final response
  if (!state.finalResponse) {
    state = await NODE_REGISTRY.response_generator.execute(state);
  }

  return state;
}
