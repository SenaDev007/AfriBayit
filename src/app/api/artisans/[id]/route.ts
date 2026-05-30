import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const artisan = await db.artisan.findUnique({
      where: { id },
      include: {
        services: {
          orderBy: { createdAt: 'asc' },
        },
        quotes: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          where: { status: 'completed' },
        },
      },
    });

    if (!artisan) {
      return NextResponse.json({ error: 'Artisan not found' }, { status: 404 });
    }

    return NextResponse.json({ data: artisan });
  } catch (error) {
    console.error('Artisan detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch artisan' }, { status: 500 });
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

    const existing = await db.artisan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Artisan not found' }, { status: 404 });
    }

    // Only the artisan owner or admin can update
    if (existing.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the artisan profile owner' }, { status: 403 });
    }

    const updated = await db.artisan.update({
      where: { id },
      data: {
        ...(body.trade !== undefined && { trade: body.trade }),
        ...(body.specialties !== undefined && { specialties: JSON.stringify(body.specialties) }),
        ...(body.certified !== undefined && { certified: body.certified }),
        ...(body.kybValid !== undefined && { kybValid: body.kybValid }),
        ...(body.available !== undefined && { available: body.available }),
        ...(body.emergency !== undefined && { emergency: body.emergency }),
        ...(body.priceRange !== undefined && { priceRange: body.priceRange }),
        ...(body.dailyRate !== undefined && { dailyRate: body.dailyRate }),
        ...(body.portfolio !== undefined && { portfolio: JSON.stringify(body.portfolio) }),
        ...(body.zone !== undefined && { zone: body.zone }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.subscriptionTier !== undefined && { subscriptionTier: body.subscriptionTier }),
        ...(body.responseTime !== undefined && { responseTime: body.responseTime }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Artisan update error:', error);
    return NextResponse.json({ error: 'Failed to update artisan' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    const existing = await db.artisan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Artisan not found' }, { status: 404 });
    }

    // Only the artisan owner or admin can delete
    if (existing.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the artisan profile owner' }, { status: 403 });
    }

    await db.artisan.delete({ where: { id } });

    return NextResponse.json({ data: null, message: 'Artisan profile deleted successfully' });
  } catch (error) {
    console.error('Artisan delete error:', error);
    return NextResponse.json({ error: 'Failed to delete artisan profile' }, { status: 500 });
  }
}
