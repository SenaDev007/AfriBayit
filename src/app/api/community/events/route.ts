import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const city = searchParams.get('city');
    const eventType = searchParams.get('eventType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: Record<string, unknown> = {};

    if (country) where.country = country;
    if (city) where.city = city;
    if (eventType) where.eventType = eventType;

    if (startDate && endDate) {
      where.eventDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.eventDate = { gte: new Date(startDate) };
    }

    const [events, total] = await Promise.all([
      db.communityEvent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { eventDate: 'asc' },
      }),
      db.communityEvent.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Community events API error:', error);
    return NextResponse.json({ error: 'Failed to fetch community events' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const event = await db.communityEvent.create({
      data: {
        title: body.title,
        description: body.description,
        organizerId: auth.userId,
        groupId: body.groupId,
        eventType: body.eventType,
        country: body.country,
        city: body.city,
        venue: body.venue,
        eventDate: new Date(body.eventDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        isVirtual: body.isVirtual ?? false,
        meetingUrl: body.meetingUrl,
        maxAttendees: body.maxAttendees,
        image: body.image,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Community event creation error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
