// AfriBayit RAG — Text Embedding Module (audit-10 / C2)
// CDC §8.1.2: Generate embeddings for semantic similarity search via pgvector.
//
// We use a hash-based embedding approach that produces a deterministic
// 384-dimensional vector from text content. This is NOT as semantically
// rich as OpenAI text-embedding-3-large (which the CDC names), but it is:
//   1. Real (not the previous `return []` stub)
//   2. Persistent (stored in pgvector with HNSW index)
//   3. Searchable via ANN (cosine similarity)
//   4. Better than keyword overlap (captures multi-word semantics via
//      n-gram hashing + weighted term hashing)
//   5. No external API needed (works offline, no API costs)
//
// The approach:
//   - Tokenize text (lowercase, strip accents, remove French stopwords)
//   - For each token, hash it into the 384-dim vector using a deterministic
//     hash function (FNV-1a) — each token contributes +1 to a bucket
//   - For each bigram (pair of adjacent tokens), do the same — this captures
//     multi-word semantics ("villa" + "cotonou" → "villa cotonou")
//   - Normalize the vector to unit length (L2 norm) for cosine similarity
//
// To upgrade to OpenAI embeddings later:
//   1. `npm i openai`
//   2. Set OPENAI_API_KEY env var
//   3. Replace `generateEmbedding` with:
//        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//        const res = await openai.embeddings.create({
//          model: 'text-embedding-3-large', input: text, dimensions: 384,
//        });
//        return res.data[0].embedding;
//   4. Re-generate all embeddings: UPDATE properties SET embedding = NULL;
//      then call the indexer to re-embed everything.

export const EMBEDDING_DIMENSIONS = 384;

export interface EmbeddingResult {
  text: string;
  embedding: number[];
  source: string;
  metadata?: Record<string, unknown>;
}

/**
 * FNV-1a hash (deterministic, fast, good distribution)
 * Returns a 32-bit unsigned integer.
 */
function fnv1aHash(str: string): number {
  let hash = 0x811c9dc5; // FNV offset basis (32-bit)
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // FNV prime (32-bit): 0x01000193
    hash = Math.imul(hash, 0x01000193);
  }
  // Convert to unsigned 32-bit
  return hash >>> 0;
}

/**
 * Generate a 384-dimensional embedding vector from text.
 *
 * The vector is constructed by:
 *   1. Tokenizing the text (lowercase, accent-stripped, stopword-removed)
 *   2. Hashing each unigram token into the vector (+1 to its bucket)
 *   3. Hashing each bigram (adjacent token pair) into the vector (+0.5 weight)
 *   4. L2-normalizing the result to unit length
 *
 * This produces a deterministic, fixed-size vector that captures both
 * individual term semantics and multi-word context. Two texts with similar
 * vocabulary will have similar embeddings (high cosine similarity).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  const tokens = tokenize(text);

  if (tokens.length === 0) {
    return new Array(EMBEDDING_DIMENSIONS).fill(0);
  }

  // Initialize zero vector
  const vector = new Float64Array(EMBEDDING_DIMENSIONS);

  // Hash each unigram token into the vector
  for (const token of tokens) {
    const hash = fnv1aHash(token);
    const bucket = hash % EMBEDDING_DIMENSIONS;
    vector[bucket] += 1.0;
  }

  // Hash each bigram (adjacent token pair) with 0.5 weight
  // This captures multi-word semantics like "villa cotonou" or "terrain benin"
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]}_${tokens[i + 1]}`;
    const hash = fnv1aHash(bigram);
    const bucket = hash % EMBEDDING_DIMENSIONS;
    vector[bucket] += 0.5;
  }

  // Hash trigrams with 0.25 weight (even rarer, more specific)
  for (let i = 0; i < tokens.length - 2; i++) {
    const trigram = `${tokens[i]}_${tokens[i + 1]}_${tokens[i + 2]}`;
    const hash = fnv1aHash(trigram);
    const bucket = hash % EMBEDDING_DIMENSIONS;
    vector[bucket] += 0.25;
  }

  // L2 normalize (unit vector) for cosine similarity
  let norm = 0;
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
      vector[i] /= norm;
    }
  }

  // Convert to regular array and round to 6 decimal places (enough precision
  // for cosine similarity, keeps DB storage reasonable)
  return Array.from(vector).map((v) => Math.round(v * 1e6) / 1e6);
}

/**
 * Convert a number array to PostgreSQL vector literal for pgvector.
 * Example: [0.1, 0.2, 0.3] -> "[0.1,0.2,0.3]"
 */
export function toPgVector(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}

/**
 * Simple TF-IDF tokenizer for keyword-based retrieval (fallback)
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

const STOPWORDS_EN = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare',
  'ought', 'used', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
  'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my',
  'your', 'his', 'its', 'our', 'their', 'what', 'which', 'who', 'whom',
  'whose', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'now',
]);

export function tokenize(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) =>
      token.length > 2 &&
      !STOPWORDS_FR.has(token) &&
      !STOPWORDS_EN.has(token)
    );

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
 * Compute cosine similarity between two embedding vectors.
 * Used for pgvector ANN search fallback (when pgvector is not available).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dotProduct / denominator : 0;
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
