// AfriBayit — Profile Completeness Auto-Calculation
// CDC §5.4b — Calcul automatique de complétude du profil
//
// Scoring weights:
// - Has avatar: +10%
// - Has headline: +10%
// - Has bio: +15%
// - Has at least 1 skill: +10%
// - Has at least 1 experience: +10%
// - Has at least 1 education: +10%
// - Has at least 1 certification: +10%
// - Has at least 1 portfolio item: +10%
// - Phone verified: +7.5%
// - Email verified: +7.5%
// Total: 100%

/** Profile data input for completeness calculation */
export interface ProfileData {
  avatar?: string | null;
  headline?: string | null;
  bio?: string | null;
  skills?: string[] | unknown;
  experience?: unknown[] | unknown;
  education?: unknown[] | unknown;
  certifications?: unknown[] | unknown;
  portfolio?: unknown[] | unknown;
  phoneVerified?: boolean;
  emailVerified?: boolean;
}

/** Individual check result */
export interface CompletenessCheck {
  field: string;
  labelFr: string;
  weight: number;
  filled: boolean;
  description: string;
}

/** Overall completeness result */
export interface CompletenessResult {
  percentage: number;
  checks: CompletenessCheck[];
  missing: CompletenessCheck[];
  level: CompletenessLevel;
  nextMilestone: number;
  nextMilestoneLabel: string;
}

/** Completeness level thresholds */
export type CompletenessLevel = 'debutant' | 'intermediaire' | 'avance' | 'complet';

const COMPLETENESS_THRESHOLDS: { min: number; level: CompletenessLevel; label: string }[] = [
  { min: 0, level: 'debutant', label: 'Débutant' },
  { min: 30, level: 'intermediaire', label: 'Intermédiaire' },
  { min: 70, level: 'avance', label: 'Avancé' },
  { min: 100, level: 'complet', label: 'Complet' },
];

const MILESTONES = [30, 50, 70, 85, 100];

/**
 * Helper to check if an array-like field has at least one item.
 */
function hasAtLeastOne(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'string') return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return !!value;
}

/**
 * Calculate profile completeness percentage based on CDC §5.4b criteria.
 *
 * @param profile - The profile data to evaluate
 * @returns CompletenessResult with percentage, checks, missing items, and level
 */
export function calculateProfileCompleteness(profile: ProfileData): CompletenessResult {
  const checks: CompletenessCheck[] = [
    {
      field: 'avatar',
      labelFr: 'Photo de profil',
      weight: 10,
      filled: !!profile.avatar,
      description: 'Ajoutez une photo de profil pour personnaliser votre compte',
    },
    {
      field: 'headline',
      labelFr: 'Titre professionnel',
      weight: 10,
      filled: !!profile.headline && String(profile.headline).trim().length > 0,
      description: 'Ajoutez un titre professionnel (ex: Agent immobilier, Promoteur)',
    },
    {
      field: 'bio',
      labelFr: 'Biographie',
      weight: 15,
      filled: !!profile.bio && String(profile.bio).trim().length >= 20,
      description: 'Rédigez une biographie d\'au moins 20 caractères',
    },
    {
      field: 'skills',
      labelFr: 'Compétences',
      weight: 10,
      filled: hasAtLeastOne(profile.skills),
      description: 'Ajoutez au moins une compétence à votre profil',
    },
    {
      field: 'experience',
      labelFr: 'Expérience',
      weight: 10,
      filled: hasAtLeastOne(profile.experience),
      description: 'Ajoutez au moins une expérience professionnelle',
    },
    {
      field: 'education',
      labelFr: 'Formation',
      weight: 10,
      filled: hasAtLeastOne(profile.education),
      description: 'Ajoutez au moins une formation ou diplôme',
    },
    {
      field: 'certifications',
      labelFr: 'Certifications',
      weight: 10,
      filled: hasAtLeastOne(profile.certifications),
      description: 'Ajoutez au moins une certification ou habilitation',
    },
    {
      field: 'portfolio',
      labelFr: 'Portfolio',
      weight: 10,
      filled: hasAtLeastOne(profile.portfolio),
      description: 'Ajoutez au moins un projet ou réalisation à votre portfolio',
    },
    {
      field: 'phoneVerified',
      labelFr: 'Téléphone vérifié',
      weight: 7.5,
      filled: !!profile.phoneVerified,
      description: 'Vérifiez votre numéro de téléphone',
    },
    {
      field: 'emailVerified',
      labelFr: 'Email vérifié',
      weight: 7.5,
      filled: !!profile.emailVerified,
      description: 'Vérifiez votre adresse email',
    },
  ];

  // Calculate percentage (sum of filled weights)
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const filledWeight = checks.filter(c => c.filled).reduce((sum, c) => sum + c.weight, 0);
  const percentage = totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0;

  // Find missing items
  const missing = checks.filter(c => !c.filled);

  // Determine level
  let level: CompletenessLevel = 'debutant';
  for (const threshold of COMPLETENESS_THRESHOLDS) {
    if (percentage >= threshold.min) {
      level = threshold.level;
    }
  }

  // Find next milestone
  const nextMilestone = MILESTONES.find(m => m > percentage) || 100;
  const nextMilestoneLabel = `Atteindre ${nextMilestone}%`;

  return {
    percentage,
    checks,
    missing,
    level,
    nextMilestone,
    nextMilestoneLabel,
  };
}

/**
 * Get the French label for a completeness level.
 */
export function getCompletenessLevelLabel(level: CompletenessLevel): string {
  const threshold = COMPLETENESS_THRESHOLDS.find(t => t.level === level);
  return threshold?.label || 'Débutant';
}

/**
 * Get the color associated with a completeness level.
 */
export function getCompletenessLevelColor(level: CompletenessLevel): string {
  switch (level) {
    case 'debutant': return '#D93025';
    case 'intermediaire': return '#D4AF37';
    case 'avance': return '#009CDE';
    case 'complet': return '#00A651';
    default: return '#6b7280';
  }
}
