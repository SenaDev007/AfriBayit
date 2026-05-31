import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hotel = await db.hotel.findUnique({
      where: { id },
      include: {
        rooms: {
          orderBy: { basePriceXof: 'asc' },
        },
        reviews_hotel: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { rooms: true, bookings: true, reviews_hotel: true },
        },
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    return NextResponse.json(hotel);
  } catch (error) {
    console.error('Hotel detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch hotel' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const hotel = await db.hotel.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.slug && { slug: body.slug }),
        ...(body.city && { city: body.city }),
        ...(body.country && { country: body.country }),
        ...(body.stars !== undefined && { stars: body.stars }),
        ...(body.pricePerNight !== undefined && { pricePerNight: body.pricePerNight }),
        ...(body.amenities && { amenities: JSON.stringify(body.amenities) }),
        ...(body.images && { images: JSON.stringify(body.images) }),
        ...(body.policies && { policies: JSON.stringify(body.policies) }),
        ...(body.available !== undefined && { available: body.available }),
        ...(body.connectionLevel !== undefined && { connectionLevel: body.connectionLevel }),
        ...(body.lat !== undefined && { lat: body.lat }),
        ...(body.lng !== undefined && { lng: body.lng }),
        ...(body.status && { status: body.status }),
      },
    });

    return NextResponse.json(hotel);
  } catch (error) {
    console.error('Hotel update error:', error);
    return NextResponse.json({ error: 'Failed to update hotel' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hotel = await db.hotel.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return NextResponse.json({ message: 'Hotel soft deleted', hotel });
  } catch (error) {
    console.error('Hotel delete error:', error);
    return NextResponse.json({ error: 'Failed to delete hotel' }, { status: 500 });
  }
}
