// AfriBayit — API: Booking.com Webhook
// POST: Recevoir les notifications webhook de Booking.com

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Booking.com envoie des notifications pour:
    // - Nouvelle réservation
    // - Modification de réservation
    // - Annulation de réservation
    // - Modification de disponibilité

    const { hotel_id, reservation_id, event_type } = body;

    if (!hotel_id || !event_type) {
      return NextResponse.json({ error: 'Données webhook invalides' }, { status: 400 });
    }

    // Trouver l'hôtel correspondant
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
          // otaRefs invalides, ignorer
        }
      }
    }

    if (!matchingHotel) {
      return NextResponse.json({ error: 'Hôtel non trouvé pour ce webhook' }, { status: 404 });
    }

    // Logger l'événement webhook
    await db.otaSyncLog.create({
      data: {
        hotelId: matchingHotel.id,
        ota: 'booking_com',
        operation: 'PULL',
        status: 'success',
        payload: JSON.stringify({
          event_type,
          reservation_id,
          hotel_id,
          received_at: new Date().toISOString(),
        }),
      },
    });

    // Traiter l'événement selon le type
    switch (event_type) {
      case 'new_booking':
        // La réservation sera importée lors de la prochaine synchronisation
        break;
      case 'modification':
        // Mettre à jour la réservation existante
        break;
      case 'cancellation':
        // Annuler la réservation dans la base
        if (reservation_id) {
          await db.hotelBooking.updateMany({
            where: {
              bookingRef: String(reservation_id),
              hotelId: matchingHotel.id,
            },
            data: { status: 'cancelled' },
          });
        }
        break;
      default:
        break;
    }

    // Booking.com attend un 200 OK pour accuser réception
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Booking.com webhook error:', error);
    return NextResponse.json({ error: 'Erreur webhook' }, { status: 500 });
  }
}
