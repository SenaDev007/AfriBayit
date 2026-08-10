// GET /api/academy/quiz/[courseId] — Récupérer le quiz d'un cours

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getQuizForDisplay } from '@/lib/quiz/engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;

    const quiz = await db.quiz.findFirst({
      where: { courseId },
      include: { attempts: true },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Aucun quiz trouvé pour ce cours.' },
        { status: 404 }
      );
    }

    // Formatter le quiz pour l'affichage (sans les réponses)
    const displayQuiz = getQuizForDisplay({
      id: quiz.id,
      courseId: quiz.courseId,
      title: quiz.title,
      description: quiz.description || '',
      timeLimitMinutes: quiz.timeLimit,
      passingScorePercent: quiz.passingScore,
      questions: quiz.questions as unknown as Array<{
        id: string;
        type: 'multiple_choice' | 'true_false' | 'short_answer';
        question: string;
        options?: string[];
        correctAnswer: string;
        explanation: string;
        points: number;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
      }>,
      maxAttempts: quiz.maxAttempts,
    });

    return NextResponse.json({
      quiz: displayQuiz,
      totalAttempts: quiz.attempts.length,
    });
  } catch (error) {
    console.error('Erreur récupération quiz:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du quiz.' },
      { status: 500 }
    );
  }
}
