import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const favorites = await db.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            type: true,
            transaction: true,
            price: true,
            currency: true,
            city: true,
            country: true,
            images: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(favorites);
  } catch (error) {
    console.error('Favorites API error:', error);
    return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const favorite = await db.favorite.create({
      data: {
        userId: body.userId,
        propertyId: body.propertyId,
      },
    });

    // Increment property favorites count
    await db.property.update({
      where: { id: body.propertyId },
      data: { favorites: { increment: 1 } },
    });

    return NextResponse.json(favorite, { status: 201 });
  } catch (error) {
    console.error('Favorite creation error:', error);
    return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const propertyId = searchParams.get('propertyId');

    if (!userId || !propertyId) {
      return NextResponse.json({ error: 'userId and propertyId are required' }, { status: 400 });
    }

    const favorite = await db.favorite.deleteMany({
      where: { userId, propertyId },
    });

    // Decrement property favorites count
    await db.property.update({
      where: { id: propertyId },
      data: { favorites: { decrement: 1 } },
    });

    return NextResponse.json({ deleted: favorite.count });
  } catch (error) {
    console.error('Favorite deletion error:', error);
    return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
  }
}
