import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, roomId } = await params;
    const body = await request.json();

    // Verify the room belongs to this hotel
    const existing = await db.hotelRoom.findUnique({ where: { id: roomId } });
    if (!existing) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    if (existing.hotelId !== id) {
      return NextResponse.json({ error: 'Room does not belong to this hotel' }, { status: 400 });
    }

    // Verify ownership: hotel owner or admin
    const hotel = await db.hotel.findUnique({ where: { id } });
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }
    if (hotel.ownerId && hotel.ownerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the hotel owner' }, { status: 403 });
    }

    const updated = await db.hotelRoom.update({
      where: { id: roomId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.capacity !== undefined && { capacity: body.capacity }),
        ...(body.amenities !== undefined && { amenities: JSON.stringify(body.amenities) }),
        ...(body.basePriceXof !== undefined && { basePriceXof: body.basePriceXof }),
        ...(body.totalRooms !== undefined && { totalRooms: body.totalRooms }),
        ...(body.available !== undefined && { available: body.available }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.currency !== undefined && { currency: body.currency }),
        ...(body.photos !== undefined && { photos: JSON.stringify(body.photos) }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Hotel room update error:', error);
    return NextResponse.json({ error: 'Failed to update hotel room' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; roomId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, roomId } = await params;

    // Verify the room belongs to this hotel
    const existing = await db.hotelRoom.findUnique({ where: { id: roomId } });
    if (!existing) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    if (existing.hotelId !== id) {
      return NextResponse.json({ error: 'Room does not belong to this hotel' }, { status: 400 });
    }

    // Verify ownership: hotel owner or admin
    const hotel = await db.hotel.findUnique({ where: { id } });
    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }
    if (hotel.ownerId && hotel.ownerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the hotel owner' }, { status: 403 });
    }

    await db.hotelRoom.delete({ where: { id: roomId } });

    return NextResponse.json({ message: 'Room deleted' });
  } catch (error) {
    console.error('Hotel room delete error:', error);
    return NextResponse.json({ error: 'Failed to delete hotel room' }, { status: 500 });
  }
}
