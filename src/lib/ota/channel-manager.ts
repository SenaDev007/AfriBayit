// AfriBayit — Channel Inventory Manager
// Gestionnaire de pool d'inventaire multi-canal

import { db } from '@/lib/db';
import {
  OTAProvider,
  ChannelAllocation,
  UnifiedCalendarDay,
  DateRange,
  AvailabilityUpdate,
} from './types';
import { BookingComProvider } from './providers/booking-com';
import { ExpediaProvider } from './providers/expedia';
import { BaseOTAProvider } from './providers/base-provider';
import type { OTAProviderConfig } from './types';

/** Créer un fournisseur OTA à partir de la config */
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

/** Obtenir les fournisseurs configurés pour un hôtel */
async function getHotelProviders(hotelId: string): Promise<BaseOTAProvider[]> {
  const hotel = await db.hotel.findUnique({
    where: { id: hotelId },
    select: { otaRefs: true },
  });

  if (!hotel?.otaRefs) return [];

  const refs = JSON.parse(hotel.otaRefs) as Record<string, string>;
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

/** Synchroniser les disponibilités sur tous les canaux connectés */
export async function syncAllProviders(hotelId: string, dateRange: DateRange) {
  const providers = await getHotelProviders(hotelId);
  const results = [];

  for (const provider of providers) {
    if (!provider.isEnabled) continue;

    try {
      // Récupérer les réservations du fournisseur
      const bookings = await provider.fetchBookings(hotelId, dateRange);

      // Mettre à jour la base de données avec les réservations importées
      for (const booking of bookings) {
        const existing = await db.hotelBooking.findFirst({
          where: { bookingRef: booking.bookingId },
        });

        if (!existing) {
          await db.hotelBooking.create({
            data: {
              bookingRef: booking.bookingId,
              hotelId,
              checkIn: new Date(booking.checkIn),
              checkOut: new Date(booking.checkOut),
              guests: 1,
              totalPrice: booking.totalAmount,
              currency: booking.currency,
              sourceChannel: booking.provider,
              status: booking.status,
              specialRequests: booking.specialRequests,
              userId: 'system', // Les réservations OTA sont créées par le système
            },
          });
        }
      }

      // Calculer les disponibilités actuelles
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
            status: { in: ['confirmed', 'checked_in'] },
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

      // Pousser les disponibilités vers le fournisseur
      await provider.pushAvailability(hotelId, availabilityUpdates);

      // Logger le succès de la synchronisation
      await db.otaSyncLog.create({
        data: {
          hotelId,
          ota: provider.providerId,
          operation: 'PULL',
          status: 'success',
          payload: JSON.stringify({ bookingsImported: bookings.length, availabilityUpdates: availabilityUpdates.length }),
        },
      });

      results.push({
        provider: provider.providerId,
        success: true,
        bookingsImported: bookings.length,
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

/** Distribuer les chambres disponibles entre les canaux */
export async function distributeAvailability(
  hotelId: string,
  totalRooms: number,
  dateRange: DateRange
): Promise<ChannelAllocation[]> {
  // Obtenir le nombre de réservations par canal
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

  // Calculer l'allocation par canal — stratégie proportionnelle
  const totalBookings = bookingsByChannel.reduce((sum, b) => sum + b._count.id, 0);
  const availableRooms = Math.max(0, totalRooms - totalBookings);

  // Réserver 40% pour direct, 35% Booking.com, 25% Expedia
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

    // Obtenir le tarif actuel du canal
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

  // Distribuer le reste au canal direct
  if (remaining > 0) {
    const directAlloc = allocations.find((a) => a.ota === 'direct');
    if (directAlloc) {
      directAlloc.allocatedRooms += remaining;
    }
  }

  return allocations;
}

/** Réconcilier les réservations de tous les canaux */
export async function reconcileBookings(hotelId: string, dateRange: DateRange) {
  const bookings = await db.hotelBooking.findMany({
    where: {
      hotelId,
      checkIn: { lte: new Date(dateRange.end) },
      checkOut: { gte: new Date(dateRange.start) },
    },
    orderBy: { checkIn: 'asc' },
  });

  // Grouper par canal source
  const byChannel: Record<string, typeof bookings> = {};
  for (const booking of bookings) {
    const channel = booking.sourceChannel;
    if (!byChannel[channel]) byChannel[channel] = [];
    byChannel[channel].push(booking);
  }

  // Vérifier les chevauchements (potentiel surbooking)
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

/** Obtenir le calendrier unifié pour un hôtel */
export async function getUnifiedCalendar(
  hotelId: string,
  month: number,
  year: number
): Promise<UnifiedCalendarDay[]> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Dernier jour du mois

  const rooms = await db.hotelRoom.findMany({
    where: { hotelId },
  });

  const totalRooms = rooms.reduce((sum, r) => sum + r.totalRooms, 0);

  // Récupérer toutes les réservations du mois
  const bookings = await db.hotelBooking.findMany({
    where: {
      hotelId,
      status: { in: ['confirmed', 'checked_in', 'pending'] },
      checkIn: { lte: endDate },
      checkOut: { gte: startDate },
    },
  });

  // Récupérer les disponibilités
  const availabilities = await db.roomAvailability.findMany({
    where: {
      room: { hotelId },
      date: { gte: startDate, lte: endDate },
    },
  });

  // Construire le calendrier jour par jour
  const calendar: UnifiedCalendarDay[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];

    // Compter les chambres réservées pour ce jour
    const bookedForDay = bookings.filter((b) => {
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      return current >= checkIn && current < checkOut;
    });

    const bookedRooms = bookedForDay.length;
    const maintenanceRooms = availabilities.filter(
      (a) => a.date.toISOString().split('T')[0] === dateStr && a.status === 'MAINTENANCE'
    ).length;

    // Tarif moyen du jour
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
        guestName: '***', // Anonymisé pour le calendrier global
        status: b.status as 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show',
      })),
    });

    current.setDate(current.getDate() + 1);
  }

  return calendar;
}
