// AfriBayit — ProMatch Match Endpoint
// POST /api/promatch/match — Find best matching artisans for a project need

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { matchArtisan, type ProjectNeed, type RankedArtisan } from '@/lib/promatch/scoring';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, skills, city, country, lat, lng, emergency, maxBudget, maxResults } = body as {
      description?: string;
      skills?: string[];
      city?: string;
      country?: string;
      lat?: number;
      lng?: number;
      emergency?: boolean;
      maxBudget?: number;
      maxResults?: number;
    };

    if (!description && (!skills || skills.length === 0)) {
      return NextResponse.json(
        { error: 'description ou skills est requis' },
        { status: 400 }
      );
    }

    // Build project need
    const projectNeed: ProjectNeed = {
      description: description || '',
      requiredSkills: skills || [],
      city,
      country,
      lat,
      lng,
      emergency,
      maxBudget,
    };

    // Fetch candidate artisans from database
    const where: Record<string, unknown> = { available: true };
    if (country) where.country = country;
    if (city) where.city = city;

    const candidates = await db.artisan.findMany({
      where,
      take: 100,
      include: { services: true },
    });

    // Convert to ArtisanData format
    const artisanDataList = candidates.map((a) => ({
      id: a.id,
      userId: a.userId,
      trade: a.trade,
      specialties: (() => {
        try { return a.specialties ? JSON.parse(a.specialties) : [a.trade]; } catch { return [a.trade]; }
      })(),
      certified: a.certified,
      available: a.available,
      emergency: a.emergency,
      dailyRate: a.dailyRate,
      rating: a.rating,
      reviews: a.reviews,
      zone: a.zone,
      city: a.city,
      country: a.country,
      responseTime: a.responseTime,
      completedMissions: a.completedMissions,
      lat: null,
      lng: null,
    }));

    // Run ProMatch scoring
    const ranked: RankedArtisan[] = matchArtisan(projectNeed, artisanDataList);
    const limit = maxResults || 10;
    const results = ranked.slice(0, limit);

    // Format results
    const formatted = results.map(formatRankedArtisan);

    return NextResponse.json({
      artisans: formatted,
      totalMatches: results.length,
      project: {
        description: projectNeed.description,
        skills: projectNeed.requiredSkills,
        city: projectNeed.city,
        country: projectNeed.country,
        emergency: projectNeed.emergency,
      },
      scoringWeights: {
        proximity: '30%',
        specialty: '25%',
        availability: '20%',
        rating: '15%',
        price: '10%',
      },
    });
  } catch (error) {
    console.error('ProMatch match API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche d\'artisans' },
      { status: 500 }
    );
  }
}

function formatRankedArtisan(ranked: RankedArtisan): Record<string, unknown> {
  const a = ranked.artisan;
  const s = ranked.scores;

  return {
    id: a.id,
    trade: a.trade,
    specialties: a.specialties,
    certified: a.certified,
    available: a.available,
    emergency: a.emergency,
    dailyRate: a.dailyRate,
    rating: a.rating,
    reviews: a.reviews,
    city: a.city,
    country: a.country,
    zone: a.zone,
    responseTime: a.responseTime,
    completedMissions: a.completedMissions,
    matchScore: ranked.totalScore,
    matchScoreFormatted: `${Math.round(ranked.totalScore * 100)}%`,
    matchReasons: ranked.matchReasons,
    matchDetails: {
      proximity: {
        score: s.proximity,
        weight: '30%',
        label: s.proximity >= 0.8 ? 'Très proche' :
          s.proximity >= 0.5 ? 'Proche' : 'Éloigné',
      },
      specialty: {
        score: s.specialty,
        weight: '25%',
        label: s.specialty >= 0.8 ? 'Spécialiste' :
          s.specialty >= 0.5 ? 'Compétent' : 'Partiel',
      },
      availability: {
        score: s.availability,
        weight: '20%',
        label: s.availability >= 0.8 ? 'Disponible' :
          s.availability >= 0.5 ? 'Partiellement' : 'Indisponible',
      },
      rating: {
        score: s.rating,
        weight: '15%',
        label: s.rating >= 0.8 ? 'Très fiable' :
          s.rating >= 0.5 ? 'Fiable' : 'Nouveau',
      },
      price: {
        score: s.price,
        weight: '10%',
        label: s.price >= 0.8 ? 'Très compétitif' :
          s.price >= 0.5 ? 'Compétitif' : 'Au-dessus du budget',
      },
    },
  };
}
