import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specialities = searchParams.get('specialities');
    const city = searchParams.get('city');
    const availability = searchParams.get('availability');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: Record<string, unknown> = { isPublic: true };

    if (specialities) {
      where.specialities = { contains: specialities };
    }
    if (city) where.zone = city;
    if (availability) where.availability = availability;

    const [profiles, total] = await Promise.all([
      db.professionalProfile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { credibilityScore: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              city: true,
              country: true,
              reputation: true,
            },
          },
          _count: { select: { endorsements: true } },
        },
      }),
      db.professionalProfile.count({ where }),
    ]);

    return NextResponse.json({
      profiles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Profiles API error:', error);
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const profile = await db.professionalProfile.create({
      data: {
        userId: body.userId,
        headline: body.headline,
        coverPhoto: body.coverPhoto,
        bio: body.bio,
        specialities: body.specialities ? JSON.stringify(body.specialities) : null,
        languages: body.languages ? JSON.stringify(body.languages) : null,
        availability: body.availability || 'available',
        isPublic: body.isPublic ?? true,
        slug: body.slug,
        experience: body.experience ? JSON.stringify(body.experience) : null,
        education: body.education ? JSON.stringify(body.education) : null,
        certifications: body.certifications ? JSON.stringify(body.certifications) : null,
        portfolio: body.portfolio ? JSON.stringify(body.portfolio) : null,
        zone: body.zone,
        agencyName: body.agencyName,
      },
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error('Profile creation error:', error);
    return NextResponse.json({ error: 'Failed to create professional profile' }, { status: 500 });
  }
}
