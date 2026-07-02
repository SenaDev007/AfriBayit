import type { ReactNode } from 'react';

export type PeriodKey = '7j' | '30j' | '90j' | '12m' | 'custom';
export type ProfileTab = 'agent' | 'artisan' | 'formateur' | 'investisseur';
export type AnalyticsTab =
  | 'overview'
  | 'profile_views'
  | 'search'
  | 'profiles'
  | 'heatmap'
  | 'rebecca'
  | 'export';

export interface KPI {
  label: string;
  value: string;
  change: string;
  icon: ReactNode;
  color: string;
}

export interface ChartDataPoint {
  month: string;
  value: number;
}

export interface BarDataPoint {
  label: string;
  value: number;
  color: string;
}

export interface PeriodOption {
  key: PeriodKey;
  label: string;
}

export interface AnalyticsTabDef {
  key: AnalyticsTab;
  label: string;
  icon: ReactNode;
}

export interface ProfileTabDef {
  key: ProfileTab;
  label: string;
  icon: ReactNode;
  color: string;
}

export interface SearchAppearanceRow {
  keyword: string;
  appearances: number;
  clicks: number;
  ctr: number;
}

export interface ProfileViewsRow {
  total: number;
  direct: number;
  search: number;
  referral: number;
  evolution: number;
}

export interface ConnectionsRow {
  connections: number;
  followers: number;
  connGrowth: number;
  followGrowth: number;
}

export interface EngagementRow {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface ConversionStage {
  stage: string;
  count: number;
  pct: number;
}

export interface ZonePerformanceRow {
  zone: string;
  performance: number;
  trend: 'up' | 'down' | 'stable';
  avgPrice: number;
}

export type RebeccaPriority = 'high' | 'medium' | 'low';
export type RebeccaIcon = 'listing' | 'message' | 'premium' | 'location' | 'network' | 'cert';

export interface RebeccaRecommendation {
  id: string;
  title: string;
  description: string;
  action: string;
  priority: RebeccaPriority;
  icon: RebeccaIcon;
}
