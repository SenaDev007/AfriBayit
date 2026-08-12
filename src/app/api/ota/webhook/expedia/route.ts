// AfriBayit — API: Expedia Webhook
// POST: Receive Expedia QuickConnect notifications with signature verification

import { NextResponse } from 'next/server';
import { ExpediaAdapter } from '@/lib/ota/adapters/expedia-adapter';
import { handleIncomingReservation } from '@/lib/ota/channel-sync-engine';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-expedia-signature') || '';

    // Initialize adapter and process notification
    const adapter = new ExpediaAdapter();
    const notifResult = await adapter.handleNotification(payload, signature);

    if (!notifResult.success) {
      return NextResponse.json(
        { error: notifResult.errors?.join(', ') || 'Notification verification failed' },
        { status: 400 }
      );
    }

    const { notificationType, arnData, bookingData } = notifResult.data!;

    // Find hotel by Expedia reference
    const hotels = await db.hotel.findMany({
      where: { status: 'active' },
      select: { id: true, otaRefs: true },
    });

    let matchingHotelId: string | null = null;
    const expediaHotelId = bookingData?.hotel_id || arnData?.hotel_id || '';

    for (const hotel of hotels) {
      if (hotel.otaRefs) {
        try {
          const refs = JSON.parse(hotel.otaRefs);
          if (refs.expedia_id === String(expediaHotelId)) {
            matchingHotelId = hotel.id;
            break;
          }
        } catch {
          // Invalid otaRefs
        }
      }
    }

    // Log notification
    if (matchingHotelId) {
      await db.otaSyncLog.create({
        data: {
          hotelId: matchingHotelId,
          ota: 'expedia',
          operation: 'PULL',
          status: 'success',
          payload: JSON.stringify({
            notificationType,
            arnEvent: arnData?.event_type,
            reservationId: bookingData?.reservation_id,
            received_at: new Date().toISOString(),
          }),
        },
      });
    }

    // Process based on notification type
    switch (notificationType) {
      case 'booking': {
        if (bookingData && matchingHotelId) {
          const otaBooking = adapter.mapBookingToOTA(bookingData);
          await handleIncomingReservation('expedia', {
            ...otaBooking,
            hotelId: expediaHotelId,
          });
        }
        break;
      }

      case 'arn': {
        if (arnData) {
          const arnProcessing = adapter.processArnNotification(arnData);
          console.info(
            `[OTA:Expedia] ARN ${arnProcessing.action}: ${arnProcessing.details}`
          );

          // If rate parity alert, log it for admin review
          if (arnProcessing.action === 'rate_parity_alert' && matchingHotelId) {
            await db.otaSyncLog.create({
              data: {
                hotelId: matchingHotelId,
                ota: 'expedia',
                operation: 'PULL',
                status: 'success',
                payload: JSON.stringify({
                  type: 'arn_parity_alert',
                  ratePlanId: arnData.rate_plan_id,
                  date: arnData.data.date,
                  oldRate: arnData.data.old_rate,
                  newRate: arnData.data.new_rate,
                  currency: arnData.data.currency,
                }),
              },
            });
          }
        }
        break;
      }

      default:
        console.info(`[OTA:Expedia] Unknown notification type: ${notificationType}`);
    }

    // Expedia expects 200 OK
    return NextResponse.json({
      received: true,
      notificationType,
    });
  } catch (error) {
    console.error('[OTA:Expedia] Webhook error:', error);
    return NextResponse.json(
      { error: 'Notification processing error' },
      { status: 500 }
    );
  }
}
