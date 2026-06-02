// AfriBayit — API: Geo Nearby Search
// GET: Find properties/hotels/guesthouses near a geographic point
// Uses PostGIS ST_DWithin for native spatial queries with Haversine fallback

import { NextResponse } from 'next/server';
import {
  findNearbyProperties,
  findNearbyHotels,
  findNearbyGuesthouses,
  findWithinBoundingBox,
  type NearbyFilters,
} from '@/lib/geo/postgis';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');
    const radius = parseFloat(searchParams.get('radius') || '10'); // default 10 km
    const type = searchParams.get('type') || 'property'; // property, hotel, guesthouse, all
    const country = searchParams.get('country') || undefined; // optional country filter

    // Bounding box params
    const swLat = searchParams.get('swLat');
    const swLng = searchParams.get('swLng');
    const neLat = searchParams.get('neLat');
    const neLng = searchParams.get('neLng');

    // Additional filters
    const filters: NearbyFilters = {
      type: searchParams.get('propertyType') || undefined, // e.g., villa, terrain
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      minSurface: searchParams.get('minSurface') ? parseFloat(searchParams.get('minSurface')!) : undefined,
      maxSurface: searchParams.get('maxSurface') ? parseFloat(searchParams.get('maxSurface')!) : undefined,
      quartier: searchParams.get('quartier') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined,
    };

    // ── Bounding box search mode ───────────────────────────
    if (swLat && swLng && neLat && neLng) {
      const swLatNum = parseFloat(swLat);
      const swLngNum = parseFloat(swLng);
      const neLatNum = parseFloat(neLat);
      const neLngNum = parseFloat(neLng);

      if ([swLatNum, swLngNum, neLatNum, neLngNum].some(isNaN)) {
        return NextResponse.json(
          { error: 'Paramètres de boîte englobante invalides (swLat, swLng, neLat, neLng)' },
          { status: 400 }
        );
      }

      const results = await findWithinBoundingBox(swLatNum, swLngNum, neLatNum, neLngNum, country);

      return NextResponse.json({
        boundingBox: { swLat: swLatNum, swLng: swLngNum, neLat: neLatNum, neLng: neLngNum },
        country: country || undefined,
        total: results.length,
        results,
      });
    }

    // ── Radius search mode ─────────────────────────────────
    // Validate required params
    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: 'Les paramètres lat et lng sont requis et doivent être des nombres valides' },
        { status: 400 }
      );
    }

    if (lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: 'La latitude doit être entre -90 et 90' },
        { status: 400 }
      );
    }

    if (lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'La longitude doit être entre -180 et 180' },
        { status: 400 }
      );
    }

    if (radius <= 0 || radius > 100) {
      return NextResponse.json(
        { error: 'Le rayon doit être entre 0 et 100 km' },
        { status: 400 }
      );
    }

    const validTypes = ['property', 'hotel', 'guesthouse', 'all'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Type invalide. Doit être : property, hotel, guesthouse, ou all' },
        { status: 400 }
      );
    }

    if (type === 'all') {
      // Search all models in parallel using PostGIS ST_DWithin
      const [properties, hotels, guesthouses] = await Promise.all([
        findNearbyProperties(lat, lng, radius, country, filters),
        findNearbyHotels(lat, lng, radius, country, filters),
        findNearbyGuesthouses(lat, lng, radius, country, filters),
      ]);

      const allResults = [
        ...properties.map((p) => ({ ...p, category: 'property' as const })),
        ...hotels.map((h) => ({ ...h, category: 'hotel' as const })),
        ...guesthouses.map((g) => ({ ...g, category: 'guesthouse' as const })),
      ].sort((a, b) => a.distanceKm - b.distanceKm);

      return NextResponse.json({
        center: { lat, lng },
        radiusKm: radius,
        country: country || undefined,
        total: allResults.length,
        results: allResults,
      });
    }

    // Single model search using dedicated PostGIS functions
    let results;
    switch (type) {
      case 'property':
        results = await findNearbyProperties(lat, lng, radius, country, filters);
        break;
      case 'hotel':
        results = await findNearbyHotels(lat, lng, radius, country, filters);
        break;
      case 'guesthouse':
        results = await findNearbyGuesthouses(lat, lng, radius, country, filters);
        break;
      default:
        results = [];
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
    console.error('[Geo:Nearby] Erreur :', error);
    return NextResponse.json(
      { error: 'Échec de la recherche de lieux à proximité' },
      { status: 500 }
    );
  }
}
