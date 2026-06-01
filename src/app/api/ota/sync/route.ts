// AfriBayit — API: OTA Sync
// POST: Déclencher une synchronisation OTA pour un hôtel

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { syncAllProviders } from '@/lib/ota/channel-manager';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hotelId, startDate, endDate } = body;

    if (!hotelId) {
      return NextResponse.json({ error: 'hotelId requis' }, { status: 400 });
    }

    // Vérifier que l'hôtel existe
    const hotel = await db.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) {
      return NextResponse.json({ error: 'Hôtel non trouvé' }, { status: 404 });
    }

    // Période de synchronisation (par défaut: 30 prochains jours)
    const now = new Date();
    const defaultEnd = new Date(now);
    defaultEnd.setDate(defaultEnd.getDate() + 30);

    const dateRange = {
      start: startDate || now.toISOString().split('T')[0],
      end: endDate || defaultEnd.toISOString().split('T')[0],
    };

    // Lancer la synchronisation
    const results = await syncAllProviders(hotelId, dateRange);

    return NextResponse.json({
      hotelId,
      dateRange,
      results,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('OTA Sync error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la synchronisation OTA' },
      { status: 500 }
    );
  }
}
