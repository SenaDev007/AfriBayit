// AfriBayit — API: PMS Rooms
// GET: Inventaire des chambres / PATCH: Mettre à jour le statut d'une chambre

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');

    if (!hotelId) {
      return NextResponse.json({ error: 'hotelId requis' }, { status: 400 });
    }

    const rooms = await db.hotelRoom.findMany({
      where: { hotelId },
      include: {
        availability: {
          where: {
            date: { gte: new Date() },
          },
          orderBy: { date: 'asc' },
          take: 30,
        },
        channelItems: true,
      },
    });

    // Statut actuel de chaque chambre
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const roomsWithStatus = await Promise.all(
      rooms.map(async (room) => {
        // Vérifier si la chambre est réservée aujourd'hui
        const currentBooking = await db.hotelBooking.findFirst({
          where: {
            hotelId,
            roomId: room.id,
            status: { in: ['confirmed', 'checked_in'] },
            checkIn: { lte: today },
            checkOut: { gt: today },
          },
        });

        // Vérifier le statut dans RoomAvailability
        const todayAvailability = await db.roomAvailability.findFirst({
          where: {
            roomId: room.id,
            date: today,
          },
        });

        let status: string = 'available';
        if (todayAvailability?.status === 'MAINTENANCE') {
          status = 'maintenance';
        } else if (todayAvailability?.status === 'BLOCKED') {
          status = 'out_of_order';
        } else if (currentBooking) {
          status = 'occupied';
        }

        return {
          id: room.id,
          type: room.type,
          name: room.name,
          capacity: room.capacity,
          totalRooms: room.totalRooms,
          basePrice: room.basePriceXof,
          currency: room.currency,
          available: room.available,
          status,
          currentBooking: currentBooking
            ? {
                id: currentBooking.id,
                bookingRef: currentBooking.bookingRef,
                checkIn: currentBooking.checkIn,
                checkOut: currentBooking.checkOut,
                sourceChannel: currentBooking.sourceChannel,
              }
            : null,
          upcomingAvailability: room.availability.slice(0, 14),
          channels: room.channelItems.map((ci) => ({
            ota: ci.ota,
            availableCount: ci.availableCount,
            rateXof: ci.rateXof,
            lastSyncedAt: ci.lastSyncedAt,
          })),
        };
      })
    );

    return NextResponse.json({ rooms: roomsWithStatus });
  } catch (error) {
    console.error('PMS Rooms error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des chambres' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { roomId, status, hotelId, date, priceOverride } = body;

    if (!roomId || !hotelId) {
      return NextResponse.json({ error: 'roomId et hotelId requis' }, { status: 400 });
    }

    // Mettre à jour le statut de la chambre
    if (status) {
      const validStatuses = ['AVAILABLE', 'BOOKED', 'BLOCKED', 'MAINTENANCE'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `Statut invalide. Valid: ${validStatuses.join(', ')}` }, { status: 400 });
      }

      const targetDate = date ? new Date(date) : new Date();
      targetDate.setHours(0, 0, 0, 0);

      await db.roomAvailability.upsert({
        where: {
          roomId_date: { roomId, date: targetDate },
        },
        create: {
          roomId,
          date: targetDate,
          status,
          priceOverride: priceOverride || null,
          source: 'manual',
        },
        update: {
          status,
          priceOverride: priceOverride || null,
          source: 'manual',
        },
      });
    }

    // Mettre à jour la disponibilité globale de la chambre
    if (typeof body.available === 'boolean') {
      await db.hotelRoom.update({
        where: { id: roomId },
        data: { available: body.available },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PMS Rooms PATCH error:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la chambre' }, { status: 500 });
  }
}
