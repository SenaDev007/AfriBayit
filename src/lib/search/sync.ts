// AfriBayit — Elasticsearch Sync Service
// Keeps ES index in sync with the database
// Supports: immediate sync, batch re-index, async queue (Redis-backed when available)
// Falls back gracefully when ES is not available

import { db } from '@/lib/db';
import {
  indexDocument,
  bulkIndexDocuments,
  deleteDocument,
  isElasticsearchConfigured,
  isElasticsearchAvailable,
  createIndex,
  type SearchDocument,
} from './elasticsearch';

// ─── Sync Queue (Redis-backed when available, in-memory fallback) ──────────

interface SyncJob {
  id: string;
  action: 'index' | 'delete' | 'bulk_index';
  document?: SearchDocument;
  documents?: SearchDocument[];
  docId?: string;
  docType?: string;
  createdAt: number;
  attempts: number;
}

const SYNC_QUEUE_KEY = 'afribayit:search:sync_queue';
const MAX_RETRY_ATTEMPTS = 3;

// In-memory queue fallback
const memoryQueue: SyncJob[] = [];
let isProcessingQueue = false;

/**
 * Enqueue a sync job for async processing.
 * Uses Redis list when available, in-memory array otherwise.
 */
async function enqueueSyncJob(job: Omit<SyncJob, 'id' | 'createdAt' | 'attempts'>): Promise<void> {
  const syncJob: SyncJob = {
    ...job,
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    createdAt: Date.now(),
    attempts: 0,
  };

  // If ES is not configured, skip queuing entirely
  if (!isElasticsearchConfigured()) {
    console.log(`[Sync] Skipping job — ES not configured. Action: ${job.action}`);
    return;
  }

  try {
    const { redis, isRedisConfigured } = await import('@/lib/redis');
    if (isRedisConfigured) {
      await redis.rpush(SYNC_QUEUE_KEY, JSON.stringify(syncJob));
      console.log(`[Sync] Enqueued job ${syncJob.id} (${job.action}) via Redis`);
    } else {
      memoryQueue.push(syncJob);
      console.log(`[Sync] Enqueued job ${syncJob.id} (${job.action}) in memory`);
      // Process in-memory queue immediately (no background worker available)
      processQueue();
    }
  } catch (error) {
    console.error('[Sync] Failed to enqueue job:', error);
    memoryQueue.push(syncJob);
    processQueue();
  }
}

/**
 * Process the sync queue — executes pending jobs.
 */
async function processQueue(): Promise<void> {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  try {
    const { redis, isRedisConfigured } = await import('@/lib/redis');

    if (isRedisConfigured) {
      // Process Redis queue
      while (true) {
        const raw = await redis.lpop(SYNC_QUEUE_KEY);
        if (!raw) break;

        const job: SyncJob = JSON.parse(raw as string);
        await executeSyncJob(job);
      }
    } else {
      // Process in-memory queue
      while (memoryQueue.length > 0) {
        const job = memoryQueue.shift()!;
        await executeSyncJob(job);
      }
    }
  } catch (error) {
    console.error('[Sync] Queue processing error:', error);
  } finally {
    isProcessingQueue = false;
  }
}

/**
 * Execute a single sync job with retry logic.
 */
async function executeSyncJob(job: SyncJob): Promise<void> {
  job.attempts++;

  try {
    switch (job.action) {
      case 'index':
        if (job.document) {
          await indexDocument(job.document);
        }
        break;

      case 'delete':
        if (job.docId) {
          await deleteDocument(job.docId, job.docType);
        }
        break;

      case 'bulk_index':
        if (job.documents && job.documents.length > 0) {
          const result = await bulkIndexDocuments(job.documents);
          console.log(`[Sync] Bulk index job ${job.id}: ${result.success} success, ${result.failed} failed`);
        }
        break;
    }

    console.log(`[Sync] Completed job ${job.id} (${job.action})`);
  } catch (error) {
    console.error(`[Sync] Job ${job.id} failed (attempt ${job.attempts}):`, error);

    if (job.attempts < MAX_RETRY_ATTEMPTS) {
      // Re-enqueue for retry
      console.log(`[Sync] Re-enqueuing job ${job.id} for retry`);
      await enqueueSyncJob({
        action: job.action,
        document: job.document,
        documents: job.documents,
        docId: job.docId,
        docType: job.docType,
      });
    } else {
      console.error(`[Sync] Job ${job.id} exceeded max retries, giving up`);
    }
  }
}

// ─── Immediate Sync Functions ──────────────────────────────────────────────

/**
 * Sync a single property to the search index.
 * Call this on property create/update.
 */
export async function syncPropertyToIndex(propertyId: string): Promise<void> {
  try {
    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: { owner: { select: { name: true, verified: true } } },
    });

    if (!property) {
      console.warn(`[Sync] Property not found: ${propertyId}`);
      return;
    }

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
    };

    // If property is published, index it; otherwise, delete it from index
    if (property.status === 'published') {
      await enqueueSyncJob({ action: 'index', document: doc });
    } else {
      await enqueueSyncJob({ action: 'delete', docId: property.id, docType: 'property' });
    }
  } catch (error) {
    console.error(`[Sync] Error syncing property ${propertyId}:`, error);
  }
}

/**
 * Remove a property from the search index.
 * Call this on property delete.
 */
export async function removePropertyFromIndex(propertyId: string): Promise<void> {
  await enqueueSyncJob({ action: 'delete', docId: propertyId, docType: 'property' });
}

/**
 * Sync a single hotel to the search index.
 */
export async function syncHotelToIndex(hotelId: string): Promise<void> {
  try {
    const hotel = await db.hotel.findUnique({
      where: { id: hotelId },
    });

    if (!hotel) {
      console.warn(`[Sync] Hotel not found: ${hotelId}`);
      return;
    }

    const doc: SearchDocument = {
      id: hotel.id,
      type: 'hotel',
      title: hotel.name,
      description: hotel.policies || '',
      city: hotel.city,
      quartier: '',
      country: hotel.country,
      price: hotel.pricePerNight,
      features: [],
      createdAt: hotel.createdAt.toISOString(),
    };

    if (hotel.status === 'active') {
      await enqueueSyncJob({ action: 'index', document: doc });
    } else {
      await enqueueSyncJob({ action: 'delete', docId: hotel.id, docType: 'hotel' });
    }
  } catch (error) {
    console.error(`[Sync] Error syncing hotel ${hotelId}:`, error);
  }
}

/**
 * Sync a single artisan to the search index.
 */
export async function syncArtisanToIndex(artisanId: string): Promise<void> {
  try {
    const artisan = await db.artisan.findUnique({
      where: { id: artisanId },
      include: { services: true },
    });

    if (!artisan) {
      console.warn(`[Sync] Artisan not found: ${artisanId}`);
      return;
    }

    let specialties: string[] = [];
    try { specialties = artisan.specialties ? JSON.parse(artisan.specialties) : []; } catch { specialties = []; }

    const doc: SearchDocument = {
      id: artisan.id,
      type: 'artisan',
      title: artisan.trade,
      description: artisan.trade,
      city: artisan.city || '',
      quartier: artisan.zone || '',
      country: artisan.country || '',
      price: artisan.dailyRate || 0,
      features: Array.isArray(specialties) ? specialties : [],
      createdAt: artisan.createdAt.toISOString(),
    };

    if (artisan.available) {
      await enqueueSyncJob({ action: 'index', document: doc });
    } else {
      await enqueueSyncJob({ action: 'delete', docId: artisan.id, docType: 'artisan' });
    }
  } catch (error) {
    console.error(`[Sync] Error syncing artisan ${artisanId}:`, error);
  }
}

// ─── Batch Re-index Functions ──────────────────────────────────────────────

/**
 * Sync all published properties from DB to search index.
 * Used for initial setup or full re-index.
 */
export async function syncPropertiesToIndex(country?: string): Promise<number> {
  try {
    const properties = await db.property.findMany({
      where: {
        status: 'published',
        ...(country ? { country } : {}),
      },
      include: {
        owner: { select: { name: true, verified: true } },
      },
    });

    const BATCH_SIZE = 100;
    let indexed = 0;

    for (let i = 0; i < properties.length; i += BATCH_SIZE) {
      const batch = properties.slice(i, i + BATCH_SIZE);

      const documents: SearchDocument[] = batch.map((p) => {
        let features: string[] = [];
        try { features = p.features ? JSON.parse(p.features) : []; } catch { features = []; }

        return {
          id: p.id,
          type: 'property' as const,
          title: p.title,
          description: p.description,
          city: p.city,
          quartier: p.quartier,
          country: p.country,
          price: p.price,
          features: Array.isArray(features) ? features : [],
          createdAt: p.createdAt.toISOString(),
        };
      });

      // Try bulk index if ES is available
      const esAvailable = await isElasticsearchAvailable();
      if (esAvailable) {
        const result = await bulkIndexDocuments(documents);
        indexed += result.success;
        if (result.failed > 0) {
          console.warn(`[Sync] Bulk index: ${result.failed} documents failed in batch ${i / BATCH_SIZE + 1}`);
        }
      } else {
        // Queue individual documents for later processing
        for (const doc of documents) {
          await enqueueSyncJob({ action: 'index', document: doc });
          indexed++;
        }
      }
    }

    console.log(`[Sync] Indexed ${indexed} properties for ${country || 'all'}`);
    return indexed;
  } catch (error) {
    console.error('[Sync] Error syncing properties:', error);
    return 0;
  }
}

/**
 * Sync all active hotels from DB to search index.
 */
export async function syncHotelsToIndex(country?: string): Promise<number> {
  try {
    const hotels = await db.hotel.findMany({
      where: {
        status: 'active',
        ...(country ? { country } : {}),
      },
    });

    const BATCH_SIZE = 100;
    let indexed = 0;

    for (let i = 0; i < hotels.length; i += BATCH_SIZE) {
      const batch = hotels.slice(i, i + BATCH_SIZE);

      const documents: SearchDocument[] = batch.map((h) => ({
        id: h.id,
        type: 'hotel' as const,
        title: h.name,
        description: h.policies || '',
        city: h.city,
        quartier: '',
        country: h.country,
        price: h.pricePerNight,
        features: [],
        createdAt: h.createdAt.toISOString(),
      }));

      const esAvailable = await isElasticsearchAvailable();
      if (esAvailable) {
        const result = await bulkIndexDocuments(documents);
        indexed += result.success;
      } else {
        for (const doc of documents) {
          await enqueueSyncJob({ action: 'index', document: doc });
          indexed++;
        }
      }
    }

    console.log(`[Sync] Indexed ${indexed} hotels for ${country || 'all'}`);
    return indexed;
  } catch (error) {
    console.error('[Sync] Error syncing hotels:', error);
    return 0;
  }
}

/**
 * Sync all active guesthouses from DB to search index.
 */
export async function syncGuesthousesToIndex(country?: string): Promise<number> {
  try {
    const guesthouses = await db.guesthouse.findMany({
      where: {
        status: 'active',
        ...(country ? { country } : {}),
      },
    });

    const BATCH_SIZE = 100;
    let indexed = 0;

    for (let i = 0; i < guesthouses.length; i += BATCH_SIZE) {
      const batch = guesthouses.slice(i, i + BATCH_SIZE);

      const documents: SearchDocument[] = batch.map((g) => ({
        id: g.id,
        type: 'guesthouse' as const,
        title: g.name,
        description: g.description || '',
        city: g.city,
        quartier: g.quartier || '',
        country: g.country,
        price: 0, // Guesthouse rooms have individual prices
        features: [],
        createdAt: g.createdAt.toISOString(),
      }));

      const esAvailable = await isElasticsearchAvailable();
      if (esAvailable) {
        const result = await bulkIndexDocuments(documents);
        indexed += result.success;
      } else {
        for (const doc of documents) {
          await enqueueSyncJob({ action: 'index', document: doc });
          indexed++;
        }
      }
    }

    console.log(`[Sync] Indexed ${indexed} guesthouses for ${country || 'all'}`);
    return indexed;
  } catch (error) {
    console.error('[Sync] Error syncing guesthouses:', error);
    return 0;
  }
}

/**
 * Sync all certified artisans from DB to search index.
 */
export async function syncArtisansToIndex(country?: string): Promise<number> {
  try {
    const artisans = await db.artisan.findMany({
      where: {
        available: true,
        ...(country ? { country } : {}),
      },
      include: {
        services: true,
      },
    });

    const BATCH_SIZE = 100;
    let indexed = 0;

    for (let i = 0; i < artisans.length; i += BATCH_SIZE) {
      const batch = artisans.slice(i, i + BATCH_SIZE);

      const documents: SearchDocument[] = batch.map((a) => {
        let specialties: string[] = [];
        try { specialties = a.specialties ? JSON.parse(a.specialties) : []; } catch { specialties = []; }

        return {
          id: a.id,
          type: 'artisan' as const,
          title: a.trade,
          description: a.trade,
          city: a.city || '',
          quartier: a.zone || '',
          country: a.country || '',
          price: a.dailyRate || 0,
          features: Array.isArray(specialties) ? specialties : [],
          createdAt: a.createdAt.toISOString(),
        };
      });

      const esAvailable = await isElasticsearchAvailable();
      if (esAvailable) {
        const result = await bulkIndexDocuments(documents);
        indexed += result.success;
      } else {
        for (const doc of documents) {
          await enqueueSyncJob({ action: 'index', document: doc });
          indexed++;
        }
      }
    }

    console.log(`[Sync] Indexed ${indexed} artisans for ${country || 'all'}`);
    return indexed;
  } catch (error) {
    console.error('[Sync] Error syncing artisans:', error);
    return 0;
  }
}

/**
 * Full sync of all document types for a country.
 * Used for admin batch re-index.
 */
export async function fullSync(country?: string): Promise<Record<string, number>> {
  console.log(`[Sync] Starting full sync for ${country || 'all'}...`);

  // Ensure indices exist if ES is available
  if (isElasticsearchConfigured()) {
    await createIndex(country || 'global');
  }

  const results = await Promise.all([
    syncPropertiesToIndex(country),
    syncHotelsToIndex(country),
    syncGuesthousesToIndex(country),
    syncArtisansToIndex(country),
  ]);

  const total = results.reduce((sum, n) => sum + n, 0);

  console.log(`[Sync] Full sync completed: ${total} total documents`);

  return {
    properties: results[0],
    hotels: results[1],
    guesthouses: results[2],
    artisans: results[3],
    total,
  };
}

/**
 * Get sync queue status.
 */
export async function getSyncQueueStatus(): Promise<{
  queueLength: number;
  esAvailable: boolean;
  esConfigured: boolean;
}> {
  let queueLength = 0;

  try {
    const { redis, isRedisConfigured } = await import('@/lib/redis');
    if (isRedisConfigured) {
      queueLength = await redis.llen(SYNC_QUEUE_KEY);
    } else {
      queueLength = memoryQueue.length;
    }
  } catch {
    queueLength = memoryQueue.length;
  }

  return {
    queueLength,
    esAvailable: await isElasticsearchAvailable(),
    esConfigured: isElasticsearchConfigured(),
  };
}
