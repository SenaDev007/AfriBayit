import { NextRequest, NextResponse } from 'next/server';
import { getPointsBalance, getPointsHistory, earnPoints, spendPoints } from '@/lib/afripoints';
import { getLevelForPoints, getNextLevel } from '@/lib/afripoints';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;
    const requestedUserId = request.nextUrl.searchParams.get('userId');
    const isSuperAdmin = auth.role === 'SUPER_ADMIN';
    const userId = isSuperAdmin && requestedUserId ? requestedUserId : auth.userId;
    const [balance, history] = await Promise.all([getPointsBalance(userId), getPointsHistory(userId, { limit: 30 })]);
    return NextResponse.json({ userId, balance, level: getLevelForPoints(balance), nextLevel: getNextLevel(balance), history });
  } catch (error) { console.error('Erreur AfriPoints:', error); return NextResponse.json({ error: 'Erreur' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;
    const body = await request.json();
    const { action, item, type, metadata, quantity, userId: bodyUserId } = body as { action?: string; item?: string; type: 'earn' | 'spend'; metadata?: Record<string, unknown>; quantity?: number; userId?: string };
    if (!type) return NextResponse.json({ error: 'type requis' }, { status: 400 });
    const isSuperAdmin = auth.role === 'SUPER_ADMIN';
    const userId = isSuperAdmin && bodyUserId ? bodyUserId : auth.userId;
    let result;
    if (type === 'earn') { if (!action) return NextResponse.json({ error: 'action requis' }, { status: 400 }); result = await earnPoints(userId, action, metadata); }
    else if (type === 'spend') { if (!item) return NextResponse.json({ error: 'item requis' }, { status: 400 }); result = await spendPoints(userId, item, quantity); }
    else return NextResponse.json({ error: 'type invalide' }, { status: 400 });
    return NextResponse.json({ success: true, userId, points: result.points, newBalance: result.newBalance, level: getLevelForPoints(result.newBalance) });
  } catch (error) { console.error('Erreur AfriPoints:', error); return NextResponse.json({ error: 'Erreur' }, { status: 400 }); }
}
