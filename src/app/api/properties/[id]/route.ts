import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
import { cache, buildCacheKey, invalidatePropertyCache } from '@/lib/cache';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Parse JSON string fields
    let images: string[] = [];
    try {
      images = propertyRaw.images ? JSON.parse(propertyRaw.images) : [];
    } catch {
      images = [];
    }

    // If propertyImages exist, use them as the authoritative image list
    if (propertyRaw.propertyImages && propertyRaw.propertyImages.length > 0) {
      images = propertyRaw.propertyImages.map((img) => img.url);
    }

    let features: string[] = [];
    try {
      features = propertyRaw.features ? JSON.parse(propertyRaw.features) : [];
    } catch {
      features = [];
    }

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

    return NextResponse.json({ data: property });
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
        ...(body.description !== undefined && { description: body.description }),
        ...(body.features !== undefined && { features: JSON.stringify(body.features) }),
        ...(body.images !== undefined && { images: JSON.stringify(body.images) }),
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
