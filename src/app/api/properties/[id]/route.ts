import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
import { cache, buildCacheKey, invalidatePropertyCache } from '@/lib/cache';
import { parseJsonArray, toJsonInput } from '@/lib/db-helpers';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Public property detail — short CDN cache so a card click → back → click
  // again (or a repeat visit within a minute) is instant, while keeping the
  // data fresh enough for edits to show quickly. Short window on purpose:
  // GET increments `views`, and longer caching would visibly dampen that
  // counter. Never cached for non-200 responses.
  const CDN_CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
  };
  try {
    const { id } = await params;

    const propertyRaw = await db.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
            phone: true,
            verified: true,
            professionalProfile: {
              select: {
                agencyName: true,
                credibilityScore: true,
              },
            },
          },
        },
        propertyImages: {
          orderBy: { sortOrder: 'asc' },
        },
        legalDocs: true,
      },
    });

    if (!propertyRaw) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Parse JSON fields — defensive: legacy rows may store them as
    // JSON-encoded strings (e.g. images: '["https://…"]').
    let images: string[] = parseJsonArray<string>(propertyRaw.images);

    // If propertyImages exist, use them as the authoritative image list
    if (propertyRaw.propertyImages && propertyRaw.propertyImages.length > 0) {
      images = propertyRaw.propertyImages.map((img) => img.url);
    }

    const features: string[] = parseJsonArray<string>(propertyRaw.features);

    const { owner, propertyImages: _pi, ...rest } = propertyRaw;

    const property = {
      ...rest,
      images,
      features,
      agent: owner
        ? {
            id: owner.id,
            name: owner.name,
            avatar: owner.avatar,
            phone: owner.phone,
            company: owner.professionalProfile?.agencyName,
            certified: owner.verified,
            rating: 0,
            reviews: 0,
            listings: 0,
          }
        : undefined,
    };

    // Increment view count asynchronously (fire and forget)
    db.property.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => {});

    return NextResponse.json({ data: property }, { headers: CDN_CACHE_HEADERS });
  } catch (error) {
    console.error('Property detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch property' }, { status: 500 });
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

    // Verify property exists
    const existing = await db.property.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check ownership: only the agent/owner or admin can update
    if (existing.agentId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the property owner' }, { status: 403 });
    }

    // Invalidate caches for this property and its listings
    await cache.del(buildCacheKey('properties', `detail:${id}`, existing.country || undefined));
    await invalidatePropertyCache(existing.country || undefined);

    const updated = await db.property.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.transaction !== undefined && { transaction: body.transaction }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.currency !== undefined && { currency: body.currency }),
        ...(body.surface !== undefined && { surface: body.surface }),
        ...(body.rooms !== undefined && { rooms: body.rooms }),
        ...(body.bedrooms !== undefined && { bedrooms: body.bedrooms }),
        ...(body.bathrooms !== undefined && { bathrooms: body.bathrooms }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.quartier !== undefined && { quartier: body.quartier }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.description !== undefined && { description: (body.description as string) || '' }),
        // FIX: write real arrays/objects into Json columns — JSON.stringify()
        // here stored a string, which broke every image URL on read.
        ...(body.features !== undefined && { features: toJsonInput(body.features) }),
        ...(body.images !== undefined && { images: toJsonInput(body.images) }),
        ...(body.lat !== undefined && { lat: body.lat }),
        ...(body.lng !== undefined && { lng: body.lng }),
        ...(body.verified !== undefined && { verified: body.verified }),
        ...(body.geoTrust !== undefined && { geoTrust: body.geoTrust }),
        ...(body.geoTrustLevel !== undefined && { geoTrustLevel: body.geoTrustLevel }),
        ...(body.premium !== undefined && { premium: body.premium }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.hasVR !== undefined && { hasVR: body.hasVR }),
        ...(body.hasDroneView !== undefined && { hasDroneView: body.hasDroneView }),
        ...(body.rejectionReason !== undefined && { rejectionReason: body.rejectionReason }),
        ...(body.investmentScore !== undefined && { investmentScore: body.investmentScore }),
        ...(body.walkScore !== undefined && { walkScore: body.walkScore }),
        ...(body.publishedAt !== undefined && { publishedAt: new Date(body.publishedAt) }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Property update error:', error);
    return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
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

    // Verify property exists
    const existing = await db.property.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check ownership: only the agent/owner or admin can soft-delete
    if (existing.agentId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the property owner' }, { status: 403 });
    }

    // Invalidate caches for this property and its listings
    await cache.del(buildCacheKey('properties', `detail:${id}`, existing.country || undefined));
    await invalidatePropertyCache(existing.country || undefined);

    // Soft delete by setting status to 'rejected' (archived)
    const deleted = await db.property.update({
      where: { id },
      data: { status: 'rejected' },
    });

    return NextResponse.json({ data: deleted, message: 'Property soft deleted' });
  } catch (error) {
    console.error('Property delete error:', error);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
}
