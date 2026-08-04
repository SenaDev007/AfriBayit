// AfriBayit — useAnalytics Hook (CDC §3.1.2)
//
// Fetches the authenticated user's analytics from
//   GET /analytics/me?period={period}&role={role}
// and returns a typed AnalyticsResponse. A 404 means the backend has no
// analytics yet (e.g. new user) — the hook resolves to an EMPTY_STATE
// instead of throwing, so consumers can fall back to demo data without
// having to catch.
//
// Other errors (network, 5xx) are surfaced via `isError`.

import { useQuery } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api-client';
import type {
  ConnectionsRow,
  EngagementRow,
  ProfileViewsRow,
  RebeccaRecommendation,
  SearchAppearanceRow,
} from '@/components/afribayit/AnalyticsDashboard/types';

// ─── Types ────────────────────────────────────────────────────────────────

export type AnalyticsRole =
  | 'agent'
  | 'artisan'
  | 'formateur'
  | 'investisseur';

export type AnalyticsPeriod =
  | '7j'
  | '30j'
  | '90j'
  | '12m';

export interface AgentAnalytics {
  timeToSale?: { avg: number; median: number; best: number; unit: string };
  performanceAnnonces?: { active: number; vues: number; contacts: number; tauxConversion: number };
  volumeTransactions?: { total: number; valeur: number; enCours: number };
  roiPremium?: { investissement: number; revenuGenere: number; roi: number; contactsSupp: number };
  conversionFunnel?: Array<{ stage: string; count: number; pct: number }>;
  localRanking?: { position: number; totalAgents: number; city: string; score: number };
}

export interface AnalyticsResponse {
  profileViews: ProfileViewsRow | null;
  searchAppearances: SearchAppearanceRow[];
  connectionsGrowth: ConnectionsRow | null;
  contentEngagement: EngagementRow | null;
  rebeccaRecommendations: RebeccaRecommendation[];
  profileCompleteness: { percentage: number; missing: Array<{ field: string; labelFr: string; weight: number }> };
  agentAnalytics: AgentAnalytics | null;
}

export const EMPTY_ANALYTICS: AnalyticsResponse = {
  profileViews: null,
  searchAppearances: [],
  connectionsGrowth: null,
  contentEngagement: null,
  rebeccaRecommendations: [],
  profileCompleteness: { percentage: 0, missing: [] },
  agentAnalytics: null,
};

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useAnalytics(
  period: AnalyticsPeriod = '30j',
  role: AnalyticsRole = 'agent',
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;

  return useQuery<AnalyticsResponse>({
    queryKey: ['analytics', 'me', period, role],
    enabled,
    staleTime: 60_000, // 1 min — analytics don't change every render
    queryFn: async () => {
      try {
        const data = await api.get<AnalyticsResponse>(
          `/analytics/me?period=${encodeURIComponent(period)}&role=${encodeURIComponent(role)}`,
        );
        // Defensive: backfill missing fields so consumers can rely on shape.
        return {
          profileViews: data?.profileViews ?? null,
          searchAppearances: Array.isArray(data?.searchAppearances)
            ? data.searchAppearances
            : [],
          connectionsGrowth: data?.connectionsGrowth ?? null,
          contentEngagement: data?.contentEngagement ?? null,
          rebeccaRecommendations: Array.isArray(data?.rebeccaRecommendations)
            ? data.rebeccaRecommendations
            : [],
          profileCompleteness:
            data?.profileCompleteness ?? EMPTY_ANALYTICS.profileCompleteness,
          agentAnalytics: data?.agentAnalytics ?? null,
        };
      } catch (err) {
        // 404 = no analytics yet for this user — return empty state, not error.
        if (err instanceof ApiError && err.statusCode === 404) {
          return EMPTY_ANALYTICS;
        }
        throw err;
      }
    },
  });
}

export default useAnalytics;
