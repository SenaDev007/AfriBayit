import { NextRequest, NextResponse } from 'next/server';
import { requiresMandatoryInspection } from '@/lib/geotrust/triggers';

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
