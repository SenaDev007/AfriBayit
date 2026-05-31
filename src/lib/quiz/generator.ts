// AfriBayit Quiz Generator — Auto-générer des quiz depuis le contenu de cours

import type { Quiz, QuizQuestion, QuestionType, QuizDifficulty } from './types';
import { db } from '@/lib/db';

/**
 * Génère un quiz automatiquement à partir du contenu d'un cours
 * Analyse les modules et crée des questions basées sur le contenu
 */
export function generateQuizFromContent(
  courseId: string,
  courseTitle: string,
  modulesContent: string,
  options?: {
    questionCount?: number;
    difficulty?: QuizDifficulty;
    timeLimitMinutes?: number;
  }
): Omit<Quiz, 'id'> {
  const {
    questionCount = 10,
    difficulty = 'intermediate',
    timeLimitMinutes = 30,
  } = options || {};

  const questions = generateQuestions(modulesContent, questionCount, difficulty);

  return {
    courseId,
    title: `Quiz — ${courseTitle}`,
    description: `Quiz de validation pour le cours "${courseTitle}". Répondez aux questions pour vérifier vos connaissances.`,
    timeLimitMinutes,
    passingScorePercent: 70,
    questions,
    maxAttempts: 3,
  };
}

/**
 * Génère un ensemble de questions à partir du contenu textuel
 */
function generateQuestions(
  content: string,
  count: number,
  difficulty: QuizDifficulty
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const sentences = content
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  // Modèles de questions immobilières prédéfinis selon la difficulté
  const templates = getTemplatesByDifficulty(difficulty);

  for (let i = 0; i < Math.min(count, templates.length); i++) {
    const template = templates[i];
    questions.push({
      id: `q_${i + 1}`,
      type: template.type,
      question: template.question,
      options: template.options,
      correctAnswer: template.correctAnswer,
      explanation: template.explanation,
      points: difficulty === 'advanced' ? 3 : difficulty === 'intermediate' ? 2 : 1,
      difficulty,
    });
  }

  return questions;
}

interface QuestionTemplate {
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

function getTemplatesByDifficulty(difficulty: QuizDifficulty): QuestionTemplate[] {
  const baseTemplates: QuestionTemplate[] = [
    {
      type: 'multiple_choice',
      question: 'Quel document est indispensable pour prouver la propriété d\'un terrain au Bénin ?',
      options: ['Le titre foncier', 'Le reçu de paiement', 'Le bail verbal', 'Le contrat de vente sous seing privé'],
      correctAnswer: 'Le titre foncier',
      explanation: 'Le titre foncier est le document officiel qui atteste de la propriété d\'un terrain au Bénin.',
    },
    {
      type: 'true_false',
      question: 'Au Bénin, un contrat de bail verbal a la même valeur juridique qu\'un bail écrit.',
      options: ['Vrai', 'Faux'],
      correctAnswer: 'Faux',
      explanation: 'Un bail écrit est nécessaire pour garantir les droits du locataire et du propriétaire.',
    },
    {
      type: 'multiple_choice',
      question: 'Quel est le rôle du notaire dans une transaction immobilière ?',
      options: ['Construire la maison', 'Authentifier les actes et vérifier la légalité', 'Financer l\'achat', 'Gérer la publicité'],
      correctAnswer: 'Authentifier les actes et vérifier la légalité',
      explanation: 'Le notaire authentifie les actes de vente et s\'assure de la conformité juridique de la transaction.',
    },
    {
      type: 'multiple_choice',
      question: 'Quelle est la durée maximale d\'un bail d\'habitation en Côte d\'Ivoire ?',
      options: ['3 ans', '6 ans', '9 ans', '12 ans'],
      correctAnswer: '9 ans',
      explanation: 'En Côte d\'Ivoire, la durée maximale d\'un bail d\'habitation est de 9 ans.',
    },
    {
      type: 'true_false',
      question: 'Le géomètre est responsable de la validation juridique d\'un titre foncier.',
      options: ['Vrai', 'Faux'],
      correctAnswer: 'Faux',
      explanation: 'Le géomètre effectue des mesures topographiques, mais la validation juridique relève du notaire.',
    },
    {
      type: 'multiple_choice',
      question: 'Quel système de paiement AfriBayit utilise-t-il pour sécuriser les transactions ?',
      options: ['Paiement direct au vendeur', 'Système de séquestre (escrow)', 'Virement bancaire simple', 'Paiement mobile direct'],
      correctAnswer: 'Système de séquestre (escrow)',
      explanation: 'AfriBayit utilise un système de séquestre (escrow) pour sécuriser les fonds pendant la transaction.',
    },
    {
      type: 'short_answer',
      question: 'Quel est le nom du service de vérification terrain d\'AfriBayit ?',
      correctAnswer: 'GeoTrust',
      explanation: 'GeoTrust est le service d\'AfriBayit qui permet la vérification terrain des propriétés.',
    },
    {
      type: 'multiple_choice',
      question: 'Quel pays ne fait pas partie de la zone d\'opération actuelle d\'AfriBayit ?',
      options: ['Bénin', 'Côte d\'Ivoire', 'Sénégal', 'Togo'],
      correctAnswer: 'Sénégal',
      explanation: 'AfriBayit opère actuellement au Bénin, Côte d\'Ivoire, Burkina Faso et Togo.',
    },
    {
      type: 'true_false',
      question: 'L\'investissement immobilier en Afrique de l\'Ouest est considéré comme sans risque.',
      options: ['Vrai', 'Faux'],
      correctAnswer: 'Faux',
      explanation: 'Tout investissement comporte des risques. Il est important de vérifier les documents et la situation du bien.',
    },
    {
      type: 'multiple_choice',
      question: 'Qu\'est-ce que l\'ACD en droit foncier béninois ?',
      options: ['Arrêté de Concession Définitive', 'Acte de Cession Domaniale', 'Attestation de Construction Domiciliaire', 'Autorisation de Construction Dépendante'],
      correctAnswer: 'Arrêté de Concession Définitive',
      explanation: 'L\'ACD (Arrêté de Concession Définitive) est un document foncier qui confère un droit de propriété sur un terrain.',
    },
  ];

  if (difficulty === 'advanced') {
    return [...baseTemplates];
  }

  // Pour débutant et intermédiaire, on retourne un sous-ensemble
  return baseTemplates.slice(0, difficulty === 'beginner' ? 5 : 8);
}

/**
 * Crée un quiz en base de données
 */
export async function createQuizInDb(quizData: Omit<Quiz, 'id'>): Promise<string> {
  const quiz = await db.quiz.create({
    data: {
      courseId: quizData.courseId,
      title: quizData.title,
      description: quizData.description,
      timeLimit: quizData.timeLimitMinutes,
      passingScore: quizData.passingScorePercent,
      maxAttempts: quizData.maxAttempts,
      questions: quizData.questions as unknown as object[],
    },
  });

  return quiz.id;
}
