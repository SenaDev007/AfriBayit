import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    const { id } = await params;
    const body = await request.json();

    const room = await db.guesthouseRoom.create({
      data: {
        guesthouseId: id,
        name: body.name,
        capacity: body.capacity || 2,
        amenities: body.amenities ? JSON.stringify(body.amenities) : null,
        basePrice: body.basePrice,
        currency: body.currency || 'XOF',
        photos: body.photos ? JSON.stringify(body.photos) : null,
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
