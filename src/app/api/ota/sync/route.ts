// AfriBayit — API: OTA Sync
// POST: Trigger an OTA synchronization for a hotel
// GET: Get sync status for a hotel
// Supports: full sync, single channel sync, and status checks

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { syncAllProviders, syncSingleProvider, pushAvailabilityToAllChannels, pushRatesToAllChannels } from '@/lib/ota/channel-manager';
import { apiResponse, apiError } from '@/lib/api/middleware';
import type { OTAProvider, AvailabilityUpdate, RateUpdate } from '@/lib/ota/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hotelId, startDate, endDate, channel, availability, rates } = body;

    if (!hotelId) {
      return apiError('hotelId requis', 400, 'MISSING_HOTEL_ID');
    }

    // Verify hotel exists
    const hotel = await db.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return apiError('Hôtel non trouvé', 404, 'HOTEL_NOT_FOUND');
    }

    // Sync period (default: next 30 days)
    const now = new Date();
    const defaultEnd = new Date(now);
    defaultEnd.setDate(defaultEnd.getDate() + 30);

    const dateRange = {
      start: startDate || now.toISOString().split('T')[0],
      end: endDate || defaultEnd.toISOString().split('T')[0],
    };

    // If availability updates are provided, push them
    if (availability && Array.isArray(availability) && availability.length > 0) {
      const updates: AvailabilityUpdate[] = availability.map((a: Record<string, unknown>) => ({
        roomTypeId: String(a.roomTypeId),
        date: String(a.date),
        availableCount: Number(a.availableCount),
      }));

      const results = await pushAvailabilityToAllChannels(hotelId, updates);

      return apiResponse({
        hotelId,
        operation: 'push_availability',
        dateRange,
        results,
        syncedAt: new Date().toISOString(),
      });
    }

    // If rate updates are provided, push them
    if (rates && Array.isArray(rates) && rates.length > 0) {
      const rateUpdates: RateUpdate[] = rates.map((r: Record<string, unknown>) => ({
        roomTypeId: String(r.roomTypeId),
        date: String(r.date),
        rate: Number(r.rate),
        currency: String(r.currency || 'XOF'),
      }));

      const results = await pushRatesToAllChannels(hotelId, rateUpdates);

      return apiResponse({
        hotelId,
        operation: 'push_rates',
        dateRange,
        results,
        syncedAt: new Date().toISOString(),
      });
    }

    // Full sync or single channel sync
    let results;
    if (channel) {
      results = [await syncSingleProvider(hotelId, channel as OTAProvider, dateRange)];
    } else {
      results = await syncAllProviders(hotelId, dateRange);
    }

    return apiResponse({
      hotelId,
      operation: channel ? 'single_channel_sync' : 'full_sync',
      channel: channel || 'all',
      dateRange,
      results,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('OTA Sync error:', error);
    return apiError('Erreur lors de la synchronisation OTA', 500, 'SYNC_ERROR');
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');

    if (!hotelId) {
      return apiError('hotelId requis', 400, 'MISSING_HOTEL_ID');
    }

    // Get recent sync logs
    const recentSyncs = await db.otaSyncLog.findMany({
      where: { hotelId },
      orderBy: { executedAt: 'desc' },
      take: 20,
    });

    // Get hotel OTA configuration
    const hotel = await db.hotel.findUnique({
      where: { id: hotelId },
      select: { otaRefs: true, name: true },
    });

    let configuredChannels: string[] = [];
    if (hotel?.otaRefs) {
      try {
        const refs = JSON.parse(hotel.otaRefs);
        configuredChannels = Object.keys(refs).filter((k) => refs[k]);
      } catch {
        configuredChannels = [];
      }
    }

    return apiResponse({
      hotelId,
      hotelName: hotel?.name,
      configuredChannels,
      recentSyncs,
      lastSyncAt: recentSyncs[0]?.executedAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('OTA Sync status error:', error);
    return apiError('Erreur lors de la récupération du statut de synchronisation', 500, 'SYNC_STATUS_ERROR');
  }
}
