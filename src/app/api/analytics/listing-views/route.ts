import { NextRequest, NextResponse } from 'next/server';
import { getUserListingViewStats } from '@/lib/analytics/listing-views';
import { authGuard } from '@/lib/auth-guard';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const isSuperAdmin = auth.role === 'SUPER_ADMIN';
    const userId = isSuperAdmin && requestedUserId ? requestedUserId : auth.userId;
    const requestedListingIds = searchParams.get('listingIds')?.split(',').filter(Boolean) || [];
    let effectiveListingIds = requestedListingIds;
    const ownListings = await db.property.findMany({ where: { agentId: userId }, select: { id: true } }).catch(() => []);
    const ownListingIds = ownListings.map((p) => p.id);
    if (effectiveListingIds.length === 0) effectiveListingIds = ownListingIds;
    else if (!isSuperAdmin) { const s = new Set(ownListingIds); effectiveListingIds = effectiveListingIds.filter((id) => s.has(id)); }
    const stats = getUserListingViewStats(effectiveListingIds);
    return NextResponse.json({ userId, ...stats });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erreur' }, { status: 500 });
  }
}
