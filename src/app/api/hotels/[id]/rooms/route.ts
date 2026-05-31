import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rooms = await db.hotelRoom.findMany({
      where: { hotelId: id },
      orderBy: { basePriceXof: 'asc' },
      include: {
        availability: {
          orderBy: { date: 'asc' },
          take: 30,
        },
      },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Hotel rooms API error:', error);
    return NextResponse.json({ error: 'Failed to fetch hotel rooms' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    // Verify ownership: hotel owner or admin
    const hotel = await db.hotel.findUnique({ where: { id } });
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }
    if (hotel.ownerId && hotel.ownerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the hotel owner' }, { status: 403 });
    }

    const room = await db.hotelRoom.create({
      data: {
        hotelId: id,
        type: body.type,
        name: body.name,
        capacity: body.capacity || 2,
        amenities: body.amenities ? JSON.stringify(body.amenities) : null,
        basePriceXof: body.basePriceXof,
        currency: body.currency || 'XOF',
        photos: body.photos ? JSON.stringify(body.photos) : null,
        totalRooms: body.totalRooms || 1,
        available: body.available ?? true,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Hotel room creation error:', error);
    return NextResponse.json({ error: 'Failed to create hotel room' }, { status: 500 });
  }
}
