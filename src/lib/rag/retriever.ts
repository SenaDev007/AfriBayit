// AfriBayit RAG — Document Retriever Module
// Retrieves relevant context from DB using keyword-based search
// Since we don't have pgvector, we use Prisma full-text search patterns

import { db } from '@/lib/db';
import { tokenize, keywordSimilarity } from './embedder';

export interface RetrievalResult {
  content: string;
  source: string;
  sourceType: 'property' | 'legal_doc' | 'faq' | 'market_data' | 'artisan';
  score: number;
  metadata?: Record<string, unknown>;
}

/**
 * Search properties by keyword matching
 */
export async function searchProperties(
  query: string,
  country?: string,
  limit = 5
): Promise<RetrievalResult[]> {
  try {
    const queryTokens = tokenize(query);

    const where: Record<string, unknown> = { status: 'published' };
    if (country) where.country = country;

    const properties = await db.property.findMany({
      where,
      take: 50, // Fetch more for scoring
      include: {
        owner: { select: { name: true, verified: true } },
      },
    });

    // Score each property by keyword overlap
    const scored = properties.map((p) => {
      const docText = `${p.title} ${p.description} ${p.type} ${p.transaction} ${p.city} ${p.quartier} ${p.country} ${p.features || ''}`;
      const docTokens = tokenize(docText);
      const score = keywordSimilarity(queryTokens, docTokens);

      const features = (() => {
        try { return p.features ? JSON.parse(p.features) : []; } catch { return []; }
      })();
      const images = (() => {
        try { return p.images ? JSON.parse(p.images) : []; } catch { return []; }
      })();

      return {
        content: `**${p.title}** — ${p.type} ${p.transaction} à ${p.city}, ${p.quartier} (${p.country})\n` +
          `Prix: ${new Intl.NumberFormat('fr-FR').format(p.price)} FCFA\n` +
          `Surface: ${p.surface}m² | ${p.bedrooms}ch | ${p.bathrooms}sdb\n` +
          `Description: ${p.description.slice(0, 300)}...\n` +
          `Caractéristiques: ${Array.isArray(features) ? features.join(', ') : ''}\n` +
          `Verifie: ${p.verified ? '[OUI]' : '[NON]'} | GeoTrust: ${p.geoTrust ? '[OUI]' : '[NON]'}\n` +
          `Agent: ${p.owner?.name || 'N/A'}`,
        source: `property:${p.id}`,
        sourceType: 'property' as const,
        score,
        metadata: {
          id: p.id,
          price: p.price,
          city: p.city,
          country: p.country,
          type: p.type,
          transaction: p.transaction,
          surface: p.surface,
          bedrooms: p.bedrooms,
          images: Array.isArray(images) ? images.slice(0, 2) : [],
        },
      };
    });

    return scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Property search error in RAG retriever:', error);
    return [];
  }
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

  // Legal docs knowledge base (static reference data)
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

    // Aggregate market data from published properties
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

    // Calculate statistics
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
      return {
        type,
        transaction,
        count: data.prices.length,
        avgPrice,
        minPrice,
        maxPrice,
        avgSurface,
        pricePerM2,
      };
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
 * Search artisans by keyword matching
 */
export async function searchArtisans(
  query: string,
  country?: string,
  city?: string,
  limit = 5
): Promise<RetrievalResult[]> {
  try {
    const queryTokens = tokenize(query);

    const where: Record<string, unknown> = { available: true };
    if (country) where.country = country;
    if (city) where.city = city;

    const artisans = await db.artisan.findMany({
      where,
      take: 50,
      include: {
        services: true,
      },
    });

    const scored = artisans.map((a) => {
      const specialties = (() => {
        try { return a.specialties ? JSON.parse(a.specialties) : []; } catch { return []; }
      })();
      const docText = `${a.trade} ${specialties.join(' ')} ${a.zone || ''} ${a.city || ''} ${a.country || ''}`;
      const docTokens = tokenize(docText);
      const score = keywordSimilarity(queryTokens, docTokens);

      return {
        content: `[Artisan] **${a.trade}** — ${a.city || ''}, ${a.country || ''}\n` +
          `Specialites: ${Array.isArray(specialties) ? specialties.join(', ') : a.trade}\n` +
          `Certifie: ${a.certified ? '[OUI]' : '[NON]'} | Note: ${a.rating}/5 (${a.reviews} avis)\n` +
          `Missions complétées: ${a.completedMissions}\n` +
          `Tarif: ${a.dailyRate ? new Intl.NumberFormat('fr-FR').format(a.dailyRate) + ' FCFA/jour' : a.priceRange || 'Sur devis'}\n` +
          `Temps de réponse: ${a.responseTime ? a.responseTime + ' min' : 'N/A'}`,
        source: `artisan:${a.id}`,
        sourceType: 'artisan' as const,
        score,
        metadata: {
          id: a.id,
          trade: a.trade,
          city: a.city,
          country: a.country,
          rating: a.rating,
          certified: a.certified,
          dailyRate: a.dailyRate,
        },
      };
    });

    return scored
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Artisan search error in RAG retriever:', error);
    return [];
  }
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

  if (enabledSources.includes('property')) {
    searchPromises.push(searchProperties(query, country));
  }
  if (enabledSources.includes('legal_doc')) {
    searchPromises.push(searchLegalDocs(query, country));
  }
  if (enabledSources.includes('faq')) {
    searchPromises.push(searchFAQ(query));
  }
  if (enabledSources.includes('market_data')) {
    searchPromises.push(searchMarketData(city, country));
  }
  if (enabledSources.includes('artisan')) {
    searchPromises.push(searchArtisans(query, country, city));
  }

  const results = await Promise.all(searchPromises);
  for (const resultSet of results) {
    allResults.push(...resultSet);
  }

  // Sort by score and return top results
  return allResults
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}
