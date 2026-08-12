// GET /api/afripoints/leaderboard — Classement AfriPoints

import { NextRequest, NextResponse } from 'next/server';
import { getPointsLeaderboard } from '@/lib/afripoints';
import { getLevelForPoints } from '@/lib/afripoints';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const leaderboard = await getPointsLeaderboard({ country, limit });

    const enriched = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
      level: getLevelForPoints(entry.points),
    }));

    return NextResponse.json({ leaderboard: enriched });
  } catch (error) {
    console.error('Erreur leaderboard:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du classement.' },
      { status: 500 }
    );
  }
}
