/**
 * AfriBayit — Listing Views Analytics
 * Track profile/listing views with visitor metadata
 */

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

// In-memory store
const viewEvents: ListingViewEvent[] = [];

/**
 * Record a listing view
 */
export function recordListingView(event: Omit<ListingViewEvent, 'id' | 'viewedAt'>): ListingViewEvent {
  const view: ListingViewEvent = {
    ...event,
    id: `view-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    viewedAt: new Date().toISOString(),
  };
  viewEvents.push(view);
  return view;
}

/**
 * Get view statistics for a listing
 */
export function getListingViewStats(listingId: string): ListingViewStats {
  const listingViews = viewEvents.filter(v => v.listingId === listingId);
  const now = new Date();
  const today = now.toISOString().substring(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const uniqueViewers = new Set(listingViews.map(v => v.viewerId || v.id));
  const viewsToday = listingViews.filter(v => v.viewedAt.substring(0, 10) === today).length;
  const viewsThisWeek = listingViews.filter(v => new Date(v.viewedAt) >= weekAgo).length;
  const viewsThisMonth = listingViews.filter(v => new Date(v.viewedAt) >= monthAgo).length;

  const bySource: Record<string, number> = {};
  const byDevice: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  const dailyViews: Record<string, number> = {};

  for (const v of listingViews) {
    bySource[v.source] = (bySource[v.source] || 0) + 1;
    byDevice[v.device] = (byDevice[v.device] || 0) + 1;
    if (v.country) byCountry[v.country] = (byCountry[v.country] || 0) + 1;
    const date = v.viewedAt.substring(0, 10);
    dailyViews[date] = (dailyViews[date] || 0) + 1;
  }

  return {
    listingId,
    totalViews: listingViews.length,
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
}

/**
 * Get aggregate view stats for all listings of a user
 */
export function getUserListingViewStats(userListingIds: string[]): {
  totalViews: number;
  totalUnique: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  topListings: { listingId: string; views: number }[];
} {
  let totalViews = 0;
  let totalUnique = 0;
  let viewsToday = 0;
  let viewsThisWeek = 0;
  let viewsThisMonth = 0;
  const listingViewCounts: { listingId: string; views: number }[] = [];

  const now = new Date();
  const today = now.toISOString().substring(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const id of userListingIds) {
    const stats = getListingViewStats(id);
    totalViews += stats.totalViews;
    totalUnique += stats.uniqueViews;
    viewsToday += stats.viewsToday;
    viewsThisWeek += stats.viewsThisWeek;
    viewsThisMonth += stats.viewsThisMonth;
    listingViewCounts.push({ listingId: id, views: stats.totalViews });
  }

  return {
    totalViews,
    totalUnique,
    viewsToday,
    viewsThisWeek,
    viewsThisMonth,
    topListings: listingViewCounts.sort((a, b) => b.views - a.views),
  };
}
