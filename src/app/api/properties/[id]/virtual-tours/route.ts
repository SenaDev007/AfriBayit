import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const property = await db.property.findUnique({ where: { id }, select: { id: true, hasVR: true, hasDroneView: true } });
    if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    const virtualTours = await db.virtualTour.findMany({ where: { propertyId: id }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ data: { propertyId: id, hasVR: property.hasVR, hasDroneView: property.hasDroneView, tours: virtualTours.map((t) => ({ id: t.id, tourType: t.tourType, url: t.url, thumbnailUrl: t.thumbnailUrl, duration: t.duration })) } });
  } catch (error) {
    console.error('Virtual tours API error:', error);
    return NextResponse.json({ error: 'Failed to fetch virtual tours' }, { status: 500 });
  }
}
