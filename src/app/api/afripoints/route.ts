// /api/afripoints — GET: solde + historique ; POST: gagner/dépenser

import { NextRequest, NextResponse } from 'next/server';
import { getPointsBalance, getPointsHistory, earnPoints, spendPoints } from '@/lib/afripoints';
import { getLevelForPoints, getNextLevel } from '@/lib/afripoints';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId est requis.' },
        { status: 400 }
      );
    }

    const [balance, history] = await Promise.all([
      getPointsBalance(userId),
      getPointsHistory(userId, { limit: 30 }),
    ]);

    const level = getLevelForPoints(balance);
    const nextLevel = getNextLevel(balance);

    return NextResponse.json({
      balance,
      level,
      nextLevel,
      history,
    });
  } catch (error) {
    console.error('Erreur récupération AfriPoints:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des AfriPoints.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, item, type, metadata, quantity } = body as {
      action?: string;
      userId: string;
      item?: string;
      type: 'earn' | 'spend';
      metadata?: Record<string, unknown>;
      quantity?: number;
    };

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'userId et type sont requis.' },
        { status: 400 }
      );
    }

    let result;

    if (type === 'earn') {
      if (!action) {
        return NextResponse.json(
          { error: 'action est requis pour gagner des points.' },
          { status: 400 }
        );
      }
      result = await earnPoints(userId, action, metadata);
    } else if (type === 'spend') {
      if (!item) {
        return NextResponse.json(
          { error: 'item est requis pour dépenser des points.' },
          { status: 400 }
        );
      }
      result = await spendPoints(userId, item, quantity);
    } else {
      return NextResponse.json(
        { error: 'type doit être "earn" ou "spend".' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      points: result.points,
      newBalance: result.newBalance,
      level: getLevelForPoints(result.newBalance),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'opération AfriPoints.';
    console.error('Erreur AfriPoints:', error);
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
