'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Send,
  RotateCcw,
} from 'lucide-react';
import { apiPost } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { QuizQuestion, QuestionFeedback } from '@/lib/constants';

// ─── Types ────────────────────────────────────────────────────────

interface QuizData {
  id: string;
  courseId: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingScorePercent: number;
  maxAttempts: number;
  questions: Omit<QuizQuestion, 'correctAnswer' | 'explanation'>[];
}

interface QuizResult {
  attemptId: string;
  score: number;
  maxScore: number;
  percentScore: number;
  passed: boolean;
  feedback: QuestionFeedback[];
}

interface QuizTakerProps {
  courseId: string;
  quiz: QuizData;
  userId: string;
  totalAttempts: number;
  onComplete?: (result: QuizResult) => void;
  onCertificateRequest?: () => void;
}

// ─── Component ────────────────────────────────────────────────────

export default function QuizTaker({
  courseId,
  quiz,
  userId,
  totalAttempts,
  onComplete,
  onCertificateRequest,
}: QuizTakerProps) {
  // ─── State ──────────────────────────────────────────────────────
  const [phase, setPhase] = useState<'intro' | 'taking' | 'results'>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimitMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalQuestions = quiz.questions.length;
  const canAttempt = totalAttempts < quiz.maxAttempts;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === totalQuestions;

  // ─── Timer ──────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          // Auto-submit when time runs out
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    if (phase === 'taking' && timerRef.current === null) {
      startTimer();
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, startTimer]);

  // ─── Format time ────────────────────────────────────────────────

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Handle answer ──────────────────────────────────────────────

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  // ─── Submit quiz ────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsSubmitting(true);
    try {
      const res = await apiPost<QuizResult>('/api/academy/quiz/attempt', {
        quizId: quiz.id,
        userId,
        answers,
      });

      setResult(res);
      setPhase('results');
      onComplete?.(res);
    } catch (err) {
      toast({
        title: 'Erreur',
        description:
          err instanceof Error
            ? err.message
            : 'Erreur lors de la soumission du quiz.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Certificate ────────────────────────────────────────────────

  const handleCertificate = async () => {
    try {
      const res = await apiPost<{
        success: boolean;
        certificateId: string;
        downloadUrl: string;
      }>('/api/academy/certificates/generate', {
        userId,
        courseId,
      });

      toast({
        title: 'Certificat généré !',
        description: 'Votre certificat est prêt à être téléchargé.',
      });

      onCertificateRequest?.();

      // Open download
      if (res.downloadUrl) {
        window.open(res.downloadUrl, '_blank');
      }
    } catch (err) {
      toast({
        title: 'Erreur',
        description:
          err instanceof Error
            ? err.message
            : 'Impossible de générer le certificat.',
        variant: 'destructive',
      });
    }
  };

  // ─── Intro Phase ────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border shadow-sm overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#003087]/10 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-[#003087]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#2C2E2F]">
                {quiz.title}
              </h2>
              <p className="text-sm text-gray-500">{quiz.description}</p>
            </div>
          </div>

          {/* Quiz info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#003087]">
                {totalQuestions}
              </p>
              <p className="text-xs text-gray-500">Questions</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#003087]">
                {quiz.timeLimitMinutes}
              </p>
              <p className="text-xs text-gray-500">Minutes</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#00A651]">
                {quiz.passingScorePercent}%
              </p>
              <p className="text-xs text-gray-500">Score requis</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#D4AF37]">
                {quiz.maxAttempts - totalAttempts}
              </p>
              <p className="text-xs text-gray-500">Tentatives restantes</p>
            </div>
          </div>

          {!canAttempt ? (
            <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl text-red-700 text-sm">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>
                Vous avez épuisé toutes vos tentatives ({quiz.maxAttempts}
                /{quiz.maxAttempts}).
              </span>
            </div>
          ) : (
            <button
              onClick={() => {
                setPhase('taking');
                setTimeLeft(quiz.timeLimitMinutes * 60);
              }}
              className="w-full py-3 bg-[#003087] text-white rounded-xl font-semibold hover:bg-[#0047b3] transition-colors"
            >
              Commencer le quiz
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // ─── Results Phase ──────────────────────────────────────────────

  if (phase === 'results' && result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border shadow-sm overflow-hidden"
      >
        <div className="p-6 sm:p-8">
          {/* Result banner */}
          <div
            className={`rounded-2xl p-6 text-center mb-6 ${
              result.passed
                ? 'bg-gradient-to-br from-[#00A651]/10 to-[#00A651]/5'
                : 'bg-gradient-to-br from-red-50 to-red-50/50'
            }`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              {result.passed ? (
                <CheckCircle2 className="w-16 h-16 text-[#00A651] mx-auto mb-3" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
              )}
            </motion.div>
            <h2
              className={`text-2xl font-bold mb-1 ${
                result.passed ? 'text-[#00A651]' : 'text-red-600'
              }`}
            >
              {result.passed ? 'Félicitations !' : 'Pas encore...'}
            </h2>
            <p className="text-gray-600">
              {result.passed
                ? 'Vous avez réussi ce quiz !'
                : `Score insuffisant. Il vous faut ${quiz.passingScorePercent}% pour réussir.`}
            </p>

            {/* Score display */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#003087]">
                  {result.percentScore}%
                </p>
                <p className="text-xs text-gray-500">Votre score</p>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-400">
                  {result.score}/{result.maxScore}
                </p>
                <p className="text-xs text-gray-500">Points</p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {result.passed && (
              <button
                onClick={handleCertificate}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#D4AF37] text-white rounded-xl font-semibold hover:bg-[#c9a22e] transition-colors"
              >
                <Award className="w-5 h-5" />
                Obtenir mon certificat
              </button>
            )}
            {!result.passed && canAttempt && (
              <button
                onClick={() => {
                  setPhase('intro');
                  setAnswers({});
                  setCurrentQuestion(0);
                  setResult(null);
                  setShowReview(false);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#003087] text-white rounded-xl font-semibold hover:bg-[#0047b3] transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Réessayer ({quiz.maxAttempts - totalAttempts - 1} tentatives
                restantes)
              </button>
            )}
            <button
              onClick={() => setShowReview(!showReview)}
              className="flex-1 flex items-center justify-center gap-2 py-3 border rounded-xl font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {showReview ? 'Masquer' : 'Voir'} les réponses
            </button>
          </div>

          {/* Review answers */}
          <AnimatePresence>
            {showReview && result.feedback && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 max-h-96 overflow-y-auto"
              >
                {result.feedback.map((fb, idx) => (
                  <div
                    key={fb.questionId}
                    className={`p-4 rounded-xl border ${
                      fb.isCorrect
                        ? 'border-[#00A651]/30 bg-[#00A651]/5'
                        : 'border-red-200 bg-red-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {fb.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 text-[#00A651] flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2C2E2F] mb-1">
                          {idx + 1}. {fb.question}
                        </p>
                        <p className="text-xs text-gray-500">
                          Votre réponse :{' '}
                          <span
                            className={
                              fb.isCorrect
                                ? 'text-[#00A651] font-medium'
                                : 'text-red-600 font-medium'
                            }
                          >
                            {fb.userAnswer || '—'}
                          </span>
                        </p>
                        {!fb.isCorrect && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Bonne réponse :{' '}
                            <span className="text-[#00A651] font-medium">
                              {fb.correctAnswer}
                            </span>
                          </p>
                        )}
                        {fb.explanation && (
                          <p className="text-xs text-gray-400 mt-1 italic">
                            {fb.explanation}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-gray-400 flex-shrink-0">
                        {fb.earnedPoints}/{fb.points} pts
                      </span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // ─── Taking Phase ───────────────────────────────────────────────

  const question = quiz.questions[currentQuestion];
  const isLowTime = timeLeft < 60;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border shadow-sm overflow-hidden"
    >
      {/* Header bar */}
      <div className="p-4 border-b bg-gradient-to-r from-[#003087]/5 to-transparent flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[#2C2E2F] text-sm">
            {quiz.title}
          </h3>
          <p className="text-xs text-gray-500">
            Question {currentQuestion + 1} sur {totalQuestions}
          </p>
        </div>

        {/* Timer */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono font-bold ${
            isLowTime
              ? 'bg-red-50 text-red-600 animate-pulse'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress dots */}
      <div className="px-4 py-2 flex gap-1 overflow-x-auto border-b">
        {quiz.questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestion(idx)}
            className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center transition-all flex-shrink-0 ${
              idx === currentQuestion
                ? 'bg-[#003087] text-white ring-2 ring-[#003087]/30'
                : answers[q.id]
                ? 'bg-[#00A651]/10 text-[#00A651] border border-[#00A651]/30'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Question content */}
      <div className="p-4 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <h3 className="text-base sm:text-lg font-semibold text-[#2C2E2F] mb-4">
              {question.question}
            </h3>

            {/* Multiple choice options */}
            {question.type === 'multiple_choice' && question.options && (
              <div className="space-y-2">
                {question.options.map((option, optIdx) => {
                  const isSelected = answers[question.id] === option;
                  const optionLetter = String.fromCharCode(65 + optIdx);

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleAnswer(question.id, option)}
                      className={`w-full text-left p-3 sm:p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-[#003087] bg-[#003087]/5'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-[#003087] text-white'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {optionLetter}
                      </span>
                      <span
                        className={`text-sm ${
                          isSelected
                            ? 'text-[#003087] font-medium'
                            : 'text-gray-700'
                        }`}
                      >
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* True/False */}
            {question.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-3">
                {['Vrai', 'Faux'].map((option) => {
                  const isSelected = answers[question.id] === option;
                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswer(question.id, option)}
                      className={`p-4 rounded-xl border-2 text-center font-semibold transition-all ${
                        isSelected
                          ? option === 'Vrai'
                            ? 'border-[#00A651] bg-[#00A651]/5 text-[#00A651]'
                            : 'border-red-400 bg-red-50 text-red-600'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short answer */}
            {question.type === 'short_answer' && (
              <textarea
                value={answers[question.id] || ''}
                onChange={(e) =>
                  handleAnswer(question.id, e.target.value)
                }
                placeholder="Écrivez votre réponse ici..."
                className="w-full p-4 border-2 border-gray-200 rounded-xl text-sm focus:border-[#003087] focus:outline-none resize-none h-32"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer actions */}
      <div className="p-4 border-t bg-gray-50/50 flex items-center justify-between">
        <button
          onClick={() =>
            setCurrentQuestion(Math.max(0, currentQuestion - 1))
          }
          disabled={currentQuestion === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium text-gray-600 border hover:bg-gray-100 transition-colors disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          Précédent
        </button>

        <span className="text-xs text-gray-400">
          {answeredCount}/{totalQuestions} répondues
        </span>

        {currentQuestion < totalQuestions - 1 ? (
          <button
            onClick={() =>
              setCurrentQuestion(
                Math.min(totalQuestions - 1, currentQuestion + 1)
              )
            }
            className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium text-white bg-[#003087] hover:bg-[#0047b3] transition-colors"
          >
            Suivant
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !allAnswered}
            className="flex items-center gap-1 px-5 py-2 rounded-full text-sm font-semibold text-white bg-[#D4AF37] hover:bg-[#c9a22e] transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Soumettre
              </>
            )}
          </button>
        )}
      </div>

      {/* Unanswered warning */}
      {!allAnswered && currentQuestion === totalQuestions - 1 && (
        <div className="px-4 pb-3">
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {totalQuestions - answeredCount} question(s) sans réponse. Vous
            pouvez naviguer entre les questions.
          </p>
        </div>
      )}
    </motion.div>
  );
}
