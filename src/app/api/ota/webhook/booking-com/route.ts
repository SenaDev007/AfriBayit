// AfriBayit — API: Booking.com Webhook (v2)
// POST: Receive Booking.com webhooks with HMAC signature verification

import { NextResponse } from 'next/server';
import { BookingComAdapter } from '@/lib/ota/adapters/booking-com-adapter';
import { handleIncomingReservation } from '@/lib/ota/channel-sync-engine';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-booking-signature') || '';

    // Initialize adapter and verify webhook
    const adapter = new BookingComAdapter();
    const webhookResult = await adapter.handleWebhook(payload, signature);

    if (!webhookResult.success) {
      return NextResponse.json(
        { error: webhookResult.errors?.join(', ') || 'Webhook verification failed' },
        { status: 400 }
      );
    }

    const { eventType, reservationId } = webhookResult.data!;

    // Parse body for additional data
    const body = JSON.parse(payload);
    const hotel_id = body.hotel_id;

    // Find matching hotel
    const hotels = await db.hotel.findMany({
      where: { status: 'active' },
      select: { id: true, otaRefs: true },
    });

    let matchingHotelId: string | null = null;
    for (const hotel of hotels) {
      if (hotel.otaRefs) {
        try {
          const refs = JSON.parse(hotel.otaRefs);
          if (refs.booking_com_id === String(hotel_id)) {
            matchingHotelId = hotel.id;
            break;
          }
        } catch {
          // Invalid otaRefs
        }
      }
    }

    if (!matchingHotelId) {
      return NextResponse.json(
        { error: 'Hotel not found for this webhook' },
        { status: 404 }
      );
    }

    // Log the webhook event
    await db.otaSyncLog.create({
      data: {
        hotelId: matchingHotelId,
        ota: 'booking_com',
        operation: 'PULL',
        status: 'success',
        payload: JSON.stringify({
          event_type: eventType,
          reservation_id: reservationId,
          hotel_id,
          received_at: new Date().toISOString(),
        }),
      },
    });

    // Process event by type
    switch (eventType) {
      case 'new_booking':
      case 'modification': {
        if (reservationId) {
          // Fetch full booking details and process
          const bookingResult = await adapter.fetchBookings(matchingHotelId, {
            start: new Date().toISOString().split('T')[0],
            end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });

          if (bookingResult.success && bookingResult.data) {
            const matchingBooking = bookingResult.data.find(
              (b) => b.bookingId === reservationId
            );
            if (matchingBooking) {
              await handleIncomingReservation('booking_com', {
                ...matchingBooking,
                hotelId: hotel_id,
              });
            }
          }
        }
        break;
      }

      case 'cancellation': {
        if (reservationId) {
          await db.hotelBooking.updateMany({
            where: {
              bookingRef: String(reservationId),
              hotelId: matchingHotelId,
            },
            data: { status: 'cancelled' },
          });
        }
        break;
      }

      case 'rate_update':
      case 'inventory_update': {
        // These are informational notifications — the sync engine handles updates
        console.info(
          `[OTA:BookingCom] Received ${eventType} notification for hotel ${matchingHotelId}`
        );
        break;
      }

      default:
        console.info(`[OTA:BookingCom] Unknown event type: ${eventType}`);
    }

    // Booking.com expects 200 OK
    return NextResponse.json({ received: true, eventType });
  } catch (error) {
    console.error('[OTA:BookingCom] Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}
