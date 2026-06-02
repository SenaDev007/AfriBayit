// AfriBayit AVM — Automated Valuation Model Orchestrator
// Main entry point for property valuation

import ZAI from 'z-ai-web-dev-sdk';
import { findComparables, PropertyData } from './comparables';
import { calculateValuation, ValuationResult } from './valuation';
import { getMarketStats, MarketStats } from './market-data';

export type { PropertyData, Comparable } from './comparables';
export type { ValuationResult, Adjustment } from './valuation';
export type { MarketStats } from './market-data';
export { findComparables } from './comparables';
export { calculateValuation } from './valuation';
export { getMarketStats } from './market-data';

export interface AIValuationInsight {
  marketAnalysis: string;
  comparableInsight: string;
  pricePrediction: string;
  recommendations: string[];
  riskFactors: string[];
}

export interface FullValuationReport {
  valuation: ValuationResult;
  marketStats: MarketStats | null;
  comparables: { id: string; title: string; price: number; pricePerM2: number; similarity: number }[];
  aiInsight?: AIValuationInsight;
}

/**
 * Run a full AVM valuation for a property
 */
export async function runValuation(
  property: PropertyData
): Promise<FullValuationReport> {
  // Step 1: Find comparable properties
  const comps = await findComparables(property);

  // Step 2: Calculate valuation
  const valuation = calculateValuation(property, comps);

  // Step 3: Get market statistics
  const marketStats = await getMarketStats(property.city, property.country, property.type);

  // Step 4: Format comparables for response
  const comparables = comps.slice(0, 5).map((c) => ({
    id: c.property.id,
    title: `${c.property.type} ${c.property.transaction} — ${c.property.quartier}, ${c.property.city}`,
    price: c.property.price,
    pricePerM2: Math.round(c.pricePerM2),
    similarity: Math.round(c.similarityScore * 100),
  }));

  // Step 5: Get AI-powered valuation insights
  let aiInsight: AIValuationInsight | undefined;
  try {
    aiInsight = await getAIValuationInsight(property, valuation, comparables, marketStats);
  } catch (error) {
    console.error('AVM AI insight error (non-critical):', error);
    // AI insight is optional — valuation is still valid without it
  }

  return {
    valuation,
    marketStats,
    comparables,
    aiInsight,
  };
}

/**
 * Get AI-powered valuation insights using z.ai
 * Provides market analysis, comparable insights, price prediction, and recommendations
 */
async function getAIValuationInsight(
  property: PropertyData,
  valuation: ValuationResult,
  comparables: { id: string; title: string; price: number; pricePerM2: number; similarity: number }[],
  marketStats: MarketStats | null
): Promise<AIValuationInsight> {
  const zai = await ZAI.create();

  const prompt = `Tu es un expert en évaluation immobilière en Afrique de l'Ouest. Analyse les données suivantes et fournis des insights professionnels.

BIEN À ÉVALUER:
- Type: ${property.type}
- Transaction: ${property.transaction}
- Surface: ${property.surface} m²
- Chambres: ${property.bedrooms}, Salles de bain: ${property.bathrooms}
- Localisation: ${property.quartier || 'Non précisé'}, ${property.city}, ${property.country}
- Caractéristiques: ${property.features?.join(', ') || 'Aucune'}

ESTIMATION ALGORITHMIQUE:
- Valeur estimée: ${new Intl.NumberFormat('fr-FR').format(valuation.estimatedValue)} FCFA
- Prix au m²: ${new Intl.NumberFormat('fr-FR').format(valuation.pricePerM2)} FCFA/m²
- Confiance: ${valuation.confidenceScore}/100
- Tendance: ${valuation.marketTrend} (${valuation.trendPercentage > 0 ? '+' : ''}${valuation.trendPercentage}%)
- Fourchette: ${new Intl.NumberFormat('fr-FR').format(valuation.range.low)} - ${new Intl.NumberFormat('fr-FR').format(valuation.range.high)} FCFA

BIENS COMPARABLES (${comparables.length}):
${comparables.map((c, i) => `${i + 1}. ${c.title} — ${new Intl.NumberFormat('fr-FR').format(c.price)} FCFA (${new Intl.NumberFormat('fr-FR').format(c.pricePerM2)} FCFA/m², similarité: ${c.similarity}%)`).join('\n')}

STATISTIQUES MARCHÉ:
${marketStats ? `- Total annonces: ${marketStats.totalListings}
- Prix moyen: ${new Intl.NumberFormat('fr-FR').format(marketStats.averagePrice)} FCFA
- Prix médian: ${new Intl.NumberFormat('fr-FR').format(marketStats.medianPrice)} FCFA
- Tendance: ${marketStats.trend} (${marketStats.trendPercentage > 0 ? '+' : ''}${marketStats.trendPercentage}%)` : 'Non disponibles'}

Réponds UNIQUEMENT en JSON valide avec cette structure (pas de markdown, pas de commentaires):
{
  "marketAnalysis": "Analyse du marché immobilier local en 2-3 phrases",
  "comparableInsight": "Analyse des comparables et leur pertinence en 2-3 phrases",
  "pricePrediction": "Prédiction de l'évolution des prix sur 6-12 mois en 2-3 phrases",
  "recommendations": ["recommandation 1", "recommandation 2", "recommandation 3"],
  "riskFactors": ["risque 1", "risque 2"]
}`;

  const response = await zai.chat.completions.create({
    model: 'glm-4-flash',
    messages: [
      { role: 'system', content: 'Tu es un analyste immobilier expert. Tu réponds uniquement en JSON valide, sans markdown ni commentaires.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 1000,
  });

  const content = response.choices?.[0]?.message?.content || '';

  // Parse the JSON response
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        marketAnalysis: parsed.marketAnalysis || 'Analyse non disponible',
        comparableInsight: parsed.comparableInsight || 'Analyse des comparables non disponible',
        pricePrediction: parsed.pricePrediction || 'Prédiction non disponible',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        riskFactors: Array.isArray(parsed.riskFactors) ? parsed.riskFactors : [],
      };
    }
  } catch {
    // Fallback if JSON parsing fails
  }

  return {
    marketAnalysis: content.substring(0, 200) || 'Analyse IA temporairement indisponible',
    comparableInsight: 'Analyse des comparables non disponible',
    pricePrediction: 'Prédiction non disponible',
    recommendations: [],
    riskFactors: [],
  };
}
