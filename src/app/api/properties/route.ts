import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { propertyCreateSchema } from '@/lib/validations/property.schema';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: Request) {
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const where: Record<string, unknown> = { status: 'published' };

    if (type) where.type = type;
    if (transaction) where.transaction = transaction;
    if (city) where.city = city;
    if (country) where.country = country;
    if (verified === 'true') where.verified = true;
    if (geoTrust === 'true') where.geoTrust = true;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice);
      if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice);
    }

    const [properties, total] = await Promise.all([
      db.property.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.property.count({ where }),
    ]);

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Properties API error:', error);
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Auth: only agents and admins can create properties
    const auth = await authGuard({ requiredRoles: ['agent', 'admin'] });
    if (!auth.success) return auth.response;

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
        description: validated.description,
        features: validated.features ? JSON.stringify(validated.features) : null,
        images: validated.images ? JSON.stringify(validated.images) : null,
        lat: validated.lat,
        lng: validated.lng,
        agentId: auth.userId,
        status: 'draft',
      },
    });

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
