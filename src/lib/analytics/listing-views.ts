/**
 * AfriBayit — Listing Views Analytics (audit-11 — now persisted to DB)
 * CDC §5.9.1: Track profile/listing views with visitor metadata.
 *
 * Previously this module used an in-memory array (lost on every serverless
 * cold start). Now backed by the PropertyView Prisma model with proper
 * PostgreSQL persistence.
 */

import { db } from '@/lib/db';

export interface ListingViewEvent {
  id: string;
  listingId: string;
  viewerId?: string;
  isAnonymous: boolean;
  source: 'search' | 'direct' | 'social' | 'email' | 'notification' | 'other';
  country?: string;
  city?: string;
  device: 'mobile' | 'desktop' | 'tablet';
  viewedAt: string;
}

export interface ListingViewStats {
  listingId: string;
  totalViews: number;
  uniqueViews: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  bySource: Record<string, number>;
  byDevice: Record<string, number>;
  byCountry: Record<string, number>;
  dailyViews: { date: string; views: number }[];
}

/**
 * Record a listing view — persists to the property_views table.
 */
export async function recordListingView(event: Omit<ListingViewEvent, 'id' | 'viewedAt'>): Promise<ListingViewEvent> {
  try {
    const view = await db.propertyView.create({
      data: {
        propertyId: event.listingId,
        viewerId: event.viewerId || null,
        isAnonymous: event.isAnonymous,
        source: event.source,
        country: event.country || null,
        city: event.city || null,
        device: event.device,
      },
    });

    return {
      id: view.id,
      listingId: view.propertyId,
      viewerId: view.viewerId || undefined,
      isAnonymous: view.isAnonymous,
      source: view.source as ListingViewEvent['source'],
      country: view.country || undefined,
      city: view.city || undefined,
      device: view.device as ListingViewEvent['device'],
      viewedAt: view.viewedAt.toISOString(),
    };
  } catch (error) {
    console.error('[ListingViews] Failed to record view:', error);
    // Return a dummy event so the caller doesn't crash
    return {
      ...event,
      id: `view-${Date.now()}`,
      viewedAt: new Date().toISOString(),
    };
  }
}

/**
 * Get view statistics for a listing — reads from the property_views table.
 */
export async function getListingViewStats(listingId: string): Promise<ListingViewStats> {
  try {
    const now = new Date();
    const today = now.toISOString().substring(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all views for this listing (within last 30 days for performance)
    const views = await db.propertyView.findMany({
      where: {
        propertyId: listingId,
        viewedAt: { gte: monthAgo },
      },
      select: {
        viewerId: true,
        source: true,
        device: true,
        country: true,
        viewedAt: true,
      },
    }).catch(() => []);

    // Also get total count (all-time)
    const totalCount = await db.propertyView.count({
      where: { propertyId: listingId },
    }).catch(() => 0);

    // Calculate stats
    const uniqueViewers = new Set(views.map(v => v.viewerId || v.id || 'anon'));
    const viewsToday = views.filter(v => v.viewedAt.toISOString().substring(0, 10) === today).length;
    const viewsThisWeek = views.filter(v => v.viewedAt >= weekAgo).length;
    const viewsThisMonth = views.length;

    const bySource: Record<string, number> = {};
    const byDevice: Record<string, number> = {};
    const byCountry: Record<string, number> = {};
    const dailyViews: Record<string, number> = {};

    for (const v of views) {
      bySource[v.source] = (bySource[v.source] || 0) + 1;
      byDevice[v.device] = (byDevice[v.device] || 0) + 1;
      if (v.country) byCountry[v.country] = (byCountry[v.country] || 0) + 1;
      const date = v.viewedAt.toISOString().substring(0, 10);
      dailyViews[date] = (dailyViews[date] || 0) + 1;
    }

    return {
      listingId,
      totalViews: totalCount,
      uniqueViews: uniqueViewers.size,
      viewsToday,
      viewsThisWeek,
      viewsThisMonth,
      bySource,
      byDevice,
      byCountry,
      dailyViews: Object.entries(dailyViews)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, views]) => ({ date, views })),
    };
  } catch (error) {
    console.error('[ListingViews] Failed to get stats:', error);
    return {
      listingId,
      totalViews: 0,
      uniqueViews: 0,
      viewsToday: 0,
      viewsThisWeek: 0,
      viewsThisMonth: 0,
      bySource: {},
      byDevice: {},
      byCountry: {},
      dailyViews: [],
    };
  }
}

/**
 * Get aggregate view stats for all listings of a user — reads from DB.
 */
export async function getUserListingViewStats(userListingIds: string[]): Promise<{
  totalViews: number;
  totalUnique: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  topListings: { listingId: string; views: number }[];
}> {
  if (userListingIds.length === 0) {
    return {
      totalViews: 0,
      totalUnique: 0,
      viewsToday: 0,
      viewsThisWeek: 0,
      viewsThisMonth: 0,
      topListings: [],
    };
  }

  try {
    const now = new Date();
    const today = now.toISOString().substring(0, 10);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get counts per listing
    const listingsWithCounts = await db.propertyView.groupBy({
      by: ['propertyId'],
      where: {
        propertyId: { in: userListingIds },
      },
      _count: { id: true },
    }).catch(() => []);

    const topListings = listingsWithCounts
      .map(item => ({ listingId: item.propertyId, views: item._count.id }))
      .sort((a, b) => b.views - a.views);

    // Get aggregate stats for the last 30 days
    const recentViews = await db.propertyView.findMany({
      where: {
        propertyId: { in: userListingIds },
        viewedAt: { gte: monthAgo },
      },
      select: { viewerId: true, viewedAt: true, id: true },
    }).catch(() => []);

    const uniqueViewers = new Set(recentViews.map(v => v.viewerId || v.id));
    const viewsToday = recentViews.filter(v => v.viewedAt.toISOString().substring(0, 10) === today).length;
    const viewsThisWeek = recentViews.filter(v => v.viewedAt >= weekAgo).length;

    return {
      totalViews: topListings.reduce((sum, l) => sum + l.views, 0),
      totalUnique: uniqueViewers.size,
      viewsToday,
      viewsThisWeek,
      viewsThisMonth: recentViews.length,
      topListings,
    };
  } catch (error) {
    console.error('[ListingViews] Failed to get user stats:', error);
    return {
      totalViews: 0,
      totalUnique: 0,
      viewsToday: 0,
      viewsThisWeek: 0,
      viewsThisMonth: 0,
      topListings: [],
    };
  }
}
