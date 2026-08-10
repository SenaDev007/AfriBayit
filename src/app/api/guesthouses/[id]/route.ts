import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const guesthouse = await db.guesthouse.findUnique({
      where: { id },
      include: {
        rooms: { orderBy: { basePrice: 'asc' } },
        meals: true,
        staff: true,
        pricingRules: true,
        _count: { select: { bookings: true } },
      },
    });

    if (!guesthouse) {
      return NextResponse.json({ error: 'Guesthouse not found' }, { status: 404 });
    }

    return NextResponse.json(guesthouse);
  } catch (error) {
    console.error('Guesthouse detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch guesthouse' }, { status: 500 });
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

    // Verify ownership: guesthouse owner or admin
    const existing = await db.guesthouse.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Guesthouse not found' }, { status: 404 });
    }
    if (existing.ownerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the guesthouse owner' }, { status: 403 });
    }

    const guesthouse = await db.guesthouse.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.slug && { slug: body.slug }),
        ...(body.description && { description: body.description }),
        ...(body.city && { city: body.city }),
        ...(body.country && { country: body.country }),
        ...(body.quartier && { quartier: body.quartier }),
        ...(body.address && { address: body.address }),
        ...(body.lat !== undefined && { lat: body.lat }),
        ...(body.lng !== undefined && { lng: body.lng }),
        ...(body.images && { images: JSON.stringify(body.images) }),
        ...(body.amenities && { amenities: JSON.stringify(body.amenities) }),
        ...(body.rules && { rules: JSON.stringify(body.rules) }),
        ...(body.certificationStatus && { certificationStatus: body.certificationStatus }),
        ...(body.breakfastAvailable !== undefined && { breakfastAvailable: body.breakfastAvailable }),
        ...(body.breakfastPrice !== undefined && { breakfastPrice: body.breakfastPrice }),
        ...(body.hasStaff !== undefined && { hasStaff: body.hasStaff }),
        ...(body.status && { status: body.status }),
      },
    });

    return NextResponse.json(guesthouse);
  } catch (error) {
    console.error('Guesthouse update error:', error);
    return NextResponse.json({ error: 'Failed to update guesthouse' }, { status: 500 });
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

    // Verify ownership: guesthouse owner or admin
    const existing = await db.guesthouse.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Guesthouse not found' }, { status: 404 });
    }
    if (existing.ownerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the guesthouse owner' }, { status: 403 });
    }

    const guesthouse = await db.guesthouse.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return NextResponse.json({ message: 'Guesthouse soft deleted', guesthouse });
  } catch (error) {
    console.error('Guesthouse delete error:', error);
    return NextResponse.json({ error: 'Failed to delete guesthouse' }, { status: 500 });
  }
}
