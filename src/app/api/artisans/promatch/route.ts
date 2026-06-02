// AfriBayit — ProMatch Endpoint
// POST /api/artisans/promatch — Find best matching artisans using AI scoring

import { NextResponse } from 'next/server';
import { findMatchingArtisans, type MatchRequest, type ScoredArtisan } from '@/lib/promatch';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobDescription, skills, city, country, lat, lng, emergency, maxBudget, maxResults } = body as {
      jobDescription?: string;
      skills?: string[];
      city?: string;
      country?: string;
      lat?: number;
      lng?: number;
      emergency?: boolean;
      maxBudget?: number;
      maxResults?: number;
    };

    if (!jobDescription && (!skills || skills.length === 0)) {
      return NextResponse.json(
        { error: 'jobDescription ou skills est requis' },
        { status: 400 }
      );
    }

    const matchRequest: MatchRequest = {
      jobDescription: jobDescription || '',
      skills: skills || [],
      city,
      country,
      lat,
      lng,
      emergency,
      maxBudget,
    };

    const results = await findMatchingArtisans(matchRequest, maxResults || 10);

    // Format results for response
    const formatted = results.map(formatScoredArtisan);

    return NextResponse.json({
      artisans: formatted,
      totalMatches: results.length,
      request: {
        skills: matchRequest.skills,
        city: matchRequest.city,
        country: matchRequest.country,
        emergency: matchRequest.emergency,
      },
    });
  } catch (error) {
    console.error('ProMatch API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la recherche d\'artisans' },
      { status: 500 }
    );
  }
}

function formatScoredArtisan(scored: ScoredArtisan): Record<string, unknown> {
  const a = scored.artisan;

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
    matchScore: scored.totalScore,
    matchScoreFormatted: `${Math.round(scored.totalScore * 100)}%`,
    matchDetails: {
      proximity: {
        score: scored.scores.proximity,
        weight: '35%',
        label: scored.scores.proximity >= 0.8 ? 'Très proche' :
          scored.scores.proximity >= 0.5 ? 'Proche' : 'Éloigné',
      },
      specialty: {
        score: scored.scores.specialty,
        weight: '30%',
        label: scored.scores.specialty >= 0.8 ? 'Spécialiste' :
          scored.scores.specialty >= 0.5 ? 'Compétent' : 'Partiel',
      },
      availability: {
        score: scored.scores.availability,
        weight: '20%',
        label: scored.scores.availability >= 0.8 ? 'Disponible' :
          scored.scores.availability >= 0.5 ? 'Partiellement' : 'Indisponible',
      },
      trust: {
        score: scored.scores.trust,
        weight: '15%',
        label: scored.scores.trust >= 0.8 ? 'Très fiable' :
          scored.scores.trust >= 0.5 ? 'Fiable' : 'Nouveau',
      },
    },
  };
}
