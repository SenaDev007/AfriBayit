import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; quoteId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, quoteId } = await params;
    const body = await request.json();

    const existing = await db.artisanQuote.findUnique({ where: { id: quoteId } });
    if (!existing) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    if (existing.artisanId !== id) {
      return NextResponse.json({ error: 'Quote does not belong to this artisan' }, { status: 400 });
    }

    // Verify ownership: artisan owner or the quote requester or admin
    const artisan = await db.artisan.findUnique({ where: { id } });
    const isArtisanOwner = artisan?.userId === auth.userId;
    const isQuoteRequester = existing.userId === auth.userId;
    const isAdmin = auth.role === 'admin';

    if (!isArtisanOwner && !isQuoteRequester && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: not authorized to update this quote' }, { status: 403 });
    }

    // Validate status if provided
    const validStatuses = ['requested', 'sent', 'accepted', 'rejected', 'in_progress', 'completed'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const updated = await db.artisanQuote.update({
      where: { id: quoteId },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.artisanResponse !== undefined && { artisanResponse: body.artisanResponse }),
        ...(body.quotedPrice !== undefined && { quotedPrice: body.quotedPrice }),
        ...(body.quotedDuration !== undefined && { quotedDuration: body.quotedDuration }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Artisan quote update error:', error);
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; quoteId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, quoteId } = await params;

    const existing = await db.artisanQuote.findUnique({ where: { id: quoteId } });
    if (!existing) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }
    if (existing.artisanId !== id) {
      return NextResponse.json({ error: 'Quote does not belong to this artisan' }, { status: 400 });
    }

    // Verify ownership: artisan owner or the quote requester or admin
    const artisan = await db.artisan.findUnique({ where: { id } });
    const isArtisanOwner = artisan?.userId === auth.userId;
    const isQuoteRequester = existing.userId === auth.userId;
    const isAdmin = auth.role === 'admin';

    if (!isArtisanOwner && !isQuoteRequester && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: not authorized to delete this quote' }, { status: 403 });
    }

    await db.artisanQuote.delete({ where: { id: quoteId } });

    return NextResponse.json({ message: 'Quote deleted' });
  } catch (error) {
    console.error('Artisan quote delete error:', error);
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 });
  }
}
