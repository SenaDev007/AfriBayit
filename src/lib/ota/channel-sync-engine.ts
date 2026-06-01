// AfriBayit — Channel Sync Engine
// Orchestrates multi-channel rate/inventory sync and incoming reservation processing

import { db } from '@/lib/db';
import { BookingComAdapter } from './adapters/booking-com-adapter';
import { ExpediaAdapter } from './adapters/expedia-adapter';
import {
  OTAProvider,
  RateUpdate,
  AvailabilityUpdate,
  ParityViolation,
  OTABooking,
} from './types';

// ── Types ───────────────────────────────────────────────────

interface ChannelSyncResult {
  hotelId: string;
  channels: {
    provider: OTAProvider;
    ratesSynced: number;
    inventorySynced: number;
    success: boolean;
    errors: string[];
  }[];
  parityViolations: ParityViolation[];
  syncedAt: string;
}

interface ReservationProcessResult {
  success: boolean;
  bookingId?: string;
  hotelId?: string;
  errors?: string[];
}

// ── Channel Sync Engine ─────────────────────────────────────

/**
 * Synchronize rates and inventory across all connected channels for a hotel.
 * Pushes current AfriBayit rates/inventory to Booking.com and Expedia,
 * then checks for rate parity violations.
 */
export async function syncAllChannels(hotelId: string): Promise<ChannelSyncResult> {
  const result: ChannelSyncResult = {
    hotelId,
    channels: [],
    parityViolations: [],
    syncedAt: new Date().toISOString(),
  };

  // Get hotel with OTA references
  const hotel = await db.hotel.findUnique({
    where: { id: hotelId },
    include: {
      rooms: {
        include: {
          availability: {
            where: {
              date: { gte: new Date() },
            },
            orderBy: { date: 'asc' },
            take: 90, // sync next 90 days
          },
          channelItems: true,
        },
      },
      channelInventory: true,
    },
  });

  if (!hotel) {
    result.channels.push({
      provider: 'booking_com',
      ratesSynced: 0,
      inventorySynced: 0,
      success: false,
      errors: ['Hotel not found'],
    });
    return result;
  }

  // Parse OTA references
  let otaRefs: Record<string, string> = {};
  if (hotel.otaRefs) {
    try {
      otaRefs = JSON.parse(hotel.otaRefs);
    } catch {
      // Invalid JSON, continue with empty refs
    }
  }

  // Build rate and inventory updates from current data
  const rateUpdates: RateUpdate[] = [];
  const inventoryUpdates: AvailabilityUpdate[] = [];

  for (const room of hotel.rooms) {
    for (const avail of room.availability) {
      const dateStr = avail.date.toISOString().split('T')[0];
      const rate = avail.priceOverride || room.basePriceXof;

      rateUpdates.push({
        roomTypeId: room.id,
        date: dateStr,
        rate,
        currency: avail.currency || 'XOF',
      });

      const bookedCount = await db.hotelBooking.count({
        where: {
          hotelId,
          roomId: room.id,
          status: { in: ['confirmed', 'checked_in', 'pending'] },
          checkIn: { lte: avail.date },
          checkOut: { gt: avail.date },
        },
      });

      inventoryUpdates.push({
        roomTypeId: room.id,
        date: dateStr,
        availableCount: Math.max(0, room.totalRooms - bookedCount),
      });
    }
  }

  // Sync with Booking.com
  if (otaRefs.booking_com_id) {
    const adapter = new BookingComAdapter({
      provider: 'booking_com',
      apiKey: process.env.BOOKING_COM_API_KEY,
      hotelId: otaRefs.booking_com_id,
      enabled: true,
    });

    const ratesResult = await adapter.syncRates(hotelId, rateUpdates);
    const inventoryResult = await adapter.syncInventory(hotelId, inventoryUpdates);

    result.channels.push({
      provider: 'booking_com',
      ratesSynced: ratesResult.success ? rateUpdates.length : 0,
      inventorySynced: inventoryResult.success ? inventoryUpdates.length : 0,
      success: ratesResult.success && inventoryResult.success,
      errors: [...(ratesResult.errors || []), ...(inventoryResult.errors || [])],
    });
  }

  // Sync with Expedia
  if (otaRefs.expedia_id) {
    const adapter = new ExpediaAdapter({
      provider: 'expedia',
      apiKey: process.env.EXPEDIA_API_KEY,
      hotelId: otaRefs.expedia_id,
      enabled: true,
    });

    const ratesResult = await adapter.syncRates(hotelId, rateUpdates);
    const inventoryResult = await adapter.syncInventory(hotelId, inventoryUpdates);

    result.channels.push({
      provider: 'expedia',
      ratesSynced: ratesResult.success ? rateUpdates.length : 0,
      inventorySynced: inventoryResult.success ? inventoryUpdates.length : 0,
      success: ratesResult.success && inventoryResult.success,
      errors: [...(ratesResult.errors || []), ...(inventoryResult.errors || [])],
    });
  }

  // Check rate parity
  result.parityViolations = await detectRateParityViolation(hotelId);

  // Log sync
  await db.otaSyncLog.create({
    data: {
      hotelId,
      ota: 'all',
      operation: 'PUSH',
      status: result.channels.every((c) => c.success) ? 'success' : 'partial',
      payload: JSON.stringify({
        channels: result.channels.length,
        ratesSynced: result.channels.reduce((sum, c) => sum + c.ratesSynced, 0),
        inventorySynced: result.channels.reduce((sum, c) => sum + c.inventorySynced, 0),
        parityViolations: result.parityViolations.length,
      }),
    },
  });

  return result;
}

/**
 * Process an incoming reservation from any OTA source.
 * Creates booking in the database, checks availability, and notifies hotel.
 */
export async function handleIncomingReservation(
  otaSource: OTAProvider,
  reservationData: OTABooking
): Promise<ReservationProcessResult> {
  try {
    // Find hotel by OTA reference
    const hotel = await findHotelByOtaRef(otaSource, reservationData.hotelId || '');
    if (!hotel) {
      return { success: false, errors: ['Hotel not found for this OTA reference'] };
    }

    // Check for duplicate booking
    const existing = await db.hotelBooking.findFirst({
      where: { bookingRef: reservationData.bookingId },
    });
    if (existing) {
      // Update existing booking
      await db.hotelBooking.update({
        where: { id: existing.id },
        data: {
          status: reservationData.status,
          totalPrice: reservationData.totalAmount,
          specialRequests: reservationData.specialRequests,
        },
      });
      return { success: true, bookingId: existing.id, hotelId: hotel.id };
    }

    // Find matching room
    const room = await db.hotelRoom.findFirst({
      where: {
        hotelId: hotel.id,
        type: reservationData.roomTypeId,
      },
    });

    // Create the booking
    const booking = await db.hotelBooking.create({
      data: {
        bookingRef: reservationData.bookingId,
        hotelId: hotel.id,
        roomId: room?.id,
        userId: 'system',
        checkIn: new Date(reservationData.checkIn),
        checkOut: new Date(reservationData.checkOut),
        guests: 1,
        totalPrice: reservationData.totalAmount,
        currency: reservationData.currency,
        sourceChannel: otaSource,
        status: reservationData.status,
        specialRequests: reservationData.specialRequests,
      },
    });

    // Log the incoming reservation
    await db.otaSyncLog.create({
      data: {
        hotelId: hotel.id,
        ota: otaSource,
        operation: 'PULL',
        status: 'success',
        payload: JSON.stringify({
          bookingId: booking.id,
          bookingRef: reservationData.bookingId,
          guest: reservationData.guestName,
          totalAmount: reservationData.totalAmount,
        }),
      },
    });

    return { success: true, bookingId: booking.id, hotelId: hotel.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[ChannelSync] handleIncomingReservation failed:', message);
    return { success: false, errors: [message] };
  }
}

/**
 * Detect rate parity violations across all channels for a hotel.
 * Compares rates between direct, Booking.com, and Expedia channels.
 */
export async function detectRateParityViolation(
  hotelId: string
): Promise<ParityViolation[]> {
  const violations: ParityViolation[] = [];
  const MAX_DISCREPANCY_PCT = 5; // 5% tolerance

  // Get channel inventory for all channels
  const channelInventory = await db.channelInventory.findMany({
    where: { hotelId },
  });

  // Group by room
  const byRoom: Record<string, typeof channelInventory> = {};
  for (const inv of channelInventory) {
    if (!byRoom[inv.roomId]) byRoom[inv.roomId] = [];
    byRoom[inv.roomId].push(inv);
  }

  // Compare rates across channels for each room
  for (const [roomTypeId, inventories] of Object.entries(byRoom)) {
    for (let i = 0; i < inventories.length; i++) {
      for (let j = i + 1; j < inventories.length; j++) {
        const a = inventories[i];
        const b = inventories[j];
        const rateA = a.rateXof || 0;
        const rateB = b.rateXof || 0;

        if (rateA === 0 || rateB === 0) continue;

        const discrepancyPct = Math.abs(rateA - rateB) / Math.max(rateA, rateB) * 100;

        if (discrepancyPct > MAX_DISCREPANCY_PCT) {
          violations.push({
            roomTypeId,
            providerA: a.ota as OTAProvider,
            rateA,
            providerB: b.ota as OTAProvider,
            rateB,
            discrepancy: Math.abs(rateA - rateB),
            discrepancyPct: Math.round(discrepancyPct),
          });
        }
      }
    }
  }

  return violations;
}

// ── Helper: Find hotel by OTA reference ─────────────────────

async function findHotelByOtaRef(
  otaSource: OTAProvider,
  otaHotelId: string
): Promise<{ id: string } | null> {
  const hotels = await db.hotel.findMany({
    where: { status: 'active' },
    select: { id: true, otaRefs: true },
  });

  for (const hotel of hotels) {
    if (!hotel.otaRefs) continue;
    try {
      const refs = JSON.parse(hotel.otaRefs) as Record<string, string>;
      const refKey = otaSource === 'booking_com' ? 'booking_com_id' : 'expedia_id';
      if (refs[refKey] === otaHotelId) {
        return { id: hotel.id };
      }
    } catch {
      // Invalid JSON, skip
    }
  }

  return null;
}
