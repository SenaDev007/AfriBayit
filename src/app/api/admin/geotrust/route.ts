import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    // 🔒 P1.3 — Admin authGuard (defense in depth)
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab') || 'geometers';
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (tab === 'missions') {
      const where: Record<string, unknown> = {};
      if (country) where.property = { country };
      if (status) where.status = status;

      if (search) {
        where.OR = [
          { serviceCode: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
          { property: { title: { contains: search, mode: 'insensitive' } } },
          { geometer: { user: { name: { contains: search, mode: 'insensitive' } } } },
        ];
      }

      const [missions, total] = await Promise.all([
        db.geometerMission.findMany({
          where,
          select: {
            id: true,
            propertyId: true,
            geometerId: true,
            status: true,
            scheduledAt: true,
            completedAt: true,
            property: { select: { id: true, title: true, city: true, country: true } },
            geometer: { select: { id: true, user: { select: { id: true, name: true } } } },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        db.geometerMission.count({ where }),
      ]);

      const [totalGeometers, totalMissions, pendingMissions, completedMissions] = await Promise.all([
        db.geometer.count(),
        db.geometerMission.count(),
        db.geometerMission.count({ where: { status: 'requested' } }),
        db.geometerMission.count({ where: { status: 'completed' } }),
      ]);

      return NextResponse.json({
        missions,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        summary: { totalGeometers, totalMissions, pendingMissions, completedMissions },
      });
    }

    // Default: tab === 'geometers'
    const where: Record<string, unknown> = {};
    if (country) where.country = country;
    if (status === 'verified') where.certified = true;
    else if (status === 'pending') where.certified = false;
    else if (status) where.available = status === 'available';

    if (search) {
      where.OR = [
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { specialities: { contains: search, mode: 'insensitive' } },
        { zone: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [geometers, total] = await Promise.all([
      db.geometer.findMany({
        where,
        select: {
          id: true,
          licenseNumber: true,
          country: true,
          specialities: true,
          certified: true,
          rating: true,
          certificationLevel: true,
          user: { select: { id: true, name: true, email: true, avatar: true } },
          _count: { select: { missions_rel: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.geometer.count({ where }),
    ]);

    const [totalGeometers, totalMissions, pendingMissions, completedMissions] = await Promise.all([
      db.geometer.count(),
      db.geometerMission.count(),
      db.geometerMission.count({ where: { status: 'requested' } }),
      db.geometerMission.count({ where: { status: 'completed' } }),
    ]);

    return NextResponse.json({
      geometers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: { totalGeometers, totalMissions, pendingMissions, completedMissions },
    });
  } catch (error) {
    console.error('Admin geotrust error:', error);
    return NextResponse.json({ error: 'Failed to fetch geotrust data' }, { status: 500 });
  }
}
