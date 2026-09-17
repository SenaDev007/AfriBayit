import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { propertyCreateSchema } from '@/lib/validations/property.schema';
import { authGuard } from '@/lib/auth-guard';
import { cache, buildCacheKey, invalidatePropertyCache } from '@/lib/cache';
import { toJsonInput, fromJson, toNumber, parseJsonArray } from '@/lib/db-helpers';

export async function GET(request: Request) {
  // Public listing responses are cacheable at the CDN edge (Vercel) — this
  // absorbs Neon auto-suspend cold starts and makes repeat visits instant.
  // Fresh window: 5 min (newly published listings appear quickly on active
  // traffic). Stale-while-revalidate: 24h — with sparse traffic the CDN entry
  // expires between visits, and WITHOUT a long SWR window every "first visitor
  // of the day" pays the full ~10s Neon wake-up cost. Serving a stale list
  // instantly (and refreshing it in the background) is the right trade for a
  // marketplace listing page: the cold DB hit then only affects the invisible
  // background revalidation, never the user.
  const CDN_CACHE_HEADERS = {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400',
  };
  const PRIVATE_CACHE_HEADERS = {
    'Cache-Control': 'private, no-store',
  };
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const transaction = searchParams.get('transaction');
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const verified = searchParams.get('verified');
    const geoTrust = searchParams.get('geoTrust');
    const premium = searchParams.get('premium');
    const sortBy = searchParams.get('sortBy') || 'recent';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const agentId = searchParams.get('agentId');
    const statusFilter = searchParams.get('status');
    const PRIVATE_STATUSES = new Set(['draft', 'pending_review', 'rejected', 'archived']);
    const ADMIN_ROLES_SET = new Set(['SUPER_ADMIN', 'COUNTRY_ADMIN']);
    let authUserId: string | null = null;
    let authRole: string | null = null;
    if (agentId || (statusFilter && PRIVATE_STATUSES.has(statusFilter))) {
      const auth = await authGuard(request);
      if (!auth.success) {
        if (agentId) return auth.response;
        if (statusFilter && PRIVATE_STATUSES.has(statusFilter)) return auth.response;
      } else {
        authUserId = auth.userId;
        authRole = auth.role;
      }
    }
    const isCacheable = !agentId && (!statusFilter || statusFilter === 'published');
    const cacheKey = buildCacheKey('properties', `list:${type || 'all'}:${transaction || 'all'}:${city || 'all'}:${country || 'all'}:${minPrice || ''}:${maxPrice || ''}:${verified || ''}:${geoTrust || ''}:${premium || ''}:${sortBy}:${page}:${limit}`, country || undefined);
    if (isCacheable) {
      const cached = await cache.get(cacheKey);
      if (cached) return NextResponse.json(cached, { headers: CDN_CACHE_HEADERS });
    }
    const where: Record<string, unknown> = {};
    if (agentId) {
      const isOwner = authUserId === agentId;
      const isAdmin = authRole !== null && ADMIN_ROLES_SET.has(authRole);
      if (!isOwner && !isAdmin) {
        where.agentId = agentId;
        where.status = 'published';
      } else {
        where.agentId = agentId;
        if (statusFilter) where.status = statusFilter;
        else where.status = { in: ['published', 'draft', 'pending_review'] };
      }
    } else {
      where.status = statusFilter && !PRIVATE_STATUSES.has(statusFilter) ? statusFilter : 'published';
    }

    if (type && type !== 'all') where.type = type;
    if (transaction && transaction !== 'all') where.transaction = transaction;
    if (city && city !== 'all') where.city = city;
    if (country && country !== 'all') where.country = country;
    if (verified === 'true') where.verified = true;
    if (geoTrust === 'true') where.geoTrust = true;
    if (premium === 'true') where.premium = true;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice);
      if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice);
    }

    // Determine sort order
    let orderBy: Record<string, string> = { createdAt: 'desc' };
    if (sortBy === 'price-asc') orderBy = { price: 'asc' };
    else if (sortBy === 'price-desc') orderBy = { price: 'desc' };
    else if (sortBy === 'popular') orderBy = { views: 'desc' };

    const [propertiesRaw, total] = await Promise.all([
      db.property.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              avatar: true,
              verified: true,
              professionalProfile: {
                select: {
                  agencyName: true,
                  credibilityScore: true,
                },
              },
            },
          },
        },
      }),
      db.property.count({ where }),
    ]);

    // Parse JSON fields and shape response
    const properties = propertiesRaw.map((p) => {
      const { owner, ...rest } = p;
      // Defensive parsing: legacy rows may store these Json columns as
      // JSON-encoded strings (e.g. images: '["https://…"]').
      const images = parseJsonArray<string>(rest.images);
      const features = parseJsonArray<string>(rest.features);

      return {
        ...rest,
        images,
        features,
        agent: owner
          ? {
              id: owner.id,
              name: owner.name,
              avatar: owner.avatar,
              company: owner.professionalProfile?.agencyName,
              certified: owner.verified,
            }
          : undefined,
      };
    });

    const responseData = {
      properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    if (isCacheable) await cache.set(cacheKey, responseData, 300);

    return NextResponse.json(responseData, {
      headers: isCacheable ? CDN_CACHE_HEADERS : PRIVATE_CACHE_HEADERS,
    });
  } catch (error) {
    console.error('Properties API error:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Auth: only agents and admins can create properties
    const auth = await authGuard({ requiredRoles: ['CERTIFIED_AGENT', 'SUPER_ADMIN', 'COUNTRY_ADMIN'] });
    if (!auth.success) return auth.response;

    // Agent certification enforcement: only agents with verificationStatus = 'APPROVED' can publish
    if (auth.role === 'agent') {
      const user = await db.user.findUnique({
        where: { id: auth.userId },
        select: { verified: true, verificationStatus: true },
      });
      if (!user?.verified || user.verificationStatus !== 'APPROVED') {
        return NextResponse.json(
          {
            error: 'Compte agent non certifié. Seuls les agents avec le statut APPROVED peuvent publier des biens.',
            code: 'AGENT_NOT_CERTIFIED',
            verificationStatus: user?.verificationStatus || 'PENDING',
          },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    // Validate with Zod schema
    const validated = propertyCreateSchema.parse(body);

    const property = await db.property.create({
      data: {
        title: validated.title,
        type: validated.type,
        transaction: validated.transaction,
        price: validated.price,
        currency: validated.currency,
        surface: validated.surface,
        rooms: validated.rooms,
        bedrooms: validated.bedrooms,
        bathrooms: validated.bathrooms,
        city: validated.city,
        country: validated.country,
        quartier: validated.quartier,
        address: validated.address,
        description: (validated.description as string) || '',
        features: toJsonInput(validated.features),
        images: toJsonInput(validated.images),
        lat: validated.lat,
        lng: validated.lng,
        agentId: auth.userId,
        status: 'draft',
      },
    });

    // Invalidate property listing caches for this country
    await invalidatePropertyCache(validated.country);

    return NextResponse.json(property, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      // Zod validation error
      return NextResponse.json(
        { error: 'Données invalides', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      );
    }
    if (error && typeof error === 'object' && 'response' in error) {
      // Auth error thrown by requireAuth
      return (error as { response: NextResponse }).response;
    }
    console.error('Property creation error:', error);
    return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
  }
}
