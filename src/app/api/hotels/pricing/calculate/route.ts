// AfriBayit — API: Dynamic Pricing Calculate
// POST: Calculer le prix dynamique

import { NextResponse } from 'next/server';
import { calculateDynamicPrice, getPricingBreakdown, getSeasonalMultiplier, isPeakSeason, isLowSeason } from '@/lib/pricing';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      hotelId,
      roomType,
      basePrice: inputBasePrice,
      checkIn,
      checkOut,
      country,
      includeBreakdown = false,
    } = body;

    if (!inputBasePrice || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'basePrice, checkIn et checkOut sont requis' },
        { status: 400 }
      );
    }

    // Obtenir le prix de base depuis la DB si hotelId est fourni
    let basePrice = inputBasePrice;
    let hotelCountry = country || 'BJ';

    if (hotelId) {
      const room = await db.hotelRoom.findFirst({
        where: { hotelId, ...(roomType ? { type: roomType } : {}) },
      });

      if (room) {
        basePrice = room.basePriceXof;
      }

      const hotel = await db.hotel.findUnique({ where: { id: hotelId } });
      if (hotel) {
        hotelCountry = hotel.country;
      }
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const now = new Date();

    // Calculer les paramètres dynamiques
    const daysUntilCheckIn = Math.max(0, Math.floor(
      (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ));
    const lengthOfStay = Math.max(1, Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    ));

    // Calculer le taux d'occupation
    let occupancyRate = 0.5; // Valeur par défaut
    if (hotelId) {
      const totalRooms = await db.hotelRoom.aggregate({
        where: { hotelId },
        _sum: { totalRooms: true },
      });

      const bookedRooms = await db.hotelBooking.count({
        where: {
          hotelId,
          status: { in: ['confirmed', 'checked_in'] },
          checkIn: { lte: checkInDate },
          checkOut: { gt: checkInDate },
        },
      });

      occupancyRate = (totalRooms._sum.totalRooms || 1) > 0
        ? bookedRooms / (totalRooms._sum.totalRooms || 1)
        : 0;
    }

    // Déterminer la saison
    const peak = isPeakSeason(checkInDate, hotelCountry);
    const low = isLowSeason(checkInDate, hotelCountry);
    const seasonalMultiplier = getSeasonalMultiplier(checkInDate, hotelCountry);

    const params = {
      occupancyRate,
      isPeakSeason: peak,
      isLowSeason: low,
      daysUntilCheckIn,
      lengthOfStay,
      dayOfWeek: checkInDate.getDay(),
      hasLocalEvent: false, // Pas de détection d'événements locaux pour l'instant
    };

    const dynamicPrice = calculateDynamicPrice(basePrice, params);

    const result: Record<string, unknown> = {
      basePrice,
      dynamicPrice,
      currency: 'XOF',
      seasonalMultiplier,
      season: peak ? 'haute' : low ? 'basse' : 'intermédiaire',
      params: {
        occupancyRate: Math.round(occupancyRate * 100),
        daysUntilCheckIn,
        lengthOfStay,
        isWeekend: params.dayOfWeek === 0 || params.dayOfWeek === 5 || params.dayOfWeek === 6,
      },
    };

    if (includeBreakdown) {
      result.breakdown = getPricingBreakdown(basePrice, params);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Dynamic pricing calculate error:', error);
    return NextResponse.json({ error: 'Erreur lors du calcul du prix dynamique' }, { status: 500 });
  }
}
