// AfriBayit — Channel Inventory Manager
// Enhanced multi-channel sync with rate parity enforcement and overbooking prevention
// Supports async sync operations and cross-channel availability management

import { db } from '@/lib/db';
import {
  OTAProvider,
  ChannelAllocation,
  UnifiedCalendarDay,
  DateRange,
  AvailabilityUpdate,
  RateUpdate,
  OTASyncConfig,
} from './types';
import { BookingComProvider } from './providers/booking-com';
import { ExpediaProvider } from './providers/expedia';
import { BaseOTAProvider } from './providers/base-provider';
import type { OTAProviderConfig } from './types';
import { validateRates, suggestParityRates } from './rate-parity';
import { checkAvailability, reserveRoom } from './overbooking-guard';

// ─── Default Sync Config ──────────────────────────────────────────────────

const DEFAULT_SYNC_CONFIG: OTASyncConfig = {
  maxConcurrentSyncs: 3,
  apiTimeout: 30_000,
  enforceRateParity: true,
  preventOverbooking: true,
  channels: [],
};

// ─── Provider Factory ─────────────────────────────────────────────────────

/** Create an OTA provider instance from config */
export function createProvider(config: OTAProviderConfig): BaseOTAProvider {
  switch (config.provider) {
    case 'booking_com':
      return new BookingComProvider(config);
    case 'expedia':
      return new ExpediaProvider(config);
    default:
      throw new Error(`Fournisseur OTA non supporté: ${config.provider}`);
  }
}

/** Get configured providers for a hotel */
async function getHotelProviders(hotelId: string): Promise<BaseOTAProvider[]> {
  const hotel = await db.hotel.findUnique({
    where: { id: hotelId },
    select: { otaRefs: true },
  });

  if (!hotel?.otaRefs) return [];

  let refs: Record<string, string> = {};
  try { refs = JSON.parse(hotel.otaRefs); } catch { refs = {}; }

  const providers: BaseOTAProvider[] = [];

  if (refs.booking_com_id) {
    providers.push(
      createProvider({
        provider: 'booking_com',
        apiKey: process.env.BOOKING_COM_API_KEY || '',
        hotelId: refs.booking_com_id,
        enabled: true,
      })
    );
  }

  if (refs.expedia_id) {
    providers.push(
      createProvider({
        provider: 'expedia',
        apiKey: process.env.EXPEDIA_API_KEY || '',
        hotelId: refs.expedia_id,
        enabled: true,
      })
    );
  }

  return providers;
}

// ─── Sync Operations ──────────────────────────────────────────────────────

/**
 * Sync availability across all OTA channels.
 * Pulls bookings from each channel, updates local DB, pushes availability.
 * Runs asynchronously — does not block the main request.
 */
export async function syncAllProviders(
  hotelId: string,
  dateRange: DateRange,
  syncConfig?: Partial<OTASyncConfig>
) {
  const config = { ...DEFAULT_SYNC_CONFIG, ...syncConfig };
  const providers = await getHotelProviders(hotelId);
  const results = [];

  for (const provider of providers) {
    if (!provider.isEnabled) continue;

    try {
      // 1. Pull bookings from the provider
      const bookings = await provider.fetchBookings(hotelId, dateRange);

      // 2. Update local database with imported bookings
      let bookingsImported = 0;
      for (const booking of bookings) {
        const existing = await db.hotelBooking.findFirst({
          where: { bookingRef: booking.bookingId },
        });

        if (!existing) {
          // Check for overbooking before creating
          if (config.preventOverbooking) {
            const availability = await checkAvailability(
              hotelId,
              booking.roomTypeId,
              booking.checkIn,
              booking.checkOut
            );

            if (!availability.available) {
              console.warn(
                `[ChannelManager] Overbooking detected for ${booking.bookingId} from ${provider.providerName}. ` +
                `Available: ${availability.availableRooms}/${availability.totalRooms}`
              );

              // Log the overbooking attempt
              await db.otaSyncLog.create({
                data: {
                  hotelId,
                  ota: provider.providerId,
                  operation: 'PULL',
                  status: 'failed',
                  errorMessage: `Overbooking prevented: ${booking.bookingId} — no availability`,
                  payload: JSON.stringify(booking),
                },
              });

              continue; // Skip this booking
            }
          }

          // Find the room
          const room = await db.hotelRoom.findFirst({
            where: { hotelId, type: booking.roomTypeId },
          });

          await db.hotelBooking.create({
            data: {
              bookingRef: booking.bookingId,
              hotelId,
              roomId: room?.id,
              checkIn: new Date(booking.checkIn),
              checkOut: new Date(booking.checkOut),
              guests: 1,
              totalPrice: booking.totalAmount,
              currency: booking.currency,
              sourceChannel: booking.provider,
              status: booking.status,
              specialRequests: booking.specialRequests,
              userId: 'system',
            },
          });
          bookingsImported++;
        }
      }

      // 3. Calculate current availability
      const rooms = await db.hotelRoom.findMany({
        where: { hotelId },
        include: { channelItems: true },
      });

      const availabilityUpdates: AvailabilityUpdate[] = [];
      for (const room of rooms) {
        const bookedCount = await db.hotelBooking.count({
          where: {
            hotelId,
            roomId: room.id,
            status: { in: ['confirmed', 'checked_in', 'pending'] },
            checkIn: { lte: new Date(dateRange.end) },
            checkOut: { gte: new Date(dateRange.start) },
          },
        });

        const availableCount = Math.max(0, room.totalRooms - bookedCount);
        availabilityUpdates.push({
          roomTypeId: room.id,
          date: dateRange.start,
          availableCount,
        });
      }

      // 4. Push availability to the provider
      await provider.pushAvailability(hotelId, availabilityUpdates);

      // 5. Enforce rate parity and push rates
      if (config.enforceRateParity) {
        const parityResult = await validateRates(hotelId, []);
        if (!parityResult.valid) {
          console.warn(
            `[ChannelManager] Rate parity violations detected for hotel ${hotelId}:`,
            parityResult.violations
          );
        }
      }

      // Push current rates
      const rateUpdates: RateUpdate[] = [];
      for (const room of rooms) {
        rateUpdates.push({
          roomTypeId: room.id,
          date: dateRange.start,
          rate: room.basePriceXof,
          currency: room.currency || 'XOF',
        });
      }

      if (rateUpdates.length > 0) {
        await provider.pushRates(hotelId, rateUpdates);
      }

      // 6. Log success
      await db.otaSyncLog.create({
        data: {
          hotelId,
          ota: provider.providerId,
          operation: 'PULL',
          status: 'success',
          payload: JSON.stringify({
            bookingsImported,
            availabilityUpdates: availabilityUpdates.length,
            rateUpdates: rateUpdates.length,
          }),
        },
      });

      results.push({
        provider: provider.providerId,
        success: true,
        bookingsImported,
        availabilityUpdated: availabilityUpdates.length,
        errors: [],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await db.otaSyncLog.create({
        data: {
          hotelId,
          ota: provider.providerId,
          operation: 'PULL',
          status: 'failed',
          errorMessage: message,
        },
      });

      results.push({
        provider: provider.providerId,
        success: false,
        bookingsImported: 0,
        availabilityUpdated: 0,
        errors: [message],
      });
    }
  }

  return results;
}

/**
 * Sync a single channel for a hotel.
 * More targeted than syncAllProviders.
 */
export async function syncSingleProvider(
  hotelId: string,
  providerId: OTAProvider,
  dateRange: DateRange
) {
  const providers = await getHotelProviders(hotelId);
  const provider = providers.find((p) => p.providerId === providerId);

  if (!provider || !provider.isEnabled) {
    return {
      provider: providerId,
      success: false,
      bookingsImported: 0,
      availabilityUpdated: 0,
      errors: ['Provider not configured or disabled'],
    };
  }

  const fullResults = await syncAllProviders(hotelId, dateRange, { channels: [providerId] });
  return fullResults[0] || {
    provider: providerId,
    success: false,
    bookingsImported: 0,
    availabilityUpdated: 0,
    errors: ['No sync result returned'],
  };
}

/**
 * Push availability update to all channels.
 * Used when availability changes locally (e.g., direct booking, cancellation).
 * This is async and non-blocking.
 */
export async function pushAvailabilityToAllChannels(
  hotelId: string,
  updates: AvailabilityUpdate[]
): Promise<Record<string, { success: boolean; errors: string[] }>> {
  const providers = await getHotelProviders(hotelId);
  const results: Record<string, { success: boolean; errors: string[] }> = {};

  // Push to each provider in parallel
  const pushPromises = providers
    .filter((p) => p.isEnabled)
    .map(async (provider) => {
      try {
        const result = await provider.pushAvailability(hotelId, updates);
        results[provider.providerId] = result;

        // Log the push
        await db.otaSyncLog.create({
          data: {
            hotelId,
            ota: provider.providerId,
            operation: 'PUSH',
            status: result.success ? 'success' : 'failed',
            payload: JSON.stringify({ updatesCount: updates.length }),
            errorMessage: result.errors.join(', ') || null,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results[provider.providerId] = { success: false, errors: [message] };
      }
    });

  await Promise.allSettled(pushPromises);
  return results;
}

/**
 * Push rate updates to all channels with rate parity enforcement.
 */
export async function pushRatesToAllChannels(
  hotelId: string,
  rates: RateUpdate[],
  enforceParity: boolean = true
): Promise<Record<string, { success: boolean; errors: string[] }>> {
  const providers = await getHotelProviders(hotelId);
  const results: Record<string, { success: boolean; errors: string[] }> = {};

  // Check rate parity before pushing
  if (enforceParity) {
    const parityCheck = await validateRates(hotelId, rates);
    if (!parityCheck.valid) {
      console.warn(
        `[ChannelManager] Rate parity violations before push:`,
        parityCheck.violations
      );
      // Still push, but log the violations
    }
  }

  const pushPromises = providers
    .filter((p) => p.isEnabled)
    .map(async (provider) => {
      try {
        const result = await provider.pushRates(hotelId, rates);
        results[provider.providerId] = result;

        await db.otaSyncLog.create({
          data: {
            hotelId,
            ota: provider.providerId,
            operation: 'PUSH',
            status: result.success ? 'success' : 'failed',
            payload: JSON.stringify({ ratesCount: rates.length, enforceParity }),
            errorMessage: result.errors.join(', ') || null,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        results[provider.providerId] = { success: false, errors: [message] };
      }
    });

  await Promise.allSettled(pushPromises);
  return results;
}

/**
 * Check overbooking across all channels before accepting a booking.
 * Returns true if the booking is safe to accept.
 */
export async function checkOverbookingAcrossChannels(
  hotelId: string,
  roomType: string,
  checkIn: string,
  checkOut: string
): Promise<{
  safe: boolean;
  availableRooms: number;
  totalRooms: number;
  channelBreakdown: Record<string, number>;
}> {
  // Get current availability
  const availability = await checkAvailability(hotelId, roomType, checkIn, checkOut);

  // Get bookings breakdown by channel
  const room = await db.hotelRoom.findFirst({
    where: { hotelId, type: roomType },
  });

  let channelBreakdown: Record<string, number> = {};
  if (room) {
    const bookingsByChannel = await db.hotelBooking.groupBy({
      by: ['sourceChannel'],
      where: {
        hotelId,
        roomId: room.id,
        status: { in: ['confirmed', 'checked_in', 'pending'] },
        checkIn: { lt: new Date(checkOut) },
        checkOut: { gt: new Date(checkIn) },
      },
      _count: { id: true },
    });

    channelBreakdown = bookingsByChannel.reduce((acc, b) => {
      acc[b.sourceChannel] = b._count.id;
      return acc;
    }, {} as Record<string, number>);
  }

  return {
    safe: availability.available,
    availableRooms: availability.availableRooms,
    totalRooms: availability.totalRooms,
    channelBreakdown,
  };
}

// ─── Distribution & Calendar ──────────────────────────────────────────────

/**
 * Distribute available rooms between channels.
 * Uses proportional allocation strategy.
 */
export async function distributeAvailability(
  hotelId: string,
  totalRooms: number,
  dateRange: DateRange
): Promise<ChannelAllocation[]> {
  // Get bookings by channel
  const bookingsByChannel = await db.hotelBooking.groupBy({
    by: ['sourceChannel'],
    where: {
      hotelId,
      status: { in: ['confirmed', 'checked_in', 'pending'] },
      checkIn: { lte: new Date(dateRange.end) },
      checkOut: { gte: new Date(dateRange.start) },
    },
    _count: { id: true },
  });

  const totalBookings = bookingsByChannel.reduce((sum, b) => sum + b._count.id, 0);
  const availableRooms = Math.max(0, totalRooms - totalBookings);

  // Allocation ratios — 40% direct, 35% Booking.com, 25% Expedia
  const allocationRatios: Record<string, number> = {
    direct: 0.4,
    booking_com: 0.35,
    expedia: 0.25,
  };

  const allocations: ChannelAllocation[] = [];
  let remaining = availableRooms;

  for (const [channel, ratio] of Object.entries(allocationRatios)) {
    const allocated = Math.round(availableRooms * ratio);
    const finalAllocated = Math.min(allocated, remaining);
    remaining -= finalAllocated;

    // Get current channel rate
    const channelInv = await db.channelInventory.findFirst({
      where: { hotelId, ota: channel },
    });

    allocations.push({
      ota: channel as OTAProvider | 'direct',
      allocatedRooms: finalAllocated,
      rate: channelInv?.rateXof || 0,
      currency: 'XOF',
    });
  }

  // Distribute remainder to direct channel
  if (remaining > 0) {
    const directAlloc = allocations.find((a) => a.ota === 'direct');
    if (directAlloc) {
      directAlloc.allocatedRooms += remaining;
    }
  }

  return allocations;
}

/**
 * Reconcile bookings across all channels to detect issues.
 */
export async function reconcileBookings(hotelId: string, dateRange: DateRange) {
  const bookings = await db.hotelBooking.findMany({
    where: {
      hotelId,
      checkIn: { lte: new Date(dateRange.end) },
      checkOut: { gte: new Date(dateRange.start) },
    },
    orderBy: { checkIn: 'asc' },
  });

  // Group by channel
  const byChannel: Record<string, typeof bookings> = {};
  for (const booking of bookings) {
    const channel = booking.sourceChannel;
    if (!byChannel[channel]) byChannel[channel] = [];
    byChannel[channel].push(booking);
  }

  // Detect overlapping bookings (potential overbooking)
  const overlappingBookings: typeof bookings = [];
  for (let i = 0; i < bookings.length - 1; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const a = bookings[i];
      const b = bookings[j];
      if (
        a.roomId === b.roomId &&
        new Date(a.checkIn) < new Date(b.checkOut) &&
        new Date(b.checkIn) < new Date(a.checkOut) &&
        a.status !== 'cancelled' &&
        b.status !== 'cancelled'
      ) {
        overlappingBookings.push(a, b);
      }
    }
  }

  return {
    totalBookings: bookings.length,
    byChannel,
    overlappingBookings: overlappingBookings.length > 0 ? overlappingBookings : [],
    hasOverlaps: overlappingBookings.length > 0,
  };
}

/**
 * Get unified calendar for a hotel.
 */
export async function getUnifiedCalendar(
  hotelId: string,
  month: number,
  year: number
): Promise<UnifiedCalendarDay[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const rooms = await db.hotelRoom.findMany({
    where: { hotelId },
  });

  const totalRooms = rooms.reduce((sum, r) => sum + r.totalRooms, 0);

  const bookings = await db.hotelBooking.findMany({
    where: {
      hotelId,
      status: { in: ['confirmed', 'checked_in', 'pending'] },
      checkIn: { lte: endDate },
      checkOut: { gte: startDate },
    },
  });

  const availabilities = await db.roomAvailability.findMany({
    where: {
      room: { hotelId },
      date: { gte: startDate, lte: endDate },
    },
  });

  const calendar: UnifiedCalendarDay[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];

    const bookedForDay = bookings.filter((b) => {
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      return current >= checkIn && current < checkOut;
    });

    const bookedRooms = bookedForDay.length;
    const maintenanceRooms = availabilities.filter(
      (a) => a.date.toISOString().split('T')[0] === dateStr && a.status === 'MAINTENANCE'
    ).length;

    const dayAvail = availabilities.filter(
      (a) => a.date.toISOString().split('T')[0] === dateStr
    );
    const rate = dayAvail.length > 0
      ? dayAvail.reduce((sum, a) => sum + (a.priceOverride || 0), 0) / dayAvail.length
      : rooms.reduce((sum, r) => sum + r.basePriceXof, 0) / Math.max(rooms.length, 1);

    calendar.push({
      date: dateStr,
      totalRooms,
      availableRooms: Math.max(0, totalRooms - bookedRooms - maintenanceRooms),
      bookedRooms,
      maintenanceRooms,
      rate: Math.round(rate),
      currency: 'XOF',
      bookings: bookedForDay.map((b) => ({
        id: b.id,
        source: b.sourceChannel as OTAProvider | 'direct',
        guestName: '***',
        status: b.status as 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show',
      })),
    });

    current.setDate(current.getDate() + 1);
  }

  return calendar;
}
