// AfriBayit — API: PMS Rates
// GET: Gestion des tarifs / PUT: Mettre à jour les tarifs

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const roomTypeId = searchParams.get('roomTypeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!hotelId) {
      return NextResponse.json({ error: 'hotelId requis' }, { status: 400 });
    }

    // Obtenir les chambres avec leurs tarifs de base
    const rooms = await db.hotelRoom.findMany({
      where: { hotelId, ...(roomTypeId ? { type: roomTypeId } : {}) },
      include: {
        availability: {
          where: {
            date: {
              gte: startDate ? new Date(startDate) : new Date(),
              lte: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
          },
          orderBy: { date: 'asc' },
        },
        channelItems: true,
      },
    });

    const rates = rooms.map((room) => ({
      roomId: room.id,
      roomType: room.type,
      name: room.name,
      basePrice: room.basePriceXof,
      currency: room.currency,
      overrides: room.availability.map((a) => ({
        date: a.date,
        priceOverride: a.priceOverride,
        status: a.status,
        effectiveRate: a.priceOverride || room.basePriceXof,
      })),
      channelRates: room.channelItems.map((ci) => ({
        ota: ci.ota,
        rateXof: ci.rateXof,
        rateEur: ci.rateEur,
        lastSyncedAt: ci.lastSyncedAt,
      })),
    }));

    return NextResponse.json({ rates });
  } catch (error) {
    console.error('PMS Rates GET error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des tarifs' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { hotelId, rates } = body;

    if (!hotelId || !rates || !Array.isArray(rates)) {
      return NextResponse.json({ error: 'hotelId et rates[] requis' }, { status: 400 });
    }

    const results = [];

    for (const rate of rates) {
      const { roomId, date, priceOverride, channelRates } = rate;

      // Mettre à jour le prix pour une date spécifique
      if (roomId && date && priceOverride !== undefined) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const result = await db.roomAvailability.upsert({
          where: {
            roomId_date: { roomId, date: targetDate },
          },
          create: {
            roomId,
            date: targetDate,
            priceOverride,
            currency: 'XOF',
            source: 'manual',
          },
          update: {
            priceOverride,
          },
        });
        results.push({ roomId, date, updated: true, id: result.id });
      }

      // Mettre à jour les tarifs par canal
      if (roomId && channelRates && Array.isArray(channelRates)) {
        for (const channelRate of channelRates) {
          const { ota, rateXof, rateEur } = channelRate;

          const existing = await db.channelInventory.findFirst({
            where: { roomId, ota },
          });

          if (existing) {
            await db.channelInventory.update({
              where: { id: existing.id },
              data: { rateXof, rateEur, lastSyncedAt: new Date() },
            });
          } else {
            await db.channelInventory.create({
              data: {
                roomId,
                hotelId,
                ota,
                rateXof,
                rateEur,
                lastSyncedAt: new Date(),
              },
            });
          }
          results.push({ roomId, ota, rateXof, updated: true });
        }
      }

      // Mettre à jour le prix de base de la chambre
      if (roomId && rate.basePrice !== undefined) {
        await db.hotelRoom.update({
          where: { id: roomId },
          data: { basePriceXof: rate.basePrice },
        });
        results.push({ roomId, basePriceUpdated: true });
      }
    }

    return NextResponse.json({ success: true, updated: results.length, results });
  } catch (error) {
    console.error('PMS Rates PUT error:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour des tarifs' }, { status: 500 });
  }
}
