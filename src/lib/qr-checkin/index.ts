// AfriBayit — QR Check-in System for Hotels & Guesthouses
// Generates and validates QR codes for contactless check-in

import QRCode from 'qrcode';
import { db } from '@/lib/db';

export interface CheckInData {
  bookingId: string;
  propertyId: string;
  propertyName: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  roomNumber?: string;
  guestCount?: number;
  propertyType: 'hotel' | 'guesthouse';
}

export interface CheckInResult {
  success: boolean;
  message: string;
  bookingId?: string;
  propertyName?: string;
  guestName?: string;
  checkedInAt?: string;
}

/**
 * Generate a QR code data URL for a hotel or guesthouse booking.
 * The QR code contains a JSON payload with all check-in information.
 */
export async function generateCheckInQR(data: CheckInData): Promise<string> {
  const payload = JSON.stringify({
    type: 'afribayit_checkin',
    version: 1,
    ...data,
    ts: Date.now(),
  });

  return QRCode.toDataURL(payload, {
    width: 256,
    margin: 2,
    color: {
      dark: '#003087', // AfriBayit primary blue
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });
}

/**
 * Generate a QR code as a Buffer (for PDF/email embedding).
 */
export async function generateCheckInQRBuffer(data: CheckInData): Promise<Buffer> {
  const payload = JSON.stringify({
    type: 'afribayit_checkin',
    version: 1,
    ...data,
    ts: Date.now(),
  });

  return QRCode.toBuffer(payload, {
    width: 256,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
}

/**
 * Validate a check-in QR code data string.
 * Returns the parsed check-in data if valid, or null if invalid.
 */
export function validateCheckInQR(qrData: string): CheckInData | null {
  try {
    const parsed = JSON.parse(qrData) as Record<string, unknown>;
    if (parsed.type !== 'afribayit_checkin') return null;
    if (!parsed.bookingId || !parsed.propertyId || !parsed.guestName) return null;
    if (!parsed.checkInDate || !parsed.checkOutDate) return null;

    return {
      bookingId: parsed.bookingId as string,
      propertyId: parsed.propertyId as string,
      propertyName: parsed.propertyName as string,
      guestName: parsed.guestName as string,
      checkInDate: parsed.checkInDate as string,
      checkOutDate: parsed.checkOutDate as string,
      roomNumber: parsed.roomNumber as string | undefined,
      guestCount: parsed.guestCount as number | undefined,
      propertyType: (parsed.propertyType as 'hotel' | 'guesthouse') || 'hotel',
    };
  } catch {
    return null;
  }
}

/**
 * Generate check-in QR for a hotel booking.
 * Fetches booking details from the database and generates the QR code.
 */
export async function generateHotelCheckInQR(bookingId: string): Promise<{ qrDataUrl: string; checkInData: CheckInData }> {
  const booking = await db.hotelBooking.findUnique({
    where: { id: bookingId },
    include: {
      hotel: { select: { name: true, id: true } },
      user: { select: { name: true } },
    },
  });

  if (!booking) {
    throw new Error(`Réservation ${bookingId} introuvable`);
  }

  if (booking.status !== 'confirmed') {
    throw new Error(`La réservation n'est pas confirmée (statut: ${booking.status})`);
  }

  const checkInData: CheckInData = {
    bookingId: booking.id,
    propertyId: booking.hotelId,
    propertyName: booking.hotel.name,
    guestName: booking.user.name,
    checkInDate: booking.checkIn.toISOString().split('T')[0],
    checkOutDate: booking.checkOut.toISOString().split('T')[0],
    guestCount: booking.guests,
    propertyType: 'hotel',
  };

  const qrDataUrl = await generateCheckInQR(checkInData);

  return { qrDataUrl, checkInData };
}

/**
 * Generate check-in QR for a guesthouse booking.
 * Fetches booking details from the database and generates the QR code.
 */
export async function generateGuesthouseCheckInQR(bookingId: string): Promise<{ qrDataUrl: string; checkInData: CheckInData }> {
  const booking = await db.guesthouseBooking.findUnique({
    where: { id: bookingId },
    include: {
      guesthouse: { select: { name: true, id: true } },
      user: { select: { name: true } },
    },
  });

  if (!booking) {
    throw new Error(`Réservation ${bookingId} introuvable`);
  }

  if (booking.status !== 'confirmed') {
    throw new Error(`La réservation n'est pas confirmée (statut: ${booking.status})`);
  }

  const checkInData: CheckInData = {
    bookingId: booking.id,
    propertyId: booking.guesthouseId,
    propertyName: booking.guesthouse.name,
    guestName: booking.user.name,
    checkInDate: booking.checkIn.toISOString().split('T')[0],
    checkOutDate: booking.checkOut.toISOString().split('T')[0],
    guestCount: booking.guests,
    propertyType: 'guesthouse',
  };

  const qrDataUrl = await generateCheckInQR(checkInData);

  return { qrDataUrl, checkInData };
}

/**
 * Process a check-in from a validated QR code.
 * Updates the booking status to 'checked_in' and records the check-in time.
 */
export async function processCheckIn(data: CheckInData): Promise<CheckInResult> {
  try {
    // Verify the check-in date is today or the check-in window is open
    const today = new Date().toISOString().split('T')[0];
    const checkInDate = data.checkInDate;

    if (data.propertyType === 'hotel') {
      const booking = await db.hotelBooking.findUnique({
        where: { id: data.bookingId },
      });

      if (!booking) {
        return { success: false, message: 'Réservation introuvable' };
      }

      if (booking.status !== 'confirmed') {
        return { success: false, message: `Réservation non confirmée (statut: ${booking.status})` };
      }

      if (checkInDate > today) {
        return { success: false, message: `L'enregistrement n'est pas encore possible (date: ${checkInDate})` };
      }

      // Update booking status
      await db.hotelBooking.update({
        where: { id: data.bookingId },
        data: { status: 'checked_in' },
      });

      return {
        success: true,
        message: `Enregistrement réussi pour ${data.guestName}`,
        bookingId: data.bookingId,
        propertyName: data.propertyName,
        guestName: data.guestName,
        checkedInAt: new Date().toISOString(),
      };
    } else {
      // Guesthouse check-in
      const booking = await db.guesthouseBooking.findUnique({
        where: { id: data.bookingId },
      });

      if (!booking) {
        return { success: false, message: 'Réservation introuvable' };
      }

      if (booking.status !== 'confirmed') {
        return { success: false, message: `Réservation non confirmée (statut: ${booking.status})` };
      }

      if (checkInDate > today) {
        return { success: false, message: `L'enregistrement n'est pas encore possible (date: ${checkInDate})` };
      }

      // Update booking status
      await db.guesthouseBooking.update({
        where: { id: data.bookingId },
        data: { status: 'checked_in' },
      });

      return {
        success: true,
        message: `Enregistrement réussi pour ${data.guestName}`,
        bookingId: data.bookingId,
        propertyName: data.propertyName,
        guestName: data.guestName,
        checkedInAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement';
    return { success: false, message };
  }
}
