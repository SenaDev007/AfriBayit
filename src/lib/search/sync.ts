// AfriBayit — Elasticsearch Sync Service
// Keeps ES index in sync with the database
// Run periodically or triggered by DB changes

import { db } from '@/lib/db';
import { indexDocument, type SearchDocument } from './elasticsearch';

/**
 * Sync all published properties from DB to search index
 */
export async function syncPropertiesToIndex(country: string): Promise<number> {
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
      };

      await indexDocument(doc);
      indexed++;
    }

    console.log(`[Sync] Indexed ${indexed} properties for ${country || 'all'}`);
    return indexed;
  } catch (error) {
    console.error('[Sync] Error syncing properties:', error);
    return 0;
  }
}

/**
 * Sync all active hotels from DB to search index
 */
export async function syncHotelsToIndex(country: string): Promise<number> {
  try {
    const hotels = await db.hotel.findMany({
      where: {
        status: 'active',
        ...(country ? { country } : {}),
      },
    });

    let indexed = 0;
    for (const h of hotels) {
      const doc: SearchDocument = {
        id: h.id,
        type: 'hotel',
        title: h.name,
        description: h.policies || '',
        city: h.city,
        quartier: '',
        country: h.country,
        price: h.pricePerNight,
        features: [],
        createdAt: h.createdAt.toISOString(),
      };

      await indexDocument(doc);
      indexed++;
    }

    console.log(`[Sync] Indexed ${indexed} hotels for ${country || 'all'}`);
    return indexed;
  } catch (error) {
    console.error('[Sync] Error syncing hotels:', error);
    return 0;
  }
}

/**
 * Sync all active guesthouses from DB to search index
 */
export async function syncGuesthousesToIndex(country: string): Promise<number> {
  try {
    const guesthouses = await db.guesthouse.findMany({
      where: {
        status: 'active',
        ...(country ? { country } : {}),
      },
    });

    let indexed = 0;
    for (const g of guesthouses) {
      const doc: SearchDocument = {
        id: g.id,
        type: 'guesthouse',
        title: g.name,
        description: g.description || '',
        city: g.city,
        quartier: g.quartier || '',
        country: g.country,
        price: 0, // Guesthouse rooms have individual prices
        features: [],
        createdAt: g.createdAt.toISOString(),
      };

      await indexDocument(doc);
      indexed++;
    }

    console.log(`[Sync] Indexed ${indexed} guesthouses for ${country || 'all'}`);
    return indexed;
  } catch (error) {
    console.error('[Sync] Error syncing guesthouses:', error);
    return 0;
  }
}

/**
 * Sync all certified artisans from DB to search index
 */
export async function syncArtisansToIndex(country: string): Promise<number> {
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
      };

      await indexDocument(doc);
      indexed++;
    }

    console.log(`[Sync] Indexed ${indexed} artisans for ${country || 'all'}`);
    return indexed;
  } catch (error) {
    console.error('[Sync] Error syncing artisans:', error);
    return 0;
  }
}

/**
 * Full sync of all document types for a country
 */
export async function fullSync(country: string): Promise<Record<string, number>> {
  const results = await Promise.all([
    syncPropertiesToIndex(country),
    syncHotelsToIndex(country),
    syncGuesthousesToIndex(country),
    syncArtisansToIndex(country),
  ]);

  return {
    properties: results[0],
    hotels: results[1],
    guesthouses: results[2],
    artisans: results[3],
    total: results.reduce((sum, n) => sum + n, 0),
  };
}
