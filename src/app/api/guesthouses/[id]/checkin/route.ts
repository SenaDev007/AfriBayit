// AfriBayit — Guesthouse QR Check-in API
// POST: Generate QR code for a guesthouse booking
// GET: Validate a check-in QR and mark booking as checked-in

import { NextRequest, NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import {
  generateGuesthouseCheckInQR,
  validateCheckInQR,
  processCheckIn,
} from '@/lib/qr-checkin';

/**
 * POST /api/guesthouses/[id]/checkin
 * Generate a QR code for a guesthouse booking.
 * Body: { bookingId: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guesthouseId } = await params;
    const auth = await authGuard({ requiredRoles: ['SUPER_ADMIN', 'CERTIFIED_AGENT', 'SELLER'] });
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { bookingId } = body as { bookingId: string };

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId requis' },
        { status: 400 }
      );
    }

    const { qrDataUrl, checkInData } = await generateGuesthouseCheckInQR(bookingId);

    // Verify the booking belongs to this guesthouse
    if (checkInData.propertyId !== guesthouseId) {
      return NextResponse.json(
        { error: 'La réservation ne correspond pas à cette maison d\'hôtes' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      qrDataUrl,
      checkInData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération du QR code';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/guesthouses/[id]/checkin?qr=...
 * Validate a check-in QR code and mark the booking as checked-in.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: guesthouseId } = await params;
    const auth = await authGuard({ requiredRoles: ['SUPER_ADMIN', 'CERTIFIED_AGENT', 'SELLER'] });
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const qrData = searchParams.get('qr');

    if (!qrData) {
      return NextResponse.json(
        { error: 'Données QR (qr) requises' },
        { status: 400 }
      );
    }

    const checkInData = validateCheckInQR(decodeURIComponent(qrData));
    if (!checkInData) {
      return NextResponse.json(
        { error: 'QR code invalide' },
        { status: 400 }
      );
    }

    // Verify the booking belongs to this guesthouse
    if (checkInData.propertyId !== guesthouseId) {
      return NextResponse.json(
        { error: 'Le QR code ne correspond pas à cette maison d\'hôtes' },
        { status: 400 }
      );
    }

    if (checkInData.propertyType !== 'guesthouse') {
      return NextResponse.json(
        { error: 'Ce QR code n\'est pas pour une maison d\'hôtes' },
        { status: 400 }
      );
    }

    const result = await processCheckIn(checkInData);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la validation du QR code';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
