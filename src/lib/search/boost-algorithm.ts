// AfriBayit — Premium Boost Algorithm
// CDC §5.5b — Search Ranking Boost System
//
// Scoring factors:
// 1. Score de pertinence (search criteria matching)
// 2. Complétude de l'annonce (photos, description, VR, docs validés)
// 3. Score de l'agent (reviews, certifications, ancienneté)
// 4. Multiplicateur Premium (x1.0 Starter, x1.5 Essentiel, x2.5 Avancé, x4.0 Elite)
// 5. Fraîcheur (boost x2 for first 48h)
// 6. Taux d'engagement (clics, vues, favoris, contacts)
// 7. "Annonce sponsorisée" label for Premium listings

// ─── Premium Tier Multipliers (CDC §5.5b) ───
export const PREMIUM_MULTIPLIERS: Record<string, number> = {
  starter: 1.0,
  essentiel: 1.5,
  avance: 2.5,
  elite: 4.0,
};

// ─── Types ───
export interface BoostableProperty {
  id: string;
  title: string;
  description: string;
  images: string[];
  hasVR: boolean;
  verified: boolean;
  geoTrust: boolean;
  views: number;
  favorites: number;
  premium: boolean;
  publishedAt: string | null;
  createdAt: string;
  agentId: string;
  // Agent data
  agentVerified?: boolean;
  agentCertified?: boolean;
  agentScore?: number;        // 0-1000
  agentReviewCount?: number;
  agentMemberSince?: string;  // ISO date
  agentPremiumTier?: string;  // starter, essentiel, avance, elite
  // Legal docs
  legalDocsValidated?: number;
  // Engagement metrics
  clickCount?: number;
  contactCount?: number;
}

export interface BoostedProperty extends BoostableProperty {
  boostScore: number;
  boostBreakdown: BoostBreakdown;
  isSponsored: boolean;
  sponsoredLabel?: string;
}

export interface BoostBreakdown {
  pertinence: number;        // 0-25
  completeness: number;      // 0-25
  agentScore: number;        // 0-20
  premiumMultiplier: number; // 1.0-4.0
  freshness: number;         // 0-15
  engagement: number;        // 0-15
  total: number;             // weighted total
}

// ─── 1. Pertinence Score (0-25) ───
// How well the property matches search criteria
export function computePertinenceScore(
  property: BoostableProperty,
  searchQuery?: string,
  searchCity?: string,
  searchType?: string[]
): number {
  let score = 10; // Base score for being a published listing

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    const titleMatch = property.title.toLowerCase().includes(query);
    const descMatch = property.description.toLowerCase().includes(query);
    if (titleMatch) score += 8;
    if (descMatch) score += 4;
    // Partial match bonus
    const words = query.split(/\s+/);
    for (const word of words) {
      if (word.length < 3) continue;
      if (property.title.toLowerCase().includes(word)) score += 1;
      if (property.description.toLowerCase().includes(word)) score += 0.5;
    }
  }

  if (searchCity && property.title.toLowerCase().includes(searchCity.toLowerCase())) {
    score += 3;
  }

  if (searchType && searchType.length > 0) {
    // Type match is already handled by filters, but boost exact matches
    score += 2;
  }

  return Math.min(25, Math.max(0, score));
}

// ─── 2. Complétude de l'annonce (0-25) ───
// Photos, description, VR, documents validés
export function computeCompletenessScore(property: BoostableProperty): number {
  let score = 0;

  // Photos (0-8 points)
  const imageCount = property.images.length;
  if (imageCount >= 8) score += 8;
  else if (imageCount >= 5) score += 6;
  else if (imageCount >= 3) score += 4;
  else if (imageCount >= 1) score += 2;

  // Description quality (0-5 points)
  const descLength = property.description.length;
  if (descLength >= 500) score += 5;
  else if (descLength >= 200) score += 3;
  else if (descLength >= 50) score += 1;

  // VR tour (0-4 points)
  if (property.hasVR) score += 4;

  // Verified / GeoTrust (0-4 points)
  if (property.verified) score += 2;
  if (property.geoTrust) score += 2;

  // Legal docs validated (0-4 points)
  if (property.legalDocsValidated && property.legalDocsValidated >= 3) score += 4;
  else if (property.legalDocsValidated && property.legalDocsValidated >= 1) score += 2;

  return Math.min(25, Math.max(0, score));
}

// ─── 3. Score de l'agent (0-20) ───
// Reviews, certifications, ancienneté
export function computeAgentScore(property: BoostableProperty): number {
  let score = 5; // Base score

  // Agent verification
  if (property.agentVerified) score += 3;
  if (property.agentCertified) score += 3;

  // Agent reputation score (0-1000 mapped to 0-4)
  if (property.agentScore) {
    score += Math.min(4, (property.agentScore / 1000) * 4);
  }

  // Reviews count
  if (property.agentReviewCount) {
    if (property.agentReviewCount >= 20) score += 3;
    else if (property.agentReviewCount >= 10) score += 2;
    else if (property.agentReviewCount >= 3) score += 1;
  }

  // Ancienneté (membership duration)
  if (property.agentMemberSince) {
    const memberDate = new Date(property.agentMemberSince);
    const yearsActive = (Date.now() - memberDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (yearsActive >= 2) score += 2;
    else if (yearsActive >= 1) score += 1;
  }

  return Math.min(20, Math.max(0, score));
}

// ─── 4. Multiplicateur Premium (x1.0 - x4.0) ───
export function computePremiumMultiplier(property: BoostableProperty): number {
  if (!property.premium) return 1.0;
  const tier = property.agentPremiumTier || 'starter';
  return PREMIUM_MULTIPLIERS[tier] || 1.0;
}

// ─── 5. Fraîcheur (0-15) ───
// Boost x2 for first 48h
export function computeFreshnessScore(property: BoostableProperty): number {
  const publishedDate = property.publishedAt ? new Date(property.publishedAt) : new Date(property.createdAt);
  const hoursSincePublish = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);

  if (hoursSincePublish <= 48) return 15; // Full boost for first 48h
  if (hoursSincePublish <= 96) return 12;
  if (hoursSincePublish <= 168) return 9;  // 1 week
  if (hoursSincePublish <= 336) return 6;  // 2 weeks
  if (hoursSincePublish <= 720) return 3;  // 1 month
  return 1;
}

// ─── 6. Taux d'engagement (0-15) ───
// Clics, vues, favoris, contacts
export function computeEngagementScore(property: BoostableProperty): number {
  let score = 0;

  // Views engagement
  if (property.views >= 500) score += 4;
  else if (property.views >= 200) score += 3;
  else if (property.views >= 50) score += 2;
  else if (property.views >= 10) score += 1;

  // Favorites (strong signal)
  if (property.favorites >= 20) score += 4;
  else if (property.favorites >= 10) score += 3;
  else if (property.favorites >= 5) score += 2;
  else if (property.favorites >= 1) score += 1;

  // Clicks
  if (property.clickCount && property.clickCount >= 50) score += 4;
  else if (property.clickCount && property.clickCount >= 20) score += 3;
  else if (property.clickCount && property.clickCount >= 5) score += 2;

  // Contacts (strongest signal)
  if (property.contactCount && property.contactCount >= 10) score += 3;
  else if (property.contactCount && property.contactCount >= 5) score += 2;
  else if (property.contactCount && property.contactCount >= 1) score += 1;

  return Math.min(15, Math.max(0, score));
}

// ─── Main Boost Algorithm ───
export function computeBoostScore(
  property: BoostableProperty,
  searchQuery?: string,
  searchCity?: string,
  searchType?: string[]
): BoostedProperty {
  const pertinence = computePertinenceScore(property, searchQuery, searchCity, searchType);
  const completeness = computeCompletenessScore(property);
  const agentScore = computeAgentScore(property);
  const premiumMultiplier = computePremiumMultiplier(property);
  const freshness = computeFreshnessScore(property);
  const engagement = computeEngagementScore(property);

  // Raw score before premium multiplier
  const rawScore = pertinence + completeness + agentScore + freshness + engagement;

  // Apply premium multiplier to boost premium listings
  const total = Math.round(rawScore * premiumMultiplier * 10) / 10;

  const isSponsored = property.premium && premiumMultiplier >= 2.5;
  const sponsoredLabel = isSponsored
    ? premiumMultiplier >= 4.0
      ? 'Annonce sponsorisée — Elite'
      : 'Annonce sponsorisée'
    : undefined;

  return {
    ...property,
    boostScore: total,
    boostBreakdown: {
      pertinence,
      completeness,
      agentScore,
      premiumMultiplier,
      freshness,
      engagement,
      total,
    },
    isSponsored,
    sponsoredLabel,
  };
}

// ─── Apply boost algorithm to search results ───
export function applyBoostAlgorithm(
  properties: BoostableProperty[],
  searchQuery?: string,
  searchCity?: string,
  searchType?: string[]
): BoostedProperty[] {
  const boosted = properties.map(p =>
    computeBoostScore(p, searchQuery, searchCity, searchType)
  );

  // Sort by boost score (descending) — Premium listings naturally rank higher
  boosted.sort((a, b) => b.boostScore - a.boostScore);

  return boosted;
}

// ─── Get boost tier label ───
export function getPremiumTierLabel(tier: string): { label: string; multiplier: number; color: string } {
  const config: Record<string, { label: string; multiplier: number; color: string }> = {
    starter: { label: 'Starter', multiplier: 1.0, color: '#6b7280' },
    essentiel: { label: 'Essentiel', multiplier: 1.5, color: '#009CDE' },
    avance: { label: 'Avancé', multiplier: 2.5, color: '#D4AF37' },
    elite: { label: 'Elite', multiplier: 4.0, color: '#003087' },
  };
  return config[tier] || config.starter;
}
