import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const country = searchParams.get('country');
    const city = searchParams.get('city');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: Record<string, unknown> = {};

    if (type) where.type = type;
    if (country) where.country = country;
    if (city) where.city = city;

    const [groups, total] = await Promise.all([
      db.communityGroup.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { members: 'desc' },
        include: {
          _count: { select: { memberships: true } },
        },
      }),
      db.communityGroup.count({ where }),
    ]);

    return NextResponse.json({
      groups,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Community groups API error:', error);
    return NextResponse.json({ error: 'Failed to fetch community groups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const group = await db.communityGroup.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        type: body.type,
        country: body.country,
        city: body.city,
        isPrivate: body.isPrivate ?? false,
        coverImage: body.coverImage,
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Community group creation error:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
