import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const geometer = await db.geometer.findUnique({
      where: { id },
      include: {
        missions_rel: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          where: { status: 'completed' },
          select: {
            id: true,
            serviceCode: true,
            status: true,
            result: true,
            createdAt: true,
            property: { select: { id: true, title: true, city: true } },
          },
        },
        _count: { select: { missions_rel: true } },
      },
    });

    if (!geometer) {
      return NextResponse.json({ error: 'Geometer not found' }, { status: 404 });
    }

    return NextResponse.json({ data: geometer });
  } catch (error) {
    console.error('Geometer detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch geometer' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.geometer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Geometer not found' }, { status: 404 });
    }

    // Only the geometer owner or admin can update
    if (existing.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the geometer profile owner' }, { status: 403 });
    }

    const updated = await db.geometer.update({
      where: { id },
      data: {
        ...(body.specialities !== undefined && { specialities: JSON.stringify(body.specialities) }),
        ...(body.certificationLevel !== undefined && { certificationLevel: body.certificationLevel }),
        ...(body.zone !== undefined && { zone: body.zone }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.available !== undefined && { available: body.available }),
        ...(body.lat !== undefined && { lat: body.lat }),
        ...(body.lng !== undefined && { lng: body.lng }),
        ...(body.subscriptionTier !== undefined && { subscriptionTier: body.subscriptionTier }),
        ...(body.certified !== undefined && { certified: body.certified }),
        ...(body.certifiedAt !== undefined && { certifiedAt: new Date(body.certifiedAt) }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Geometer update error:', error);
    return NextResponse.json({ error: 'Failed to update geometer profile' }, { status: 500 });
  }
}
