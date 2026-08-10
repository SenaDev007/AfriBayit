// AfriBayit — Rebecca AI Human Handoff Logic
// Determines when to transfer conversation from AI to human agent

export interface HandoffContext {
  message: string;
  sentiment: string;
  consecutiveFailures: number;
  userId?: string;
  sessionId?: string;
}

export interface HandoffResult {
  shouldHandoff: boolean;
  reason?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  department?: string;
}

/**
 * Determine if the conversation should be handed off to a human agent.
 *
 * Handoff triggers:
 * - 2+ consecutive failures
 * - Legal questions requiring a professional
 * - Explicit human request
 * - Very negative sentiment
 * - Dispute or conflict
 * - Complex financial decisions
 */
export function shouldHandoffToHuman(context: HandoffContext): HandoffResult {
  const { message, sentiment, consecutiveFailures } = context;

  // 1. Consecutive failures — user is frustrated with AI responses
  if (consecutiveFailures >= 2) {
    return {
      shouldHandoff: true,
      reason: 'Échecs consécutifs — l\'utilisateur semble frustré',
      priority: consecutiveFailures >= 4 ? 'urgent' : 'high',
      department: 'support',
    };
  }

  // 2. Legal questions requiring a professional
  const legalPatterns = [
    /avocat/i,
    /juriste/i,
    /contentieux/i,
    /litige/i,
    /tribunal/i,
    /poursuite\s+judiciaire/i,
    /recours\s+(en\s+)?justice/i,
    /dossier\s+juridique/i,
    /conseil\s+juridique/i,
  ];

  for (const pattern of legalPatterns) {
    if (pattern.test(message)) {
      return {
        shouldHandoff: true,
        reason: 'Question juridique détectée — transfert vers un notaire/juriste',
        priority: 'high',
        department: 'legal',
      };
    }
  }

  // 3. Explicit request to speak with a human
  const humanRequestPatterns = [
    /parler\s+(à|au|avec)\s+un\s+humain/i,
    /un\s+(vrai\s+)?agent/i,
    /un\s+conseiller/i,
    /service\s+client/i,
    /support\s+humain/i,
    /personne\s+physique/i,
    /je\s+veux\s+parler\s+à/i,
    /contactez\s+un\s+agent/i,
    /agent\s+réel/i,
  ];

  for (const pattern of humanRequestPatterns) {
    if (pattern.test(message)) {
      return {
        shouldHandoff: true,
        reason: 'Demande explicite de contact humain',
        priority: 'medium',
        department: 'support',
      };
    }
  }

  // 4. Very negative sentiment
  if (sentiment === 'very_negative') {
    return {
      shouldHandoff: true,
      reason: 'Sentiment très négatif détecté',
      priority: 'high',
      department: 'support',
    };
  }

  // 5. Dispute or conflict related to a transaction
  const disputePatterns = [
    /escroquerie/i,
    /arnaque/i,
    /fraude/i,
    /plainte/i,
    /remboursement\s+immédiat/i,
    /je\s+vais\s+porter\s+plainte/i,
  ];

  for (const pattern of disputePatterns) {
    if (pattern.test(message)) {
      return {
        shouldHandoff: true,
        reason: 'Signalement de litige ou fraude détecté',
        priority: 'urgent',
        department: 'dispute',
      };
    }
  }

  // 6. Complex financial decisions beyond AI scope
  const complexFinancialPatterns = [
    /investissement\s+(de\s+)?\d{2,}/i,
    /plus\s+de\s+\d+\s+millions/i,
    /montant\s+très\s+important/i,
    /transaction\s+internationale/i,
  ];

  for (const pattern of complexFinancialPatterns) {
    if (pattern.test(message)) {
      return {
        shouldHandoff: true,
        reason: 'Décision financière complexe — transfert vers un conseiller',
        priority: 'medium',
        department: 'financial',
      };
    }
  }

  return {
    shouldHandoff: false,
    priority: 'low',
  };
}

/**
 * Build the handoff message for the human agent
 */
export function buildHandoffMessage(context: HandoffContext): string {
  const parts: string[] = [];

  parts.push(`[TRANSFER] Transfert vers un agent humain`);
  parts.push(`Raison: ${context.consecutiveFailures > 0 ? `${context.consecutiveFailures} échecs consécutifs` : 'Demande utilisateur'}`);
  if (context.sentiment !== 'neutral' && context.sentiment !== 'positive') {
    parts.push(`Sentiment: ${context.sentiment}`);
  }

  return parts.join('\n');
}
