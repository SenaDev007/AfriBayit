// AfriBayit — API: Booking.com Webhook Handler
// Receives and processes Booking.com reservation notifications
// Handles: new_booking, modification, cancellation, availability_change, rate_change
// Creates local booking records, updates availability across channels, sends confirmations

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pushAvailabilityToAllChannels, checkOverbookingAcrossChannels } from '@/lib/ota/channel-manager';
import { BookingComProvider } from '@/lib/ota/providers/booking-com';
import type { OTAProvider } from '@/lib/ota/types';

// ─── Webhook Signature Verification ───────────────────────────────────────

/**
 * Verify Booking.com webhook signature using HMAC-SHA256.
 * SECURITY FIX (P2.8 — juillet 2026) : implémentation réelle du HMAC verification
 * (was: TODO ligne 36, acceptait tous les webhooks en prod).
 *
 * Booking.com signs webhooks with a shared secret using HMAC-SHA256.
 * The signature is sent in the `X-Booking-Signature` header as a hex string.
 */
function verifyWebhookSignature(request: NextRequest, body: string): boolean {
  const signature = request.headers.get('X-Booking-Signature');
  if (!signature) {
    // In sandbox mode, allow unsigned webhooks
    if (process.env.OTA_SANDBOX_MODE !== 'false') {
      console.warn('[Webhook:Booking.com] No signature — allowing in sandbox mode');
      return true;
    }
    console.error('[Webhook:Booking.com] No signature header — rejecting in production');
    return false;
  }

  const secret = process.env.BOOKING_COM_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Webhook:Booking.com] BOOKING_COM_WEBHOOK_SECRET not configured — rejecting');
    return false;
  }

  // P2.8 — real HMAC-SHA256 verification
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (signatureBuffer.length !== expectedBuffer.length) {
    console.error('[Webhook:Booking.com] Signature length mismatch — rejecting');
    return false;
  }

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

// ─── Webhook Handler ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const rawBody = await request.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(request, rawBody)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Booking.com sends notifications for:
    // - New reservation (event_type: new_booking)
    // - Modification (event_type: modification)
    // - Cancellation (event_type: cancellation)
    // - Availability change (event_type: availability_change)
    // - Rate change (event_type: rate_change)

    const { hotel_id, reservation_id, event_type } = body;

    if (!hotel_id || !event_type) {
      return NextResponse.json({ error: 'Données webhook invalides' }, { status: 400 });
    }

    console.log(
      `[Webhook:Booking.com] Received ${event_type} event for hotel ${hotel_id}, ` +
      `reservation ${reservation_id || 'N/A'}`
    );

    // Find the matching hotel
    const hotels = await db.hotel.findMany({
      where: { status: 'active' },
    });

    let matchingHotel = null;
    for (const hotel of hotels) {
      if (hotel.otaRefs) {
        try {
          const refs = JSON.parse(hotel.otaRefs);
          if (refs.booking_com_id === String(hotel_id)) {
            matchingHotel = hotel;
            break;
          }
        } catch {
          // Invalid otaRefs, skip
        }
      }
    }

    if (!matchingHotel) {
      console.warn(`[Webhook:Booking.com] No matching hotel found for hotel_id: ${hotel_id}`);
      return NextResponse.json({ error: 'Hôtel non trouvé pour ce webhook' }, { status: 404 });
    }

    // Log the webhook event
    await db.otaSyncLog.create({
      data: {
        hotelId: matchingHotel.id,
        ota: 'booking_com',
        operation: 'WEBHOOK',
        status: 'success',
        payload: JSON.stringify({
          event_type,
          reservation_id,
          hotel_id,
          received_at: new Date().toISOString(),
          processing_time_ms: Date.now() - startTime,
        }),
      },
    });

    // Process the event
    switch (event_type) {
      case 'new_booking':
        await handleNewBooking(matchingHotel.id, body);
        break;

      case 'modification':
        await handleModification(matchingHotel.id, body);
        break;

      case 'cancellation':
        await handleCancellation(matchingHotel.id, body);
        break;

      case 'availability_change':
        await handleAvailabilityChange(matchingHotel.id, body);
        break;

      case 'rate_change':
        await handleRateChange(matchingHotel.id, body);
        break;

      default:
        console.warn(`[Webhook:Booking.com] Unknown event type: ${event_type}`);
    }

    // Booking.com expects a 200 OK to acknowledge receipt
    return NextResponse.json({
      received: true,
      processed: true,
      eventType,
      hotelId: matchingHotel.id,
      processingTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[Webhook:Booking.com] Error processing webhook:', error);
    return NextResponse.json({ error: 'Erreur webhook' }, { status: 500 });
  }
}

// ─── Event Handlers ───────────────────────────────────────────────────────

async function handleNewBooking(hotelId: string, data: Record<string, unknown>) {
  const reservationId = String(data.reservation_id || '');
  if (!reservationId) return;

  // Check if booking already exists
  const existing = await db.hotelBooking.findFirst({
    where: { bookingRef: reservationId },
  });

  if (existing) {
    console.log(`[Webhook:Booking.com] Booking ${reservationId} already exists, skipping`);
    return;
  }

  // Extract booking details from webhook data
  const roomDetails = data.room_details as Record<string, unknown> | undefined;
  const dateRange = data.date_range as Record<string, string> | undefined;
  const guestInfo = data.guest as Record<string, string> | undefined;
  const priceDetails = data.price_details as Record<string, unknown> | undefined;

  const roomTypeId = roomDetails?.room_id
    ? mapBookingComRoomType(String(roomDetails.room_id))
    : 'double';

  const checkIn = dateRange?.checkin || '';
  const checkOut = dateRange?.checkout || '';

  if (!checkIn || !checkOut) {
    console.error('[Webhook:Booking.com] Missing check-in/check-out dates');
    return;
  }

  // Check for overbooking across all channels
  const overbookingCheck = await checkOverbookingAcrossChannels(
    hotelId,
    roomTypeId,
    checkIn,
    checkOut
  );

  if (!overbookingCheck.safe) {
    console.error(
      `[Webhook:Booking.com] OVERBOOKING: Reservation ${reservationId} conflicts with existing bookings. ` +
      `Available: ${overbookingCheck.availableRooms}/${overbookingCheck.totalRooms}`
    );

    // TODO: In production, notify the hotel manager and/or reject the booking on Booking.com
    // For now, we still create the booking record but flag it

    await db.otaSyncLog.create({
      data: {
        hotelId,
        ota: 'booking_com',
        operation: 'WEBHOOK',
        status: 'failed',
        errorMessage: `Overbooking detected for reservation ${reservationId}`,
        payload: JSON.stringify({
          reservationId,
          overbookingCheck,
          action: 'flagged_for_review',
        }),
      },
    });
  }

  // Find the room
  const room = await db.hotelRoom.findFirst({
    where: { hotelId, type: roomTypeId },
  });

  const nightlyPrices = (priceDetails?.nightly_prices as number[]) || [];
  const totalAmount = (priceDetails?.total_price as number) ||
    nightlyPrices.reduce((sum, p) => sum + p, 0);
  const currency = (priceDetails?.currency as string) || 'XOF';

  // Create the booking record
  await db.hotelBooking.create({
    data: {
      bookingRef: reservationId,
      hotelId,
      roomId: room?.id,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests: 1,
      totalPrice: totalAmount,
      currency,
      sourceChannel: 'booking_com',
      status: 'confirmed',
      specialRequests: (data.remarks as string) || null,
      userId: 'system',
    },
  });

  console.log(`[Webhook:Booking.com] Created booking ${reservationId} for hotel ${hotelId}`);

  // Update availability across all channels
  // This is async — don't block the webhook response
  pushAvailabilityToAllChannels(hotelId, [
    {
      roomTypeId: room?.id || roomTypeId,
      date: checkIn,
      availableCount: overbookingCheck.availableRooms - 1,
    },
  ]).catch((error) => {
    console.error('[Webhook:Booking.com] Failed to push availability update:', error);
  });

  // TODO: Send confirmation email to guest
  // TODO: Send notification to hotel manager
}

async function handleModification(hotelId: string, data: Record<string, unknown>) {
  const reservationId = String(data.reservation_id || '');
  if (!reservationId) return;

  const existing = await db.hotelBooking.findFirst({
    where: { bookingRef: reservationId, hotelId },
  });

  if (!existing) {
    console.warn(`[Webhook:Booking.com] Modification for unknown booking ${reservationId}`);
    // Treat as a new booking
    await handleNewBooking(hotelId, data);
    return;
  }

  // Update the booking with new details
  const dateRange = data.date_range as Record<string, string> | undefined;
  const priceDetails = data.price_details as Record<string, unknown> | undefined;
  const nightlyPrices = (priceDetails?.nightly_prices as number[]) || [];
  const totalAmount = (priceDetails?.total_price as number) ||
    nightlyPrices.reduce((sum, p) => sum + p, 0);

  await db.hotelBooking.update({
    where: { id: existing.id },
    data: {
      checkIn: dateRange?.checkin ? new Date(dateRange.checkin) : undefined,
      checkOut: dateRange?.checkout ? new Date(dateRange.checkout) : undefined,
      totalPrice: totalAmount || undefined,
      specialRequests: (data.remarks as string) || existing.specialRequests,
    },
  });

  console.log(`[Webhook:Booking.com] Updated booking ${reservationId}`);

  // Update availability across channels
  pushAvailabilityToAllChannels(hotelId, []).catch((error) => {
    console.error('[Webhook:Booking.com] Failed to push availability update after modification:', error);
  });
}

async function handleCancellation(hotelId: string, data: Record<string, unknown>) {
  const reservationId = String(data.reservation_id || '');
  if (!reservationId) return;

  // Cancel the booking in the database
  const result = await db.hotelBooking.updateMany({
    where: {
      bookingRef: reservationId,
      hotelId,
      status: { in: ['confirmed', 'pending'] },
    },
    data: { status: 'cancelled' },
  });

  if (result.count > 0) {
    console.log(`[Webhook:Booking.com] Cancelled booking ${reservationId}`);

    // Update availability across all channels (room is now available again)
    pushAvailabilityToAllChannels(hotelId, []).catch((error) => {
      console.error('[Webhook:Booking.com] Failed to push availability update after cancellation:', error);
    });
  } else {
    console.warn(`[Webhook:Booking.com] No active booking found to cancel: ${reservationId}`);
  }
}

async function handleAvailabilityChange(hotelId: string, data: Record<string, unknown>) {
  // Booking.com is notifying us of an availability change
  // We should refresh our local availability data
  console.log(`[Webhook:Booking.com] Availability change notification for hotel ${hotelId}`);

  // Trigger a full sync for this hotel
  const dateRange = {
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  };

  // Don't await — run async
  import('@/lib/ota/channel-manager').then(({ syncAllProviders }) => {
    syncAllProviders(hotelId, dateRange).catch((error) => {
      console.error('[Webhook:Booking.com] Failed to sync after availability change:', error);
    });
  });
}

async function handleRateChange(hotelId: string, data: Record<string, unknown>) {
  // Booking.com is notifying us of a rate change
  // We should update our local rate data
  console.log(`[Webhook:Booking.com] Rate change notification for hotel ${hotelId}`);

  // Log the rate change for review
  await db.otaSyncLog.create({
    data: {
      hotelId,
      ota: 'booking_com',
      operation: 'WEBHOOK',
      status: 'success',
      payload: JSON.stringify({
        event_type: 'rate_change',
        data,
        note: 'Rate change from Booking.com — review for parity enforcement',
      }),
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function mapBookingComRoomType(roomId: string): string {
  const mapping: Record<string, string> = {
    '1': 'single',
    '2': 'double',
    '3': 'suite',
    '4': 'deluxe',
    '5': 'family',
    '6': 'studio',
    '7': 'penthouse',
  };
  return mapping[roomId] || 'double';
}
