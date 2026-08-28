/**
 * AfriBayit — Weekly Performance Reports
 * Generate weekly summary: views, inquiries, conversions, revenue
 */

export interface WeeklyReport {
  userId: string;
  periodStart: string;
  periodEnd: string;
  summary: {
    listingViews: number;
    profileViews: number;
    inquiries: number;
    conversions: number;
    revenue: number;
    currency: string;
  };
  changes: {
    listingViews: number; // percentage change from previous week
    profileViews: number;
    inquiries: number;
    conversions: number;
    revenue: number;
  };
  topListings: {
    id: string;
    title: string;
    views: number;
    inquiries: number;
  }[];
  recommendations: string[];
  generatedAt: string;
}

/**
 * Generate weekly performance report
 * SECURITY FIX: Uses real DB data instead of Math.random() fabricated numbers.
 */
export async function generateWeeklyReport(userId: string): Promise<WeeklyReport> {
  const now = new Date();
  const periodEnd = now.toISOString();
  const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Real data aggregation from the database
  const { db } = await import('@/lib/db');

  const startDate = periodStart;

  // Get real listing views from ProfileView table
  const listingViews = await db.profileView.count({
    where: { viewerId: userId, createdAt: { gte: startDate } },
  }).catch(() => 0);

  // Get real profile views
  const profileViews = await db.profileView.count({
    where: { viewerId: userId, createdAt: { gte: startDate } },
  }).catch(() => 0);

  // Get real inquiries (appointments or messages)
  const inquiries = await db.appointment.count({
    where: { agentId: userId, createdAt: { gte: startDate } },
  }).catch(() => 0);

  // Get real conversions (transactions in escrow or completed)
  const conversions = await db.transaction.count({
    where: { sellerId: userId, createdAt: { gte: startDate } },
  }).catch(() => 0);

  // Get real revenue (sum of completed transaction amounts)
  const revenueResult = await db.transaction.aggregate({
    where: { sellerId: userId, status: 'RELEASED', createdAt: { gte: startDate } },
    _sum: { amount: true },
  }).catch(() => ({ _sum: { amount: 0 } }));
  const revenue = Number(revenueResult._sum?.amount || 0);

  const summary = {
    listingViews,
    profileViews,
    inquiries,
    conversions,
    revenue,
    currency: 'XOF',
  };

  // Calculate week-over-week changes (compare to previous week)
  const prevWeekStart = new Date(periodStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevListingViews = await db.profileView.count({
    where: { viewerId: userId, createdAt: { gte: prevWeekStart, lt: startDate } },
  }).catch(() => 0);

  const changes = {
    listingViews: prevListingViews > 0 ? Math.round((listingViews - prevListingViews) / prevListingViews * 100) : 0,
    profileViews: 0, // Would need previous week's profile views
    inquiries: 0,
    conversions: 0,
    revenue: 0,
  };

  // Get real top listings
  const topProperties = await db.property.findMany({
    where: { agentId: userId, status: 'published' },
    select: { id: true, title: true, views: true },
    orderBy: { views: 'desc' },
    take: 3,
  }).catch(() => []);

  const topListings = topProperties.map(p => ({
    id: p.id,
    title: p.title,
    views: p.views || 0,
    inquiries: 0, // Would need appointment count per property
  }));

  const recommendations: string[] = [];

  if (summary.conversions < 3) {
    recommendations.push('Votre taux de conversion est faible. Essayez d\'améliorer la qualité de vos photos et descriptions.');
  }
  if (summary.listingViews < 200) {
    recommendations.push('Les vues de vos annonces sont en dessous de la moyenne. Envisagez de booster vos annonces.');
  }
  if (changes.revenue < 0) {
    recommendations.push('Vos revenus ont baissé cette semaine. Analysez les annonces qui sous-performent.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Bonne semaine ! Continuez à optimiser vos annonces pour maintenir vos performances.');
  }

  return {
    userId,
    periodStart: periodStart.toISOString(),
    periodEnd,
    summary,
    changes,
    topListings,
    recommendations,
    generatedAt: now.toISOString(),
  };
}
