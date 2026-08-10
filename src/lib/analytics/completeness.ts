/**
 * AfriBayit — Profile Completeness Calculator
 * Calculates weighted profile completeness score
 */

export interface CompletenessCheck {
  field: string;
  labelFr: string;
  weight: number;
  filled: boolean;
}

export interface CompletenessResult {
  score: number;
  maxScore: number;
  percentage: number;
  missing: { field: string; labelFr: string; weight: number }[];
  checks: CompletenessCheck[];
}

/**
 * Calculate profile completeness with weighted scoring
 */
export function calculateProfileCompleteness(profile: Record<string, unknown>): CompletenessResult {
  const checks: CompletenessCheck[] = [
    { field: 'avatar', labelFr: 'Photo de profil', weight: 10, filled: !!profile.avatar },
    { field: 'headline', labelFr: 'Titre professionnel', weight: 10, filled: !!profile.headline },
    { field: 'bio', labelFr: 'Biographie', weight: 15, filled: !!profile.bio && String(profile.bio).length > 20 },
    { field: 'location', labelFr: 'Localisation', weight: 10, filled: !!profile.city || !!profile.country },
    { field: 'skills', labelFr: 'Compétences', weight: 10, filled: !!profile.specialities || !!profile.skills },
    { field: 'experience', labelFr: 'Expérience', weight: 15, filled: !!profile.experience },
    { field: 'education', labelFr: 'Formation', weight: 10, filled: !!profile.education },
    { field: 'certifications', labelFr: 'Certifications', weight: 10, filled: !!profile.certifications },
    { field: 'portfolio', labelFr: 'Portfolio', weight: 10, filled: !!profile.portfolio },
  ];

  let score = 0;
  let maxScore = 0;
  const missing: { field: string; labelFr: string; weight: number }[] = [];

  for (const check of checks) {
    maxScore += check.weight;
    if (check.filled) {
      score += check.weight;
    } else {
      missing.push({ field: check.field, labelFr: check.labelFr, weight: check.weight });
    }
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return { score, maxScore, percentage, missing, checks };
}
