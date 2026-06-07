import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const specialities = searchParams.get('specialities');
    const city = searchParams.get('city');
    const availability = searchParams.get('availability');
    const country = searchParams.get('country');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // If userId is provided, return a single profile for that user
    if (userId) {
      const profile = await db.professionalProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              coverPhoto: true,
              city: true,
              country: true,
              reputation: true,
              score: true,
              bio: true,
              verified: true,
              premiumTier: true,
              credibilityScore: true,
              afriPoints: true,
              isOnline: true,
            },
          },
          _count: { select: { endorsements: true } },
        },
      });

      if (!profile) {
        // Fetch real user data from DB instead of returning mock data
        const realUser = await db.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            coverPhoto: true,
            city: true,
            country: true,
            bio: true,
            verified: true,
            kycLevel: true,
            score: true,
            credibilityScore: true,
            reputation: true,
            isOnline: true,
          },
        });

        if (!realUser) {
          return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
        }

        const countryNames: Record<string, string> = {
          BJ: 'Bénin', CI: "Côte d'Ivoire", BF: 'Burkina Faso', TG: 'Togo', SN: 'Sénégal',
        };

        const certifications: { id: string; name: string; icon: string; color: string; year: string }[] = [];
        if (realUser.kycLevel >= 1) {
          certifications.push({ id: 'cert-kyc', name: 'KYC Vérifié', icon: 'kyc', color: '#00A651', year: new Date().getFullYear().toString() });
        }
        if (realUser.verified) {
          certifications.push({ id: 'cert-verified', name: 'Email vérifié', icon: 'agent', color: '#009CDE', year: new Date().getFullYear().toString() });
        }

        // Return a minimal profile using real user data — no mock data
        return NextResponse.json({
          name: realUser.name || '',
          headline: '',
          location: `${realUser.city || ''}${realUser.city && realUser.country ? ', ' : ''}${countryNames[realUser.country || ''] || realUser.country || ''}`,
          avatar: realUser.avatar || '',
          coverPhoto: realUser.coverPhoto || '',
          availability: realUser.isOnline ? 'available' : 'offline',
          bio: realUser.bio || '',
          skills: [],
          experience: [],
          education: [],
          certifications,
          portfolio: [],
          recommendations: [],
          stats: {
            profileViews: 0,
            searchAppearances: 0,
            connections: 0,
            credibilityScore: realUser.credibilityScore || realUser.score || 0,
          },
          profileCompleteness: realUser.name ? 10 : 0,
          userId: userId,
          slug: '',
          isProfileCreated: false, // Flag: professional profile not yet created
        });
      }

      // Transform the profile data to match what the ProfessionalProfileModule expects
      const user = profile.user as Record<string, unknown>;
      let skills: { name: string; endorsements: number; endorsedByMe?: boolean }[] = [];
      try {
        const rawSkills = profile.specialities ? JSON.parse(profile.specialities) : [];
        if (Array.isArray(rawSkills)) {
          skills = rawSkills.map((s: string) => ({ name: s, endorsements: 0 }));
        }
      } catch { skills = []; }

      let experience: { id: string; title: string; company: string; period: string; desc: string }[] = [];
      try {
        const rawExp = profile.experience ? JSON.parse(profile.experience) : [];
        if (Array.isArray(rawExp)) {
          experience = rawExp.map((e: Record<string, string>, i: number) => ({
            id: String(i),
            title: e.title || '',
            company: e.company || '',
            period: e.period || '',
            desc: e.desc || e.description || '',
          }));
        }
      } catch { experience = []; }

      let education: { id: string; degree: string; school: string; year: string }[] = [];
      try {
        const rawEdu = profile.education ? JSON.parse(profile.education) : [];
        if (Array.isArray(rawEdu)) {
          education = rawEdu.map((e: Record<string, string>, i: number) => ({
            id: String(i),
            degree: e.degree || '',
            school: e.school || '',
            year: e.year || '',
          }));
        }
      } catch { education = []; }

      let certifications: { id: string; name: string; icon: string; color: string; year: string }[] = [];
      try {
        const rawCerts = profile.certifications ? JSON.parse(profile.certifications) : [];
        if (Array.isArray(rawCerts)) {
          certifications = rawCerts.map((c: Record<string, string>, i: number) => ({
            id: String(i),
            name: c.name || '',
            icon: c.icon || 'default',
            color: c.color || '#003087',
            year: c.year || '',
          }));
        }
      } catch { certifications = []; }

      let portfolio: { id: string; title: string; image: string; type: string }[] = [];
      try {
        const rawPort = profile.portfolio ? JSON.parse(profile.portfolio) : [];
        if (Array.isArray(rawPort)) {
          portfolio = rawPort.map((p: Record<string, string>, i: number) => ({
            id: String(i),
            title: p.title || '',
            image: p.image || '',
            type: p.type || 'Vente',
          }));
        }
      } catch { portfolio = []; }

      const endorsementCount = (profile as Record<string, unknown>)._count
        ? ((profile as Record<string, unknown>)._count as Record<string, number>).endorsements || 0
        : 0;

      const transformedProfile = {
        name: (user?.name || '') as string,
        headline: (profile.headline || '') as string,
        location: `${user?.city || profile.zone || ''}${user?.country ? ', ' + (user?.country as string) : ''}`,
        avatar: (user?.avatar || '') as string,
        coverPhoto: (user?.coverPhoto || '') as string,
        availability: (profile.availability || 'offline') as string,
        bio: (profile.bio || (user?.bio as string) || '') as string,
        skills,
        experience,
        education,
        certifications,
        portfolio,
        recommendations: [] as { id: string; author: string; avatar: string; text: string }[],
        stats: {
          profileViews: 0,
          searchAppearances: 0,
          connections: endorsementCount,
          credibilityScore: (user?.credibilityScore || profile.credibilityScore || 0) as number,
        },
        profileCompleteness: profile.completenessPct || 0,
        userId: profile.userId,
        slug: profile.slug,
        specialities: profile.specialities,
      };

      return NextResponse.json(transformedProfile);
    }

    // General listing with filters
    const where: Record<string, unknown> = { isPublic: true };

    if (specialities) {
      where.specialities = { contains: specialities };
    }
    if (city) where.zone = city;
    if (availability) where.availability = availability;
    if (country) where.country = country;

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
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    // Use authenticated user's ID if not provided
    const userId = body.userId || auth.userId;

    const profile = await db.professionalProfile.create({
      data: {
        userId,
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
        country: body.country || null,
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
