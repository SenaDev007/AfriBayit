// AfriBayit — Multi-Model Search Indexer
// Maintains search vectors and indexes across ALL models:
// Property, Hotel, Guesthouse, Artisan, Course
//
// Two indexing strategies:
// 1. PostgreSQL tsvector (for Property full-text search — always available)
// 2. Elasticsearch-compatible indexDocument() (for when ES is configured)
//
// French text search configuration used throughout.

import { db } from '@/lib/db';
import { indexDocument, type SearchDocument, type SearchModelType } from './elasticsearch';

// ============ Property Indexing (tsvector + ES) ============

/**
 * Update the search_vector tsvector for a single property.
 * Combines title, description, city, quartier, and address into a tsvector.
 * Uses French text search configuration since most content is in French.
 *
 * Should be called after any property create/update that changes
 * searchable fields (title, description, city, quartier, address).
 */
export async function indexProperty(propertyId: string): Promise<boolean> {
  try {
    await db.$executeRawUnsafe(`
      UPDATE properties
      SET "searchVector" = setweight(
        to_tsvector('french', COALESCE(title, '')),
        'A'
      ) || setweight(
        to_tsvector('french', COALESCE(description, '')),
        'B'
      ) || setweight(
        to_tsvector('french', COALESCE(city, '')),
        'C'
      ) || setweight(
        to_tsvector('french', COALESCE(quartier, '')),
        'C'
      ) || setweight(
        to_tsvector('french', COALESCE(address, '')),
        'D'
      ) || setweight(
        to_tsvector('french', COALESCE(type, '')),
        'D'
      ) || setweight(
        to_tsvector('french', COALESCE(transaction, '')),
        'D'
      )
      WHERE id = $1
    `, propertyId);

    // Also index to Elasticsearch-compatible layer
    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: { owner: { select: { name: true, verified: true } } },
    });

    if (property) {
      let features: string[] = [];
      try { features = property.features ? JSON.parse(property.features) : []; } catch { features = []; }

      const doc: SearchDocument = {
        id: property.id,
        type: 'property',
        title: property.title,
        description: property.description,
        city: property.city,
        quartier: property.quartier,
        country: property.country,
        price: property.price,
        features: Array.isArray(features) ? features : [],
        createdAt: property.createdAt.toISOString(),
        verified: property.verified,
        slug: property.slug,
      };
      await indexDocument(doc);
    }

    return true;
  } catch (error) {
    console.error(`[Indexeur] Erreur d'indexation propriété ${propertyId}:`, error);
    return false;
  }
}

/**
 * Update the search_vector for a property using field values directly.
 * Useful when creating a property and wanting to index it in one operation.
 */
export async function indexPropertyFromData(data: {
  id: string;
  title: string;
  description: string;
  city: string;
  quartier: string;
  address?: string | null;
  type: string;
  transaction: string;
}): Promise<boolean> {
  try {
    await db.$executeRawUnsafe(`
      UPDATE properties
      SET "searchVector" = setweight(
        to_tsvector('french', $2),
        'A'
      ) || setweight(
        to_tsvector('french', $3),
        'B'
      ) || setweight(
        to_tsvector('french', $4),
        'C'
      ) || setweight(
        to_tsvector('french', $5),
        'C'
      ) || setweight(
        to_tsvector('french', $6),
        'D'
      ) || setweight(
        to_tsvector('french', $7),
        'D'
      ) || setweight(
        to_tsvector('french', $8),
        'D'
      )
      WHERE id = $1
    `,
      data.id,
      data.title || '',
      data.description || '',
      data.city || '',
      data.quartier || '',
      data.address || '',
      data.type || '',
      data.transaction || ''
    );

    return true;
  } catch (error) {
    console.error(`[Indexeur] Erreur d'indexation propriété ${data.id}:`, error);
    return false;
  }
}

// ============ Hotel Indexing ============

/**
 * Index all hotels into the search layer.
 * Reads from Prisma and calls indexDocument() for each hotel.
 */
export async function indexAllHotels(country?: string): Promise<{
  total: number;
  indexed: number;
  errors: number;
}> {
  let indexed = 0;
  let errors = 0;

  try {
    const where: Record<string, unknown> = { status: 'active' };
    if (country) where.country = country;

    const hotels = await db.hotel.findMany({ where });

    for (const h of hotels) {
      try {
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
      } catch {
        errors++;
      }
    }

    console.log(`[Indexeur] ${indexed} hôtels indexés (${errors} erreurs) pour ${country || 'tous'}`);
  } catch (error) {
    console.error('[Indexeur] Erreur d\'indexation des hôtels:', error);
    errors++;
  }

  return { total: indexed + errors, indexed, errors };
}

// ============ Guesthouse Indexing ============

/**
 * Index all guesthouses into the search layer.
 * Reads from Prisma and calls indexDocument() for each guesthouse.
 */
export async function indexAllGuesthouses(country?: string): Promise<{
  total: number;
  indexed: number;
  errors: number;
}> {
  let indexed = 0;
  let errors = 0;

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

    for (const g of guesthouses) {
      try {
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
      } catch {
        errors++;
      }
    }

    console.log(`[Indexeur] ${indexed} maisons d'hôtes indexées (${errors} erreurs) pour ${country || 'tous'}`);
  } catch (error) {
    console.error('[Indexeur] Erreur d\'indexation des maisons d\'hôtes:', error);
    errors++;
  }

  return { total: indexed + errors, indexed, errors };
}

// ============ Artisan Indexing ============

/**
 * Index all artisans into the search layer.
 * Reads from Prisma and calls indexDocument() for each artisan.
 */
export async function indexAllArtisans(country?: string): Promise<{
  total: number;
  indexed: number;
  errors: number;
}> {
  let indexed = 0;
  let errors = 0;

  try {
    const where: Record<string, unknown> = { available: true };
    if (country) where.country = country;

    const artisans = await db.artisan.findMany({
      where,
      include: {
        services: { select: { serviceName: true, basePrice: true } },
      },
    });

    for (const a of artisans) {
      try {
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
      } catch {
        errors++;
      }
    }

    console.log(`[Indexeur] ${indexed} artisans indexés (${errors} erreurs) pour ${country || 'tous'}`);
  } catch (error) {
    console.error('[Indexeur] Erreur d\'indexation des artisans:', error);
    errors++;
  }

  return { total: indexed + errors, indexed, errors };
}

// ============ Course Indexing ============

/**
 * Index all courses into the search layer.
 * Reads from Prisma and calls indexDocument() for each course.
 */
export async function indexAllCourses(country?: string): Promise<{
  total: number;
  indexed: number;
  errors: number;
}> {
  let indexed = 0;
  let errors = 0;

  try {
    const where: Record<string, unknown> = { published: true };
    if (country) where.country = country;

    const courses = await db.course.findMany({ where });

    for (const c of courses) {
      try {
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
      } catch {
        errors++;
      }
    }

    console.log(`[Indexeur] ${indexed} formations indexées (${errors} erreurs) pour ${country || 'tous'}`);
  } catch (error) {
    console.error('[Indexeur] Erreur d\'indexation des formations:', error);
    errors++;
  }

  return { total: indexed + errors, indexed, errors };
}

// ============ Bulk Property Indexing (tsvector) ============

/**
 * Index all properties — rebuilds the tsvector search index.
 * This is a bulk operation that should be run:
 * - On initial setup
 * - After schema changes
 * - Periodically for maintenance
 */
export async function indexAllProperties(country?: string, batchSize = 100): Promise<{
  total: number;
  indexed: number;
  errors: number;
  duration: number;
}> {
  const startTime = Date.now();
  let total = 0;
  let indexed = 0;
  let errors = 0;

  try {
    // Count total properties
    const countResult = country
      ? await db.$queryRawUnsafe(`SELECT COUNT(*) as total FROM properties WHERE country = $1`, country)
      : await db.$queryRawUnsafe(`SELECT COUNT(*) as total FROM properties`);
    total = Number((countResult as any[])?.[0]?.total || 0);

    // Try the fast bulk approach first
    try {
      if (country) {
        await db.$executeRawUnsafe(`
          UPDATE properties
          SET "searchVector" = 
            setweight(to_tsvector('french', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('french', COALESCE(description, '')), 'B') ||
            setweight(to_tsvector('french', COALESCE(city, '')), 'C') ||
            setweight(to_tsvector('french', COALESCE(quartier, '')), 'C') ||
            setweight(to_tsvector('french', COALESCE(address, '')), 'D') ||
            setweight(to_tsvector('french', COALESCE(type, '')), 'D') ||
            setweight(to_tsvector('french', COALESCE(transaction, '')), 'D')
          WHERE country = $1
        `, country);
      } else {
        await db.$executeRawUnsafe(`
          UPDATE properties
          SET "searchVector" = 
            setweight(to_tsvector('french', COALESCE(title, '')), 'A') ||
            setweight(to_tsvector('french', COALESCE(description, '')), 'B') ||
            setweight(to_tsvector('french', COALESCE(city, '')), 'C') ||
            setweight(to_tsvector('french', COALESCE(quartier, '')), 'C') ||
            setweight(to_tsvector('french', COALESCE(address, '')), 'D') ||
            setweight(to_tsvector('french', COALESCE(type, '')), 'D') ||
            setweight(to_tsvector('french', COALESCE(transaction, '')), 'D')
        `);
      }

      indexed = total;
    } catch (bulkError) {
      // Fallback to batch processing
      console.warn('[Indexeur] Indexation en masse échouée, utilisation du traitement par lot:', bulkError);

      let offset = 0;
      const where = country ? { country } : {};
      while (true) {
        const properties = await db.property.findMany({
          where,
          select: {
            id: true, title: true, description: true,
            city: true, quartier: true, address: true,
            type: true, transaction: true,
          },
          skip: offset,
          take: batchSize,
        });

        if (properties.length === 0) break;

        const batchResults = await Promise.allSettled(
          properties.map(p => indexPropertyFromData(p))
        );

        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value) {
            indexed++;
          } else {
            errors++;
          }
        }

        offset += batchSize;
      }
    }

    // Create GIN index if it doesn't exist
    try {
      await db.$executeRawUnsafe(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_search_vector
        ON properties USING GIN ("searchVector")
      `);
    } catch {
      // Non-critical — index may already exist
    }

    // Also push to ES-compatible layer
    await indexAllPropertiesToES(country);

  } catch (error) {
    console.error('[Indexeur] Erreur de reconstruction de l\'index:', error);
    errors++;
  }

  const duration = Date.now() - startTime;
  return { total, indexed, errors, duration };
}

/**
 * Push all properties to the ES-compatible index layer
 */
async function indexAllPropertiesToES(country?: string): Promise<void> {
  try {
    const where: Record<string, unknown> = { status: 'published' };
    if (country) where.country = country;

    const properties = await db.property.findMany({
      where,
      include: { owner: { select: { name: true, verified: true } } },
    });

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
    }
  } catch (error) {
    console.error('[Indexeur] Erreur d\'indexation ES des propriétés:', error);
  }
}

// ============ Master Sync ============

/**
 * Re-indexes ALL data across all models.
 * This is the primary function to call for a full sync.
 *
 * @param country Optional country code (BJ, CI, BF, TG) for tenant isolation
 * @returns Summary of indexed documents per model type
 */
export async function syncSearchIndex(country?: string): Promise<{
  property: { total: number; indexed: number; errors: number; duration: number };
  hotel: { total: number; indexed: number; errors: number };
  guesthouse: { total: number; indexed: number; errors: number };
  artisan: { total: number; indexed: number; errors: number };
  course: { total: number; indexed: number; errors: number };
  totalIndexed: number;
  totalErrors: number;
  duration: number;
}> {
  const startTime = Date.now();
  console.log(`[Indexeur] Début de la synchronisation complète ${country ? `pour ${country}` : '(tous les pays)'}`);

  // Run all indexing in parallel
  const [propertyResult, hotelResult, guesthouseResult, artisanResult, courseResult] = await Promise.all([
    indexAllProperties(country),
    indexAllHotels(country),
    indexAllGuesthouses(country),
    indexAllArtisans(country),
    indexAllCourses(country),
  ]);

  const totalIndexed = propertyResult.indexed + hotelResult.indexed + guesthouseResult.indexed + artisanResult.indexed + courseResult.indexed;
  const totalErrors = propertyResult.errors + hotelResult.errors + guesthouseResult.errors + artisanResult.errors + courseResult.errors;
  const duration = Date.now() - startTime;

  console.log(`[Indexeur] Synchronisation terminée: ${totalIndexed} documents indexés, ${totalErrors} erreurs en ${duration}ms`);

  return {
    property: propertyResult,
    hotel: hotelResult,
    guesthouse: guesthouseResult,
    artisan: artisanResult,
    course: courseResult,
    totalIndexed,
    totalErrors,
    duration,
  };
}

/**
 * Index all properties that don't have a search_vector yet.
 * Useful for incremental indexing after initial setup.
 */
export async function indexMissingProperties(): Promise<number> {
  try {
    const unindexed = await db.$queryRawUnsafe(`
      SELECT id FROM properties WHERE "searchVector" IS NULL LIMIT 500
    `);

    const ids = (unindexed as any[]).map((r: any) => r.id);
    if (ids.length === 0) return 0;

    // Bulk update
    await db.$executeRawUnsafe(`
      UPDATE properties
      SET "searchVector" = 
        setweight(to_tsvector('french', COALESCE(title, '')), 'A') ||
        setweight(to_tsvector('french', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('french', COALESCE(city, '')), 'C') ||
        setweight(to_tsvector('french', COALESCE(quartier, '')), 'C') ||
        setweight(to_tsvector('french', COALESCE(address, '')), 'D') ||
        setweight(to_tsvector('french', COALESCE(type, '')), 'D') ||
        setweight(to_tsvector('french', COALESCE(transaction, '')), 'D')
      WHERE "searchVector" IS NULL
    `);

    return ids.length;
  } catch (error) {
    console.error('[Indexeur] Erreur d\'indexation des propriétés manquantes:', error);
    return 0;
  }
}

/**
 * Re-index a single document by type and ID.
 * Useful for real-time updates after CRUD operations.
 */
export async function reindexDocument(
  type: SearchModelType,
  id: string
): Promise<boolean> {
  try {
    switch (type) {
      case 'property':
        return indexProperty(id);
      case 'hotel': {
        const hotel = await db.hotel.findUnique({ where: { id } });
        if (!hotel) return false;
        let amenities: string[] = [];
        try { amenities = hotel.amenities ? JSON.parse(hotel.amenities) : []; } catch { amenities = []; }
        await indexDocument({
          id: hotel.id, type: 'hotel', title: hotel.name,
          description: hotel.policies || '', city: hotel.city,
          quartier: '', country: hotel.country, price: hotel.pricePerNight,
          features: Array.isArray(amenities) ? amenities : [],
          createdAt: hotel.createdAt.toISOString(), rating: hotel.rating,
          stars: hotel.stars, slug: hotel.slug,
        });
        return true;
      }
      case 'guesthouse': {
        const gh = await db.guesthouse.findUnique({
          where: { id },
          include: { rooms: { where: { available: true }, select: { basePrice: true }, take: 1, orderBy: { basePrice: 'asc' } } },
        });
        if (!gh) return false;
        let amenities: string[] = [];
        try { amenities = gh.amenities ? JSON.parse(gh.amenities) : []; } catch { amenities = []; }
        await indexDocument({
          id: gh.id, type: 'guesthouse', title: gh.name,
          description: gh.description || '', city: gh.city,
          quartier: gh.quartier || '', country: gh.country,
          price: gh.rooms[0]?.basePrice || 0,
          features: Array.isArray(amenities) ? amenities : [],
          createdAt: gh.createdAt.toISOString(), rating: gh.overallRating,
          certified: gh.certificationStatus === 'certified', slug: gh.slug,
        });
        return true;
      }
      case 'artisan': {
        const artisan = await db.artisan.findUnique({ where: { id } });
        if (!artisan) return false;
        let specialties: string[] = [];
        try { specialties = artisan.specialties ? JSON.parse(artisan.specialties) : []; } catch { specialties = []; }
        await indexDocument({
          id: artisan.id, type: 'artisan', title: artisan.trade,
          description: artisan.trade, city: artisan.city || '',
          quartier: artisan.zone || '', country: artisan.country || '',
          price: artisan.dailyRate || 0,
          features: Array.isArray(specialties) ? specialties : [],
          createdAt: artisan.createdAt.toISOString(), rating: artisan.rating,
          certified: artisan.certified, available: artisan.available,
          trade: artisan.trade, dailyRate: artisan.dailyRate,
        });
        return true;
      }
      case 'course': {
        const course = await db.course.findUnique({ where: { id } });
        if (!course) return false;
        await indexDocument({
          id: course.id, type: 'course', title: course.title,
          description: course.description || '', city: '',
          quartier: '', country: course.country, price: course.price,
          features: [], createdAt: course.createdAt.toISOString(),
          image: course.image || null, rating: course.rating,
          slug: course.slug, category: course.category, level: course.level,
        });
        return true;
      }
      default:
        console.warn(`[Indexeur] Type inconnu: ${type}`);
        return false;
    }
  } catch (error) {
    console.error(`[Indexeur] Erreur de ré-indexation ${type}/${id}:`, error);
    return false;
  }
}
