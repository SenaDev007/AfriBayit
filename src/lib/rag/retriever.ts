// AfriBayit RAG — Document Retriever Module (audit-10 / C2)
// CDC §8.1.2: Retrieves relevant context using pgvector ANN search.
// Falls back to keyword-based search when embeddings are not available.

import { db } from '@/lib/db';
import { tokenize, keywordSimilarity, generateEmbedding, toPgVector, cosineSimilarity } from './embedder';

export interface RetrievalResult {
  content: string;
  source: string;
  sourceType: 'property' | 'legal_doc' | 'faq' | 'market_data' | 'artisan';
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Search properties using pgvector ANN (cosine similarity) with keyword fallback.
 *
 * Strategy:
 *   1. Generate embedding for the query
 *   2. Try pgvector ANN search: SELECT ... ORDER BY embedding <=> query_vector LIMIT N
 *   3. If pgvector fails (extension not installed, no embeddings), fall back to
 *      keyword-based search (the previous approach)
 */
export async function searchProperties(
  query: string,
  country?: string,
  limit = 5
): Promise<RetrievalResult[]> {
  try {
    // Try pgvector ANN search first
    const queryEmbedding = await generateEmbedding(query);
    const hasNonZero = queryEmbedding.some((v) => v !== 0);

    if (hasNonZero) {
      try {
        const vectorLiteral = toPgVector(queryEmbedding);
        // Build the raw SQL query with pgvector cosine distance operator (<=>)
        // Lower distance = higher similarity. We convert to a 0-1 score.
        const countryFilter = country ? `AND country = $2` : '';
        const params: unknown[] = [vectorLiteral, ...(country ? [country.toUpperCase()] : []), limit];

        const results = await db.$queryRawUnsafe<{
          id: string; title: string; slug: string | null;
          type: string; transaction: string; price: number; currency: string;
          surface: number; bedrooms: number; bathrooms: number; rooms: number;
          city: string; country: string; quartier: string; description: string;
          features: unknown; images: unknown; verified: boolean; geoTrust: boolean;
          premium: boolean; investmentScore: number | null;
          agentName: string | null;
          distance: number;
        }[]>(`
          SELECT
            p.id, p.title, p.slug, p.type, p.transaction, p.price, p.currency,
            p.surface, p.bedrooms, p.bathrooms, p.rooms, p.city, p.country,
            p.quartier, p.description, p.features, p.images,
            p.verified, p."geoTrust", p.premium, p."investmentScore",
            u.name as "agentName",
            (p.embedding <=> $1::vector) as distance
          FROM properties p
          LEFT JOIN users u ON p."agentId" = u.id
          WHERE p.status = 'published'
            AND p.embedding IS NOT NULL
            ${countryFilter}
          ORDER BY p.embedding <=> $1::vector
          LIMIT $${country ? 3 : 2}
        `, ...params);

        if (results.length > 0) {
          // Convert distance (0=identical, 2=opposite) to similarity score (0-1)
          return results.map((row) => {
            const features = Array.isArray(row.features) ? row.features as string[] : [];
            const images = Array.isArray(row.images) ? row.images as string[] : [];
            const similarity = 1 - (row.distance / 2);

            return {
              content: `**${row.title}** — ${row.type} ${row.transaction} à ${row.city}, ${row.quartier} (${row.country})\n` +
                `Prix: ${new Intl.NumberFormat('fr-FR').format(row.price)} ${row.currency}\n` +
                `Surface: ${row.surface}m² | ${row.bedrooms}ch | ${row.bathrooms}sdb\n` +
                `Description: ${(row.description || '').slice(0, 300)}...\n` +
                `Caractéristiques: ${features.join(', ')}\n` +
                `Vérifié: ${row.verified ? '[OUI]' : '[NON]'} | GeoTrust: ${row.geoTrust ? '[OUI]' : '[NON]'}\n` +
                `Agent: ${row.agentName || 'N/A'}`,
              source: `property:${row.id}`,
              sourceType: 'property' as const,
              score: Math.max(0.1, similarity), // Floor at 0.1 so results always appear
              metadata: {
                id: row.id, price: row.price, city: row.city, country: row.country,
                type: row.type, transaction: row.transaction, surface: row.surface,
                bedrooms: row.bedrooms, images: images.slice(0, 2),
                searchMethod: 'pgvector',
              },
            };
          });
        }
      } catch (pgvectorError) {
        // pgvector not available or no embeddings — fall through to keyword search
        console.info('[RAG] pgvector search failed, falling back to keyword search:', pgvectorError instanceof Error ? pgvectorError.message : 'unknown');
      }
    }

    // Fallback: keyword-based search (the previous approach)
    return searchPropertiesByKeyword(query, country, limit);
  } catch (error) {
    console.error('Property search error in RAG retriever:', error);
    return [];
  }
}

/**
 * Keyword-based property search (fallback when pgvector is not available)
 */
async function searchPropertiesByKeyword(
  query: string,
  country?: string,
  limit = 5
): Promise<RetrievalResult[]> {
  const queryTokens = tokenize(query);

  const where: Record<string, unknown> = { status: 'published' };
  if (country) where.country = country;

  const properties = await db.property.findMany({
    where,
    take: 50,
    include: { owner: { select: { name: true, verified: true } } },
  });

  const scored = properties.map((p) => {
    const features = Array.isArray(p.features) ? p.features : [];
    const docText = `${p.title} ${p.description} ${p.type} ${p.transaction} ${p.city} ${p.quartier} ${p.country} ${features.join(' ')}`;
    const docTokens = tokenize(docText);
    const score = keywordSimilarity(queryTokens, docTokens);

    return {
      content: `**${p.title}** — ${p.type} ${p.transaction} à ${p.city}, ${p.quartier} (${p.country})\n` +
        `Prix: ${new Intl.NumberFormat('fr-FR').format(p.price)} FCFA\n` +
        `Surface: ${p.surface}m² | ${p.bedrooms}ch | ${p.bathrooms}sdb\n` +
        `Description: ${p.description.slice(0, 300)}...\n` +
        `Caractéristiques: ${Array.isArray(features) ? features.join(', ') : ''}\n` +
        `Vérifié: ${p.verified ? '[OUI]' : '[NON]'} | GeoTrust: ${p.geoTrust ? '[OUI]' : '[NON]'}\n` +
        `Agent: ${p.owner?.name || 'N/A'}`,
      source: `property:${p.id}`,
      sourceType: 'property' as const,
      score,
      metadata: {
        id: p.id, price: p.price, city: p.city, country: p.country,
        type: p.type, transaction: p.transaction, surface: p.surface,
        bedrooms: p.bedrooms, searchMethod: 'keyword',
      },
    };
  });

  return scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Search legal document templates by country and topic
 */
export async function searchLegalDocs(
  query: string,
  country?: string,
  _limit = 3
): Promise<RetrievalResult[]> {
  const queryTokens = tokenize(query);

  const legalKnowledgeBase: Record<string, Array<{ topic: string; content: string; keywords: string }>> = {
    BJ: [
      {
        topic: 'Titre Foncier',
        content: 'Au Bénin, le Titre Foncier est le titre de propriété le plus sûr. Il est délivré par le Service de la Conservation Foncière après une procédure d\'immatriculation. Le TF est inattaquable après 2 ans (prescription trentenaire). Coût moyen: 150 000 - 500 000 FCFA. Durée: 6-18 mois.',
        keywords: 'titre foncier propriete benin immatriculation conservation fonciere',
      },
      {
        topic: 'ACD (Attestation de Custom Déguerpissement)',
        content: 'L\'ACD est une attestation délivrée par la mairie pour les terrains non titrés. Elle ne constitue pas un titre de propriété mais un droit de jouissance. Risque: précaire, peut être remis en cause. L\'ACD peut être convertie en Titre Foncier via la procédure d\'immatriculation.',
        keywords: 'acd attestation custom deguerpissement mairie terrain non titre jouissance',
      },
      {
        topic: 'Arrêté de Concession',
        content: 'L\'Arrêté de Concession est un acte administratif par lequel l\'État concède un terrain du domaine public. Il est délivré par le Ministère en charge du domaine. Il confère un droit réel mais n\'est pas un titre foncier. Doit être suivi d\'une immatriculation pour sécurité juridique.',
        keywords: 'arrete concession etat domaine public ministere terrain',
      },
      {
        topic: 'Permis de Construire',
        content: 'Le permis de construire est obligatoire au Bénin pour toute construction. Délivré par la mairie dans les 30 jours (silence = acceptation). Documents requis: plan de construction, titre de propriété ou ACD, étude d\'impact. Coût: 1-3% du coût de construction.',
        keywords: 'permis construire benin mairie plan construction obligatoire',
      },
      {
        topic: 'Transaction immobilière',
        content: 'Procédure d\'achat au Bénin: 1) Compromis de vente 2) Vérification titres 3) Paiement via escrow 4) Acte notarié 5) Enregistrement ANDF 6) Mutation au service foncier. Frais notariaux: 2-5% du montant. Droits d\'enregistrement: 5% de la valeur. Durée moyenne: 2-4 mois.',
        keywords: 'transaction achat vente immobiliere benin notaire escrow andf enregistrement',
      },
    ],
    CI: [
      {
        topic: 'Titre Foncier (Côte d\'Ivoire)',
        content: 'En Côte d\'Ivoire, le Titre Foncier est délivré par la Direction Générale des Impôts après immatriculation. Loi de 2019: mise en place du Livre Foncier Numérisé. Durée d\'obtention: 12-24 mois. Le titre est définitif et inattaquable.',
        keywords: 'titre foncier cote ivoire impots immatriculation livre foncier numerise',
      },
      {
        topic: 'Certificat de Propriété',
        content: 'Le certificat de propriété est un document provisoire délivré en Côte d\'Ivoire en attendant le titre foncier. Il confère un droit de jouissance mais moins sécurisé que le TF. Utilisé principalement dans les zones non loties.',
        keywords: 'certificat propriete cote ivoire provisoire jouissance',
      },
      {
        topic: 'Transaction immobilière CI',
        content: 'Procédure d\'achat en CI: 1) Promesse de vente 2) Certificat d\'urbanisme 3) Vérification titres 4) Acte notarié 5) Publicité foncière. Frais: ~8-10% du montant (droits de mutation 4%, honoraires notaire 2.5%, autres frais).',
        keywords: 'transaction achat vente cote ivoire notaire urbanisme publicite fonciere',
      },
    ],
    BF: [
      {
        topic: 'Titre Foncier (Burkina Faso)',
        content: 'Au Burkina Faso, le Titre Foncier est régi par la loi n°034-2012/AN. Le processus d\'immatriculation est géré par la Direction de la Conservation Foncière. Réforme foncière de 2012: reconnaissance des droits coutumiers. Durée: 12-24 mois.',
        keywords: 'titre foncier burkina faso conservation fonciere loi 2012 coutumier',
      },
      {
        topic: 'Attestation de Propriété Coutumière',
        content: 'L\'Attestation de Propriété Coutumière (APC) est reconnue au Burkina Faso depuis la réforme de 2012. Elle est délivrée par le chef coutumier et validée par la commune. Permet de faire valoir des droits sur les terres rurales.',
        keywords: 'attestation propriete coutumiere burkina faso chef coutumier commune rurale',
      },
    ],
    TG: [
      {
        topic: 'Titre Foncier (Togo)',
        content: 'Au Togo, le Titre Foncier est délivré par le Service de la Conservation Foncière. Loi n°2018-005 portant code foncier. Durée d\'obtention: 6-18 mois. Le titre foncier togolais est inattaquable après le délai de 2 ans.',
        keywords: 'titre foncier togo conservation fonciere code foncier 2018',
      },
      {
        topic: 'Transaction immobilière Togo',
        content: 'Procédure au Togo: 1) Compromis de vente 2) Vérification titres et charges 3) Acte notarié 4) Publicité foncière 5) Déclaration fiscale. Frais de mutation: 6-8% du montant.',
        keywords: 'transaction achat vente togo notaire publicite fonciere fiscale',
      },
    ],
  };

  const results: RetrievalResult[] = [];
  const countries = country ? [country] : Object.keys(legalKnowledgeBase);

  for (const c of countries) {
    const docs = legalKnowledgeBase[c] || [];
    for (const doc of docs) {
      const docTokens = tokenize(`${doc.topic} ${doc.keywords} ${doc.content}`);
      const score = keywordSimilarity(queryTokens, docTokens);
      if (score > 0) {
        results.push({
          content: `[Document] **${doc.topic}** (${c})\n${doc.content}`,
          source: `legal:${c}:${doc.topic}`,
          sourceType: 'legal_doc',
          score,
          metadata: { country: c, topic: doc.topic },
        });
      }
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 3);
}

/**
 * Search FAQ / knowledge base
 */
export async function searchFAQ(
  query: string,
  _limit = 3
): Promise<RetrievalResult[]> {
  const queryTokens = tokenize(query);

  const faqData = [
    {
      q: 'Comment fonctionne l\'escrow AfriBayit ?',
      a: 'L\'escrow AfriBayit sécurise votre transaction immobilière en 9 étapes: 1) Création de la transaction 2) Dépôt des fonds en escrow 3) Validation IA des documents 4) Validation géomatique GeoTrust 5) Assignation d\'un notaire 6) Rédaction de l\'acte 7) Signature 8) Enregistrement ANDF 9) Libération des fonds. Les fonds sont sécurisés du début à la fin.',
      keywords: 'escrow securise transaction etapes fonds notaire',
    },
    {
      q: 'Quels documents sont nécessaires pour vendre un bien ?',
      a: 'Documents requis selon le pays:\n**Bénin**: Titre Foncier ou ACD, Permis de construire, Plan de bornage, Certificat de situation juridique\n**Côte d\'Ivoire**: Titre Foncier ou Certificat de propriété, Certificat d\'urbanisme, Quitus fiscal\n**Burkina Faso**: Titre Foncier ou APC, Plan de lotissement, Certificat de situation\n**Togo**: Titre Foncier, Certificat de situation, Quitus fiscal\nAfriBayit vérifie tous les documents par IA avant publication.',
      keywords: 'documents vente titre foncier permis construire bornage certificat',
    },
    {
      q: 'Comment financer mon achat immobilier ?',
      a: 'Options de financement en Afrique de l\'Ouest:\n- **Banques**: BICEC, BOA, Ecobank, SGBE — taux 6-10% sur 15-25 ans\n- **Microfinance**: FECECAM, RCPB — taux 8-14% sur 5-10 ans\n- **Mobile Money**: M-Pesa, Orange Money, MTN — paiement escrow\n- **Investisseurs**: Club AfriBayit Invest — copropriété fractionnée\nApport personnel minimum: 20-30% du prix.',
      keywords: 'financement credit bancaire microfinance mobile money investisseur taux',
    },
    {
      q: 'Qu\'est-ce que GeoTrust ?',
      a: 'GeoTrust est le service de vérification géomatique d\'AfriBayit. Il inclut: GPS bounding (délimitation précise), Vérification de surface (comparaison déclarée vs mesurée), Inspection drone (vue aérienne), Bornage certifié, Détection de conflits (chevauchement de parcelles). 3 niveaux: Standard, Expert, Elite. GeoTrust élimine les risques de conflits fonciers.',
      keywords: 'geotrust geometer verification gps drone bornage conflit surface',
    },
    {
      q: 'Comment fonctionne le Mobile Money ?',
      a: 'AfriBayit accepte les paiements Mobile Money dans les 4 pays:\n- **Bénin**: MTN MoMo, Moov Money\n- **Côte d\'Ivoire**: Orange Money, MTN MoMo, Wave\n- **Burkina Faso**: Orange Money, Moov Money\n- **Togo**: Moov Money, Togocel\nLe paiement est sécurisé via notre système escrow. Les fonds ne sont libérés qu\'après validation complète.',
      keywords: 'mobile money mtn orange moov paiement wave escrow',
    },
  ];

  const results: RetrievalResult[] = [];

  for (const faq of faqData) {
    const docTokens = tokenize(`${faq.q} ${faq.keywords} ${faq.a}`);
    const score = keywordSimilarity(queryTokens, docTokens);
    if (score > 0) {
      results.push({
        content: `[FAQ] **${faq.q}**\n${faq.a}`,
        source: `faq:${faq.q}`,
        sourceType: 'faq',
        score,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 3);
}

/**
 * Search market data / statistics
 */
export async function searchMarketData(
  area?: string,
  country?: string,
  _limit = 3
): Promise<RetrievalResult[]> {
  try {
    const where: Record<string, unknown> = { status: 'published' };
    if (country) where.country = country;
    if (area) where.city = area;

    const properties = await db.property.findMany({
      where,
      select: { price: true, surface: true, type: true, transaction: true, city: true, country: true, createdAt: true },
      take: 200,
    });

    if (properties.length === 0) {
      return [{
        content: `[Market] Aucune donnée de marché disponible pour ${area || country || 'cette zone'}. Les données du marché sont mises à jour régulièrement.`,
        source: 'market:empty',
        sourceType: 'market_data',
        score: 0.5,
      }];
    }

    const byType: Record<string, { prices: number[]; surfaces: number[] }> = {};
    for (const p of properties) {
      const key = `${p.type}_${p.transaction}`;
      if (!byType[key]) byType[key] = { prices: [], surfaces: [] };
      byType[key].prices.push(p.price);
      byType[key].surfaces.push(p.surface);
    }

    const stats = Object.entries(byType).map(([key, data]) => {
      const avgPrice = Math.round(data.prices.reduce((a, b) => a + b, 0) / data.prices.length);
      const avgSurface = Math.round(data.surfaces.reduce((a, b) => a + b, 0) / data.surfaces.length);
      const pricePerM2 = Math.round(avgPrice / avgSurface);
      const minPrice = Math.min(...data.prices);
      const maxPrice = Math.max(...data.prices);
      const [type, transaction] = key.split('_');
      return { type, transaction, count: data.prices.length, avgPrice, minPrice, maxPrice, avgSurface, pricePerM2 };
    });

    const areaName = area || country || 'toutes zones';
    const content = `[Market] **Marché immobilier — ${areaName}**\n` +
      `Basé sur ${properties.length} annonces publiées:\n\n` +
      stats.map((s) =>
        `- **${s.type}** (${s.transaction}): Moy. ${new Intl.NumberFormat('fr-FR').format(s.avgPrice)} FCFA | ` +
        `${new Intl.NumberFormat('fr-FR').format(s.pricePerM2)} FCFA/m² | ` +
        `Range: ${new Intl.NumberFormat('fr-FR').format(s.minPrice)} - ${new Intl.NumberFormat('fr-FR').format(s.maxPrice)} FCFA | ` +
        `${s.count} annonces`
      ).join('\n');

    return [{
      content,
      source: `market:${area || country || 'all'}`,
      sourceType: 'market_data',
      score: 0.8,
      metadata: { area, country, stats, totalProperties: properties.length },
    }];
  } catch (error) {
    console.error('Market data search error:', error);
    return [];
  }
}

/**
 * Search artisans using pgvector ANN with keyword fallback
 */
export async function searchArtisans(
  query: string,
  country?: string,
  city?: string,
  limit = 5
): Promise<RetrievalResult[]> {
  try {
    // Try pgvector ANN search first
    const queryEmbedding = await generateEmbedding(query);
    const hasNonZero = queryEmbedding.some((v) => v !== 0);

    if (hasNonZero) {
      try {
        const vectorLiteral = toPgVector(queryEmbedding);
        const filters: string[] = ['a.available = true', 'a.embedding IS NOT NULL'];
        const params: unknown[] = [vectorLiteral];
        let paramIdx = 2;
        if (country) { filters.push(`a.country = $${paramIdx++}`); params.push(country); }
        if (city) { filters.push(`a.city = $${paramIdx++}`); params.push(city); }
        params.push(limit);

        const results = await db.$queryRawUnsafe<{
          id: string; trade: string; specialties: unknown; zone: string | null;
          city: string | null; country: string | null; certified: boolean;
          rating: number; reviews: number; completedMissions: number;
          dailyRate: number | null; priceRange: string | null; responseTime: number | null;
          distance: number;
        }[]>(`
          SELECT
            a.id, a.trade, a.specialties, a.zone, a.city, a.country,
            a.certified, a.rating, a.reviews, a."completedMissions",
            a."dailyRate", a."priceRange", a."responseTime",
            (a.embedding <=> $1::vector) as distance
          FROM artisans a
          WHERE ${filters.join(' AND ')}
          ORDER BY a.embedding <=> $1::vector
          LIMIT $${paramIdx}
        `, ...params);

        if (results.length > 0) {
          return results.map((row) => {
            const specialties = Array.isArray(row.specialties) ? row.specialties as string[] : [];
            const similarity = 1 - (row.distance / 2);
            return {
              content: `[Artisan] **${row.trade}** — ${row.city || ''}, ${row.country || ''}\n` +
                `Spécialités: ${specialties.join(', ') || row.trade}\n` +
                `Certifié: ${row.certified ? '[OUI]' : '[NON]'} | Note: ${row.rating}/5 (${row.reviews} avis)\n` +
                `Missions complétées: ${row.completedMissions}\n` +
                `Tarif: ${row.dailyRate ? new Intl.NumberFormat('fr-FR').format(row.dailyRate) + ' FCFA/jour' : row.priceRange || 'Sur devis'}\n` +
                `Temps de réponse: ${row.responseTime ? row.responseTime + ' min' : 'N/A'}`,
              source: `artisan:${row.id}`,
              sourceType: 'artisan' as const,
              score: Math.max(0.1, similarity),
              metadata: {
                id: row.id, trade: row.trade, city: row.city, country: row.country,
                rating: row.rating, certified: row.certified, dailyRate: row.dailyRate,
                searchMethod: 'pgvector',
              },
            };
          });
        }
      } catch (pgvectorError) {
        console.info('[RAG] pgvector artisan search failed, falling back to keyword:', pgvectorError instanceof Error ? pgvectorError.message : 'unknown');
      }
    }

    // Fallback: keyword-based search
    return searchArtisansByKeyword(query, country, city, limit);
  } catch (error) {
    console.error('Artisan search error in RAG retriever:', error);
    return [];
  }
}

/**
 * Keyword-based artisan search (fallback)
 */
async function searchArtisansByKeyword(
  query: string,
  country?: string,
  city?: string,
  limit = 5
): Promise<RetrievalResult[]> {
  const queryTokens = tokenize(query);
  const where: Record<string, unknown> = { available: true };
  if (country) where.country = country;
  if (city) where.city = city;

  const artisans = await db.artisan.findMany({
    where, take: 50, include: { services: true },
  });

  const scored = artisans.map((a) => {
    const specialties = Array.isArray(a.specialties) ? a.specialties as string[] : [];
    const docText = `${a.trade} ${specialties.join(' ')} ${a.zone || ''} ${a.city || ''} ${a.country || ''}`;
    const docTokens = tokenize(docText);
    const score = keywordSimilarity(queryTokens, docTokens);
    return {
      content: `[Artisan] **${a.trade}** — ${a.city || ''}, ${a.country || ''}\n` +
        `Spécialités: ${specialties.join(', ') || a.trade}\n` +
        `Certifié: ${a.certified ? '[OUI]' : '[NON]'} | Note: ${a.rating}/5 (${a.reviews} avis)\n` +
        `Missions complétées: ${a.completedMissions}\n` +
        `Tarif: ${a.dailyRate ? new Intl.NumberFormat('fr-FR').format(a.dailyRate) + ' FCFA/jour' : a.priceRange || 'Sur devis'}\n` +
        `Temps de réponse: ${a.responseTime ? a.responseTime + ' min' : 'N/A'}`,
      source: `artisan:${a.id}`,
      sourceType: 'artisan' as const,
      score,
      metadata: {
        id: a.id, trade: a.trade, city: a.city, country: a.country,
        rating: a.rating, certified: a.certified, dailyRate: a.dailyRate,
        searchMethod: 'keyword',
      },
    };
  });

  return scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Main retrieval function that searches all sources and combines results
 */
export async function retrieve(
  query: string,
  options?: {
    country?: string;
    city?: string;
    sources?: ('property' | 'legal_doc' | 'faq' | 'market_data' | 'artisan')[];
  }
): Promise<RetrievalResult[]> {
  const { country, city, sources } = options || {};
  const enabledSources = sources || ['property', 'legal_doc', 'faq', 'market_data', 'artisan'];

  const allResults: RetrievalResult[] = [];
  const searchPromises: Promise<RetrievalResult[]>[] = [];

  if (enabledSources.includes('property')) searchPromises.push(searchProperties(query, country));
  if (enabledSources.includes('legal_doc')) searchPromises.push(searchLegalDocs(query, country));
  if (enabledSources.includes('faq')) searchPromises.push(searchFAQ(query));
  if (enabledSources.includes('market_data')) searchPromises.push(searchMarketData(city, country));
  if (enabledSources.includes('artisan')) searchPromises.push(searchArtisans(query, country, city));

  const results = await Promise.all(searchPromises);
  for (const resultSet of results) allResults.push(...resultSet);

  return allResults.sort((a, b) => b.score - a.score).slice(0, 8);
}
