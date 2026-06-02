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
 */
export function generateWeeklyReport(userId: string): WeeklyReport {
  const now = new Date();
  const periodEnd = now.toISOString();
  const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // In production, these would come from real data aggregation
  const summary = {
    listingViews: 342 + Math.floor(Math.random() * 100),
    profileViews: 89 + Math.floor(Math.random() * 30),
    inquiries: 15 + Math.floor(Math.random() * 10),
    conversions: 3 + Math.floor(Math.random() * 3),
    revenue: (2500000 + Math.floor(Math.random() * 1500000)),
    currency: 'XOF',
  };

  const changes = {
    listingViews: Math.round((Math.random() - 0.3) * 40),
    profileViews: Math.round((Math.random() - 0.3) * 30),
    inquiries: Math.round((Math.random() - 0.2) * 25),
    conversions: Math.round((Math.random() - 0.3) * 20),
    revenue: Math.round((Math.random() - 0.2) * 35),
  };

  const topListings = [
    { id: 'listing-1', title: 'Villa 4ch Cotonou', views: 89, inquiries: 5 },
    { id: 'listing-2', title: 'Appartement Abidjan', views: 67, inquiries: 3 },
    { id: 'listing-3', title: 'Terrain Lomé', views: 45, inquiries: 2 },
  ];

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
    periodStart,
    periodEnd,
    summary,
    changes,
    topListings,
    recommendations,
    generatedAt: now.toISOString(),
  };
}
