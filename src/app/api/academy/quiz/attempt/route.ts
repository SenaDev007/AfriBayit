// POST /api/academy/quiz/attempt — Soumettre une tentative de quiz

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { evaluateAttempt, canAttempt } from '@/lib/quiz/engine';
import { earnPoints } from '@/lib/afripoints';
import type { Quiz, QuizQuestion } from '@/lib/quiz/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quizId, userId, answers } = body as {
      quizId: string;
      userId: string;
      answers: Record<string, string>;
    };

    if (!quizId || !userId || !answers) {
      return NextResponse.json(
        { error: 'quizId, userId et answers sont requis.' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur peut tenter le quiz
    const canTry = await canAttempt(quizId, userId);
    if (!canTry) {
      return NextResponse.json(
        { error: 'Nombre maximum de tentatives atteint.' },
        { status: 403 }
      );
    }

    // Récupérer le quiz
    const quizData = await db.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quizData) {
      return NextResponse.json(
        { error: 'Quiz introuvable.' },
        { status: 404 }
      );
    }

    const quiz: Quiz = {
      id: quizData.id,
      courseId: quizData.courseId,
      title: quizData.title,
      description: quizData.description || '',
      timeLimitMinutes: quizData.timeLimit,
      passingScorePercent: quizData.passingScore,
      questions: quizData.questions as unknown as QuizQuestion[],
      maxAttempts: quizData.maxAttempts,
    };

    // Évaluer les réponses
    const result = evaluateAttempt(quiz, answers);

    // Sauvegarder la tentative
    const attempt = await db.quizAttempt.create({
      data: {
        quizId,
        userId,
        answers: answers as unknown as object,
        score: result.score,
        maxScore: result.maxScore,
        percent: result.percentScore,
        passed: result.passed,
        completedAt: new Date(),
      },
    });

    // Attribuer des AfriPoints si réussi
    if (result.passed) {
      try {
        await earnPoints(userId, 'quiz_passed', { quizId, score: result.percentScore });
      } catch {
        // Ne pas bloquer si les points échouent
      }
    }

    return NextResponse.json({
      attemptId: attempt.id,
      score: result.score,
      maxScore: result.maxScore,
      percentScore: result.percentScore,
      passed: result.passed,
      feedback: result.feedback,
    });
  } catch (error) {
    console.error('Erreur soumission quiz:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la soumission du quiz.' },
      { status: 500 }
    );
  }
}
