// AfriBayit RAG — Orchestrator
// Main RAG pipeline: retrieve → augment → generate

import { retrieve, RetrievalResult } from './retriever';
import { augmentPrompt, REBECCA_SYSTEM_PROMPT } from './prompts';

export type { RetrievalResult };
export { retrieve } from './retriever';
export { augmentPrompt, REBECCA_SYSTEM_PROMPT } from './prompts';

export interface RAGResponse {
  answer: string;
  sources: RetrievalResult[];
  contextUsed: boolean;
}

/**
 * Full RAG pipeline: process a user query
 * 1. Retrieve relevant context
 * 2. Augment the system prompt
 * 3. Call LLM with augmented context
 * 4. Return response with sources
 */
export async function processQuery(
  message: string,
  options?: {
    country?: string;
    city?: string;
    sessionId?: string;
  }
): Promise<RAGResponse> {
  // Step 1: Retrieve relevant context
  const sources = await retrieve(message, {
    country: options?.country,
    city: options?.city,
  });

  // Step 2: Augment the system prompt
  const augmentedPrompt = augmentPrompt(REBECCA_SYSTEM_PROMPT, sources);

  // Step 3: Call LLM with augmented context
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const response = await zai.chat.completions.create({
      model: 'glm-4-flash',
      messages: [
        { role: 'system', content: augmentedPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const answer = response.choices?.[0]?.message?.content ||
      'Je suis désolée, je n\'ai pas pu traiter votre demande. Pourriez-vous reformuler votre question ?';

    return {
      answer,
      sources,
      contextUsed: sources.length > 0,
    };
  } catch (error) {
    console.error('RAG LLM call error:', error);

    // Fallback: return a helpful message with the context we found
    if (sources.length > 0) {
      const contextSummary = sources
        .slice(0, 3)
        .map((s) => s.content)
        .join('\n\n');

      return {
        answer: `Voici ce que j'ai trouvé pour vous :\n\n${contextSummary}\n\nN'hésitez pas à me poser d'autres questions pour plus de détails !`,
        sources,
        contextUsed: true,
      };
    }

    return {
      answer: 'Je rencontre une difficulté technique temporaire. Veuillez réessayer dans quelques instants ou contactez notre support à support@afribayit.com.',
      sources: [],
      contextUsed: false,
    };
  }
}
