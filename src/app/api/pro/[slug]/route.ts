// GET /api/pro/[slug] — Profil professionnel public

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const profile = await db.professionalProfile.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            coverPhoto: true,
            country: true,
            city: true,
            bio: true,
            role: true,
            verified: true,
            credibilityScore: true,
            afriPoints: true,
            premiumTier: true,
          },
        },
        endorsements: {
          select: { skill: true, endorserId: true },
        },
      },
    });

    if (!profile || !profile.isPublic) {
      return NextResponse.json(
        { error: 'Profil introuvable ou non public.' },
        { status: 404 }
      );
    }

    // Calculer les compteurs d'endorsements par compétence
    const skillEndorsements: Record<string, number> = {};
    for (const e of profile.endorsements) {
      skillEndorsements[e.skill] = (skillEndorsements[e.skill] || 0) + 1;
    }

    // Récupérer les avis
    const reviews = await db.review.findMany({
      where: { targetId: profile.userId, targetType: 'agent' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: { select: { name: true, avatar: true } },
      },
    });

    // Enregistrer la vue de profil (anonyme)
    try {
      await db.profileView.create({
        data: {
          viewedId: profile.userId,
          viewerId: 'anonymous',
          isAnonymous: true,
        },
      });
    } catch {
      // Ignore les erreurs de vue de profil
    }

    return NextResponse.json({
      profile: {
        slug: profile.slug,
        headline: profile.headline,
        bio: profile.bio,
        specialities: profile.specialities ? JSON.parse(profile.specialities) : [],
        languages: profile.languages ? JSON.parse(profile.languages) : [],
        availability: profile.availability,
        credibilityScore: profile.credibilityScore,
        completenessPct: profile.completenessPct,
        experience: profile.experience ? JSON.parse(profile.experience) : [],
        education: profile.education ? JSON.parse(profile.education) : [],
        certifications: profile.certifications ? JSON.parse(profile.certifications) : [],
        portfolio: profile.portfolio ? JSON.parse(profile.portfolio) : [],
        country: profile.country,
        zone: profile.zone,
        agencyName: profile.agencyName,
        skillEndorsements,
      },
      user: profile.user,
      reviews,
    });
  } catch (error) {
    console.error('Erreur profil public:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du profil.' },
      { status: 500 }
    );
  }
}
