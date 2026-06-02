// AfriBayit Certificate Templates — Styles et données de certificat

export type CertificateType = 'course_completion' | 'workshop' | 'masterclass';

export interface CertificateTemplate {
  type: CertificateType;
  titleFr: string;
  titleEn: string;
  subtitleFr: string;
  subtitleEn: string;
  borderStyle: 'classic' | 'modern' | 'elegant';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export const CERTIFICATE_TEMPLATES: Record<CertificateType, CertificateTemplate> = {
  course_completion: {
    type: 'course_completion',
    titleFr: 'CERTIFICAT DE RÉUSSITE',
    titleEn: 'CERTIFICATE OF COMPLETION',
    subtitleFr: 'Délivré par AfriBayit Academy',
    subtitleEn: 'Issued by AfriBayit Academy',
    borderStyle: 'classic',
    primaryColor: '#003087',   // Navy AfriBayit
    secondaryColor: '#D4AF37', // Or AfriBayit
    accentColor: '#00A651',    // Vert AfriBayit
  },
  workshop: {
    type: 'workshop',
    titleFr: 'CERTIFICAT DE PARTICIPATION',
    titleEn: 'CERTIFICATE OF PARTICIPATION',
    subtitleFr: 'Atelier AfriBayit Academy',
    subtitleEn: 'AfriBayit Academy Workshop',
    borderStyle: 'modern',
    primaryColor: '#009CDE',
    secondaryColor: '#D4AF37',
    accentColor: '#003087',
  },
  masterclass: {
    type: 'masterclass',
    titleFr: 'CERTIFICAT MASTERCLASS',
    titleEn: 'MASTERCLASS CERTIFICATE',
    subtitleFr: 'Formation d\'Excellence AfriBayit',
    subtitleEn: 'AfriBayit Excellence Training',
    borderStyle: 'elegant',
    primaryColor: '#D4AF37',
    secondaryColor: '#003087',
    accentColor: '#00A651',
  },
};

export function getTemplate(type: CertificateType): CertificateTemplate {
  return CERTIFICATE_TEMPLATES[type] || CERTIFICATE_TEMPLATES.course_completion;
}

/**
 * Retourne le texte bilingue du certificat
 */
export function getCertificateText(
  type: CertificateType,
  recipientName: string,
  courseName: string,
  instructorName: string,
  date: string,
  certificateId: string
): { french: string; english: string } {
  const template = getTemplate(type);

  return {
    french: `${template.subtitleFr}\n\nCe certificat atteste que\n\n${recipientName}\n\na réussi avec succès le cours\n\n"${courseName}"\n\nSous la direction de ${instructorName}\n\nLe ${date}\n\nID: ${certificateId}`,
    english: `${template.subtitleEn}\n\nThis certifies that\n\n${recipientName}\n\nhas successfully completed the course\n\n"${courseName}"\n\nUnder the instruction of ${instructorName}\n\nOn ${date}\n\nID: ${certificateId}`,
  };
}
