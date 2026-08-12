// AfriBayit Quiz Engine — Scoring, Evaluation, Progress

import { db } from '@/lib/db';
import type {
  Quiz,
  QuizQuestion,
  QuizAttemptResult,
  QuestionFeedback,
  QuizProgress,
} from './types';

/**
 * Évalue les réponses d'un utilisateur pour un quiz donné
 */
export function evaluateAttempt(
  quiz: Quiz,
  answers: Record<string, string>
): QuizAttemptResult {
  const feedback: QuestionFeedback[] = [];
  let score = 0;
  let maxScore = 0;

  for (const question of quiz.questions) {
    maxScore += question.points;
    const userAnswer = answers[question.id] || '';
    const isCorrect = checkAnswer(question, userAnswer);
    const earnedPoints = isCorrect ? question.points : 0;
    score += earnedPoints;

    feedback.push({
      questionId: question.id,
      question: question.question,
      userAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      explanation: question.explanation,
      points: question.points,
      earnedPoints,
    });
  }

  const percentScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const passed = percentScore >= quiz.passingScorePercent;

  return {
    attemptId: '', // sera assigné après création en DB
    score,
    maxScore,
    percentScore,
    passed,
    feedback,
  };
}

/**
 * Vérifie la réponse d'un utilisateur pour une question
 */
function checkAnswer(question: QuizQuestion, userAnswer: string): boolean {
  const normalize = (s: string) =>
    s.trim().toLowerCase().replace(/\s+/g, ' ');

  switch (question.type) {
    case 'multiple_choice':
    case 'true_false':
      return normalize(userAnswer) === normalize(question.correctAnswer);
    case 'short_answer':
      // Correspondance approximative pour réponses courtes
      return normalize(userAnswer).includes(normalize(question.correctAnswer))
        || normalize(question.correctAnswer).includes(normalize(userAnswer));
    default:
      return false;
  }
}

/**
 * Vérifie si un utilisateur peut tenter un quiz (max tentatives non atteint)
 */
export async function canAttempt(
  quizId: string,
  userId: string
): Promise<boolean> {
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { attempts: { where: { userId } } },
  });

  if (!quiz) return false;

  const attemptCount = quiz.attempts.length;
  return attemptCount < quiz.maxAttempts;
}

/**
 * Récupère la progression globale d'un utilisateur pour les quiz d'un cours
 */
export async function getQuizProgress(
  courseId: string,
  userId: string
): Promise<QuizProgress[]> {
  const quizzes = await db.quiz.findMany({
    where: { courseId },
    include: { attempts: { where: { userId } } },
  });

  return quizzes.map((quiz) => {
    const attempts = quiz.attempts;
    const bestScore = attempts.reduce(
      (max, a) => Math.max(max, a.percent),
      0
    );
    const hasPassed = attempts.some((a) => a.passed);

    return {
      courseId,
      quizId: quiz.id,
      totalAttempts: attempts.length,
      maxAttempts: quiz.maxAttempts,
      bestScore,
      passed: hasPassed,
      canAttempt: attempts.length < quiz.maxAttempts,
    };
  });
}

/**
 * Récupère un quiz formaté pour l'affichage (sans les réponses correctes)
 */
export function getQuizForDisplay(quiz: Quiz): Omit<Quiz, 'questions'> & {
  questions: Omit<QuizQuestion, 'correctAnswer' | 'explanation'>[];
} {
  return {
    id: quiz.id,
    courseId: quiz.courseId,
    title: quiz.title,
    description: quiz.description,
    timeLimitMinutes: quiz.timeLimitMinutes,
    passingScorePercent: quiz.passingScorePercent,
    maxAttempts: quiz.maxAttempts,
    questions: quiz.questions.map(({ correctAnswer, explanation, ...rest }) => rest),
  };
}
