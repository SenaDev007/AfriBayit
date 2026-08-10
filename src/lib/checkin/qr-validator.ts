// AfriBayit — QR Code Validator & Check-in/Check-out Processor
// Validates QR codes and processes check-in/check-out for bookings

import { db } from '@/lib/db';
import { parseQRContent, validateToken } from './qr-generator';
import type { CheckinQRData } from './qr-generator';

export interface ValidationResult {
  valid: boolean;
  data: CheckinQRData | null;
  error?: string;
}

export interface CheckinResult {
  success: boolean;
  bookingId: string;
  status: string;
  checkedInAt?: string;
  error?: string;
}

export interface CheckoutResult {
  success: boolean;
  bookingId: string;
  status: string;
  checkedOutAt?: string;
  error?: string;
}

/**
 * Validate a QR code's data and HMAC token.
 */
export function validateCheckinQR(qrData: string): ValidationResult {
  // Parse the QR content
  const data = parseQRContent(qrData);
  if (!data) {
    return {
      valid: false,
      data: null,
      error: 'QR code invalide — données illisibles',
    };
  }

  // Verify HMAC token
  const isValid = validateToken(data.bookingId, data.propertyId, data.checkInDate, data.token);
  if (!isValid) {
    return {
      valid: false,
      data: null,
      error: 'QR code invalide — signature non valide',
    };
  }

  return {
    valid: true,
    data,
  };
}

/**
 * Process a check-in for a booking.
 * Works with HotelBooking, GuesthouseBooking, and ShortTermRentalBooking.
 */
export async function processCheckin(bookingId: string): Promise<CheckinResult> {
  try {
    // Try hotel booking first
    const hotelBooking = await db.hotelBooking.findUnique({
      where: { id: bookingId },
    });

    if (hotelBooking) {
      if (hotelBooking.status === 'checked_in') {
        return {
          success: true,
          bookingId,
          status: 'checked_in',
          checkedInAt: hotelBooking.updatedAt.toISOString(),
        };
      }

      if (hotelBooking.status !== 'confirmed') {
        return {
          success: false,
          bookingId,
          status: hotelBooking.status,
          error: `Réservation non confirmée (statut: ${hotelBooking.status})`,
        };
      }

      // Check if today is within check-in range
      const now = new Date();
      const checkIn = new Date(hotelBooking.checkIn);
      checkIn.setHours(0, 0, 0, 0);
      const dayAfterCheckIn = new Date(checkIn);
      dayAfterCheckIn.setDate(dayAfterCheckIn.getDate() + 1);

      if (now < checkIn) {
        return {
          success: false,
          bookingId,
          status: hotelBooking.status,
          error: 'Check-in pas encore disponible — date d\'arrivée pas atteinte',
        };
      }

      // Update status to checked_in
      const updated = await db.hotelBooking.update({
        where: { id: bookingId },
        data: { status: 'checked_in' },
      });

      return {
        success: true,
        bookingId,
        status: updated.status,
        checkedInAt: updated.updatedAt.toISOString(),
      };
    }

    // Try guesthouse booking
    const guesthouseBooking = await db.guesthouseBooking.findUnique({
      where: { id: bookingId },
    });

    if (guesthouseBooking) {
      if (guesthouseBooking.status === 'checked_in') {
        return {
          success: true,
          bookingId,
          status: 'checked_in',
          checkedInAt: guesthouseBooking.updatedAt.toISOString(),
        };
      }

      if (guesthouseBooking.status !== 'confirmed') {
        return {
          success: false,
          bookingId,
          status: guesthouseBooking.status,
          error: `Réservation non confirmée (statut: ${guesthouseBooking.status})`,
        };
      }

      const updated = await db.guesthouseBooking.update({
        where: { id: bookingId },
        data: { status: 'checked_in' },
      });

      return {
        success: true,
        bookingId,
        status: updated.status,
        checkedInAt: updated.updatedAt.toISOString(),
      };
    }

    // Try short-term rental booking
    const strBooking = await db.shortTermRentalBooking.findUnique({
      where: { id: bookingId },
    });

    if (strBooking) {
      if (strBooking.status === 'checked_in') {
        return {
          success: true,
          bookingId,
          status: 'checked_in',
          checkedInAt: strBooking.updatedAt.toISOString(),
        };
      }

      if (strBooking.status !== 'confirmed') {
        return {
          success: false,
          bookingId,
          status: strBooking.status,
          error: `Réservation non confirmée (statut: ${strBooking.status})`,
        };
      }

      const updated = await db.shortTermRentalBooking.update({
        where: { id: bookingId },
        data: { status: 'checked_in' },
      });

      return {
        success: true,
        bookingId,
        status: updated.status,
        checkedInAt: updated.updatedAt.toISOString(),
      };
    }

    return {
      success: false,
      bookingId,
      status: 'not_found',
      error: 'Réservation non trouvée',
    };
  } catch (error) {
    console.error('Checkin process error:', error);
    return {
      success: false,
      bookingId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Erreur lors du check-in',
    };
  }
}

/**
 * Process a check-out for a booking.
 */
export async function processCheckout(bookingId: string): Promise<CheckoutResult> {
  try {
    // Try hotel booking first
    const hotelBooking = await db.hotelBooking.findUnique({
      where: { id: bookingId },
    });

    if (hotelBooking) {
      if (hotelBooking.status !== 'checked_in') {
        return {
          success: false,
          bookingId,
          status: hotelBooking.status,
          error: 'Check-in requis avant le check-out',
        };
      }

      const updated = await db.hotelBooking.update({
        where: { id: bookingId },
        data: { status: 'completed' },
      });

      return {
        success: true,
        bookingId,
        status: updated.status,
        checkedOutAt: updated.updatedAt.toISOString(),
      };
    }

    // Try guesthouse booking
    const guesthouseBooking = await db.guesthouseBooking.findUnique({
      where: { id: bookingId },
    });

    if (guesthouseBooking) {
      if (guesthouseBooking.status !== 'checked_in') {
        return {
          success: false,
          bookingId,
          status: guesthouseBooking.status,
          error: 'Check-in requis avant le check-out',
        };
      }

      const updated = await db.guesthouseBooking.update({
        where: { id: bookingId },
        data: { status: 'completed' },
      });

      return {
        success: true,
        bookingId,
        status: updated.status,
        checkedOutAt: updated.updatedAt.toISOString(),
      };
    }

    // Try short-term rental booking
    const strBooking = await db.shortTermRentalBooking.findUnique({
      where: { id: bookingId },
    });

    if (strBooking) {
      if (strBooking.status !== 'checked_in') {
        return {
          success: false,
          bookingId,
          status: strBooking.status,
          error: 'Check-in requis avant le check-out',
        };
      }

      const updated = await db.shortTermRentalBooking.update({
        where: { id: bookingId },
        data: { status: 'completed' },
      });

      return {
        success: true,
        bookingId,
        status: updated.status,
        checkedOutAt: updated.updatedAt.toISOString(),
      };
    }

    return {
      success: false,
      bookingId,
      status: 'not_found',
      error: 'Réservation non trouvée',
    };
  } catch (error) {
    console.error('Checkout process error:', error);
    return {
      success: false,
      bookingId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Erreur lors du check-out',
    };
  }
}

/**
 * Get the booking status for a given booking ID across all booking types.
 */
export async function getBookingStatus(
  bookingId: string
): Promise<{ found: boolean; type: string; status: string; checkIn?: Date; checkOut?: Date } | null> {
  // Try hotel
  const hotel = await db.hotelBooking.findUnique({
    where: { id: bookingId },
    select: { status: true, checkIn: true, checkOut: true },
  });
  if (hotel) {
    return { found: true, type: 'hotel', status: hotel.status, checkIn: hotel.checkIn, checkOut: hotel.checkOut };
  }

  // Try guesthouse
  const guesthouse = await db.guesthouseBooking.findUnique({
    where: { id: bookingId },
    select: { status: true, checkIn: true, checkOut: true },
  });
  if (guesthouse) {
    return { found: true, type: 'guesthouse', status: guesthouse.status, checkIn: guesthouse.checkIn, checkOut: guesthouse.checkOut };
  }

  // Try short-term rental
  const str = await db.shortTermRentalBooking.findUnique({
    where: { id: bookingId },
    select: { status: true, checkIn: true, checkOut: true },
  });
  if (str) {
    return { found: true, type: 'short_term_rental', status: str.status, checkIn: str.checkIn, checkOut: str.checkOut };
  }

  return null;
}
