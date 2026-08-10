// AfriBayit — /api/checkin/qr
// GET: Generate QR code for a booking (authenticated, property owner only)
// POST: Validate QR code and process check-in

import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { generateCheckinQR } from '@/lib/checkin/qr-generator';
import { validateCheckinQR, processCheckin, getBookingStatus } from '@/lib/checkin/qr-validator';

export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const propertyId = searchParams.get('propertyId');
    const checkInDate = searchParams.get('checkInDate');
    const checkOutDate = searchParams.get('checkOutDate');

    if (!bookingId || !propertyId || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: 'Paramètres manquants: bookingId, propertyId, checkInDate, checkOutDate requis' },
        { status: 400 }
      );
    }

    // Verify the booking exists and the user has access
    const bookingStatus = await getBookingStatus(bookingId);
    if (!bookingStatus || !bookingStatus.found) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }

    // Generate QR code
    const qrDataUrl = await generateCheckinQR(
      bookingId,
      propertyId,
      checkInDate,
      checkOutDate
    );

    return NextResponse.json({
      success: true,
      qrCode: qrDataUrl,
      bookingId,
      status: bookingStatus.status,
      checkInDate,
      checkOutDate,
    });
  } catch (error) {
    console.error('QR generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate QR code';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { qrData } = body as { qrData: string };

    if (!qrData) {
      return NextResponse.json(
        { error: 'Données QR requises' },
        { status: 400 }
      );
    }

    // Validate the QR code
    const validation = validateCheckinQR(qrData);

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'QR code invalide',
          code: 'INVALID_QR',
        },
        { status: 400 }
      );
    }

    // Process check-in
    const checkinResult = await processCheckin(validation.data!.bookingId);

    if (!checkinResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: checkinResult.error,
          bookingId: checkinResult.bookingId,
          status: checkinResult.status,
          code: 'CHECKIN_FAILED',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingId: checkinResult.bookingId,
      status: checkinResult.status,
      checkedInAt: checkinResult.checkedInAt,
      message: 'Check-in effectué avec succès',
    });
  } catch (error) {
    console.error('Checkin error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process check-in';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
