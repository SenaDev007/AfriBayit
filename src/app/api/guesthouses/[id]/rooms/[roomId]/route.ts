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

    // Verify the room belongs to this guesthouse
    const existing = await db.guesthouseRoom.findUnique({ where: { id: roomId } });
    if (!existing) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    if (existing.guesthouseId !== id) {
      return NextResponse.json({ error: 'Room does not belong to this guesthouse' }, { status: 400 });
    }

    // Verify ownership: guesthouse owner or admin
    const guesthouse = await db.guesthouse.findUnique({ where: { id } });
    if (!guesthouse) {
      return NextResponse.json({ error: 'Guesthouse not found' }, { status: 404 });
    }
    if (guesthouse.ownerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the guesthouse owner' }, { status: 403 });
    }

    const updated = await db.guesthouseRoom.update({
      where: { id: roomId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.capacity !== undefined && { capacity: body.capacity }),
        ...(body.amenities !== undefined && { amenities: JSON.stringify(body.amenities) }),
        ...(body.basePrice !== undefined && { basePrice: body.basePrice }),
        ...(body.currency !== undefined && { currency: body.currency }),
        ...(body.photos !== undefined && { photos: JSON.stringify(body.photos) }),
        ...(body.available !== undefined && { available: body.available }),
        ...(body.instantBooking !== undefined && { instantBooking: body.instantBooking }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Guesthouse room update error:', error);
    return NextResponse.json({ error: 'Failed to update guesthouse room' }, { status: 500 });
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

    // Verify the room belongs to this guesthouse
    const existing = await db.guesthouseRoom.findUnique({ where: { id: roomId } });
    if (!existing) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    if (existing.guesthouseId !== id) {
      return NextResponse.json({ error: 'Room does not belong to this guesthouse' }, { status: 400 });
    }

    // Verify ownership: guesthouse owner or admin
    const guesthouse = await db.guesthouse.findUnique({ where: { id } });
    if (!guesthouse) {
      return NextResponse.json({ error: 'Guesthouse not found' }, { status: 404 });
    }
    if (guesthouse.ownerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the guesthouse owner' }, { status: 403 });
    }

    await db.guesthouseRoom.delete({ where: { id: roomId } });

    return NextResponse.json({ message: 'Room deleted' });
  } catch (error) {
    console.error('Guesthouse room delete error:', error);
    return NextResponse.json({ error: 'Failed to delete guesthouse room' }, { status: 500 });
  }
}
