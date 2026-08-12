import { NextRequest, NextResponse } from 'next/server';
import { getUserListingViewStats } from '@/lib/analytics/listing-views';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const listingIds = searchParams.get('listingIds')?.split(',') || [];

    if (!userId) {
      return NextResponse.json({ error: 'userId est requis' }, { status: 400 });
    }

    // In production, would fetch user's listing IDs from database
    const effectiveListingIds = listingIds.length > 0 ? listingIds : ['demo-listing-1', 'demo-listing-2', 'demo-listing-3'];

    const stats = getUserListingViewStats(effectiveListingIds);

    return NextResponse.json({
      userId,
      ...stats,
      // Add demo data if empty
      ...(stats.totalViews === 0 && {
        totalViews: 342,
        totalUnique: 218,
        viewsToday: 12,
        viewsThisWeek: 87,
        viewsThisMonth: 342,
        topListings: [
          { listingId: 'demo-listing-1', views: 156 },
          { listingId: 'demo-listing-2', views: 112 },
          { listingId: 'demo-listing-3', views: 74 },
        ],
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
