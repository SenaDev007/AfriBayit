import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify property exists
    const property = await db.property.findUnique({
      where: { id },
      select: { id: true, hasVR: true, hasDroneView: true },
    });

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Fetch virtual tours for the property
    const virtualTours = await db.virtualTour.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: 'desc' },
    });

    // If no tours exist in DB but property hasVR is true, provide demo data
    let tours = virtualTours;
    if (tours.length === 0 && property.hasVR) {
      tours = [
        {
          id: 'demo-salon',
          propertyId: id,
          tourType: '360_photo',
          url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=4096&h=2048&fit=crop',
          thumbnailUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=200&fit=crop',
          duration: null,
          createdAt: new Date(),
        },
        {
          id: 'demo-cuisine',
          propertyId: id,
          tourType: '360_photo',
          url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=4096&h=2048&fit=crop',
          thumbnailUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=200&fit=crop',
          duration: null,
          createdAt: new Date(),
        },
        {
          id: 'demo-chambre',
          propertyId: id,
          tourType: '360_photo',
          url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=4096&h=2048&fit=crop',
          thumbnailUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=200&fit=crop',
          duration: null,
          createdAt: new Date(),
        },
        {
          id: 'demo-jardin',
          propertyId: id,
          tourType: 'drone',
          url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=4096&h=2048&fit=crop',
          thumbnailUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=200&fit=crop',
          duration: null,
          createdAt: new Date(),
        },
      ] as typeof virtualTours;
    }

    return NextResponse.json({
      data: {
        propertyId: id,
        hasVR: property.hasVR,
        hasDroneView: property.hasDroneView,
        tours: tours.map((t) => ({
          id: t.id,
          tourType: t.tourType,
          url: t.url,
          thumbnailUrl: t.thumbnailUrl,
          duration: t.duration,
        })),
      },
    });
  } catch (error) {
    console.error('Virtual tours API error:', error);
    return NextResponse.json({ error: 'Failed to fetch virtual tours' }, { status: 500 });
  }
}
