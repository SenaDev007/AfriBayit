// AfriBayit — API: Cancellation Refund
// POST: Calculer le remboursement d'annulation

import { NextResponse } from 'next/server';
import { calculateRefund, CANCELLATION_POLICIES, getDefaultPolicy } from '@/lib/cancellation';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, policyType } = body;

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId requis' }, { status: 400 });
    }

    // Obtenir la réservation
    const booking = await db.hotelBooking.findUnique({
      where: { id: bookingId },
      include: { hotel: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Réservation non trouvée' }, { status: 404 });
    }

    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'Cette réservation est déjà annulée' }, { status: 400 });
    }

    // Déterminer la politique d'annulation
    let effectivePolicyType = policyType;
    if (!effectivePolicyType) {
      // Utiliser la politique par défaut selon le type d'établissement
      effectivePolicyType = getDefaultPolicy(booking.hotel.connectionLevel);

      // Vérifier les politiques de l'hôtel
      if (booking.hotel.policies) {
        try {
          const policies = JSON.parse(booking.hotel.policies);
          if (policies.cancellationPolicy && CANCELLATION_POLICIES[policies.cancellationPolicy]) {
            effectivePolicyType = policies.cancellationPolicy;
          }
        } catch {
          // Policies invalides, utiliser la politique par défaut
        }
      }
    }

    // Calculer le remboursement
    const refund = calculateRefund(
      effectivePolicyType,
      booking.totalPrice,
      new Date(booking.checkIn),
      new Date()
    );

    return NextResponse.json({
      bookingId: booking.id,
      bookingRef: booking.bookingRef,
      totalPrice: booking.totalPrice,
      currency: booking.currency,
      policyType: effectivePolicyType,
      policy: refund.policy,
      refundAmount: refund.refundAmount,
      refundPct: refund.refundPct,
      reason: refund.reason,
      checkIn: booking.checkIn,
      cancellationDate: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cancellation refund error:', error);
    return NextResponse.json({ error: 'Erreur lors du calcul du remboursement' }, { status: 500 });
  }
}
