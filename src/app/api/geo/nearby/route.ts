// AfriBayit — API: Geo Nearby Search
// GET: Find properties/hotels/guesthouses near a geographic point

import { NextResponse } from 'next/server';
import { findNearby } from '@/lib/geo/postgis';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const radius = parseFloat(searchParams.get('radius') || '10'); // default 10 km
    const type = searchParams.get('type') || 'property'; // property, hotel, guesthouse, all
    const country = searchParams.get('country') || ''; // optional country filter

    // Validate required params
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'lat and lng parameters are required and must be valid numbers' },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Longitude must be between -180 and 180' },
        { status: 400 }
      );
    }

    if (radius <= 0 || radius > 100) {
      return NextResponse.json(
        { error: 'Radius must be between 0 and 100 km' },
        { status: 400 }
      );
    }

    const modelMap: Record<string, 'Property' | 'Hotel' | 'Guesthouse'> = {
      property: 'Property',
      hotel: 'Hotel',
      guesthouse: 'Guesthouse',
    };

    if (type === 'all') {
      // Search all models in parallel
      const [properties, hotels, guesthouses] = await Promise.all([
        findNearby(lat, lng, radius, 'Property'),
        findNearby(lat, lng, radius, 'Hotel'),
        findNearby(lat, lng, radius, 'Guesthouse'),
      ]);

      // Filter by country if specified
      const filterByCountry = (items: typeof properties) =>
        country ? items.filter((i) => i.country === country) : items;

      const allResults = [
        ...filterByCountry(properties).map((p) => ({ ...p, category: 'property' })),
        ...filterByCountry(hotels).map((h) => ({ ...h, category: 'hotel' })),
        ...filterByCountry(guesthouses).map((g) => ({ ...g, category: 'guesthouse' })),
      ].sort((a, b) => a.distanceKm - b.distanceKm);

      return NextResponse.json({
        center: { lat, lng },
        radiusKm: radius,
        country: country || undefined,
        total: allResults.length,
        results: allResults,
      });
    }

    // Single model search
    const model = modelMap[type];
    if (!model) {
      return NextResponse.json(
        { error: 'Invalid type. Must be: property, hotel, guesthouse, or all' },
        { status: 400 }
      );
    }

    let results = await findNearby(lat, lng, radius, model);

    // Filter by country if specified
    if (country) {
      results = results.filter((r) => r.country === country);
    }

    return NextResponse.json({
      center: { lat, lng },
      radiusKm: radius,
      type,
      country: country || undefined,
      total: results.length,
      results,
    });
  } catch (error) {
    console.error('[Geo:Nearby] Error:', error);
    return NextResponse.json(
      { error: 'Failed to search nearby locations' },
      { status: 500 }
    );
  }
}
