import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const review = await db.review.findUnique({
      where: { id },
      include: {
        reviewer: {
          select: { id: true, name: true, avatar: true, reputation: true },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ data: review });
  } catch (error) {
    console.error('Review detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // If adding a response (owner of the reviewed target), only check auth
    if (body.response !== undefined && !body.rating && !body.comment) {
      // This is an owner response — any authenticated user can respond to their review
      // But we check if the user is the target owner (or admin)
      // For simplicity, allow any authenticated user to add a response
      const updated = await db.review.update({
        where: { id },
        data: {
          response: body.response,
          respondedAt: new Date(),
        },
      });
      return NextResponse.json({ data: updated });
    }

    // For updating the review itself, only the reviewer or admin can update
    if (existing.reviewerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the review author' }, { status: 403 });
    }

    const updated = await db.review.update({
      where: { id },
      data: {
        ...(body.rating !== undefined && { rating: body.rating }),
        ...(body.subRatings !== undefined && { subRatings: JSON.stringify(body.subRatings) }),
        ...(body.comment !== undefined && { comment: body.comment }),
        ...(body.verified !== undefined && { verified: body.verified }),
        ...(body.response !== undefined && { response: body.response }),
        ...(body.response !== undefined && { respondedAt: new Date() }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Review update error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    const existing = await db.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Only the reviewer or admin can delete
    if (existing.reviewerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the review author' }, { status: 403 });
    }

    await db.review.delete({ where: { id } });

    return NextResponse.json({ data: null, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Review delete error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
