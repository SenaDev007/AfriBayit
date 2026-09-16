import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toJsonInput } from '@/lib/db-helpers';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rental = await db.shortTermRental.findUnique({
      where: { id },
      include: {
        _count: { select: { bookings: true, reviews_str: true } },
        pricingRules: true,
        reviews_str: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!rental) {
      return NextResponse.json({ error: 'Location non trouvee' }, { status: 404 });
    }

    // Increment view count
    await db.shortTermRental.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // Fetch host info
    const host = await db.user.findUnique({
      where: { id: rental.hostId },
      select: { name: true, avatar: true, verified: true, kycLevel: true },
    });

    return NextResponse.json({ ...rental, host });
  } catch (error) {
    console.error('Short-term rental detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch rental' }, { status: 500 });
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

    // Verify ownership: host or admin
    const existing = await db.shortTermRental.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Location non trouvee' }, { status: 404 });
    }
    if (existing.hostId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse: vous n\'etes pas le proprietaire' }, { status: 403 });
    }

    const rental = await db.shortTermRental.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.slug && { slug: body.slug }),
        ...(body.description !== undefined && { description: (body.description as string) || '' }),
        ...(body.propertyType && { propertyType: body.propertyType }),
        ...(body.city && { city: body.city }),
        ...(body.country && { country: body.country }),
        ...(body.quartier !== undefined && { quartier: body.quartier }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.lat !== undefined && { lat: body.lat }),
        ...(body.lng !== undefined && { lng: body.lng }),
        ...(body.images && { images: toJsonInput(body.images) }),
        ...(body.pricePerNight !== undefined && { pricePerNight: body.pricePerNight }),
        ...(body.weeklyPrice !== undefined && { weeklyPrice: body.weeklyPrice }),
        ...(body.monthlyPrice !== undefined && { monthlyPrice: body.monthlyPrice }),
        ...(body.currency && { currency: body.currency }),
        ...(body.maxGuests !== undefined && { maxGuests: body.maxGuests }),
        ...(body.bedrooms !== undefined && { bedrooms: body.bedrooms }),
        ...(body.bathrooms !== undefined && { bathrooms: body.bathrooms }),
        ...(body.beds !== undefined && { beds: body.beds }),
        ...(body.amenities && { amenities: toJsonInput(body.amenities) }),
        ...(body.houseRules && { houseRules: toJsonInput(body.houseRules) }),
        ...(body.instantBooking !== undefined && { instantBooking: body.instantBooking }),
        ...(body.minStayNights !== undefined && { minStayNights: body.minStayNights }),
        ...(body.maxStayNights !== undefined && { maxStayNights: body.maxStayNights }),
        ...(body.cancellationPolicy && { cancellationPolicy: body.cancellationPolicy }),
        ...(body.cleaningFee !== undefined && { cleaningFee: body.cleaningFee }),
        ...(body.securityDeposit !== undefined && { securityDeposit: body.securityDeposit }),
        ...(body.otaRefs && { otaRefs: toJsonInput(body.otaRefs) }),
        ...(body.otaSyncStatus && { otaSyncStatus: toJsonInput(body.otaSyncStatus) }),
        ...(body.hostVerified !== undefined && { hostVerified: body.hostVerified }),
        ...(body.hostIdentityVerified !== undefined && { hostIdentityVerified: body.hostIdentityVerified }),
        ...(body.status && { status: body.status }),
      },
    });

    return NextResponse.json(rental);
  } catch (error) {
    console.error('Short-term rental update error:', error);
    return NextResponse.json({ error: 'Failed to update rental' }, { status: 500 });
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

    const existing = await db.shortTermRental.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Location non trouvee' }, { status: 404 });
    }
    if (existing.hostId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const rental = await db.shortTermRental.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return NextResponse.json({ message: 'Location desactivee', rental });
  } catch (error) {
    console.error('Short-term rental delete error:', error);
    return NextResponse.json({ error: 'Failed to delete rental' }, { status: 500 });
  }
}
