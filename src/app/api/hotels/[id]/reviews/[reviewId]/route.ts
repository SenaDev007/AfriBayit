import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, reviewId } = await params;
    const body = await request.json();

    // Verify the review belongs to this hotel
    const existing = await db.hotelReview.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (existing.hotelId !== id) {
      return NextResponse.json({ error: 'Review does not belong to this hotel' }, { status: 400 });
    }

    // Verify ownership: review author, hotel owner, or admin
    const hotel = await db.hotel.findUnique({ where: { id } });
    const isReviewAuthor = existing.userId === auth.userId;
    const isHotelOwner = hotel?.ownerId === auth.userId;
    const isAdmin = auth.role === 'admin';

    if (!isReviewAuthor && !isHotelOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: not authorized to update this review' }, { status: 403 });
    }

    // Validate status if provided
    const validStatuses = ['pending_moderation', 'published', 'hidden'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await db.hotelReview.update({
      where: { id: reviewId },
      data: {
        ...(body.comment !== undefined && { comment: body.comment }),
        ...(body.cleanliness !== undefined && { cleanliness: body.cleanliness }),
        ...(body.comfort !== undefined && { comfort: body.comfort }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.value !== undefined && { value: body.value }),
        ...(body.service !== undefined && { service: body.service }),
        ...(body.overall !== undefined && { overall: body.overall }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.response !== undefined && { response: body.response, respondedAt: new Date() }),
      },
    });

    // Recalculate hotel average rating if ratings changed
    if (body.overall !== undefined) {
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
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Hotel review update error:', error);
    return NextResponse.json({ error: 'Failed to update hotel review' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, reviewId } = await params;

    // Verify the review belongs to this hotel
    const existing = await db.hotelReview.findUnique({ where: { id: reviewId } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    if (existing.hotelId !== id) {
      return NextResponse.json({ error: 'Review does not belong to this hotel' }, { status: 400 });
    }

    // Verify ownership: review author, hotel owner, or admin
    const hotel = await db.hotel.findUnique({ where: { id } });
    const isReviewAuthor = existing.userId === auth.userId;
    const isHotelOwner = hotel?.ownerId === auth.userId;
    const isAdmin = auth.role === 'admin';

    if (!isReviewAuthor && !isHotelOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: not authorized to delete this review' }, { status: 403 });
    }

    await db.hotelReview.delete({ where: { id: reviewId } });

    // Recalculate hotel average rating
    const avgRating = await db.hotelReview.aggregate({
      where: { hotelId: id },
      _avg: { overall: true },
    });

    if (avgRating._avg.overall) {
      await db.hotel.update({
        where: { id },
        data: { rating: Math.round(avgRating._avg.overall * 10) / 10 },
      });
    } else {
      await db.hotel.update({
        where: { id },
        data: { rating: 0 },
      });
    }

    return NextResponse.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Hotel review delete error:', error);
    return NextResponse.json({ error: 'Failed to delete hotel review' }, { status: 500 });
  }
}
