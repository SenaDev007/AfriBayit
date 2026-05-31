// AfriBayit — Overbooking Prevention Guard
// Vérification et réservation atomique pour éviter le surbooking

import { db } from '@/lib/db';

/** Vérifier la disponibilité en temps réel */
export async function checkAvailability(
  hotelId: string,
  roomType: string,
  checkIn: string,
  checkOut: string
): Promise<{ available: boolean; availableRooms: number; totalRooms: number }> {
  const room = await db.hotelRoom.findFirst({
    where: { hotelId, type: roomType },
  });

  if (!room) {
    return { available: false, availableRooms: 0, totalRooms: 0 };
  }

  // Compter les chambres déjà réservées pour cette période
  const bookedCount = await db.hotelBooking.count({
    where: {
      hotelId,
      roomId: room.id,
      status: { in: ['confirmed', 'checked_in', 'pending'] },
      checkIn: { lt: new Date(checkOut) },
      checkOut: { gt: new Date(checkIn) },
    },
  });

  // Compter les chambres en maintenance
  const maintenanceCount = await db.roomAvailability.count({
    where: {
      roomId: room.id,
      status: 'MAINTENANCE',
      date: {
        gte: new Date(checkIn),
        lt: new Date(checkOut),
      },
    },
  });

  const availableRooms = Math.max(0, room.totalRooms - bookedCount - maintenanceCount);

  return {
    available: availableRooms > 0,
    availableRooms,
    totalRooms: room.totalRooms,
  };
}

/** Réserver une chambre de manière atomique avec verrou */
export async function reserveRoom(
  hotelId: string,
  roomType: string,
  checkIn: string,
  checkOut: string,
  source: string,
  bookingData?: {
    userId?: string;
    guests?: number;
    totalPrice?: number;
    currency?: string;
    specialRequests?: string;
  }
): Promise<{ success: boolean; bookingId?: string; error?: string }> {
  // Vérifier la disponibilité d'abord
  const availability = await checkAvailability(hotelId, roomType, checkIn, checkOut);
  if (!availability.available) {
    return {
      success: false,
      error: `Aucune chambre disponible (${roomType}) du ${checkIn} au ${checkOut}. Chambres disponibles: ${availability.availableRooms}/${availability.totalRooms}`,
    };
  }

  const room = await db.hotelRoom.findFirst({
    where: { hotelId, type: roomType },
  });

  if (!room) {
    return { success: false, error: `Type de chambre non trouvé: ${roomType}` };
  }

  try {
    // Créer la réservation de manière transactionnelle
    const booking = await db.$transaction(async (tx) => {
      // Double-vérification dans la transaction (verrou)
      const bookedInTx = await tx.hotelBooking.count({
        where: {
          hotelId,
          roomId: room.id,
          status: { in: ['confirmed', 'checked_in', 'pending'] },
          checkIn: { lt: new Date(checkOut) },
          checkOut: { gt: new Date(checkIn) },
        },
      });

      if (bookedInTx >= room.totalRooms) {
        throw new Error('SURBOOKING: Chambre plus disponible au moment de la réservation');
      }

      // Générer une référence de réservation
      const bookingRef = `AFB-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Créer la réservation
      const newBooking = await tx.hotelBooking.create({
        data: {
          bookingRef,
          hotelId,
          roomId: room.id,
          userId: bookingData?.userId || 'guest',
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          guests: bookingData?.guests || 1,
          totalPrice: bookingData?.totalPrice || room.basePriceXof,
          currency: bookingData?.currency || 'XOF',
          sourceChannel: source,
          status: 'confirmed',
          specialRequests: bookingData?.specialRequests,
        },
      });

      return newBooking;
    });

    return { success: true, bookingId: booking.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

/** Libérer une chambre (annulation) */
export async function releaseRoom(
  hotelId: string,
  roomType: string,
  checkIn: string,
  checkOut: string,
  source: string
): Promise<{ success: boolean; error?: string }> {
  const room = await db.hotelRoom.findFirst({
    where: { hotelId, type: roomType },
  });

  if (!room) {
    return { success: false, error: `Type de chambre non trouvé: ${roomType}` };
  }

  try {
    // Trouver la réservation correspondante et l'annuler
    const booking = await db.hotelBooking.findFirst({
      where: {
        hotelId,
        roomId: room.id,
        sourceChannel: source,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        status: { in: ['confirmed', 'pending'] },
      },
    });

    if (!booking) {
      return { success: false, error: 'Réservation non trouvée pour libération' };
    }

    await db.hotelBooking.update({
      where: { id: booking.id },
      data: { status: 'cancelled' },
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
