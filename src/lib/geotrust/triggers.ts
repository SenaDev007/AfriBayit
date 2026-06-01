/**
 * AfriBayit — Mandatory Inspection Triggers
 * Determines if a property requires mandatory GeoTrust inspection
 */

export interface InspectionTriggerResult {
  required: boolean;
  reason: string;
  severity: 'mandatory' | 'recommended' | 'optional';
  triggers: {
    condition: string;
    met: boolean;
    severity: 'mandatory' | 'recommended' | 'optional';
  }[];
}

/**
 * Check if a property requires mandatory inspection
 */
export function requiresMandatoryInspection(property: {
  type: string;
  price: number;
  country: string;
  geoTrustRequested?: boolean;
  isBareLand?: boolean;
}): InspectionTriggerResult {
  const triggers: InspectionTriggerResult['triggers'] = [];

  // Terrain > 10M XOF → mandatory
  if (property.type === 'terrain' && property.price > 10000000) {
    triggers.push({
      condition: `Terrain à ${new Intl.NumberFormat('fr-FR').format(property.price)} XOF — supérieur à 10M XOF`,
      met: true,
      severity: 'mandatory',
    });
  }

  // Terrain nu (bare land) → mandatory
  if (property.isBareLand || (property.type === 'terrain' && !property.isBareLand)) {
    triggers.push({
      condition: 'Terrain nu — inspection cadastrale obligatoire',
      met: true,
      severity: 'mandatory',
    });
  }

  // Property > 50M XOF → recommended
  if (property.price > 50000000) {
    triggers.push({
      condition: `Bien à ${new Intl.NumberFormat('fr-FR').format(property.price)} XOF — supérieur à 50M XOF`,
      met: true,
      severity: 'recommended',
    });
  }

  // GeoTrust certification requested → mandatory
  if (property.geoTrustRequested) {
    triggers.push({
      condition: 'Certification GeoTrust demandée — inspection obligatoire',
      met: true,
      severity: 'mandatory',
    });
  }

  // Country-specific triggers
  if (property.country === 'BJ') {
    // Bénin: TF verification mandatory per 2023 reform
    triggers.push({
      condition: 'Bénin — Vérification TF obligatoire (réforme 2023)',
      met: true,
      severity: 'mandatory',
    });
  }

  if (property.country === 'BF') {
    // BF: RAF 2025 requires PUH/APFR verification for terrain
    if (property.type === 'terrain') {
      triggers.push({
        condition: 'Burkina Faso — Vérification PUH/APFR (RAF 2025)',
        met: true,
        severity: 'mandatory',
      });
    }
  }

  if (property.country === 'TG') {
    // TG: DCCF 2025 mandatory registration verification
    triggers.push({
      condition: 'Togo — Vérification enregistrement CFD/DCCF 2025',
      met: true,
      severity: 'mandatory',
    });
  }

  const hasMandatory = triggers.some(t => t.severity === 'mandatory');
  const hasRecommended = triggers.some(t => t.severity === 'recommended');

  let reason = '';
  if (hasMandatory) {
    const mandatoryTriggers = triggers.filter(t => t.severity === 'mandatory');
    reason = `Inspection obligatoire : ${mandatoryTriggers.map(t => t.condition).join('; ')}`;
  } else if (hasRecommended) {
    reason = 'Inspection recommandée pour les biens de haute valeur';
  } else {
    reason = 'Aucune inspection obligatoire détectée';
  }

  return {
    required: hasMandatory,
    reason,
    severity: hasMandatory ? 'mandatory' : hasRecommended ? 'recommended' : 'optional',
    triggers,
  };
}
