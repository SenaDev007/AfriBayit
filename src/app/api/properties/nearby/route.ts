import { NextResponse } from 'next/server';
import {
  findPropertiesNearPoint,
  findPropertiesInBounds,
  getCountryCenter,
  type GeoPoint,
} from '@/lib/geo/spatial';

export const dynamic = 'force-dynamic';

/**
 * GET /api/properties/nearby
 *
 * Spatial query endpoint for finding properties near a point or within bounds.
 *
 * Query parameters:
 *   - lat, lng: Center point coordinates (for radius search)
 *   - radius: Search radius in km (default: 10)
 *   - south, west, north, east: Bounding box coordinates (for bounds search)
 *   - type: Property type filter (villa, appartement, terrain, etc.)
 *   - transaction: Transaction type filter (achat, location, etc.)
 *   - country: Country code filter (BJ, CI, BF, TG)
 *   - limit: Maximum number of results (default: 20)
 *
 * Examples:
 *   /api/properties/nearby?lat=9.3077&lng=2.3158&radius=5&country=BJ
 *   /api/properties/nearby?south=6&west=-5&north=10&east=4&type=villa
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const radius = parseFloat(searchParams.get('radius') || '10');
  const type = searchParams.get('type') || undefined;
  const transaction = searchParams.get('transaction') || undefined;
  const country = searchParams.get('country') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  // Bounds-based search parameters
  const south = searchParams.get('south');
  const west = searchParams.get('west');
  const north = searchParams.get('north');
  const east = searchParams.get('east');

  try {
    // Bounds-based search
    if (south && west && north && east) {
      const southNum = parseFloat(south);
      const westNum = parseFloat(west);
      const northNum = parseFloat(north);
      const eastNum = parseFloat(east);

      // Validate bounds
      if (
        isNaN(southNum) ||
        isNaN(westNum) ||
        isNaN(northNum) ||
        isNaN(eastNum)
      ) {
        return NextResponse.json(
          { error: 'Invalid bounds coordinates' },
          { status: 400 }
        );
      }

      if (southNum >= northNum) {
        return NextResponse.json(
          { error: 'South must be less than north' },
          { status: 400 }
        );
      }

      const results = await findPropertiesInBounds(
        { south: southNum, west: westNum, north: northNum, east: eastNum },
        { type, transaction, country }
      );

      return NextResponse.json({
        properties: results,
        searchType: 'bounds',
        bounds: { south: southNum, west: westNum, north: northNum, east: eastNum },
        count: results.length,
      });
    }

    // Point-based radius search
    if (!isNaN(lat) && !isNaN(lng)) {
      // Validate coordinates
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        return NextResponse.json(
          { error: 'Invalid coordinates. Lat must be -90 to 90, lng must be -180 to 180' },
          { status: 400 }
        );
      }

      // Validate radius
      if (radius <= 0 || radius > 1000) {
        return NextResponse.json(
          { error: 'Radius must be between 0 and 1000 km' },
          { status: 400 }
        );
      }

      const results = await findPropertiesNearPoint(
        { lat, lng },
        radius,
        { type, transaction, country, limit }
      );

      return NextResponse.json({
        properties: results,
        searchType: 'nearby',
        center: { lat, lng },
        radiusKm: radius,
        count: results.length,
      });
    }

    // If country is provided but no coordinates, use the country center
    if (country) {
      const center = getCountryCenter(country);
      const results = await findPropertiesNearPoint(center, radius, {
        type,
        transaction,
        country,
        limit,
      });

      return NextResponse.json({
        properties: results,
        searchType: 'country_center',
        center,
        radiusKm: radius,
        country,
        count: results.length,
      });
    }

    return NextResponse.json(
      {
        error: 'lat/lng coordinates, bounds, or country parameter required',
        usage: {
          nearby: '/api/properties/nearby?lat=9.3077&lng=2.3158&radius=10',
          bounds: '/api/properties/nearby?south=6&west=-5&north=10&east=4',
          country: '/api/properties/nearby?country=BJ&radius=50',
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[AfriBayit] Spatial query error:', error);
    return NextResponse.json(
      { error: 'Spatial query failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
