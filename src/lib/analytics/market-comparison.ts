/**
 * AfriBayit — Market Comparison
 * Compare user metrics against market averages
 */

export interface ComparisonMetric {
  label: string;
  labelFr: string;
  user: number;
  market: number;
  unit: string;
  status: 'above' | 'below' | 'average';
  percentageDiff: number;
}

export interface ComparisonResult {
  overallScore: number;
  metrics: ComparisonMetric[];
  strengths: string[];
  improvements: string[];
}

const MARKET_AVERAGES = {
  conversionRate: 4.5, // %
  responseTime: 180, // minutes
  listingViews: 250, // per month per listing
  inquiryRate: 8, // % of views → inquiries
  closingRate: 20, // % of inquiries → closed
  averagePrice: 25000000, // XOF
  listingCompleteness: 65, // %
  responseRate: 78, // %
};

/**
 * Compare user metrics against market averages
 */
export function compareToMarket(userMetrics: Record<string, number>): ComparisonResult {
  const metrics: ComparisonMetric[] = [
    createMetric('Taux de conversion', 'conversionRate', userMetrics.conversionRate, MARKET_AVERAGES.conversionRate, '%', true),
    createMetric('Temps de réponse', 'responseTime', userMetrics.responseTime, MARKET_AVERAGES.responseTime, 'min', false),
    createMetric('Vues par annonce', 'listingViews', userMetrics.listingViews, MARKET_AVERAGES.listingViews, '/mois', true),
    createMetric('Taux d\'demandes', 'inquiryRate', userMetrics.inquiryRate, MARKET_AVERAGES.inquiryRate, '%', true),
    createMetric('Taux de clôture', 'closingRate', userMetrics.closingRate, MARKET_AVERAGES.closingRate, '%', true),
    createMetric('Complétude annonces', 'listingCompleteness', userMetrics.listingCompleteness, MARKET_AVERAGES.listingCompleteness, '%', true),
    createMetric('Taux de réponse', 'responseRate', userMetrics.responseRate, MARKET_AVERAGES.responseRate, '%', true),
  ];

  const strengths: string[] = [];
  const improvements: string[] = [];

  for (const m of metrics) {
    if (m.status === 'above') {
      strengths.push(`${m.labelFr}: ${m.user}${m.unit} (marché: ${m.market}${m.unit})`);
    } else if (m.status === 'below') {
      improvements.push(`${m.labelFr}: ${m.user}${m.unit} vs ${m.market}${m.unit} du marché`);
    }
  }

  const aboveCount = metrics.filter(m => m.status === 'above').length;
  const overallScore = Math.round((aboveCount / metrics.length) * 100);

  return { overallScore, metrics, strengths, improvements };
}

function createMetric(
  labelFr: string,
  key: string,
  userValue: number,
  marketValue: number,
  unit: string,
  higherIsBetter: boolean
): ComparisonMetric {
  const user = userValue || 0;
  const market = marketValue;

  let status: ComparisonMetric['status'];
  const diff = market > 0 ? ((user - market) / market) * 100 : 0;

  if (Math.abs(diff) <= 10) {
    status = 'average';
  } else if (higherIsBetter ? user > market : user < market) {
    status = 'above';
  } else {
    status = 'below';
  }

  return {
    label: key,
    labelFr,
    user,
    market,
    unit,
    status,
    percentageDiff: Math.round(diff),
  };
}
