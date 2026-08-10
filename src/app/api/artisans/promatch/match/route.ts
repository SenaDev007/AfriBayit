// POST /api/artisans/promatch/match — IA artisan matching (CDC §5.5.2)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { trade, city, country, budget } = await request.json();

    const where: any = { certified: true };
    if (trade) where.trade = { contains: trade, mode: 'insensitive' };
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (country) where.country = country;

    let artisans: any[] = [];
    try {
      artisans = await (db as any).artisan.findMany({
        where, include: { user: { select: { name: true, avatar: true } } }, take: 50,
      }) ?? [];
    } catch {}

    const scored = artisans.map(a => {
      const ratingScore = (a.rating || 0) / 5 * 40;
      const missionScore = Math.min((a.completedMissions || 0) / 50, 1) * 30;
      const responseScore = Math.max(0, 1 - (a.avgResponseTime || 60) / 120) * 15;
      const certScore = a.certificationLevel === 'elite' ? 15 : 10;
      return { artisanId: a.id, score: Math.round(ratingScore + missionScore + responseScore + certScore), reason: `Note ${a.rating}★, ${a.completedMissions} missions` };
    }).sort((a, b) => b.score - a.score).slice(0, 10);

    return NextResponse.json({ matches: scored });
  } catch { return NextResponse.json({ matches: [] }); }
}
