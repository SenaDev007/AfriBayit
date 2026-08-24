import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
import { toJsonInput, fromJson, toNumber } from '@/lib/db-helpers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rooms = await db.guesthouseRoom.findMany({
      where: { guesthouseId: id },
      orderBy: { basePrice: 'asc' },
    });

    return NextResponse.json(rooms);
  } catch (error) {
    console.error('Guesthouse rooms API error:', error);
    return NextResponse.json({ error: 'Failed to fetch guesthouse rooms' }, { status: 500 });
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

    // Verify ownership: guesthouse owner or admin
    const guesthouse = await db.guesthouse.findUnique({ where: { id } });
    if (!guesthouse) {
      return NextResponse.json({ error: 'Guesthouse not found' }, { status: 404 });
    }
    if (guesthouse.ownerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the guesthouse owner' }, { status: 403 });
    }

    const room = await db.guesthouseRoom.create({
      data: {
        guesthouseId: id,
        name: body.name,
        capacity: body.capacity || 2,
        amenities: toJsonInput(body.amenities),
        basePrice: body.basePrice,
        currency: body.currency || 'XOF',
        photos: toJsonInput(body.photos),
        available: body.available ?? true,
        instantBooking: body.instantBooking ?? true,
      },
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    console.error('Guesthouse room creation error:', error);
    return NextResponse.json({ error: 'Failed to create guesthouse room' }, { status: 500 });
  }
}
