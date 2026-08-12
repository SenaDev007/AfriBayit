// AfriBayit RAG — Text Embedding Module
// Uses z-ai-web-dev-sdk for embedding generation
// Falls back to keyword-based TF-IDF retrieval when embeddings are unavailable

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  source: string;
  metadata?: Record<string, unknown>;
}

/**
 * Generate embeddings using z-ai-web-dev-sdk
 * Since we don't have pgvector, we use keyword-based similarity as primary approach
 * and embeddings for semantic similarity when available
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // Use chat completions to generate a semantic representation
    // Since the SDK may not have a dedicated embeddings endpoint,
    // we'll rely on keyword-based retrieval for our RAG pipeline
    void zai; // suppress unused warning
    return [];
  } catch {
    return [];
  }
}

/**
 * Simple TF-IDF tokenizer for keyword-based retrieval
 * Extracts meaningful tokens from text, removing stopwords
 */
const STOPWORDS_FR = new Set([
  'le', 'la', 'les', 'de', 'des', 'du', 'un', 'une', 'et', 'en', 'est',
  'que', 'qui', 'dans', 'pour', 'sur', 'avec', 'au', 'aux', 'par', 'il',
  'elle', 'nous', 'vous', 'ils', 'elles', 'ce', 'cette', 'ces', 'mon',
  'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'votre',
  'leur', 'ne', 'pas', 'plus', 'ou', 'mais', 'donc', 'car', 'si', 'je',
  'tu', 'on', 'y', 'a', 'sont', 'été', 'avoir', 'être', 'fait', 'tout',
  'tous', 'toute', 'toutes', 'rien', 'chaque', 'quel', 'quelle', 'comment',
  'pourquoi', 'quand', 'où', 'combien', 'quelque', 'certain', 'même',
  'aussi', 'autre', 'autres', 'très', 'bien', 'peu', 'beaucoup', 'trop',
  'encore', 'déjà', 'toujours', 'jamais', 'souvent', 'parfois', 'peut',
  'avoir', 'faire', 'dire', 'voir', 'savoir', 'pouvoir', 'venir', 'aller',
  'faut', 'doit', 'entre', 'chez', 'vers', 'sans', 'sous', 'après',
  'avant', 'pendant', 'depuis', 'jusque', 'contre', 'selon', 'chez',
]);

export function tokenize(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS_FR.has(token));

  return [...new Set(normalized)]; // Deduplicate
}

/**
 * Compute simple keyword overlap score between query and document
 * Returns a score between 0 and 1
 */
export function keywordSimilarity(queryTokens: string[], docTokens: string[]): number {
  if (queryTokens.length === 0 || docTokens.length === 0) return 0;

  const docSet = new Set(docTokens);
  const matches = queryTokens.filter((t) => docSet.has(t));
  return matches.length / queryTokens.length;
}

/**
 * Compute TF-IDF-like score for a document against a query
 * Approximates IDF by giving more weight to rarer terms
 */
export function tfidfScore(
  queryTokens: string[],
  docTokens: string[],
  allDocTokens: string[][]
): number {
  if (queryTokens.length === 0 || docTokens.length === 0) return 0;

  const docFreq = new Map<string, number>();
  const totalDocs = allDocTokens.length || 1;

  for (const doc of allDocTokens) {
    const uniqueTokens = new Set(doc);
    for (const token of uniqueTokens) {
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    }
  }

  let score = 0;
  const docSet = new Set(docTokens);

  for (const token of queryTokens) {
    if (docSet.has(token)) {
      const df = docFreq.get(token) || 1;
      const idf = Math.log((totalDocs + 1) / (df + 1)) + 1;
      score += idf;
    }
  }

  return score / queryTokens.length;
}
