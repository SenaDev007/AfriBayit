import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, serviceId } = await params;
    const body = await request.json();

    // Verify the service belongs to this artisan
    const existing = await db.artisanService.findUnique({ where: { id: serviceId } });
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
      where: { id: serviceId },
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, serviceId } = await params;

    // Verify the service belongs to this artisan
    const existing = await db.artisanService.findUnique({ where: { id: serviceId } });
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

    await db.artisanService.delete({ where: { id: serviceId } });

    return NextResponse.json({ message: 'Service deleted' });
  } catch (error) {
    console.error('Artisan service delete error:', error);
    return NextResponse.json({ error: 'Failed to delete artisan service' }, { status: 500 });
  }
}
