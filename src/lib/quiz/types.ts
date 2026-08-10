// AfriBayit Quiz & Assessment Types

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingScorePercent: number;
  questions: QuizQuestion[];
  maxAttempts: number;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer';
export type QuizDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[]; // pour choix multiple
  correctAnswer: string;
  explanation: string;
  points: number;
  difficulty: QuizDifficulty;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, string>; // questionId → réponse
  score: number;
  maxScore: number;
  percentScore: number;
  passed: boolean;
  startedAt: Date;
  completedAt?: Date;
}

export interface QuizAttemptResult {
  attemptId: string;
  score: number;
  maxScore: number;
  percentScore: number;
  passed: boolean;
  feedback: QuestionFeedback[];
}

export interface QuestionFeedback {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  points: number;
  earnedPoints: number;
}

export interface QuizProgress {
  courseId: string;
  quizId: string;
  totalAttempts: number;
  maxAttempts: number;
  bestScore: number;
  passed: boolean;
  canAttempt: boolean;
}
