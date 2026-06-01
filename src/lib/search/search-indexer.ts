// AfriBayit — Search Indexer
// Maintains the search_vector tsvector column on the Property table
// Uses PostgreSQL to_tsvector('french', ...) for indexing title, description,
// city, quartier, and address fields

import { db } from '@/lib/db';

// ============ Single Property Indexing ============

/**
 * Update the search_vector for a single property.
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

    return true;
  } catch (error) {
    console.error(`Search index error for property ${propertyId}:`, error);
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
    const combinedText = [
      data.title,
      data.description,
      data.city,
      data.quartier,
      data.address || '',
      data.type,
      data.transaction,
    ].filter(Boolean).join(' ');

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
    console.error(`Search index error for property ${data.id}:`, error);
    return false;
  }
}

// ============ Bulk Indexing ============

/**
 * Rebuild the search index for ALL properties.
 * This is a bulk operation that should be run:
 * - On initial setup
 * - After schema changes
 * - Periodically for maintenance
 *
 * Processes in batches to avoid memory issues with large datasets.
 */
export async function rebuildSearchIndex(batchSize = 100): Promise<{
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
    // First, count total properties
    const countResult = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM properties
    `);
    total = Number((countResult as any[])?.[0]?.total || 0);

    // Try the fast bulk approach first
    try {
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

      indexed = total;
    } catch (bulkError) {
      // If bulk fails, fall back to batch processing
      console.warn('Bulk search index rebuild failed, using batch approach:', bulkError);

      let offset = 0;
      while (true) {
        const properties = await db.property.findMany({
          select: {
            id: true,
            title: true,
            description: true,
            city: true,
            quartier: true,
            address: true,
            type: true,
            transaction: true,
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

    // Create GIN index on search_vector if it doesn't exist
    try {
      await db.$executeRawUnsafe(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_search_vector
        ON properties USING GIN ("searchVector")
      `);
    } catch {
      // Index creation may fail if it already exists or concurrent access issues
      // This is non-critical
    }

    const duration = Date.now() - startTime;

    return { total, indexed, errors, duration };
  } catch (error) {
    console.error('Search index rebuild error:', error);
    return {
      total,
      indexed,
      errors: errors + 1,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Rebuild search index for properties in a specific country.
 * Useful after country-specific data imports.
 */
export async function rebuildSearchIndexByCountry(
  country: string,
  batchSize = 100
): Promise<{
  total: number;
  indexed: number;
  errors: number;
}> {
  let total = 0;
  let indexed = 0;
  let errors = 0;

  try {
    const countResult = await db.$queryRawUnsafe(`
      SELECT COUNT(*) as total FROM properties WHERE country = $1
    `, country);
    total = Number((countResult as any[])?.[0]?.total || 0);

    // Bulk update for the country
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

    indexed = total;
  } catch (bulkError) {
    // Fallback to batch
    let offset = 0;
    while (true) {
      const properties = await db.property.findMany({
        where: { country },
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

  return { total, indexed, errors };
}

/**
 * Index all properties that don't have a search_vector yet.
 * Useful for incremental indexing after initial setup.
 */
export async function indexMissingProperties(): Promise<number> {
  try {
    // Find properties without search_vector
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
    console.error('Index missing properties error:', error);
    return 0;
  }
}
