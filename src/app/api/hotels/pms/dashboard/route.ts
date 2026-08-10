// AfriBayit — API: PMS Dashboard
// GET: Données du tableau de bord PMS

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');

    if (!hotelId) {
      return NextResponse.json({ error: 'hotelId requis' }, { status: 400 });
    }

    const hotel = await db.hotel.findUnique({
      where: { id: hotelId },
      include: {
        rooms: { include: { channelItems: true } },
        bookings: true,
        reviews_hotel: { take: 10, orderBy: { createdAt: 'desc' } },
        otaSyncLogs: { take: 20, orderBy: { executedAt: 'desc' } },
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: 'Hôtel non trouvé' }, { status: 404 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Arrivées du jour
    const arrivals = hotel.bookings.filter(
      (b) => new Date(b.checkIn).toDateString() === today.toDateString() && b.status !== 'cancelled'
    );

    // Départs du jour
    const departures = hotel.bookings.filter(
      (b) => new Date(b.checkOut).toDateString() === today.toDateString() && b.status !== 'cancelled'
    );

    // Chambres occupées
    const occupiedRooms = hotel.bookings.filter(
      (b) =>
        new Date(b.checkIn) <= today &&
        new Date(b.checkOut) > today &&
        b.status !== 'cancelled'
    ).length;

    // Total chambres
    const totalRooms = hotel.rooms.reduce((sum, r) => sum + r.totalRooms, 0);

    // Taux d'occupation
    const occupancyRate = totalRooms > 0 ? occupiedRooms / totalRooms : 0;

    // Revenu du jour
    const todayRevenue = hotel.bookings
      .filter((b) => {
        const checkIn = new Date(b.checkIn);
        return (
          checkIn.toDateString() === today.toDateString() &&
          b.status !== 'cancelled'
        );
      })
      .reduce((sum, b) => sum + b.totalPrice, 0);

    // Revenu du mois
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthRevenue = hotel.bookings
      .filter((b) => new Date(b.checkIn) >= monthStart && b.status !== 'cancelled')
      .reduce((sum, b) => sum + b.totalPrice, 0);

    // Statistiques par canal
    const channelStats: Record<string, { bookings: number; revenue: number }> = {};
    for (const booking of hotel.bookings) {
      if (booking.status === 'cancelled') continue;
      if (!channelStats[booking.sourceChannel]) {
        channelStats[booking.sourceChannel] = { bookings: 0, revenue: 0 };
      }
      channelStats[booking.sourceChannel].bookings++;
      channelStats[booking.sourceChannel].revenue += booking.totalPrice;
    }

    // Alertes
    const alerts: { type: string; message: string; severity: 'info' | 'warning' | 'error' }[] = [];

    // Surbooking potentiel
    if (occupancyRate > 0.95) {
      alerts.push({
        type: 'overbooking_risk',
        message: 'Risque de surbooking détecté',
        severity: 'error',
      });
    }

    // Réservations en attente
    const pendingBookings = hotel.bookings.filter((b) => b.status === 'pending').length;
    if (pendingBookings > 0) {
      alerts.push({
        type: 'pending_bookings',
        message: `${pendingBookings} réservation(s) en attente de confirmation`,
        severity: 'warning',
      });
    }

    // Erreurs de synchronisation récentes
    const recentErrors = hotel.otaSyncLogs.filter(
      (log) => log.status === 'failed' && new Date(log.executedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    if (recentErrors.length > 0) {
      alerts.push({
        type: 'sync_error',
        message: `${recentErrors.length} erreur(s) de synchronisation OTA dans les dernières 24h`,
        severity: 'warning',
      });
    }

    // RevPAR et ADR
    const daysThisMonth = Math.max(1, Math.ceil((today.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)));
    const roomsSoldThisMonth = hotel.bookings.filter(
      (b) => new Date(b.checkIn) >= monthStart && b.status !== 'cancelled'
    ).length;
    const adr = roomsSoldThisMonth > 0 ? monthRevenue / roomsSoldThisMonth : 0;
    const revPAR = totalRooms > 0 ? monthRevenue / (totalRooms * daysThisMonth) : 0;

    return NextResponse.json({
      hotel: {
        id: hotel.id,
        name: hotel.name,
        stars: hotel.stars,
        country: hotel.country,
        city: hotel.city,
      },
      today: {
        date: today.toISOString().split('T')[0],
        arrivals: arrivals.map((a) => ({
          id: a.id,
          guestName: '***',
          checkIn: a.checkIn,
          checkOut: a.checkOut,
          sourceChannel: a.sourceChannel,
          status: a.status,
        })),
        departures: departures.map((d) => ({
          id: d.id,
          guestName: '***',
          checkOut: d.checkOut,
          sourceChannel: d.sourceChannel,
          status: d.status,
        })),
        arrivalCount: arrivals.length,
        departureCount: departures.length,
      },
      occupancy: {
        totalRooms,
        occupiedRooms,
        availableRooms: totalRooms - occupiedRooms,
        occupancyRate: Math.round(occupancyRate * 100),
      },
      revenue: {
        today: todayRevenue,
        thisMonth: monthRevenue,
        adr: Math.round(adr),
        revPAR: Math.round(revPAR),
        currency: hotel.currency,
      },
      channels: channelStats,
      alerts,
      rooms: hotel.rooms.map((r) => ({
        id: r.id,
        type: r.type,
        name: r.name,
        totalRooms: r.totalRooms,
        basePrice: r.basePriceXof,
        available: r.available,
      })),
      recentSyncLogs: hotel.otaSyncLogs.slice(0, 10),
    });
  } catch (error) {
    console.error('PMS Dashboard error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement du tableau de bord PMS' },
      { status: 500 }
    );
  }
}
