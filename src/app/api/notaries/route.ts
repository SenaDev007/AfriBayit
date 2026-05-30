import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zone = searchParams.get('zone');
    const certificationLevel = searchParams.get('certificationLevel');
    const available = searchParams.get('available');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: Record<string, unknown> = { certified: true };

    if (zone) where.zone = zone;
    if (certificationLevel) where.certificationLevel = certificationLevel;
    if (available === 'true') where.available = true;

    const [notaries, total] = await Promise.all([
      db.notary.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { rating: 'desc' },
      }),
      db.notary.count({ where }),
    ]);

    return NextResponse.json({
      notaries,
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
