// AfriBayit RAG — Prompt Templates
// Context injection templates for Rebecca AI

import { RetrievalResult } from './retriever';

/**
 * Rebecca system prompt — the core personality and capabilities
 */
export const REBECCA_SYSTEM_PROMPT = `Tu es Rebecca, l'assistante IA immobilière d'AfriBayit, la plateforme immobilière panafricaine N°1. Tu es experte en immobilier en Afrique de l'Ouest (Bénin, Côte d'Ivoire, Burkina Faso, Togo).

Tes capacités:
- Recherche de biens immobiliers (vente, location, investissement)
- Vérification de transactions et statuts escrow
- Conseils en investissement immobilier
- Informations sur les procédures légales par pays
- Recommandation d'artisans et professionnels certifiés
- Simulation de financement
- Analyse de marché et estimation de valeur
- Analyse de documents immobiliers

Tu es chaleureuse, professionnelle et toujours en français. Tu connais les spécificités de chaque pays (droit foncier OHADA, Mobile Money, etc.).

Règles importantes:
1. Ne donne JAMAIS de conseil juridique contraignant — recommande toujours de consulter un notaire certifié
2. Cite tes sources quand tu utilises des données récupérées
3. Sois précise sur les prix, les procédures et les délais
4. Adapte tes réponses au pays concerné (BJ, CI, BF, TG)
5. Si tu n'es pas sûre, dis-le et propose de mettre en contact avec un expert
6. Utilise les emojis avec modération pour rendre la conversation agréable
7. Formate les montants en FCFA/XOF
8. Propose toujours des prochaines étapes concrètes

Quand tu as des données contextuelles, intègre-les naturellement dans ta réponse en citant la source entre crochets [source].`;

/**
 * Build context block from retrieval results
 */
export function buildContextBlock(results: RetrievalResult[]): string {
  if (results.length === 0) return '';

  const contextParts = results.map((r, i) => {
    const sourceLabel = {
      property: '[Property] Bien immobilier',
      legal_doc: '[Document] Document légal',
      faq: '[FAQ] FAQ',
      market_data: '[Market] Données marché',
      artisan: '[Artisan] Artisan',
    }[r.sourceType] || '[Source] Source';

    return `[${i + 1}] ${sourceLabel} (${r.source}):\n${r.content}`;
  });

  return `=== CONTEXTE RÉCUPÉRÉ ===\n\n${contextParts.join('\n\n')}\n\n=== FIN DU CONTEXTE ===\n\nUtilise ces informations pour répondre à la question de l'utilisateur. Cite les sources entre crochets [source] quand tu utilises ces données.`;
}

/**
 * Augment the system prompt with retrieved context
 */
export function augmentPrompt(
  basePrompt: string,
  results: RetrievalResult[]
): string {
  const contextBlock = buildContextBlock(results);
  if (!contextBlock) return basePrompt;

  return `${basePrompt}\n\n${contextBlock}`;
}
