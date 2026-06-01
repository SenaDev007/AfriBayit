// AfriBayit — Rebecca AI Document Analysis Endpoint
// POST /api/rebecca/analyze-document — AI-powered document analysis

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { documentText, documentType, country, imageUrl } = body as {
      documentText?: string;
      documentType?: string;
      country?: string;
      imageUrl?: string;
    };

    if (!documentText && !imageUrl) {
      return NextResponse.json(
        { error: 'documentText ou imageUrl est requis' },
        { status: 400 }
      );
    }

    // Build analysis prompt based on document type
    const analysisPrompt = buildAnalysisPrompt(documentType, country);

    let analysisResult: Record<string, unknown>;

    try {
      const { default: ZAI } = await import('z-ai-web-dev-sdk');
      const zai = new ZAI();

      if (imageUrl) {
        // Use VLM for image-based document analysis
        const messages = [
          {
            role: 'system' as const,
            content: analysisPrompt,
          },
          {
            role: 'user' as const,
            content: imageUrl
              ? `Analyse ce document immobilier. Image: ${imageUrl}`
              : `Analyse ce document immobilier:\n\n${documentText}`,
          },
        ];

        const completion = await zai.chat.completions.create({
          model: 'glm-4-flash',
          messages,
          temperature: 0.3,
          max_tokens: 1200,
        });

        const aiContent = completion.choices?.[0]?.message?.content || '';

        analysisResult = {
          analysis: aiContent,
          source: 'vlm',
        };
      } else {
        // Text-based document analysis
        const completion = await zai.chat.completions.create({
          model: 'glm-4-flash',
          messages: [
            { role: 'system', content: analysisPrompt },
            { role: 'user', content: `Analyse ce document immobilier:\n\n${documentText}` },
          ],
          temperature: 0.3,
          max_tokens: 1200,
        });

        const aiContent = completion.choices?.[0]?.message?.content || '';

        analysisResult = {
          analysis: aiContent,
          source: 'text-analysis',
        };
      }

      // Structure the analysis result
      const structured = structureAnalysis(analysisResult.analysis as string, documentType, country);

      return NextResponse.json({
        success: true,
        ...structured,
      });
    } catch (aiError) {
      console.error('Document analysis AI error:', aiError);

      // Fallback: simple keyword-based analysis
      if (documentText) {
        const fallback = basicDocumentAnalysis(documentText, documentType, country);
        return NextResponse.json({
          success: true,
          ...fallback,
          note: 'Analyse basique (IA temporairement indisponible)',
        });
      }

      return NextResponse.json(
        { error: 'Erreur d\'analyse IA. Veuillez réessayer.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Document analysis API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse du document' },
      { status: 500 }
    );
  }
}

/**
 * Build analysis prompt based on document type
 */
function buildAnalysisPrompt(documentType?: string, country?: string): string {
  const basePrompt = `Tu es Rebecca, l'IA d'AfriBayit spécialisée dans l'analyse de documents immobiliers en Afrique de l'Ouest.

Analyse le document fourni et extrais les informations clés. Ta réponse doit être structurée en JSON avec les sections suivantes:

{
  "documentType": "type identifié du document",
  "parties": ["liste des parties mentionnées"],
  "property": {
    "description": "description du bien",
    "address": "adresse",
    "surface": "surface si mentionnée",
    "type": "type de bien"
  },
  "financial": {
    "amount": "montant mentionné",
    "currency": "devise"
  },
  "keyDates": ["dates importantes"],
  "completeness": {
    "score": 0-100,
    "missing": ["éléments manquants"]
  },
  "inconsistencies": ["incohérences détectées"],
  "recommendations": ["recommandations"],
  "riskLevel": "low/medium/high"
}`;

  const typeSpecific: Record<string, string> = {
    titre_foncier: `\n\nCe document semble être un Titre Foncier. Vérifie: le numéro TF, le nom du titulaire, la superficie, les limites, les charges éventuelles, et la conformité avec la législation de ${country || 'Afrique de l\'Ouest'}.`,
    acd: `\n\nCe document semble être une ACD (Attestation de Custom Déguerpissement). Vérifie: la mairie émettrice, le nom du bénéficiaire, la localisation, et les limitations de ce document par rapport à un Titre Foncier.`,
    permis_construire: `\n\nCe document semble être un Permis de Construire. Vérifie: le titulaire, l'adresse du projet, la conformité urbanistique, la date de délivrance et la validité.`,
    acte_cession: `\n\nCe document semble être un Acte de Cession. Vérifie: les parties (cédant/cessionnaire), le prix, les conditions, les garanties, et si un notaire est impliqué.`,
    compromis: `\n\nCe document semble être un Compromis de Vente. Vérifie: les parties, le bien, le prix, les conditions suspensives, le délai de réalisation, et les clauses de pénalité.`,
  };

  return basePrompt + (documentType && typeSpecific[documentType] ? typeSpecific[documentType] : '');
}

/**
 * Structure the AI analysis into a standardized format
 */
function structureAnalysis(
  analysisText: string,
  documentType?: string,
  country?: string
): Record<string, unknown> {
  // Try to parse as JSON if the AI returned structured data
  try {
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ...parsed,
        documentType: parsed.documentType || documentType,
        country,
        rawAnalysis: analysisText,
      };
    }
  } catch {
    // Not valid JSON, use text as-is
  }

  return {
    documentType: documentType || 'unknown',
    rawAnalysis: analysisText,
    country,
    completeness: { score: 0, missing: ['Analyse structurée non disponible'] },
    note: 'L\'analyse n\'a pas pu être structurée automatiquement',
  };
}

/**
 * Basic keyword-based document analysis (fallback)
 */
function basicDocumentAnalysis(
  text: string,
  documentType?: string,
  country?: string
): Record<string, unknown> {
  const lower = text.toLowerCase();

  // Extract potential amounts
  const amountMatches = text.match(/(\d[\d\s]*)\s*(?:fcfa|xof|cfa|franc|€|eur|dollars?|\$)/gi) || [];

  // Extract potential dates
  const dateMatches = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}/gi) || [];

  // Check for key legal terms
  const legalTerms = [
    'titre foncier', 'acd', 'permis de construire', 'acte de vente',
    'compromis', 'notaire', 'enregistrement', 'mutation', 'bornage',
    'certificat', 'attestation', 'arrêté', 'concession',
  ];

  const foundTerms = legalTerms.filter((term) => lower.includes(term));

  // Determine document type if not provided
  const detectedType = documentType || (() => {
    if (lower.includes('titre foncier')) return 'titre_foncier';
    if (lower.includes('acd') || lower.includes('custom déguerpissement')) return 'acd';
    if (lower.includes('permis de construire')) return 'permis_construire';
    if (lower.includes('acte de cession') || lower.includes('acte de vente')) return 'acte_cession';
    if (lower.includes('compromis')) return 'compromis';
    return 'unknown';
  })();

  // Basic completeness check
  const missingElements: string[] = [];
  if (!lower.includes('signature') && !lower.includes('signé')) missingElements.push('Signature manquante détectée');
  if (amountMatches.length === 0) missingElements.push('Aucun montant financier détecté');
  if (dateMatches.length === 0) missingElements.push('Aucune date détectée');

  const completenessScore = Math.max(10, 80 - missingElements.length * 20);

  return {
    documentType: detectedType,
    detectedTerms: foundTerms,
    extractedAmounts: amountMatches,
    extractedDates: dateMatches,
    completeness: {
      score: completenessScore,
      missing: missingElements,
    },
    inconsistencies: [],
    recommendations: [
      'Faire vérifier le document par un notaire certifié',
      'Vérifier l\'authenticité auprès des services fonciers',
      country ? `Valider selon la législation de ${country}` : 'Valider selon la législation locale',
    ],
    riskLevel: completenessScore >= 60 ? 'low' : completenessScore >= 40 ? 'medium' : 'high',
    country,
  };
}
