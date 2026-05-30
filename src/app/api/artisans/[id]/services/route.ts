import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify artisan exists
    const artisan = await db.artisan.findUnique({ where: { id } });
    if (!artisan) {
      return NextResponse.json({ error: 'Artisan not found' }, { status: 404 });
    }

    const services = await db.artisanService.findMany({
      where: { artisanId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ data: services });
  } catch (error) {
    console.error('Artisan services API error:', error);
    return NextResponse.json({ error: 'Failed to fetch artisan services' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    // Verify artisan exists and user is the owner
    const artisan = await db.artisan.findUnique({ where: { id } });
    if (!artisan) {
      return NextResponse.json({ error: 'Artisan not found' }, { status: 404 });
    }
    if (artisan.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the artisan profile owner' }, { status: 403 });
    }

    if (!body.serviceName) {
      return NextResponse.json({ error: 'serviceName is required' }, { status: 400 });
    }

    const service = await db.artisanService.create({
      data: {
        artisanId: id,
        serviceName: body.serviceName,
        description: body.description,
        basePrice: body.basePrice,
        unit: body.unit,
        category: body.category,
      },
    });

    return NextResponse.json({ data: service }, { status: 201 });
  } catch (error) {
    console.error('Artisan service creation error:', error);
    return NextResponse.json({ error: 'Failed to create artisan service' }, { status: 500 });
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

    if (!body.serviceId) {
      return NextResponse.json({ error: 'serviceId is required in body' }, { status: 400 });
    }

    // Verify the service belongs to this artisan
    const existing = await db.artisanService.findUnique({ where: { id: body.serviceId } });
    if (!existing) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    if (existing.artisanId !== id) {
      return NextResponse.json({ error: 'Service does not belong to this artisan' }, { status: 400 });
    }

    // Verify ownership of the artisan profile
    const artisan = await db.artisan.findUnique({ where: { id } });
    if (!artisan) {
      return NextResponse.json({ error: 'Artisan not found' }, { status: 404 });
    }
    if (artisan.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the artisan profile owner' }, { status: 403 });
    }

    const updated = await db.artisanService.update({
      where: { id: body.serviceId },
      data: {
        ...(body.serviceName !== undefined && { serviceName: body.serviceName }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.basePrice !== undefined && { basePrice: body.basePrice }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.category !== undefined && { category: body.category }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Artisan service update error:', error);
    return NextResponse.json({ error: 'Failed to update artisan service' }, { status: 500 });
  }
}
