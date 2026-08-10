import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTenantDb, extractTenantFromRequest, getTenantFilter } from '@/lib/db-tenant';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get('zone');
    const specialty = searchParams.get('specialty');
    const certificationLevel = searchParams.get('certificationLevel');
    const available = searchParams.get('available');
    const country = searchParams.get('country');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    // Use tenant-aware country filter
    const tenantCountry = extractTenantFromRequest(request);

    const where: Record<string, unknown> = {
      certified: true,
      // Apply tenant filter - explicit country param overrides tenant context
      ...(country ? { country } : getTenantFilter(tenantCountry)),
    };

    if (zone) where.zone = zone;
    if (specialty) where.specialty = specialty;
    if (certificationLevel) where.certificationLevel = certificationLevel;
    if (available === 'true') where.available = true;

    // Note: Notary's user relation may not be available in generated client,
    // so we fetch user data separately after getting notaries
    const [notaries, total] = await Promise.all([
      db.notary.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
      db.notary.count({ where }),
    ]);

    // Fetch user data for notaries
    const userIds = notaries.map((n) => n.userId).filter(Boolean);
    const users = userIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            name: true,
            avatar: true,
            city: true,
            country: true,
            reputation: true,
          },
        })
      : [];

    const userMap = new Map(users.map((u) => [u.id, u]));

    const notariesWithUsers = notaries.map((notary) => ({
      ...notary,
      user: userMap.get(notary.userId) || null,
    }));

    return NextResponse.json({
      notaries: notariesWithUsers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Notaries API error:', error);
    return NextResponse.json({ error: 'Failed to fetch notaries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const notary = await db.notary.create({
      data: {
        userId: auth.userId,
        licenseNumber: body.licenseNumber,
        chamberName: body.chamberName,
        specialty: body.specialty,
        certificationLevel: body.certificationLevel || 'standard',
        country: body.country || 'BJ',
        zone: body.zone,
        available: body.available ?? true,
        subscriptionTier: body.subscriptionTier,
        conventionSigned: body.conventionSigned ?? false,
        conventionUrl: body.conventionUrl,
        certified: body.certified ?? false,
      },
    });

    return NextResponse.json(notary, { status: 201 });
  } catch (error) {
    console.error('Notary creation error:', error);
    return NextResponse.json({ error: 'Failed to create notary profile' }, { status: 500 });
  }
}
