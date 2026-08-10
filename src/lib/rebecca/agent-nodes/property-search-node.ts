// AfriBayit — Property Search Agent Node
// Searches properties based on extracted criteria from user intent

import { db } from '@/lib/db';

export interface PropertySearchState {
  properties: Array<{
    id: string;
    title: string;
    type: string;
    transaction: string;
    price: number;
    surface: number;
    bedrooms: number;
    city: string;
    quartier: string;
    country: string;
    verified: boolean;
    geoTrust: boolean;
    images: string[];
    features: string[];
    agentName?: string;
  }>;
  totalCount: number;
  searchCriteria: Record<string, unknown>;
  summary: string;
}

export async function executePropertySearchNode(
  state: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const entities = (state.entities as Array<{ type: string; value: string }>) || [];

  // Extract search criteria from entities
  const criteria: Record<string, unknown> = {};

  for (const entity of entities) {
    switch (entity.type) {
      case 'property_type':
        criteria.type = entity.value.toLowerCase();
        break;
      case 'transaction_type':
        criteria.transaction = entity.value.toLowerCase();
        break;
      case 'city':
        criteria.city = entity.value;
        break;
      case 'country':
        if (['BJ', 'CI', 'BF', 'TG', 'SN'].includes(entity.value)) {
          criteria.country = entity.value;
        }
        break;
      case 'budget': {
        const budget = parseInt(entity.value.replace(/\s/g, ''), 10);
        if (!isNaN(budget)) criteria.maxPrice = budget;
        break;
      }
    }
  }

  // Also check the original message for additional context
  const message = (state.userMessage as string) || '';
  const budgetMatch = message.match(/(\d[\d\s]*)\s*(?:fcfa|xof|cfa)/i);
  if (budgetMatch && !criteria.maxPrice) {
    const budget = parseInt(budgetMatch[1].replace(/\s/g, ''), 10);
    if (!isNaN(budget)) criteria.maxPrice = budget;
  }

  const bedroomMatch = message.match(/(\d+)\s*(?:chambre|pi[eè]ce)/i);
  if (bedroomMatch) criteria.minBedrooms = parseInt(bedroomMatch[1], 10);

  // Build database query
  const where: Record<string, unknown> = { status: 'published' };
  if (criteria.type) where.type = criteria.type;
  if (criteria.transaction) where.transaction = criteria.transaction;
  if (criteria.city) where.city = criteria.city;
  if (criteria.country) where.country = criteria.country;
  if (criteria.minBedrooms) where.bedrooms = { gte: criteria.minBedrooms };
  if (criteria.maxPrice) where.price = { lte: criteria.maxPrice };

  try {
    const properties = await db.property.findMany({
      where,
      take: 8,
      orderBy: [
        { premium: 'desc' },
        { verified: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        owner: { select: { name: true, verified: true } },
      },
    });

    const totalCount = await db.property.count({ where });

    const formatted = properties.map((p) => {
      let images: string[] = [];
      try { images = p.images ? JSON.parse(p.images) : []; } catch { images = []; }
      let features: string[] = [];
      try { features = p.features ? JSON.parse(p.features) : []; } catch { features = []; }

      return {
        id: p.id,
        title: p.title,
        type: p.type,
        transaction: p.transaction,
        price: p.price,
        surface: p.surface,
        bedrooms: p.bedrooms,
        city: p.city,
        quartier: p.quartier,
        country: p.country,
        verified: p.verified,
        geoTrust: p.geoTrust,
        images: Array.isArray(images) ? images.slice(0, 2) : [],
        features: Array.isArray(features) ? features.slice(0, 5) : [],
        agentName: p.owner?.name,
      };
    });

    const summary = buildSearchSummary(formatted, criteria, totalCount);

    return {
      ...state,
      propertySearch: {
        properties: formatted,
        totalCount,
        searchCriteria: criteria,
        summary,
      } satisfies PropertySearchState,
    };
  } catch (error) {
    console.error('[property-search-node] DB error:', error);
    return {
      ...state,
      propertySearch: {
        properties: [],
        totalCount: 0,
        searchCriteria: criteria,
        summary: 'Erreur lors de la recherche de biens. Veuillez réessayer.',
      } satisfies PropertySearchState,
    };
  }
}

function buildSearchSummary(
  properties: PropertySearchState['properties'],
  criteria: Record<string, unknown>,
  totalCount: number
): string {
  if (properties.length === 0) {
    const critStr = Object.entries(criteria)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    return `Aucun bien trouvé avec les critères: ${critStr || 'aucun'}. Essayez d'élargir votre recherche.`;
  }

  const priceRange = properties.length > 0
    ? `${new Intl.NumberFormat('fr-FR').format(Math.min(...properties.map((p) => p.price)))} - ${new Intl.NumberFormat('fr-FR').format(Math.max(...properties.map((p) => p.price)))} FCFA`
    : '';

  return `${totalCount} bien(s) trouvé(s)${priceRange ? ` (${priceRange})` : ''}. Voici les ${properties.length} meilleurs résultats.`;
}
