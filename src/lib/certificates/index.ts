// AfriBayit Certificate Orchestrator — Orchestrateur de certificats

import { db } from '@/lib/db';
import { generateCertificatePDF, generateCertificateBase64 } from './generator';
import type { CertificateType } from './templates';
import { getTemplate } from './templates';
import { earnPoints } from '@/lib/afripoints';

export interface GenerateCertificateInput {
  userId: string;
  courseId: string;
  enrollmentId?: string;
  type?: CertificateType;
}

/**
 * Vérifie que l'utilisateur a complété le cours avec un score suffisant
 */
async function verifyCourseCompletion(
  userId: string,
  courseId: string
): Promise<{ eligible: boolean; enrollment?: { id: string; completed: boolean; progress: number } }> {
  const enrollment = await db.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (!enrollment) {
    return { eligible: false };
  }

  // Vérifier si le cours est marqué comme complété
  if (!enrollment.completed) {
    return { eligible: false, enrollment };
  }

  // Vérifier s'il existe un quiz passé avec un score suffisant
  const quizAttempts = await db.quizAttempt.findMany({
    where: { userId, quiz: { courseId }, passed: true },
    orderBy: { percent: 'desc' },
    take: 1,
  });

  // Si pas de quiz, on accepte juste la complétion du cours
  const eligible = enrollment.completed || quizAttempts.length > 0;
  return { eligible, enrollment };
}

/**
 * Génère un certificat complet pour un utilisateur
 */
export async function generateCertificate(input: GenerateCertificateInput) {
  const { userId, courseId, enrollmentId, type = 'course_completion' } = input;

  // Vérifier l'éligibilité
  const { eligible, enrollment } = await verifyCourseCompletion(userId, courseId);

  if (!eligible) {
    throw new Error('Vous n\'êtes pas encore éligible pour un certificat. Complétez le cours et réussissez le quiz.');
  }

  // Vérifier qu'un certificat n'existe pas déjà
  const existing = await db.certificate.findFirst({
    where: { userId, courseId, type },
  });

  if (existing) {
    return {
      certificateId: existing.certificateId,
      pdfBase64: existing.pdfBase64,
      existing: true,
    };
  }

  // Récupérer les informations du cours et de l'utilisateur
  const [course, user] = await Promise.all([
    db.course.findUnique({ where: { id: courseId } }),
    db.user.findUnique({ where: { id: userId } }),
  ]);

  if (!course || !user) {
    throw new Error('Cours ou utilisateur introuvable.');
  }

  // Générer un ID de certificat unique
  const certificateId = `AFB-${type.charAt(0).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const verificationUrl = `https://afribayit.com/verify/cert/${certificateId}`;
  const date = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Générer le PDF
  const pdfBase64 = await generateCertificateBase64({
    certificateId,
    recipientName: user.name,
    courseName: course.title,
    instructorName: course.instructor,
    date,
    type,
    verificationUrl,
  });

  // Sauvegarder en base
  const certificate = await db.certificate.create({
    data: {
      certificateId,
      userId,
      courseId,
      enrollmentId: enrollmentId || enrollment?.id,
      type,
      recipientName: user.name,
      courseName: course.title,
      instructorName: course.instructor,
      pdfBase64,
      verified: true,
    },
  });

  // Mettre à jour l'enrollment avec le certificat
  if (enrollment) {
    await db.courseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        certificateId: certificate.id,
        certificateUrl: verificationUrl,
      },
    });
  }

  // Attribuer des AfriPoints pour l'obtention du certificat
  try {
    await earnPoints(userId, 'certificate_earned', { certificateId, courseId });
  } catch {
    // Ne pas bloquer si les points échouent
  }

  return {
    certificateId: certificate.certificateId,
    pdfBase64: certificate.pdfBase64,
    existing: false,
  };
}

/**
 * Vérifie un certificat par son ID
 */
export async function verifyCertificate(certificateId: string) {
  const certificate = await db.certificate.findUnique({
    where: { certificateId },
    include: {
      user: { select: { name: true, avatar: true } },
      course: { select: { title: true, instructor: true, image: true } },
    },
  });

  if (!certificate) {
    return { valid: false, message: 'Certificat introuvable.' };
  }

  return {
    valid: certificate.verified,
    certificate: {
      certificateId: certificate.certificateId,
      recipientName: certificate.recipientName,
      courseName: certificate.courseName,
      instructorName: certificate.instructorName,
      type: certificate.type,
      issuedAt: certificate.issuedAt,
      user: certificate.user,
      course: certificate.course,
    },
  };
}
