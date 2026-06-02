// AfriBayit — QR Code Generator for Digital Check-in/Check-out
// Generates secure QR codes for hotel and short-term rental bookings
// QR content includes HMAC signature to prevent forgery

import crypto from 'crypto';
import QRCode from 'qrcode';

const QR_SECRET = process.env.NEXTAUTH_SECRET || 'afribayit-qr-secret-key';

export interface CheckinQRData {
  type: 'checkin';
  bookingId: string;
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
  token: string;
  generatedAt: string;
}

export interface GenerateQROptions {
  bookingId: string;
  propertyId: string;
  checkInDate: string;
  checkOutDate: string;
}

/**
 * Generate an HMAC token for QR code authentication.
 * This prevents forgery by signing the QR data with a server-side secret.
 */
function generateToken(bookingId: string, propertyId: string, date: string): string {
  const payload = `${bookingId}:${propertyId}:${date}`;
  return crypto
    .createHmac('sha256', QR_SECRET)
    .update(payload)
    .digest('hex')
    .substring(0, 32); // Use first 32 chars for shorter QR codes
}

/**
 * Validate an HMAC token from QR code data.
 */
export function validateToken(bookingId: string, propertyId: string, date: string, token: string): boolean {
  const expectedToken = generateToken(bookingId, propertyId, date);
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(expectedToken, 'hex')
  );
}

/**
 * Generate a check-in QR code as a data URL.
 * Returns a base64-encoded PNG image.
 */
export async function generateCheckinQR(
  bookingId: string,
  propertyId: string,
  checkInDate: string,
  checkOutDate: string
): Promise<string> {
  // Generate secure token
  const token = generateToken(bookingId, propertyId, checkInDate);

  // Create QR data payload
  const qrData: CheckinQRData = {
    type: 'checkin',
    bookingId,
    propertyId,
    checkInDate,
    checkOutDate,
    token,
    generatedAt: new Date().toISOString(),
  };

  // Encode as JSON string for QR content
  const qrContent = JSON.stringify(qrData);

  // Generate QR code as data URL
  const dataUrl = await QRCode.toDataURL(qrContent, {
    width: 300,
    margin: 2,
    color: {
      dark: '#1a1a2e',  // AfriBayit dark blue
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });

  return dataUrl;
}

/**
 * Generate a check-in QR code as a Buffer (for PDF/email embedding).
 */
export async function generateCheckinQRBuffer(
  bookingId: string,
  propertyId: string,
  checkInDate: string,
  checkOutDate: string
): Promise<Buffer> {
  const token = generateToken(bookingId, propertyId, checkInDate);

  const qrData: CheckinQRData = {
    type: 'checkin',
    bookingId,
    propertyId,
    checkInDate,
    checkOutDate,
    token,
    generatedAt: new Date().toISOString(),
  };

  const qrContent = JSON.stringify(qrData);

  const buffer = await QRCode.toBuffer(qrContent, {
    width: 300,
    margin: 2,
    color: {
      dark: '#1a1a2e',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'M',
  });

  return buffer;
}

/**
 * Parse QR code content string into structured data.
 */
export function parseQRContent(content: string): CheckinQRData | null {
  try {
    const data = JSON.parse(content) as CheckinQRData;
    if (data.type !== 'checkin' || !data.bookingId || !data.propertyId || !data.token) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
