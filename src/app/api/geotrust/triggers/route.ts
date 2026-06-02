import { NextRequest, NextResponse } from 'next/server';
import { requiresMandatoryInspection, detectPropertyConflicts } from '@/lib/geotrust/triggers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'terrain';
    const price = parseFloat(searchParams.get('price') || '0');
    const country = searchParams.get('country') || 'BJ';
    const geoTrustRequested = searchParams.get('geoTrustRequested') === 'true';
    const isBareLand = searchParams.get('isBareLand') === 'true';

    const result = requiresMandatoryInspection({
      type,
      price,
      country,
      geoTrustRequested,
      isBareLand,
    });

    return NextResponse.json({
      property: { type, price, country },
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/geotrust/triggers
 * Run conflict detection for a specific property.
 * Called automatically when a new property is created.
 * Designed to be async — does not block property creation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId } = body as { propertyId: string };

    if (!propertyId) {
      return NextResponse.json(
        { error: 'propertyId requis' },
        { status: 400 }
      );
    }

    // Run conflict detection asynchronously (fire and forget in production)
    const alerts = await detectPropertyConflicts(propertyId);

    return NextResponse.json({
      propertyId,
      conflictsDetected: alerts.length,
      alerts: alerts.map(a => ({
        type: a.type,
        severity: a.severity,
        description: a.description,
        autoAction: a.autoAction,
        propertyIds: a.propertyIds,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la détection de conflits';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
