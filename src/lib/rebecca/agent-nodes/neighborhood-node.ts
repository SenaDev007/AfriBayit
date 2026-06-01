// AfriBayit — Neighborhood Analyzer Agent Node
// Provides neighborhood analysis including amenities, transport, safety, and walk score

import { db } from '@/lib/db';

export interface NeighborhoodAnalysisState {
  city: string;
  country: string;
  quartier?: string;
  analysis: {
    overallScore: number;
    amenities: Array<{ type: string; name: string; distance: string }>;
    transport: Array<{ type: string; description: string }>;
    safety: string;
    utilities: Array<{ type: string; available: boolean }>;
    marketData: {
      avgPricePerM2: number;
      priceTrend: 'rising' | 'stable' | 'declining';
      demandLevel: 'high' | 'medium' | 'low';
    };
  };
  summary: string;
}

export async function executeNeighborhoodNode(
  state: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const entities = (state.entities as Array<{ type: string; value: string }>) || [];
  const message = (state.userMessage as string) || '';

  // Extract location from entities
  let city = 'Cotonou';
  let country = 'BJ';
  let quartier: string | undefined;

  for (const entity of entities) {
    if (entity.type === 'city') city = entity.value;
    if (entity.type === 'country' && ['BJ', 'CI', 'BF', 'TG', 'SN'].includes(entity.value)) {
      country = entity.value;
    }
    if (entity.type === 'quartier') quartier = entity.value;
  }

  // Extract from message if not found in entities
  if (!quartier) {
    const quartierMatch = message.match(/quartier\s+(?:de\s+)?([\w\s-]+)/i);
    if (quartierMatch) quartier = quartierMatch[1].trim();
  }

  // Get market data from database
  const marketData = await getMarketData(city, country);

  // Build neighborhood analysis
  const analysis = buildNeighborhoodAnalysis(city, country, quartier, marketData);

  const summary = buildNeighborhoodSummary(city, quartier, analysis, marketData);

  return {
    ...state,
    neighborhood: {
      city,
      country,
      quartier,
      analysis,
      summary,
    } satisfies NeighborhoodAnalysisState,
  };
}

async function getMarketData(city: string, country: string) {
  try {
    const properties = await db.property.findMany({
      where: {
        city: { contains: city, mode: 'insensitive' },
        country,
        status: 'published',
        surface: { gt: 0 },
      },
      select: { price: true, surface: true, createdAt: true },
      take: 100,
    });

    if (properties.length === 0) {
      return {
        avgPricePerM2: 0,
        priceTrend: 'stable' as const,
        demandLevel: 'medium' as const,
      };
    }

    const pricePerM2List = properties
      .filter((p) => p.surface > 0)
      .map((p) => p.price / p.surface);

    const avgPricePerM2 = pricePerM2List.length > 0
      ? Math.round(pricePerM2List.reduce((a, b) => a + b, 0) / pricePerM2List.length)
      : 0;

    // Simple trend analysis: compare older vs newer listings
    const sorted = [...properties].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const half = Math.floor(sorted.length / 2);
    const olderAvg = sorted.slice(0, half).reduce((s, p) => s + p.price, 0) / Math.max(half, 1);
    const newerAvg = sorted.slice(half).reduce((s, p) => s + p.price, 0) / Math.max(sorted.length - half, 1);

    const priceChange = olderAvg > 0 ? (newerAvg - olderAvg) / olderAvg : 0;
    const priceTrend = priceChange > 0.05 ? 'rising' : priceChange < -0.05 ? 'declining' : 'stable';

    const demandLevel = properties.length > 50 ? 'high' : properties.length > 20 ? 'medium' : 'low';

    return { avgPricePerM2, priceTrend, demandLevel };
  } catch (error) {
    console.error('[neighborhood-node] Market data error:', error);
    return {
      avgPricePerM2: 0,
      priceTrend: 'stable' as const,
      demandLevel: 'medium' as const,
    };
  }
}

function buildNeighborhoodAnalysis(
  city: string,
  country: string,
  quartier: string | undefined,
  marketData: { avgPricePerM2: number; priceTrend: string; demandLevel: string }
): NeighborhoodAnalysisState['analysis'] {
  // Build analysis based on city and country knowledge
  const cityLower = city.toLowerCase();

  // Amenities vary by city
  const amenities: Array<{ type: string; name: string; distance: string }> = [];
  const transport: Array<{ type: string; description: string }> = [];
  const utilities: Array<{ type: string; available: boolean }> = [];

  // Default amenities for major cities
  if (['cotonou', 'abidjan', 'ouagadougou', 'lomé', 'dakar'].includes(cityLower)) {
    amenities.push(
      { type: 'hospital', name: 'Hôpital de zone', distance: '2-5 km' },
      { type: 'school', name: 'École primaire', distance: '0.5-2 km' },
      { type: 'market', name: 'Marché central', distance: '1-3 km' },
      { type: 'bank', name: 'Banque/ATM', distance: '1-3 km' },
      { type: 'pharmacy', name: 'Pharmacie', distance: '0.5-1 km' },
    );

    transport.push(
      { type: 'taxi', description: 'Taxis-motos et taxis ville disponibles' },
      { type: 'bus', description: 'Transport en commun disponible' },
    );
  } else {
    amenities.push(
      { type: 'school', name: 'École', distance: '1-5 km' },
      { type: 'market', name: 'Marché local', distance: '1-3 km' },
      { type: 'pharmacy', name: 'Pharmacie', distance: '1-5 km' },
    );

    transport.push(
      { type: 'taxi', description: 'Taxis-motos disponibles' },
    );
  }

  // Utilities availability by country
  utilities.push(
    { type: 'Électricité', available: true },
    { type: 'Eau courante', available: ['cotonou', 'abidjan', 'ouagadougou', 'lomé', 'dakar'].includes(cityLower) },
    { type: 'Internet', available: true },
    { type: 'Réseau mobile', available: true },
  );

  // Safety assessment
  const safetyByCity: Record<string, string> = {
    'cotonou': 'Bonne sécurité générale. Quartiers résidentiels bien sécurisés.',
    'abidjan': 'Sécurité variable selon les communes. Zone Nord et Plateau bien sécurisées.',
    'ouagadougou': 'Sécurité satisfaisante dans les zones résidentielles. Vigilance recommandée.',
    'lomé': 'Bonne sécurité en général. Quartiers centraux bien éclairés.',
    'dakar': 'Sécurité bonne dans les zones résidentielles. Almadie et Plateau recommandés.',
  };
  const safety = safetyByCity[cityLower] || 'Renseignez-vous sur la sécurité locale auprès des résidents.';

  // Overall score (0-100)
  let overallScore = 60; // Base
  if (marketData.demandLevel === 'high') overallScore += 15;
  if (marketData.priceTrend === 'rising') overallScore += 10;
  if (['cotonou', 'abidjan', 'dakar'].includes(cityLower)) overallScore += 10;
  overallScore = Math.min(100, overallScore);

  return {
    overallScore,
    amenities,
    transport,
    safety,
    utilities,
    marketData: {
      avgPricePerM2: marketData.avgPricePerM2,
      priceTrend: marketData.priceTrend as 'rising' | 'stable' | 'declining',
      demandLevel: marketData.demandLevel as 'high' | 'medium' | 'low',
    },
  };
}

function buildNeighborhoodSummary(
  city: string,
  quartier: string | undefined,
  analysis: NeighborhoodAnalysisState['analysis'],
  marketData: { avgPricePerM2: number; priceTrend: string; demandLevel: string }
): string {
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);
  const location = quartier ? `${quartier}, ${city}` : city;

  let summary = `📍 Analyse de ${location}:\n`;
  summary += `Score global: ${analysis.overallScore}/100\n\n`;

  if (marketData.avgPricePerM2 > 0) {
    summary += `💰 Prix moyen: ${fmt(marketData.avgPricePerM2)} FCFA/m² `;
    summary += `(${marketData.priceTrend === 'rising' ? '📈 en hausse' : marketData.priceTrend === 'declining' ? '📉 en baisse' : '➡️ stable'})\n`;
    summary += `Demande: ${marketData.demandLevel === 'high' ? '🔴 forte' : marketData.demandLevel === 'medium' ? '🟡 moyenne' : '🟢 faible'}\n\n`;
  }

  summary += `🏢 Commodités: ${analysis.amenities.length} services à proximité\n`;
  summary += `🚌 Transport: ${analysis.transport.map((t) => t.type).join(', ')}\n`;
  summary += `🔒 Sécurité: ${analysis.safety}\n`;

  const availableUtilities = analysis.utilities.filter((u) => u.available).map((u) => u.type);
  summary += `⚡ Services: ${availableUtilities.join(', ')}`;

  return summary;
}
