import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const [reviews, total] = await Promise.all([
      db.hotelReview.findMany({
        where: { hotelId: id },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.hotelReview.count({ where: { hotelId: id } }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Hotel reviews API error:', error);
    return NextResponse.json({ error: 'Failed to fetch hotel reviews' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const review = await db.hotelReview.create({
      data: {
        hotelId: id,
        bookingId: body.bookingId,
        userId: body.userId,
        cleanliness: body.cleanliness,
        comfort: body.comfort,
        location: body.location,
        value: body.value,
        service: body.service,
        overall: body.overall,
        comment: body.comment,
        status: 'published',
      },
    });

    // Update hotel rating
    const avgRating = await db.hotelReview.aggregate({
      where: { hotelId: id },
      _avg: { overall: true },
    });

    if (avgRating._avg.overall) {
      await db.hotel.update({
        where: { id },
        data: { rating: Math.round(avgRating._avg.overall * 10) / 10 },
      });
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Hotel review creation error:', error);
    return NextResponse.json({ error: 'Failed to create hotel review' }, { status: 500 });
  }
}
