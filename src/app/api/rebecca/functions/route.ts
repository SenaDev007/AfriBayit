// AfriBayit — Rebecca Function Execution Endpoint
// POST /api/rebecca/functions — Execute Rebecca's function calls
// Also used internally by the chat endpoint

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { findMatchingArtisans, type MatchRequest } from '@/lib/promatch';

// Rebecca function definitions (for reference and documentation)
export const REBECCA_FUNCTIONS = [
  {
    name: 'search_properties',
    description: 'Rechercher des biens immobiliers en vente, location ou investissement',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Type de bien (villa, appartement, terrain, bureau, commerce)' },
        transaction: { type: 'string', description: 'Type de transaction (achat, location, investissement)' },
        city: { type: 'string', description: 'Ville' },
        country: { type: 'string', description: 'Pays (BJ, CI, BF, TG)' },
        minPrice: { type: 'number', description: 'Prix minimum en XOF' },
        maxPrice: { type: 'number', description: 'Prix maximum en XOF' },
        minBedrooms: { type: 'number', description: 'Nombre minimum de chambres' },
      },
    },
  },
  {
    name: 'check_escrow',
    description: 'Vérifier le statut d\'une transaction escrow',
    parameters: {
      type: 'object',
      properties: {
        transactionId: { type: 'string', description: 'ID de la transaction' },
      },
    },
  },
  {
    name: 'get_market_stats',
    description: 'Obtenir les statistiques du marché immobilier par zone',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'Ville' },
        country: { type: 'string', description: 'Pays (BJ, CI, BF, TG)' },
        propertyType: { type: 'string', description: 'Type de bien' },
      },
    },
  },
  {
    name: 'find_artisans',
    description: 'Trouver des artisans certifiés pour des travaux',
    parameters: {
      type: 'object',
      properties: {
        skills: { type: 'array', items: { type: 'string' }, description: 'Compétences requises' },
        city: { type: 'string', description: 'Ville' },
        country: { type: 'string', description: 'Pays (BJ, CI, BF, TG)' },
        emergency: { type: 'boolean', description: 'Urgence' },
      },
    },
  },
  {
    name: 'calculate_financing',
    description: 'Simuler un financement immobilier',
    parameters: {
      type: 'object',
      properties: {
        amount: { type: 'number', description: 'Montant du bien en XOF' },
        durationYears: { type: 'number', description: 'Durée en années' },
        downPaymentPct: { type: 'number', description: 'Pourcentage d\'apport personnel' },
        rate: { type: 'number', description: 'Taux d\'intérêt annuel (%)' },
      },
    },
  },
  {
    name: 'get_property_details',
    description: 'Obtenir les détails complets d\'un bien immobilier',
    parameters: {
      type: 'object',
      properties: {
        propertyId: { type: 'string', description: 'ID du bien' },
      },
    },
  },
];

/**
 * Execute a Rebecca function by name
 */
export async function executeRebeccaFunction(
  name: string,
  args: Record<string, unknown>,
  userId?: string
): Promise<Record<string, unknown>> {
  switch (name) {
    case 'search_properties':
      return await searchProperties(args);
    case 'check_escrow':
      return await checkEscrow(args, userId);
    case 'get_market_stats':
      return await getMarketStats(args);
    case 'find_artisans':
      return await findArtisans(args);
    case 'calculate_financing':
      return calculateFinancing(args);
    case 'get_property_details':
      return await getPropertyDetails(args);
    default:
      return { error: `Fonction inconnue: ${name}` };
  }
}

/**
 * Search properties from database
 */
async function searchProperties(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const where: Record<string, unknown> = { status: 'published' };
    if (args.type) where.type = args.type;
    if (args.transaction) where.transaction = args.transaction;
    if (args.city) where.city = args.city;
    if (args.country) where.country = args.country;
    if (args.minPrice || args.maxPrice) {
      where.price = {};
      if (args.minPrice) (where.price as Record<string, number>).gte = Number(args.minPrice);
      if (args.maxPrice) (where.price as Record<string, number>).lte = Number(args.maxPrice);
    }

    const properties = await db.property.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { name: true, verified: true } },
      },
    });

    const formatted = properties.map((p) => {
      const images = (() => {
        try { return p.images ? JSON.parse(p.images) : []; } catch { return []; }
      })();
      const features = (() => {
        try { return p.features ? JSON.parse(p.features) : []; } catch { return []; }
      })();

      return {
        id: p.id,
        title: p.title,
        type: p.type,
        transaction: p.transaction,
        price: p.price,
        surface: p.surface,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        city: p.city,
        quartier: p.quartier,
        country: p.country,
        verified: p.verified,
        geoTrust: p.geoTrust,
        features: Array.isArray(features) ? features.slice(0, 5) : [],
        images: Array.isArray(images) ? images.slice(0, 2) : [],
        agent: p.owner?.name,
      };
    });

    return {
      properties: formatted,
      total: await db.property.count({ where }),
    };
  } catch (error) {
    console.error('search_properties error:', error);
    return { error: 'Erreur lors de la recherche de biens' };
  }
}

/**
 * Check escrow transaction status
 */
async function checkEscrow(args: Record<string, unknown>, userId?: string): Promise<Record<string, unknown>> {
  try {
    const { transactionId } = args;

    if (!transactionId && !userId) {
      return { error: 'ID de transaction ou ID utilisateur requis' };
    }

    const where: Record<string, unknown> = {};
    if (transactionId) where.id = transactionId as string;
    else if (userId) where.buyerId = userId;

    const transactions = await db.transaction.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: { id: true, title: true, type: true, city: true, country: true, images: true },
        },
        escrowAccount: true,
        timelineEvents: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    const formatted = transactions.map((t) => ({
      id: t.id,
      status: t.status,
      amount: t.amount,
      currency: t.currency,
      escrowReference: t.escrowReference,
      escrowAccount: t.escrowAccount ? {
        balance: t.escrowAccount.balance,
        heldAmount: t.escrowAccount.heldAmount,
        releasedAmount: t.escrowAccount.releasedAmount,
        status: t.escrowAccount.status,
      } : null,
      property: t.property,
      recentEvents: t.timelineEvents.map((e) => ({
        from: e.fromStatus,
        to: e.toStatus,
        description: e.description,
        date: e.createdAt,
      })),
      createdAt: t.createdAt,
    }));

    return { transactions: formatted };
  } catch (error) {
    console.error('check_escrow error:', error);
    return { error: 'Erreur lors de la vérification escrow' };
  }
}

/**
 * Get market statistics
 */
async function getMarketStats(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const { city, country, propertyType } = args;

    const where: Record<string, unknown> = { status: 'published' };
    if (country) where.country = country;
    if (city) where.city = city;
    if (propertyType) where.type = propertyType;

    const properties = await db.property.findMany({
      where,
      select: { price: true, surface: true, type: true, transaction: true, createdAt: true },
      take: 200,
    });

    if (properties.length === 0) {
      return {
        message: `Aucune donnée disponible pour ${city || country || 'cette zone'}`,
        total: 0,
      };
    }

    const prices = properties.map((p) => p.price).sort((a, b) => a - b);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const medianPrice = prices[Math.floor(prices.length / 2)];
    const minPrice = prices[0];
    const maxPrice = prices[prices.length - 1];

    const validSurfaces = properties.filter((p) => p.surface > 0);
    const avgPricePerM2 = validSurfaces.length > 0
      ? Math.round(validSurfaces.reduce((s, p) => s + p.price / p.surface, 0) / validSurfaces.length)
      : 0;

    // Group by type
    const byType: Record<string, { count: number; avgPrice: number }> = {};
    for (const p of properties) {
      if (!byType[p.type]) byType[p.type] = { count: 0, avgPrice: 0 };
      byType[p.type].avgPrice += p.price;
      byType[p.type].count += 1;
    }
    for (const key of Object.keys(byType)) {
      byType[key].avgPrice = Math.round(byType[key].avgPrice / byType[key].count);
    }

    return {
      area: city || country || 'all',
      totalListings: properties.length,
      averagePrice: avgPrice,
      medianPrice,
      minPrice,
      maxPrice,
      averagePricePerM2: avgPricePerM2,
      byType,
    };
  } catch (error) {
    console.error('get_market_stats error:', error);
    return { error: 'Erreur lors de la récupération des statistiques' };
  }
}

/**
 * Find artisans using ProMatch algorithm
 */
async function findArtisans(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const request: MatchRequest = {
      jobDescription: (args.jobDescription as string) || '',
      skills: (args.skills as string[]) || [],
      city: args.city as string | undefined,
      country: args.country as string | undefined,
      emergency: args.emergency as boolean | undefined,
    };

    const results = await findMatchingArtisans(request, 5);

    const formatted = results.map((r) => ({
      id: r.artisan.id,
      trade: r.artisan.trade,
      specialties: r.artisan.specialties,
      certified: r.artisan.certified,
      rating: r.artisan.rating,
      reviews: r.artisan.reviews,
      city: r.artisan.city,
      country: r.artisan.country,
      dailyRate: r.artisan.dailyRate,
      responseTime: r.artisan.responseTime,
      completedMissions: r.artisan.completedMissions,
      matchScore: r.totalScore,
      matchDetails: r.scores,
    }));

    return { artisans: formatted };
  } catch (error) {
    console.error('find_artisans error:', error);
    return { error: 'Erreur lors de la recherche d\'artisans' };
  }
}

/**
 * Calculate financing simulation
 */
function calculateFinancing(args: Record<string, unknown>): Record<string, unknown> {
  const amount = Number(args.amount) || 25_000_000; // 25M FCFA default
  const durationYears = Number(args.durationYears) || 20;
  const downPaymentPct = Number(args.downPaymentPct) || 20;
  const annualRate = Number(args.rate) || 7.5; // 7.5% default West Africa rate

  const downPayment = Math.round(amount * (downPaymentPct / 100));
  const loanAmount = amount - downPayment;
  const monthlyRate = annualRate / 100 / 12;
  const totalMonths = durationYears * 12;

  // Monthly payment calculation (annuity formula)
  const monthlyPayment = monthlyRate > 0
    ? Math.round(
        (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      )
    : Math.round(loanAmount / totalMonths);

  const totalPaid = monthlyPayment * totalMonths;
  const totalInterest = totalPaid - loanAmount;

  // Bank options comparison
  const bankOptions = [
    { name: 'BOA (Banque Ouest Africaine)', rate: 7.5, duration: '15-25 ans', minDownPayment: 20 },
    { name: 'Ecobank', rate: 8.0, duration: '10-20 ans', minDownPayment: 25 },
    { name: 'BICEC', rate: 7.0, duration: '15-25 ans', minDownPayment: 20 },
    { name: 'SGBE (Société Générale)', rate: 7.8, duration: '12-20 ans', minDownPayment: 25 },
  ];

  return {
    simulation: {
      propertyValue: amount,
      downPayment,
      downPaymentPct,
      loanAmount,
      annualRate,
      durationYears,
      monthlyPayment,
      totalPaid,
      totalInterest,
      costOfCredit: Math.round((totalInterest / loanAmount) * 100), // as percentage
    },
    bankOptions,
    mobileMoneyOptions: [
      { name: 'MTN MoMo', maxAmount: 2_000_000, rate: 'N/A', note: 'Paiement escrow uniquement' },
      { name: 'Orange Money', maxAmount: 2_000_000, rate: 'N/A', note: 'Paiement escrow uniquement' },
    ],
    advice: `Pour un bien de ${new Intl.NumberFormat('fr-FR').format(amount)} FCFA avec ${downPaymentPct}% d'apport, ` +
      `votre mensualité sera d'environ ${new Intl.NumberFormat('fr-FR').format(monthlyPayment)} FCFA sur ${durationYears} ans. ` +
      `Le coût total du crédit sera de ${new Intl.NumberFormat('fr-FR').format(totalInterest)} FCFA. ` +
      `Nous recommandons de comparer les offres de plusieurs banques et de négocier le taux.`,
  };
}

/**
 * Get full property details
 */
async function getPropertyDetails(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    const { propertyId } = args;
    if (!propertyId) return { error: 'propertyId est requis' };

    const property = await db.property.findUnique({
      where: { id: propertyId as string },
      include: {
        owner: {
          select: { id: true, name: true, avatar: true, verified: true, phone: true,
            professionalProfile: { select: { agencyName: true, credibilityScore: true } }
          },
        },
        legalDocs: true,
        virtualTours: true,
      },
    });

    if (!property) return { error: 'Bien non trouvé' };

    const images = (() => { try { return property.images ? JSON.parse(property.images) : []; } catch { return []; } })();
    const features = (() => { try { return property.features ? JSON.parse(property.features) : []; } catch { return []; } })();

    return {
      property: {
        ...property,
        images: Array.isArray(images) ? images : [],
        features: Array.isArray(features) ? features : [],
      },
    };
  } catch (error) {
    console.error('get_property_details error:', error);
    return { error: 'Erreur lors de la récupération des détails du bien' };
  }
}

/**
 * POST handler for direct function execution
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, args, userId } = body as { name: string; args: Record<string, unknown>; userId?: string };

    if (!name) {
      return NextResponse.json({ error: 'name est requis' }, { status: 400 });
    }

    const result = await executeRebeccaFunction(name, args || {}, userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Rebecca functions API error:', error);
    return NextResponse.json({ error: 'Erreur d\'exécution de fonction' }, { status: 500 });
  }
}
