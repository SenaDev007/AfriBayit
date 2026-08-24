// GET /api/analytics/me — User analytics (CDC §5.9)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30j';
    const days = period === '7j' ? 7 : period === '90j' ? 90 : period === '12m' ? 365 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Try to aggregate from analytics events, fall back to zeros
    let profileViews = { total: 0, direct: 0, search: 0, referral: 0, evolution: 0 };
    let connections = 0;
    let likes = 0;
    let comments = 0;

    try {
      const views = await (db as any).analyticsEvent?.groupBy?.({
        by: ['source'],
        where: { userId, eventType: 'profile_view', createdAt: { gte: since } },
        _count: true,
      }) ?? [];
      profileViews.total = views.reduce((s: number, p: any) => s + p._count, 0);
      profileViews.direct = views.find((p: any) => p.source === 'direct')?._count || 0;
      profileViews.search = views.find((p: any) => p.source === 'search')?._count || 0;
      profileViews.referral = views.find((p: any) => p.source === 'referral')?._count || 0;
    } catch {}

    try {
      connections = await (db as any).connection?.count?.({
        where: { OR: [{ userId }, { connectedToId: userId }], createdAt: { gte: since } },
      }) ?? 0;
    } catch {}

    try {
      likes = await (db as any).like?.count?.({
        where: { post: { authorId: userId }, createdAt: { gte: since } },
      }) ?? 0;
      comments = await (db as any).comment?.count?.({
        where: { post: { authorId: userId }, createdAt: { gte: since } },
      }) ?? 0;
    } catch {}

    // Profile completeness
    const user = await db.user.findUnique({ where: { id: userId } });
    const missing: string[] = [];
    if (!user?.avatar) missing.push('Photo de profil');
    if (!user?.bio) missing.push('Bio');
    if (!user?.phone) missing.push('Téléphone');
    if (!user?.city) missing.push('Ville');
    const pct = Math.round(((4 - missing.length) / 4) * 100);

    return NextResponse.json({
      profileViews: { [period]: profileViews },
      searchAppearances: { [period]: [] },
      connectionsGrowth: { [period]: { connections, followers: 0, connGrowth: 0, followGrowth: 0 } },
      contentEngagement: { [period]: { likes, comments, shares: 0, saves: 0 } },
      profileCompleteness: { pct, missing },
    });
  } catch (error) {
    console.error('[analytics/me] Error:', error);
    return NextResponse.json({});
  }
}
