import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    // Users can only see their own favorites
    const favorites = await db.favorite.findMany({
      where: { userId: auth.userId },
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
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const favorite = await db.favorite.create({
      data: {
        userId: auth.userId,
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
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
    }

    // Users can only delete their own favorites
    const favorite = await db.favorite.deleteMany({
      where: { userId: auth.userId, propertyId },
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
