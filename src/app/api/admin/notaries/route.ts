import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    // 🔒 P1.3 — Admin authGuard (defense in depth)
    const auth = await authGuard(request, { requiredRoles: ['SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (country) where.country = country;
    if (status === 'verified') where.certified = true;
    else if (status === 'pending') where.certified = false;
    else if (status === 'available') where.available = true;
    else if (status === 'unavailable') where.available = false;

    if (search) {
      where.OR = [
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { specialty: { contains: search, mode: 'insensitive' } },
        { zone: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [notaries, total] = await Promise.all([
      db.notary.findMany({
        where,
        select: {
          id: true,
          licenseNumber: true,
          specialty: true,
          country: true,
          zone: true,
          certified: true,
          available: true,
          rating: true,
          missions: true,
          certificationLevel: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.notary.count({ where }),
    ]);

    const [totalVerified, totalPending] = await Promise.all([
      db.notary.count({ where: { certified: true } }),
      db.notary.count({ where: { certified: false } }),
    ]);

    return NextResponse.json({
      notaries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: { total, verified: totalVerified, pending: totalPending },
    });
  } catch (error) {
    console.error('Admin notaries error:', error);
    return NextResponse.json({ error: 'Failed to fetch notaries' }, { status: 500 });
  }
}
