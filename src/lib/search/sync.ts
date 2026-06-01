// AfriBayit — Elasticsearch Sync Service
// Keeps ES index in sync with the database across ALL models:
// Property, Hotel, Guesthouse, Artisan, Course
// Run periodically or triggered by DB changes

import { db } from '@/lib/db';
import { indexDocument, type SearchDocument, type SearchModelType } from './elasticsearch';

/**
 * Sync all published properties from DB to search index
 */
export async function syncPropertiesToIndex(country?: string): Promise<number> {
  try {
    const where: Record<string, unknown> = { status: 'published' };
    if (country) where.country = country;

    const properties = await db.property.findMany({
      where,
      include: {
        owner: { select: { name: true, verified: true } },
      },
    });

    let indexed = 0;
    for (const p of properties) {
      let features: string[] = [];
      try { features = p.features ? JSON.parse(p.features) : []; } catch { features = []; }

      const doc: SearchDocument = {
        id: p.id,
        type: 'property',
        title: p.title,
        description: p.description,
        city: p.city,
        quartier: p.quartier,
        country: p.country,
        price: p.price,
        features: Array.isArray(features) ? features : [],
        createdAt: p.createdAt.toISOString(),
        verified: p.verified,
        slug: p.slug,
      };

      await indexDocument(doc);
      indexed++;
    }

    console.log(`[Sync] ${indexed} propriétés indexées pour ${country || 'tous'}`);
    return indexed;
  } catch (error) {
    console.error('[Sync] Erreur de synchronisation des propriétés:', error);
    return 0;
  }
}

/**
 * Sync all active hotels from DB to search index
 */
export async function syncHotelsToIndex(country?: string): Promise<number> {
  try {
    const where: Record<string, unknown> = { status: 'active' };
    if (country) where.country = country;

    const hotels = await db.hotel.findMany({ where });

    let indexed = 0;
    for (const h of hotels) {
      let amenities: string[] = [];
      try { amenities = h.amenities ? JSON.parse(h.amenities) : []; } catch { amenities = []; }

      const doc: SearchDocument = {
        id: h.id,
        type: 'hotel',
        title: h.name,
        description: h.policies || '',
        city: h.city,
        quartier: '',
        country: h.country,
        price: h.pricePerNight,
        features: Array.isArray(amenities) ? amenities : [],
        createdAt: h.createdAt.toISOString(),
        rating: h.rating,
        stars: h.stars,
        slug: h.slug,
      };

      await indexDocument(doc);
      indexed++;
    }

    console.log(`[Sync] ${indexed} hôtels indexés pour ${country || 'tous'}`);
    return indexed;
  } catch (error) {
    console.error('[Sync] Erreur de synchronisation des hôtels:', error);
    return 0;
  }
}

/**
 * Sync all active guesthouses from DB to search index
 */
export async function syncGuesthousesToIndex(country?: string): Promise<number> {
  try {
    const where: Record<string, unknown> = { status: 'active' };
    if (country) where.country = country;

    const guesthouses = await db.guesthouse.findMany({
      where,
      include: {
        rooms: {
          where: { available: true },
          select: { basePrice: true },
          take: 1,
          orderBy: { basePrice: 'asc' },
        },
      },
    });

    let indexed = 0;
    for (const g of guesthouses) {
      let amenities: string[] = [];
      try { amenities = g.amenities ? JSON.parse(g.amenities) : []; } catch { amenities = []; }

      const minRoomPrice = g.rooms[0]?.basePrice || 0;

      const doc: SearchDocument = {
        id: g.id,
        type: 'guesthouse',
        title: g.name,
        description: g.description || '',
        city: g.city,
        quartier: g.quartier || '',
        country: g.country,
        price: minRoomPrice,
        features: Array.isArray(amenities) ? amenities : [],
        createdAt: g.createdAt.toISOString(),
        rating: g.overallRating,
        certified: g.certificationStatus === 'certified',
        slug: g.slug,
      };

      await indexDocument(doc);
      indexed++;
    }

    console.log(`[Sync] ${indexed} maisons d'hôtes indexées pour ${country || 'tous'}`);
    return indexed;
  } catch (error) {
    console.error('[Sync] Erreur de synchronisation des maisons d\'hôtes:', error);
    return 0;
  }
}

/**
 * Sync all available artisans from DB to search index
 */
export async function syncArtisansToIndex(country?: string): Promise<number> {
  try {
    const where: Record<string, unknown> = { available: true };
    if (country) where.country = country;

    const artisans = await db.artisan.findMany({
      where,
      include: {
        services: true,
      },
    });

    let indexed = 0;
    for (const a of artisans) {
      let specialties: string[] = [];
      try { specialties = a.specialties ? JSON.parse(a.specialties) : []; } catch { specialties = []; }

      const doc: SearchDocument = {
        id: a.id,
        type: 'artisan',
        title: a.trade,
        description: a.trade,
        city: a.city || '',
        quartier: a.zone || '',
        country: a.country || '',
        price: a.dailyRate || 0,
        features: Array.isArray(specialties) ? specialties : [],
        createdAt: a.createdAt.toISOString(),
        rating: a.rating,
        certified: a.certified,
        available: a.available,
        trade: a.trade,
        dailyRate: a.dailyRate,
      };

      await indexDocument(doc);
      indexed++;
    }

    console.log(`[Sync] ${indexed} artisans indexés pour ${country || 'tous'}`);
    return indexed;
  } catch (error) {
    console.error('[Sync] Erreur de synchronisation des artisans:', error);
    return 0;
  }
}

/**
 * Sync all published courses from DB to search index
 */
export async function syncCoursesToIndex(country?: string): Promise<number> {
  try {
    const where: Record<string, unknown> = { published: true };
    if (country) where.country = country;

    const courses = await db.course.findMany({ where });

    let indexed = 0;
    for (const c of courses) {
      const doc: SearchDocument = {
        id: c.id,
        type: 'course',
        title: c.title,
        description: c.description || '',
        city: '',
        quartier: '',
        country: c.country,
        price: c.price,
        features: [],
        createdAt: c.createdAt.toISOString(),
        image: c.image || null,
        rating: c.rating,
        slug: c.slug,
        category: c.category,
        level: c.level,
      };

      await indexDocument(doc);
      indexed++;
    }

    console.log(`[Sync] ${indexed} formations indexées pour ${country || 'tous'}`);
    return indexed;
  } catch (error) {
    console.error('[Sync] Erreur de synchronisation des formations:', error);
    return 0;
  }
}

/**
 * Full sync of all document types for a country (or all countries)
 */
export async function fullSync(country?: string): Promise<Record<string, number>> {
  const results = await Promise.all([
    syncPropertiesToIndex(country),
    syncHotelsToIndex(country),
    syncGuesthousesToIndex(country),
    syncArtisansToIndex(country),
    syncCoursesToIndex(country),
  ]);

  return {
    property: results[0],
    hotel: results[1],
    guesthouse: results[2],
    artisan: results[3],
    course: results[4],
    total: results.reduce((sum, n) => sum + n, 0),
  };
}

/**
 * Sync a single document by type and ID
 */
export async function syncSingleDocument(type: SearchModelType, id: string): Promise<boolean> {
  try {
    switch (type) {
      case 'property': {
        const p = await db.property.findUnique({
          where: { id },
          include: { owner: { select: { name: true, verified: true } } },
        });
        if (!p) return false;
        let features: string[] = [];
        try { features = p.features ? JSON.parse(p.features) : []; } catch { features = []; }
        await indexDocument({
          id: p.id, type: 'property', title: p.title,
          description: p.description, city: p.city,
          quartier: p.quartier, country: p.country,
          price: p.price, features: Array.isArray(features) ? features : [],
          createdAt: p.createdAt.toISOString(), verified: p.verified, slug: p.slug,
        });
        return true;
      }
      case 'hotel': {
        const h = await db.hotel.findUnique({ where: { id } });
        if (!h) return false;
        let amenities: string[] = [];
        try { amenities = h.amenities ? JSON.parse(h.amenities) : []; } catch { amenities = []; }
        await indexDocument({
          id: h.id, type: 'hotel', title: h.name,
          description: h.policies || '', city: h.city,
          quartier: '', country: h.country, price: h.pricePerNight,
          features: Array.isArray(amenities) ? amenities : [],
          createdAt: h.createdAt.toISOString(), rating: h.rating,
          stars: h.stars, slug: h.slug,
        });
        return true;
      }
      case 'guesthouse': {
        const g = await db.guesthouse.findUnique({
          where: { id },
          include: { rooms: { where: { available: true }, select: { basePrice: true }, take: 1, orderBy: { basePrice: 'asc' } } },
        });
        if (!g) return false;
        let amenities: string[] = [];
        try { amenities = g.amenities ? JSON.parse(g.amenities) : []; } catch { amenities = []; }
        await indexDocument({
          id: g.id, type: 'guesthouse', title: g.name,
          description: g.description || '', city: g.city,
          quartier: g.quartier || '', country: g.country,
          price: g.rooms[0]?.basePrice || 0,
          features: Array.isArray(amenities) ? amenities : [],
          createdAt: g.createdAt.toISOString(), rating: g.overallRating,
          certified: g.certificationStatus === 'certified', slug: g.slug,
        });
        return true;
      }
      case 'artisan': {
        const a = await db.artisan.findUnique({ where: { id } });
        if (!a) return false;
        let specialties: string[] = [];
        try { specialties = a.specialties ? JSON.parse(a.specialties) : []; } catch { specialties = []; }
        await indexDocument({
          id: a.id, type: 'artisan', title: a.trade,
          description: a.trade, city: a.city || '',
          quartier: a.zone || '', country: a.country || '',
          price: a.dailyRate || 0, features: Array.isArray(specialties) ? specialties : [],
          createdAt: a.createdAt.toISOString(), rating: a.rating,
          certified: a.certified, available: a.available,
          trade: a.trade, dailyRate: a.dailyRate,
        });
        return true;
      }
      case 'course': {
        const c = await db.course.findUnique({ where: { id } });
        if (!c) return false;
        await indexDocument({
          id: c.id, type: 'course', title: c.title,
          description: c.description || '', city: '',
          quartier: '', country: c.country, price: c.price,
          features: [], createdAt: c.createdAt.toISOString(),
          image: c.image || null, rating: c.rating,
          slug: c.slug, category: c.category, level: c.level,
        });
        return true;
      }
      default:
        return false;
    }
  } catch (error) {
    console.error(`[Sync] Erreur de synchronisation ${type}/${id}:`, error);
    return false;
  }
}
