// AfriBayit — /api/checkin/checkout
// POST: Process check-out for a booking

import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import { processCheckout } from '@/lib/checkin/qr-validator';

export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { bookingId } = body as { bookingId: string };

    if (!bookingId) {
      return NextResponse.json(
        { error: 'ID de réservation requis' },
        { status: 400 }
      );
    }

    // Process check-out
    const checkoutResult = await processCheckout(bookingId);

    if (!checkoutResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: checkoutResult.error,
          bookingId: checkoutResult.bookingId,
          status: checkoutResult.status,
          code: 'CHECKOUT_FAILED',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingId: checkoutResult.bookingId,
      status: checkoutResult.status,
      checkedOutAt: checkoutResult.checkedOutAt,
      message: 'Check-out effectué avec succès',
    });
  } catch (error) {
    console.error('Checkout error:', error);
    const message = error instanceof Error ? error.message : 'Failed to process check-out';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
