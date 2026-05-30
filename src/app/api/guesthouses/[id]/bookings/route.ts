import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { guesthouseId: id };
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      db.guesthouseBooking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { room: true },
      }),
      db.guesthouseBooking.count({ where }),
    ]);

    return NextResponse.json({
      bookings,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Guesthouse bookings API error:', error);
    return NextResponse.json({ error: 'Failed to fetch guesthouse bookings' }, { status: 500 });
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

    const booking = await db.guesthouseBooking.create({
      data: {
        guesthouseId: id,
        roomId: body.roomId,
        userId: auth.userId,
        checkIn: new Date(body.checkIn),
        checkOut: new Date(body.checkOut),
        guests: body.guests || 1,
        totalPrice: body.totalPrice,
        currency: body.currency || 'XOF',
        breakfastIncluded: body.breakfastIncluded ?? false,
        status: 'pending',
        paymentRef: body.paymentRef,
        paymentProvider: body.paymentProvider,
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error('Guesthouse booking creation error:', error);
    return NextResponse.json({ error: 'Failed to create guesthouse booking' }, { status: 500 });
  }
}
