import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export interface RoiEstimate {
  estimatedMonthlyRent: number;
  estimatedAnnualRent: number;
  grossYield: number;
  netYield: number;
  paybackYears: number | null;
  projectedValue5y: number;
  projectedGain5y: number;
  projectedGainPct5y: number;
}

export interface InvestmentOpportunity {
  id: string;
  title: string;
  type: string;
  transaction: string;
  price: number;
  currency: string;
  surface: number;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  city: string;
  country: string;
  quartier: string;
  images: string[];
  features: string[];
  verified: boolean;
  geoTrust: boolean;
  hasVR: boolean;
  investmentScore: number | null;
  owner?: { id: string; name: string; avatar?: string };
  roi?: RoiEstimate;
}

export interface InvestmentStats {
  totalOpportunities: number;
  avgScore: number;
  scoredCount: number;
  avgRentalYield: number;
  avgAnnualGrowth: number;
  byCountry: Array<{
    code: string;
    opportunities: number;
    avgRentalYield: number;
    annualGrowth: number;
  }>;
}

/** Top investment opportunities — sorted by investment score */
export function useTopOpportunities(limit = 6, country?: string) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (country) params.set('country', country);
  return useQuery({
    queryKey: ['investment-top', limit, country],
    queryFn: () => api.get<{ opportunities: InvestmentOpportunity[] }>(
      `/api/investment/top-opportunities?${params.toString()}`,
    ),
    staleTime: 5 * 60 * 1000,
  });
}

/** Investment market stats — avg yield, growth, opportunities count */
export function useInvestmentStats() {
  return useQuery({
    queryKey: ['investment-stats'],
    queryFn: () => api.get<InvestmentStats>(`/api/investment/stats`),
    staleTime: 5 * 60 * 1000,
  });
}

/** Compute the investment score for a specific property (on-demand) */
export function useInvestmentScore(propertyId: string | null) {
  return useQuery({
    queryKey: ['investment-score', propertyId],
    queryFn: () => api.get<{
      score: number;
      breakdown: any;
      roi: RoiEstimate;
    }>(`/api/investment/score/${propertyId}`),
    enabled: !!propertyId,
  });
}

export interface PortfolioItem {
  transactionId: string;
  propertyId: string;
  title: string;
  type: string;
  city: string;
  country: string;
  surface: number;
  bedrooms: number;
  images: string[];
  purchasePrice: number;
  purchaseDate: string;
  currentValue: number;
  plusValue: number;
  plusValuePct: number;
  yearsHeld: number;
  investmentScore: number;
  estimatedRoi: RoiEstimate;
}

export interface RentalIncomeItem {
  leaseId: string;
  leaseRef: string;
  property: { id: string; title: string; city: string };
  tenant: { id: string; name: string; avatar?: string };
  monthlyRent: number;
  currency: string;
  collectedTotal: number;
  startDate: string;
  endDate: string;
}

export interface InvestorDashboard {
  kpis: {
    portfolioValue: number;
    totalInvested: number;
    totalPlusValue: number;
    totalPlusValuePct: number;
    totalRentalIncome: number;
    monthlyRentalIncome: number;
    avgRoi: number;
    propertyCount: number;
    activeLeaseCount: number;
    favoritesCount: number;
  };
  portfolio: PortfolioItem[];
  rentalIncome: RentalIncomeItem[];
  incomeSeries: Array<{ month: string; label: string; amount: number }>;
}

/** Investor dashboard — portfolio, plus-value latente, rental income, ROI (CDC §5.9.2) */
export function useInvestorDashboard() {
  return useQuery({
    queryKey: ['investor-dashboard'],
    queryFn: () => api.get<InvestorDashboard>(`/api/investment/dashboard`),
    staleTime: 60 * 1000,
  });
}
