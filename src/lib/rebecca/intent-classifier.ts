// AfriBayit — Rebecca Intent Classifier
// Classifies user intent for agent routing in the multi-step orchestration system
// Combines pattern matching with AI classification for robust intent detection

export type RebeccaIntent =
  | 'PROPERTY_SEARCH'
  | 'FINANCIAL_INQUIRY'
  | 'LEGAL_QUESTION'
  | 'NEIGHBORHOOD_INFO'
  | 'ESCROW_HELP'
  | 'BOOKING'
  | 'GENERAL'
  | 'HANDOFF';

export interface IntentResult {
  intent: RebeccaIntent;
  confidence: number; // 0-1
  entities: Entity[];
  subIntents?: RebeccaIntent[];
}

export interface Entity {
  type: string;
  value: string;
  confidence: number;
}

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Pattern-based intent rules ────────────────────────────────────────────────

const INTENT_PATTERNS: Array<{
  intent: RebeccaIntent;
  patterns: RegExp[];
  entityExtractors?: Array<{
    type: string;
    pattern: RegExp;
    transform?: (match: string) => string;
  }>;
}> = [
  {
    intent: 'PROPERTY_SEARCH',
    patterns: [
      /recherch(?:e|er)/i, /cherche(?:r|z)?/i, /je (?:veux|voudrais|cherche) (?:un|une|des)/i,
      /bien(?:s)?\b/i, /maison/i, /appartement/i, /villa/i, /terrain/i,
      /louer/i, /acheter/i, /investir/i, /location/i, /achat/i,
      /combien (?:ça )?co[ûu]te/i, /prix d(?:'(?:un|une)|es) /i,
      /annonce(?:s)?/i, /liste(?:s)?(?: de)? bien/i,
    ],
    entityExtractors: [
      {
        type: 'property_type',
        pattern: /\b(villa|maison|appartement|terrain|bureau|commerce|chambre|studio|duplex)\b/i,
      },
      {
        type: 'transaction_type',
        pattern: /\b(achat|louer|location|investissement|investir|vente)\b/i,
        transform: (match) => {
          const map: Record<string, string> = {
            'louer': 'location', 'investir': 'investissement',
          };
          return map[match.toLowerCase()] || match.toLowerCase();
        },
      },
      {
        type: 'city',
        pattern: /\b(Cotonou|Porto-Novo|Parakou|Abidjan|Yamoussoukro|Ouagadougou|Bobo-Dioulasso|Lom[ée]|Sokod[ée]|Kara|Dakar|Thi[èe]s)\b/i,
      },
      {
        type: 'country',
        pattern: /\b(B[eé]nin|Bénin|C[oô]te d'Ivoire|Cote d Ivoire|Burkina|Togo|S[eé]n[eé]gal)\b/i,
        transform: (match) => {
          const map: Record<string, string> = {
            'bénin': 'BJ', 'benin': 'BJ',
            "côte d'ivoire": 'CI', "cote d ivoire": 'CI',
            'burkina': 'BF', 'togo': 'TG', 'sénégal': 'SN', 'senegal': 'SN',
          };
          return map[match.toLowerCase()] || match;
        },
      },
      {
        type: 'budget',
        pattern: /(\d[\d\s]*(?:\d))\s*(?:fcfa|xof|cfa|franc|€|eur)/i,
      },
    ],
  },
  {
    intent: 'FINANCIAL_INQUIRY',
    patterns: [
      /financement/i, /cr[eé]dit/i, /emprunt/i, /mensualit[eé]/i,
      /taux/i, /banque/i, /pr[eê]t/i, /simulation/i, /calcul(?:er|ez)?/i,
      /roi/i, /rendement/i, /investissement/i, /rentabilit[eé]/i,
      /combien (?:je )?(?:peux|dois|vais) (?:payer|emprunter|gagner)/i,
      /apport/i, /int[eé]r[eê]t/i,
    ],
    entityExtractors: [
      {
        type: 'amount',
        pattern: /(\d[\d\s]*)\s*(?:fcfa|xof|cfa|franc)/i,
      },
      {
        type: 'duration_years',
        pattern: /(\d+)\s*(?:an|ann[eé]e)/i,
      },
      {
        type: 'interest_rate',
        pattern: /(\d+(?:[.,]\d+)?)\s*%/i,
      },
    ],
  },
  {
    intent: 'LEGAL_QUESTION',
    patterns: [
      /titre foncier/i, /tf\b/i, /acd\b/i, /permis de construire/i,
      /document(?:s)? (?:l[eé]gal|foncier|requis)/i, /notaire/i,
      /droit(?:s)? foncier/i, /l[eé]gislation/i, /juridique/i,
      /certificat/i, /acte de (?:cession|vente)/i, /bornage/i,
      /proced(?:ure|ure)/i, /formalit[eé]/i, /enregistrement/i,
      /conformit[eé]/i, /r[eé]glementation/i, /puh\b/i, /andf\b/i,
    ],
    entityExtractors: [
      {
        type: 'document_type',
        pattern: /\b(titre foncier|acd|permis de construire|acte de cession|certificat andf|puh|attestation)\b/i,
      },
      {
        type: 'country',
        pattern: /\b(B[eé]nin|C[oô]te d'Ivoire|Burkina|Togo|S[eé]n[eé]gal)\b/i,
        transform: (match) => {
          const map: Record<string, string> = {
            'bénin': 'BJ', 'benin': 'BJ',
            "côte d'ivoire": 'CI', 'burkina': 'BF', 'togo': 'TG', 'sénégal': 'SN',
          };
          return map[match.toLowerCase()] || match;
        },
      },
    ],
  },
  {
    intent: 'NEIGHBORHOOD_INFO',
    patterns: [
      /quartier/i, /voisinage/i, /environnement/i, /commodit[eé]/i,
      /proximit[eé]/i, /transports?/i, /[ée]cole/i, /h[oô]pital/i,
      /march[eé]/i, /supermarch[eé]/i, /pharmacie/i, /banque/i,
      /s[eé]curit[eé]/i, /eau courante/i, /[ée]lectricit[eé]/i,
      /internet/i, /r[eé]seau/i, /qualit[eé] de vie/i,
      /ambiance/i, /vie (?:de )?quartier/i, /walk.?score/i,
    ],
    entityExtractors: [
      {
        type: 'city',
        pattern: /\b(Cotonou|Porto-Novo|Parakou|Abidjan|Ouagadougou|Lom[ée]|Dakar)\b/i,
      },
      {
        type: 'quartier',
        pattern: /quartier\s+(?:de\s+)?([\w\s-]+)/i,
      },
    ],
  },
  {
    intent: 'ESCROW_HELP',
    patterns: [
      /escrow/i, /transaction/i, /paiement/i, /d[eé]p[oô]t/i,
      /virement/i, /lib[eé]ration/i, /remboursement/i,
      /suivi(?: de)? (?:transaction|paiement|escrow)/i,
      /fonds? s[eé]curis[eé]/i, /garantie/i, /compte s[eé]questre/i,
      /statut (?:de )?(?:ma )?(?:transaction|paiement|escrow)/i,
      /frais de notaire/i, /commission/i,
    ],
    entityExtractors: [
      {
        type: 'transaction_id',
        pattern: /transaction\s+(?:id\s*)?:?\s*([\w-]+)/i,
      },
    ],
  },
  {
    intent: 'BOOKING',
    patterns: [
      /r[eé]serv(?:ation|er|ez)/i, /booking/i, /s[eé]jour/i,
      /h[oô]tel/i, /guesthouse/i, /maison d'h[oô]te/i,
      /nuit(?:s)?(?:e)?/i, /check-?in/i, /check-?out/i,
      /disponibil/i, /courte dur[eé]e/i, /location courte/i,
      /voyage/i, /tourisme/i, /visite/i,
    ],
    entityExtractors: [
      {
        type: 'city',
        pattern: /\b(Cotonou|Abidjan|Ouagadougou|Lom[ée]|Dakar)\b/i,
      },
      {
        type: 'dates',
        pattern: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
      },
    ],
  },
  {
    intent: 'HANDOFF',
    patterns: [
      /parler [aà] (?:un|une) (?:humain|agent|conseiller)/i,
      /service client/i, /support humain/i,
      /agent r[eé]el/i, /personne physique/i,
      /je veux parler [aà]/i, /contactez un agent/i,
      /arnaque/i, /escroquerie/i, /fraude/i, /plainte/i,
    ],
  },
];

/**
 * Classify user intent from a message, optionally using conversation history.
 * Uses pattern matching first, then optionally AI classification for ambiguous cases.
 */
export function classifyIntent(
  message: string,
  history?: HistoryMessage[]
): IntentResult {
  const lower = message.toLowerCase();

  // Step 1: Pattern-based classification with scoring
  const intentScores: Record<string, number> = {};
  const extractedEntities: Entity[] = [];

  for (const rule of INTENT_PATTERNS) {
    let score = 0;
    let matchCount = 0;

    for (const pattern of rule.patterns) {
      if (pattern.test(message)) {
        matchCount++;
        // Full word matches get higher scores
        const fullWordMatch = new RegExp(`\\b${pattern.source}\\b`, 'i').test(message);
        score += fullWordMatch ? 1.5 : 1;
      }
    }

    if (matchCount > 0) {
      intentScores[rule.intent] = score;

      // Extract entities from matching rules
      if (rule.entityExtractors) {
        for (const extractor of rule.entityExtractors) {
          const match = message.match(extractor.pattern);
          if (match?.[1]) {
            const value = extractor.transform
              ? extractor.transform(match[1])
              : match[1].trim();
            extractedEntities.push({
              type: extractor.type,
              value,
              confidence: 0.8,
            });
          }
        }
      }
    }
  }

  // Step 2: Find the highest-scoring intent
  let bestIntent: RebeccaIntent = 'GENERAL';
  let bestScore = 0;

  for (const [intent, score] of Object.entries(intentScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent as RebeccaIntent;
    }
  }

  // Step 3: Calculate confidence (normalize scores)
  const totalScore = Object.values(intentScores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(1, bestScore / totalScore) : 0;

  // Step 4: If no intent matched with sufficient confidence, default to GENERAL
  if (bestScore < 1) {
    return {
      intent: 'GENERAL',
      confidence: 0.3,
      entities: extractedEntities,
    };
  }

  // Step 5: Check for sub-intents (secondary intents)
  const subIntents = Object.entries(intentScores)
    .filter(([intent, score]) => intent !== bestIntent && score >= 1)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([intent]) => intent as RebeccaIntent);

  // Step 6: Use conversation history to refine intent
  if (history && history.length > 0) {
    const recentUserMessages = history
      .filter((m) => m.role === 'user')
      .slice(-3);

    // If user has been asking about properties, a follow-up might be about the same
    for (const prevMessage of recentUserMessages) {
      if (prevMessage.content.toLowerCase().includes('propriet') ||
          prevMessage.content.toLowerCase().includes('bien') ||
          prevMessage.content.toLowerCase().includes('maison')) {
        // Boost PROPERTY_SEARCH if it's a secondary intent
        if (bestIntent !== 'PROPERTY_SEARCH' && subIntents.includes('PROPERTY_SEARCH')) {
          // Keep the current best intent but note the context
        }
      }
    }
  }

  // Step 7: Override for HANDOFF — always prioritize
  if (bestIntent === 'HANDOFF') {
    return {
      intent: 'HANDOFF',
      confidence: Math.max(confidence, 0.9),
      entities: extractedEntities,
    };
  }

  return {
    intent: bestIntent,
    confidence: Math.round(confidence * 100) / 100,
    entities: deduplicateEntities(extractedEntities),
    subIntents,
  };
}

/**
 * Deduplicate entities by type, keeping the highest confidence one.
 */
function deduplicateEntities(entities: Entity[]): Entity[] {
  const byType = new Map<string, Entity>();

  for (const entity of entities) {
    const existing = byType.get(entity.type);
    if (!existing || entity.confidence > existing.confidence) {
      byType.set(entity.type, entity);
    }
  }

  return Array.from(byType.values());
}

/**
 * AI-enhanced intent classification using the LLM.
 * Used as a fallback when pattern matching gives low confidence.
 */
export async function classifyIntentWithAI(
  message: string,
  history?: HistoryMessage[]
): Promise<IntentResult> {
  // First try pattern-based
  const patternResult = classifyIntent(message, history);

  // If pattern-based classification has high confidence, use it
  if (patternResult.confidence >= 0.7) return patternResult;

  // Otherwise, use AI for disambiguation
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const historyContext = history
      ? history.slice(-5).map((m) => `${m.role}: ${m.content}`).join('\n')
      : '';

    const completion = await zai.chat.completions.create({
      model: 'glm-4-flash',
      messages: [
        {
          role: 'system',
          content: `Tu classifies les messages utilisateurs d'une plateforme immobilière ouest-africaine (AfriBayit).

Intents possibles:
- PROPERTY_SEARCH: recherche de biens immobiliers
- FINANCIAL_INQUIRY: questions sur le financement, crédit, ROI, rendement
- LEGAL_QUESTION: questions juridiques, documents fonciers, procédures
- NEIGHBORHOOD_INFO: informations sur quartier, commodités, environnement
- ESCROW_HELP: aide sur transactions escrow, paiements, suivi
- BOOKING: réservation hôtels, guesthouses, locations courte durée
- GENERAL: questions générales, salutations, hors sujet
- HANDOFF: demande de transfert vers un agent humain

Réponds UNIQUEMENT en JSON:
{
  "intent": "INTENT_NAME",
  "confidence": 0.0-1.0,
  "entities": [{"type": "entity_type", "value": "extracted_value"}]
}`,
        },
        {
          role: 'user',
          content: historyContext
            ? `Historique:\n${historyContext}\n\nMessage actuel: ${message}`
            : `Message: ${message}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 300,
    });

    const aiContent = completion.choices?.[0]?.message?.content || '';

    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const validIntents: RebeccaIntent[] = [
          'PROPERTY_SEARCH', 'FINANCIAL_INQUIRY', 'LEGAL_QUESTION',
          'NEIGHBORHOOD_INFO', 'ESCROW_HELP', 'BOOKING', 'GENERAL', 'HANDOFF',
        ];

        const aiIntent = validIntents.includes(parsed.intent)
          ? parsed.intent as RebeccaIntent
          : patternResult.intent;

        const aiConfidence = typeof parsed.confidence === 'number'
          ? parsed.confidence
          : patternResult.confidence;

        const aiEntities: Entity[] = Array.isArray(parsed.entities)
          ? parsed.entities
              .filter((e: { type?: string; value?: string }) => e.type && e.value)
              .map((e: { type: string; value: string }) => ({
                type: e.type,
                value: String(e.value),
                confidence: 0.7,
              }))
          : patternResult.entities;

        // Merge pattern entities with AI entities (pattern ones take precedence)
        const mergedEntities = deduplicateEntities([
          ...patternResult.entities,
          ...aiEntities,
        ]);

        return {
          intent: aiIntent,
          confidence: Math.round(aiConfidence * 100) / 100,
          entities: mergedEntities,
        };
      }
    } catch {
      // JSON parse failed, use pattern result
    }
  } catch (error) {
    console.error('[intent-classifier] AI classification error:', error);
  }

  return patternResult;
}
