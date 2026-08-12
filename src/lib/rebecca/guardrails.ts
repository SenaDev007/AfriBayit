// AfriBayit — Rebecca AI Nemo-style Guardrails
// Input sanitization and safety checks for Rebecca AI conversations

export interface GuardrailResult {
  allowed: boolean;
  reason?: string;
  sanitized?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

/**
 * Apply guardrails to user input before processing by Rebecca AI.
 * Blocks prompt injection, PII requests, and sanitizes XSS.
 */
export function applyGuardrails(message: string): GuardrailResult {
  // Step 1: Check for prompt injection attempts
  const injectionPatterns = [
    /ignore\s+previous/i,
    /ignore\s+above/i,
    /system\s*prompt/i,
    /you\s+are\s+now/i,
    /forget\s+everything/i,
    /disregard\s+(all|previous|above)/i,
    /new\s+instructions/i,
    /override\s+(your|the)\s+(instructions|rules)/i,
    /pretend\s+you\s+are/i,
    /act\s+as\s+(if\s+you\s+are|a)/i,
    /jailbreak/i,
    /DAN\s+mode/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(message)) {
      return {
        allowed: false,
        reason: 'Tentative d\'injection de prompt détectée',
        riskLevel: 'high',
      };
    }
  }

  // Step 2: Block personal data requests (PII)
  const piiPatterns = [
    /numéro\s+de\s+carte/i,
    /carte\s+bancaire/i,
    /carte\s+de\s+crédit/i,
    /mot\s+de\s+passe/i,
    /code\s+pin/i,
    /CVV/i,
    /numéro\s+de\s+sécurité\s+sociale/i,
    /numéro\s+d\'assurance/i,
    /RIB/i,
    /IBAN/i,
    /numéro\s+de\s+compte\s+bancaire/i,
  ];

  for (const pattern of piiPatterns) {
    if (pattern.test(message)) {
      return {
        allowed: false,
        reason: 'Demande de données personnelles bloquée',
        riskLevel: 'high',
      };
    }
  }

  // Step 3: Sanitize potential XSS
  let sanitized = message.replace(/<[^>]*>/g, '');

  // Step 4: Check for suspicious URLs
  const suspiciousUrlPattern = /(https?:\/\/[^\s]*\.(exe|bat|cmd|scr|pif|msi|js|vbs)\b)/i;
  if (suspiciousUrlPattern.test(message)) {
    sanitized = sanitized.replace(suspiciousUrlPattern, '[lien supprimé pour sécurité]');
  }

  // Step 5: Check for excessive length (potential DoS)
  if (message.length > 5000) {
    return {
      allowed: false,
      reason: 'Message trop long (maximum 5000 caractères)',
      riskLevel: 'medium',
    };
  }

  // Step 6: Detect spam patterns
  const spamPatterns = [
    /(.)\1{20,}/, // Repeated characters
    /(http[s]?:\/\/[^\s]+(\s+http[s]?:\/\/[^\s]+){4,})/, // Multiple URLs
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(message)) {
      return {
        allowed: false,
        reason: 'Contenu considéré comme spam détecté',
        riskLevel: 'medium',
      };
    }
  }

  return {
    allowed: true,
    sanitized: sanitized.trim(),
    riskLevel: 'low',
  };
}

/**
 * Validate that Rebecca's response doesn't leak sensitive information
 */
export function validateRebeccaResponse(response: string): GuardrailResult {
  // Block if response contains system prompt fragments
  const systemPromptFragments = [
    'REBECCA_SYSTEM_PROMPT',
    'Tu es Rebecca',
    'instructions système',
  ];

  for (const fragment of systemPromptFragments) {
    if (response.includes(fragment) && response.length < 200) {
      return {
        allowed: false,
        reason: 'Réponse contient des fragments de prompt système',
        riskLevel: 'high',
      };
    }
  }

  // Block if response contains raw internal data structures
  if (/```(json|typescript|javascript)/i.test(response) && response.includes('apiKey')) {
    return {
      allowed: false,
      reason: 'Réponse contient des données internes sensibles',
      riskLevel: 'high',
    };
  }

  return {
    allowed: true,
    sanitized: response,
    riskLevel: 'low',
  };
}
