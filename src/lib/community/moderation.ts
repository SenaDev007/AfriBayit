// AfriBayit — Community NLP Moderation (CDC §5.7.4)
// Content classification, confidence scoring, and auto-moderation for community posts
// Supports: SPAM, HATE_SPEECH, DISGUISED_AD, OFF_TOPIC, MISINFORMATION, OK

// ====== Types ======

export type ContentClassification =
  | 'SPAM'
  | 'HATE_SPEECH'
  | 'DISGUISED_AD'
  | 'OFF_TOPIC'
  | 'MISINFORMATION'
  | 'OK';

export type ModerationAction = 'auto_reject' | 'human_review' | 'allow';

export interface ModerationResult {
  classification: ContentClassification;
  confidence: number; // 0-1
  action: ModerationAction;
  reasons: string[];
  flaggedPatterns: string[];
  sanitizedContent?: string;
  report: ModerationReport;
}

export interface ModerationReport {
  id: string;
  timestamp: Date;
  content: string;
  authorId?: string;
  classification: ContentClassification;
  confidence: number;
  action: ModerationAction;
  reasons: string[];
  flaggedPatterns: string[];
}

export interface ModerationConfig {
  autoRejectThreshold: number; // default 0.85
  humanReviewThreshold: number; // default 0.5
  maxLength: number;
  forumTopic?: string; // For off-topic detection context
}

// ====== Default Configuration ======

const DEFAULT_CONFIG: ModerationConfig = {
  autoRejectThreshold: 0.85,
  humanReviewThreshold: 0.5,
  maxLength: 5000,
};

// In-memory human review queue
const humanReviewQueue: ModerationReport[] = [];
const MAX_QUEUE_SIZE = 500;

// ====== Pattern Definitions ======

// Spam indicators
const SPAM_PATTERNS: Array<{ pattern: RegExp; label: string; weight: number }> = [
  { pattern: /(https?:\/\/[^\s]+(\s+https?:\/\/[^\s]+){2,})/i, label: 'multiple_links', weight: 0.6 },
  { pattern: /(.)\1{10,}/, label: 'repeated_chars', weight: 0.5 },
  { pattern: /(?:buy|achetez|commandez|commander|promo|promotion|remise|discount|offre|gratuit|free)\s*(?:now|maintenant|aujourd|today|vite|quick)/i, label: 'promo_urgency', weight: 0.7 },
  { pattern: /\b(?:click|cliquez|clique|appuyez|tapez)\s*(?:here|ici|sur|le lien|sur le lien)\b/i, label: 'click_bait', weight: 0.6 },
  { pattern: /\b(?:whatsapp|telegram|wa\.me|t\.me)\s*(?:\+?\d{5,}|@?\w+)/i, label: 'contact_redirect', weight: 0.7 },
  { pattern: /(?:gagnez|gagner|remportez|remporter|cash|argent|money|prix|prize)\s*(?:\d+|des|des milliers|millions)/i, label: 'prize_scam', weight: 0.8 },
  { pattern: /(?:emploi|travail|job|income|revenu)\s*(?: domicile| maison| home| en ligne| online)/i, label: 'work_from_home_scam', weight: 0.65 },
  { pattern: /(?:investissement|investir|roi|rendement)\s*(?:garanti|assure|certain|100%)/i, label: 'investment_scam', weight: 0.75 },
  { pattern: /copie[z]?\s*(?:ce|la)\s*(?:message|lien|code|texte)/i, label: 'chain_message', weight: 0.7 },
  { pattern: /(?:limited|limite[e]?|expire|fin)\s*(?:time|temps|offre|offer|bientot)/i, label: 'scarcity_tactic', weight: 0.5 },
];

// Hate speech indicators
const HATE_SPEECH_PATTERNS: Array<{ pattern: RegExp; label: string; weight: number }> = [
  // Threats
  { pattern: /(?:je\s+vais|on\s+va|va\s+te|va\s+votre)\s*(?:tuer|bruler|detruire|frapper|tabasser|viol|bangne)/i, label: 'threat_violence', weight: 0.95 },
  { pattern: /(?:tu\s+merites|vous\s+meritez|doit\s+etre)\s*(?:mort|brule|detruit|tue|supprime)/i, label: 'wish_harm', weight: 0.9 },
  // Discriminatory language
  { pattern: /(?:sale|dangereux|inferieur|sous-homme|sous-hommes)\s*(?:race|tribu|ethnie|noir|blanc|etranger)/i, label: 'racial_slur', weight: 0.9 },
  { pattern: /(?:les?\s+)?(?:juifs|musulmans|chretiens|arabes|africains|etrangers|immigres|migrants)\s*(?:sont\s+)?(?:tous?\s+)?(?:voleurs?|criminels?|terroristes?|parasites?| sales?|paresseux?|vils?)/i, label: 'group_generalization', weight: 0.85 },
  { pattern: /(?:retourne[z]?\s+|rentre[z]?\s+|va[z]?\s+)(?:chez\s+vous|dans\s+votre\s+pays|en\s+enfer)/i, label: 'xenophobic_remark', weight: 0.85 },
  { pattern: /(?:nettoyage\s+ethnique|genocide|extermination|deportation\s+force)/i, label: 'genocide_reference', weight: 0.95 },
  { pattern: /(?:n[ée]gros?|bougnoule|macaque|singe|bamboula|negre)/i, label: 'ethnic_slur_fr', weight: 0.9 },
  { pattern: /(?:pd|tapette|gouine|travelo|tranny|faggot)/i, label: 'lgbt_slur', weight: 0.85 },
  { pattern: /(?:salope|pute|garce|bitch|slut|whore)\s*(?:de\s+)?(?:mere|femme|fille)/i, label: 'misogynistic_slur', weight: 0.8 },
];

// Disguised real estate ad detection
const DISGUISED_AD_PATTERNS: Array<{ pattern: RegExp; label: string; weight: number }> = [
  { pattern: /(?:contactez[- ]moi|appelez[- ]moi|envoyez[- ]moi|dm\s+moi|mp\s+moi)\s*(?:pour\s+)?(?:visiter|voir|découvrir|info|details|réserver)/i, label: 'contact_for_info', weight: 0.6 },
  { pattern: /(?:m(?:a|on|es)\s+(?:maison|villa|appartement|terrain|chambre|propriete|immeuble))\s+(?:est?\s+)?(?:a\s+)?(?:vendre|louer|disponible|libre)/i, label: 'direct_listing', weight: 0.7 },
  { pattern: /(?:prix|co[ûu]t|loyer|caution)\s*(?::|est|de|=)\s*\d/i, label: 'price_mention', weight: 0.5 },
  { pattern: /(?:surface|superficie|aire)\s*(?::|est|de|=)\s*\d/i, label: 'surface_mention', weight: 0.45 },
  { pattern: /(?:chambre|salon|cuisine|douche|wc|parking|garage|jardin|piscine)\s*(?:\d+|disponible|compris)/i, label: 'property_features', weight: 0.5 },
  { pattern: /(?:quartier|zone|adresse|rue|avenue|carrefour)\s+(?:de|du|des|au|aux)\s+\w+.*(?:vendre|louer|disponible)/i, label: 'location_with_availability', weight: 0.55 },
  { pattern: /(?:ajoutez?\s+moi|contact\s+whatsapp|appel|phone)\s*(?:\+?\d{5,}|\d[\d\s]{6,})/i, label: 'phone_in_post', weight: 0.55 },
  { pattern: /(?:profitez|opportunite|rare|exceptionnel|fuyez|precipitez)\s+(?:de|d'une?\s+)?(?:cette?\s+)?(?:offre|occasion|chance|opportunite)/i, label: 'urgency_selling', weight: 0.6 },
];

// Misinformation indicators
const MISINFORMATION_PATTERNS: Array<{ pattern: RegExp; label: string; weight: number }> = [
  { pattern: /(?:le\s+gouvernement|l'etat|les\s+autorites?|la\s+police)\s+(?:cache|dissimule|ment|ne\s+d[iy]t\s+pas|cache\s+la\s+verite)/i, label: 'conspiracy_gov', weight: 0.65 },
  { pattern: /(?:scientifiquement\s+prouv[eé]|etude\s+confirme|prouv[eé]\s+par)\s*(?:que|le\s+fait)/i, label: 'fake_science', weight: 0.6 },
  { pattern: /(?:ils?\s+)?(?:ne\s+veulent?\s+pas\s+que\s+vous\s+le\s+sachiez|veulent?\s+cacher)/i, label: 'hidden_truth', weight: 0.65 },
  { pattern: /(?:100%|totalement|absolument|completement)\s*(?:efficace|sur|vrai|garanti|gueri|traite)/i, label: 'absolute_claims', weight: 0.55 },
  { pattern: /(?:grandes?\s+pharmacie|big\s+pharma|laboratoires?|l'industrie)\s+(?:cache|dissimule|ment|supprime)/i, label: 'pharma_conspiracy', weight: 0.65 },
  { pattern: /(?:remede\s+naturel|traitement\s+miracle|guerison\s+rapide|solution\s+radicale)\s+(?:pour|contre|de)/i, label: 'miracle_cure', weight: 0.6 },
];

// ====== Core Moderation Function ======

/**
 * Classify and moderate community content before publication.
 * Returns classification, confidence score, and recommended action.
 */
export function moderateContent(
  content: string,
  config: Partial<ModerationConfig> = {},
  context?: { authorId?: string; forumTopic?: string }
): ModerationResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const reasons: string[] = [];
  const flaggedPatterns: string[] = [];

  // Run all classifiers
  const spamResult = classifySpam(content);
  const hateResult = classifyHateSpeech(content);
  const adResult = classifyDisguisedAd(content);
  const misinfoResult = classifyMisinformation(content);

  // Off-topic check (only if forum topic provided)
  const offTopicResult = cfg.forumTopic || context?.forumTopic
    ? classifyOffTopic(content, cfg.forumTopic || context?.forumTopic || '')
    : { confidence: 0, patterns: [] as string[] };

  // Find the highest confidence classification
  const scores: Array<{ classification: ContentClassification; confidence: number; patterns: string[] }> = [
    { classification: 'SPAM', confidence: spamResult.confidence, patterns: spamResult.patterns },
    { classification: 'HATE_SPEECH', confidence: hateResult.confidence, patterns: hateResult.patterns },
    { classification: 'DISGUISED_AD', confidence: adResult.confidence, patterns: adResult.patterns },
    { classification: 'MISINFORMATION', confidence: misinfoResult.confidence, patterns: misinfoResult.patterns },
    { classification: 'OFF_TOPIC', confidence: offTopicResult.confidence, patterns: offTopicResult.patterns },
  ];

  // Sort by confidence descending
  scores.sort((a, b) => b.confidence - a.confidence);

  const topScore = scores[0];
  const classification: ContentClassification = topScore.confidence >= cfg.humanReviewThreshold
    ? topScore.classification
    : 'OK';

  // Collect reasons and flagged patterns from all triggered classifiers
  if (spamResult.confidence >= cfg.humanReviewThreshold) {
    reasons.push(`Spam detecte (confidence: ${Math.round(spamResult.confidence * 100)}%)`);
    flaggedPatterns.push(...spamResult.patterns);
  }
  if (hateResult.confidence >= cfg.humanReviewThreshold) {
    reasons.push(`Discours de haine detecte (confidence: ${Math.round(hateResult.confidence * 100)}%)`);
    flaggedPatterns.push(...hateResult.patterns);
  }
  if (adResult.confidence >= cfg.humanReviewThreshold) {
    reasons.push(`Annonce immobiliere deguisee (confidence: ${Math.round(adResult.confidence * 100)}%)`);
    flaggedPatterns.push(...adResult.patterns);
  }
  if (misinfoResult.confidence >= cfg.humanReviewThreshold) {
    reasons.push(`Desinformation possible (confidence: ${Math.round(misinfoResult.confidence * 100)}%)`);
    flaggedPatterns.push(...misinfoResult.patterns);
  }
  if (offTopicResult.confidence >= cfg.humanReviewThreshold) {
    reasons.push(`Hors sujet (confidence: ${Math.round(offTopicResult.confidence * 100)}%)`);
    flaggedPatterns.push(...offTopicResult.patterns);
  }

  // Determine action
  let action: ModerationAction = 'allow';
  const confidence = topScore.confidence;

  if (classification === 'HATE_SPEECH' && confidence >= cfg.humanReviewThreshold) {
    action = confidence >= cfg.autoRejectThreshold ? 'auto_reject' : 'human_review';
  } else if (confidence >= cfg.autoRejectThreshold) {
    action = 'auto_reject';
  } else if (confidence >= cfg.humanReviewThreshold) {
    action = 'human_review';
  }

  // Sanitize content (remove links from spam)
  let sanitizedContent: string | undefined;
  if (classification === 'SPAM' && action !== 'auto_reject') {
    sanitizedContent = content.replace(/https?:\/\/[^\s]+/gi, '[lien supprime]');
  }

  // Build report
  const report: ModerationReport = {
    id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    timestamp: new Date(),
    content: content.substring(0, 1000),
    authorId: context?.authorId,
    classification,
    confidence,
    action,
    reasons,
    flaggedPatterns,
  };

  // Add to human review queue if needed
  if (action === 'human_review') {
    addToReviewQueue(report);
  }

  return {
    classification,
    confidence: Math.round(confidence * 100) / 100,
    action,
    reasons,
    flaggedPatterns,
    sanitizedContent,
    report,
  };
}

// ====== Individual Classifiers ======

function classifySpam(content: string): { confidence: number; patterns: string[] } {
  const patterns: string[] = [];
  let maxWeight = 0;
  let totalWeight = 0;

  for (const { pattern, label, weight } of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      patterns.push(label);
      maxWeight = Math.max(maxWeight, weight);
      totalWeight += weight;
    }
  }

  // Link density check
  const linkCount = (content.match(/https?:\/\/[^\s]+/gi) || []).length;
  const wordCount = content.split(/\s+/).length;
  if (wordCount > 0 && linkCount / wordCount > 0.15) {
    patterns.push('high_link_density');
    maxWeight = Math.max(maxWeight, 0.5);
    totalWeight += 0.5;
  }

  // Repetition check
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length >= 3) {
    const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
    const repetitionRatio = 1 - (uniqueSentences.size / sentences.length);
    if (repetitionRatio > 0.3) {
      patterns.push('repetitive_content');
      maxWeight = Math.max(maxWeight, 0.4);
      totalWeight += 0.4;
    }
  }

  if (patterns.length === 0) return { confidence: 0, patterns };
  const confidence = Math.min(1, maxWeight * 0.6 + (totalWeight / patterns.length) * 0.4);
  return { confidence: Math.round(confidence * 100) / 100, patterns };
}

function classifyHateSpeech(content: string): { confidence: number; patterns: string[] } {
  const patterns: string[] = [];
  let maxWeight = 0;
  let totalWeight = 0;

  for (const { pattern, label, weight } of HATE_SPEECH_PATTERNS) {
    if (pattern.test(content)) {
      patterns.push(label);
      maxWeight = Math.max(maxWeight, weight);
      totalWeight += weight;
    }
  }

  if (patterns.length === 0) return { confidence: 0, patterns };
  // Hate speech uses higher weight for max (any single pattern is serious)
  const confidence = Math.min(1, maxWeight * 0.75 + (totalWeight / patterns.length) * 0.25);
  return { confidence: Math.round(confidence * 100) / 100, patterns };
}

function classifyDisguisedAd(content: string): { confidence: number; patterns: string[] } {
  const patterns: string[] = [];
  let maxWeight = 0;
  let totalWeight = 0;
  let matchCount = 0;

  for (const { pattern, label, weight } of DISGUISED_AD_PATTERNS) {
    if (pattern.test(content)) {
      patterns.push(label);
      maxWeight = Math.max(maxWeight, weight);
      totalWeight += weight;
      matchCount++;
    }
  }

  // Multiple ad indicators increase confidence significantly
  if (matchCount >= 3) {
    totalWeight += 0.3; // Boost for multiple ad indicators
  }

  if (patterns.length === 0) return { confidence: 0, patterns };
  const confidence = Math.min(1, maxWeight * 0.5 + (totalWeight / patterns.length) * 0.5);
  return { confidence: Math.round(confidence * 100) / 100, patterns };
}

function classifyMisinformation(content: string): { confidence: number; patterns: string[] } {
  const patterns: string[] = [];
  let maxWeight = 0;
  let totalWeight = 0;

  for (const { pattern, label, weight } of MISINFORMATION_PATTERNS) {
    if (pattern.test(content)) {
      patterns.push(label);
      maxWeight = Math.max(maxWeight, weight);
      totalWeight += weight;
    }
  }

  if (patterns.length === 0) return { confidence: 0, patterns };
  const confidence = Math.min(1, maxWeight * 0.55 + (totalWeight / patterns.length) * 0.45);
  return { confidence: Math.round(confidence * 100) / 100, patterns };
}

function classifyOffTopic(content: string, forumTopic: string): { confidence: number; patterns: string[] } {
  const patterns: string[] = [];
  let confidence = 0;

  // Simple keyword-based off-topic detection
  // In production, this would use embeddings/similarity scoring
  const topicKeywords = extractKeywords(forumTopic);
  const contentKeywords = extractKeywords(content);

  if (topicKeywords.length === 0) return { confidence: 0, patterns };

  // Check overlap between topic and content keywords
  const overlap = contentKeywords.filter(k => topicKeywords.includes(k)).length;
  const overlapRatio = overlap / Math.max(contentKeywords.length, 1);

  // If very low overlap, likely off-topic
  if (overlapRatio < 0.1 && contentKeywords.length > 5) {
    confidence = 0.7;
    patterns.push('low_topic_overlap');
  } else if (overlapRatio < 0.2 && contentKeywords.length > 5) {
    confidence = 0.4;
    patterns.push('moderate_topic_divergence');
  }

  // Check for completely unrelated topics
  const unrelatedTopics = [
    { topic: /(?:crypto|bitcoin|ethereum|trading)/i, forum: /immobilier|bien|maison|terrain/i, label: 'crypto_in_real_estate' },
    { topic: /(?:regime|maigrir|perte\s+de\s+poids|mincir)/i, forum: /immobilier|bien|maison|terrain/i, label: 'diet_in_real_estate' },
  ];

  for (const check of unrelatedTopics) {
    if (check.topic.test(content) && check.forum.test(forumTopic)) {
      confidence = Math.max(confidence, 0.75);
      patterns.push(check.label);
    }
  }

  return { confidence: Math.round(confidence * 100) / 100, patterns };
}

// ====== Helper Functions ======

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'au', 'aux',
    'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi',
    'dans', 'sur', 'sous', 'avec', 'pour', 'par', 'en', 'vers',
    'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
    'son', 'sa', 'ses', 'notre', 'votre', 'leur', 'est', 'sont',
    'a', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'se',
    'ne', 'pas', 'plus', 'tres', 'bien', 'fait', 'etre', 'avoir',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-zàâéèêëïîôùûüÿç\s-]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 50);
}

function addToReviewQueue(report: ModerationReport): void {
  humanReviewQueue.push(report);
  if (humanReviewQueue.length > MAX_QUEUE_SIZE) {
    humanReviewQueue.shift();
  }
}

// ====== Public Utility Functions ======

/**
 * Get items pending human review.
 */
export function getHumanReviewQueue(options?: { limit?: number; classification?: ContentClassification }): ModerationReport[] {
  let entries = [...humanReviewQueue];
  if (options?.classification) {
    entries = entries.filter(e => e.classification === options.classification);
  }
  return entries.slice(0, options?.limit ?? 50);
}

/**
 * Get moderation statistics.
 */
export function getModerationStats(): {
  totalModerated: number;
  autoRejected: number;
  humanReviewPending: number;
  byClassification: Record<ContentClassification, number>;
} {
  const byClassification: Record<ContentClassification, number> = {
    SPAM: 0,
    HATE_SPEECH: 0,
    DISGUISED_AD: 0,
    OFF_TOPIC: 0,
    MISINFORMATION: 0,
    OK: 0,
  };

  for (const entry of humanReviewQueue) {
    byClassification[entry.classification]++;
  }

  return {
    totalModerated: humanReviewQueue.length,
    autoRejected: humanReviewQueue.filter(e => e.action === 'auto_reject').length,
    humanReviewPending: humanReviewQueue.filter(e => e.action === 'human_review').length,
    byClassification,
  };
}

/**
 * Sanitize content by removing or redacting flagged elements.
 */
export function sanitizeContent(content: string, classification: ContentClassification): string {
  let sanitized = content;

  switch (classification) {
    case 'SPAM':
      // Remove links
      sanitized = sanitized.replace(/https?:\/\/[^\s]+/gi, '[lien supprime]');
      // Remove phone numbers
      sanitized = sanitized.replace(/(\+?\d[\d\s-]{7,})/g, '[numero supprime]');
      break;
    case 'HATE_SPEECH':
      // Replace the entire content with a notice
      sanitized = '[Contenu supprime - Discours de haine detecte]';
      break;
    case 'DISGUISED_AD':
      // Remove contact info
      sanitized = sanitized.replace(/(?:contactez|appelez|envoyez)\s*-?\s*moi/gi, '[coordonnees supprimees]');
      sanitized = sanitized.replace(/(\+?\d[\d\s-]{7,})/g, '[numero supprime]');
      break;
    default:
      break;
  }

  return sanitized;
}
