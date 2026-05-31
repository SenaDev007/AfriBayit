'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────
interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

interface PointsData {
  balance: number;
  level: { name: string; icon: string; color: string; minPoints: number };
  nextLevel: { level: { name: string; icon: string; minPoints: number }; pointsNeeded: number } | null;
  history: Array<{ id: string; type: string; action: string; points: number; balanceAfter: number; createdAt: string }>;
}

interface AmbassadorData {
  isAmbassador: boolean;
  ambassador: {
    tier: string;
    tierInfo: { name: string; nameFr: string; commissionRate: number; benefits: string[]; icon: string; color: string };
    referralCode: string;
    referralLink: string;
    totalReferrals: number;
    totalEarnings: number;
  } | null;
}

interface CredibilityData {
  total: number;
  factors: Array<{ key: string; name: string; weight: number; score: number; weightedScore: number }>;
}

// ─── Constants ────────────────────────────────────────────
const easeOut = [0.16, 1, 0.3, 1] as const;
const DEMO_USER_ID = 'demo-user-001';

const FEATURE_TABS = [
  { key: 'quiz', label: 'Quiz Academy', icon: '📝', color: '#003087' },
  { key: 'certificates', label: 'Certificats', icon: '🏅', color: '#D4AF37' },
  { key: 'afripoints', label: 'AfriPoints', icon: '💰', color: '#00A651' },
  { key: 'ambassador', label: 'Ambassadeur', icon: '🤝', color: '#009CDE' },
  { key: 'credibility', label: 'Crédibilité', icon: '⭐', color: '#D4AF37' },
  { key: 'profile', label: 'Profil Pro', icon: '👤', color: '#8B5CF6' },
] as const;

type FeatureTab = (typeof FEATURE_TABS)[number]['key'];

// ─── Demo Quiz Data ───────────────────────────────────────
const DEMO_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    type: 'multiple_choice',
    question: 'Quel document est indispensable pour prouver la propriété d\'un terrain au Bénin ?',
    options: ['Le titre foncier', 'Le reçu de paiement', 'Le bail verbal', 'Le contrat sous seing privé'],
    correctAnswer: 'Le titre foncier',
    explanation: 'Le titre foncier est le document officiel qui atteste de la propriété d\'un terrain au Bénin.',
    points: 2,
  },
  {
    id: 'q2',
    type: 'true_false',
    question: 'Au Bénin, un contrat de bail verbal a la même valeur juridique qu\'un bail écrit.',
    options: ['Vrai', 'Faux'],
    correctAnswer: 'Faux',
    explanation: 'Un bail écrit est nécessaire pour garantir les droits du locataire et du propriétaire.',
    points: 1,
  },
  {
    id: 'q3',
    type: 'multiple_choice',
    question: 'Quel est le rôle du notaire dans une transaction immobilière ?',
    options: ['Construire la maison', 'Authentifier les actes et vérifier la légalité', 'Financer l\'achat', 'Gérer la publicité'],
    correctAnswer: 'Authentifier les actes et vérifier la légalité',
    explanation: 'Le notaire authentifie les actes de vente et s\'assure de la conformité juridique de la transaction.',
    points: 2,
  },
  {
    id: 'q4',
    type: 'multiple_choice',
    question: 'Quelle est la durée maximale d\'un bail d\'habitation en Côte d\'Ivoire ?',
    options: ['3 ans', '6 ans', '9 ans', '12 ans'],
    correctAnswer: '9 ans',
    explanation: 'En Côte d\'Ivoire, la durée maximale d\'un bail d\'habitation est de 9 ans.',
    points: 2,
  },
  {
    id: 'q5',
    type: 'true_false',
    question: 'Le géomètre est responsable de la validation juridique d\'un titre foncier.',
    options: ['Vrai', 'Faux'],
    correctAnswer: 'Faux',
    explanation: 'Le géomètre effectue des mesures topographiques, mais la validation juridique relève du notaire.',
    points: 1,
  },
  {
    id: 'q6',
    type: 'multiple_choice',
    question: 'Quel système AfriBayit utilise-t-il pour sécuriser les transactions ?',
    options: ['Paiement direct au vendeur', 'Système de séquestre (escrow)', 'Virement bancaire simple', 'Paiement mobile direct'],
    correctAnswer: 'Système de séquestre (escrow)',
    explanation: 'AfriBayit utilise un système de séquestre (escrow) pour sécuriser les fonds pendant la transaction.',
    points: 2,
  },
];

const LEVELS = [
  { name: 'Bronze', minPoints: 0, icon: '🥉', color: '#CD7F32' },
  { name: 'Argent', minPoints: 200, icon: '🥈', color: '#C0C0C0' },
  { name: 'Or', minPoints: 500, icon: '🥇', color: '#FFD700' },
  { name: 'Platine', minPoints: 1500, icon: '💎', color: '#E5E4E2' },
  { name: 'Diamant', minPoints: 5000, icon: '👑', color: '#B9F2FF' },
];

function getLevelForPoints(points: number) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (points >= l.minPoints) level = l;
  }
  return level;
}

function getNextLevel(points: number) {
  for (const level of LEVELS) {
    if (points < level.minPoints) return { level, pointsNeeded: level.minPoints - points };
  }
  return null;
}

// ─── Main Component ───────────────────────────────────────
export default function HomePage() {
  const [activeTab, setActiveTab] = useState<FeatureTab>('quiz');

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; maxScore: number; percent: number; passed: boolean } | null>(null);

  // AfriPoints state
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [pointsLoading, setPointsLoading] = useState(false);

  // Ambassador state
  const [ambassadorData, setAmbassadorData] = useState<AmbassadorData | null>(null);
  const [ambassadorLoading, setAmbassadorLoading] = useState(false);

  // Credibility state
  const [credibilityData, setCredibilityData] = useState<CredibilityData | null>(null);
  const [credibilityLoading, setCredibilityLoading] = useState(false);

  // Certificate state
  const [certGenerating, setCertGenerating] = useState(false);
  const [certGenerated, setCertGenerated] = useState(false);

  // ─── Fetch AfriPoints ────────────────────────────
  const fetchPoints = useCallback(async () => {
    setPointsLoading(true);
    try {
      const res = await fetch(`/api/afripoints?userId=${DEMO_USER_ID}`);
      if (res.ok) {
        const data = await res.json();
        const level = getLevelForPoints(data.balance);
        const nextLevel = getNextLevel(data.balance);
        setPointsData({ ...data, level, nextLevel });
      }
    } catch {
      // Use demo data
      setPointsData({
        balance: 850,
        level: { name: 'Or', icon: '🥇', color: '#FFD700', minPoints: 500 },
        nextLevel: { level: { name: 'Platine', icon: '💎', minPoints: 1500 }, pointsNeeded: 650 },
        history: [
          { id: '1', type: 'earn', action: 'quiz_passed', points: 10, balanceAfter: 850, createdAt: new Date().toISOString() },
          { id: '2', type: 'earn', action: 'course_completed', points: 25, balanceAfter: 840, createdAt: new Date().toISOString() },
          { id: '3', type: 'earn', action: 'profile_completed', points: 50, balanceAfter: 815, createdAt: new Date().toISOString() },
          { id: '4', type: 'spend', action: 'boost_listing_7d', points: -200, balanceAfter: 765, createdAt: new Date().toISOString() },
          { id: '5', type: 'earn', action: 'post_created', points: 5, balanceAfter: 965, createdAt: new Date().toISOString() },
        ],
      });
    } finally {
      setPointsLoading(false);
    }
  }, []);

  // ─── Fetch Ambassador ────────────────────────────
  const fetchAmbassador = useCallback(async () => {
    setAmbassadorLoading(true);
    try {
      const res = await fetch(`/api/ambassador?userId=${DEMO_USER_ID}`);
      if (res.ok) {
        const data = await res.json();
        setAmbassadorData(data);
        return;
      }
    } catch {
      // Use demo data
    }
    setAmbassadorData({
      isAmbassador: true,
      ambassador: {
        tier: 'silver',
        tierInfo: {
          name: 'Silver Ambassador',
          nameFr: 'Ambassadeur Argent',
          commissionRate: 0.10,
          benefits: ['Lien de parrainage', 'Commission 10%', 'Page personnalisée', 'Support prioritaire'],
          icon: '🥈',
          color: '#C0C0C0',
        },
        referralCode: 'adama-A7X9',
        referralLink: 'https://afribayit.com/ref/adama-A7X9',
        totalReferrals: 12,
        totalEarnings: 75000,
      },
    });
    setAmbassadorLoading(false);
  }, []);

  // ─── Fetch Credibility ──────────────────────────
  const fetchCredibility = useCallback(async () => {
    setCredibilityLoading(true);
    try {
      const res = await fetch(`/api/credibility/${DEMO_USER_ID}`);
      if (res.ok) {
        const data = await res.json();
        setCredibilityData(data);
        return;
      }
    } catch {
      // Use demo data
    }
    setCredibilityData({
      total: 72,
      factors: [
        { key: 'profile_completeness', name: 'Complétude du profil', weight: 20, score: 85, weightedScore: 17 },
        { key: 'verification_status', name: 'Statut de vérification', weight: 25, score: 65, weightedScore: 16.25 },
        { key: 'activity_score', name: 'Score d\'activité', weight: 20, score: 70, weightedScore: 14 },
        { key: 'endorsements', name: 'Recommandations', weight: 15, score: 55, weightedScore: 8.25 },
        { key: 'transaction_history', name: 'Historique transactions', weight: 20, score: 80, weightedScore: 16 },
      ],
    });
    setCredibilityLoading(false);
  }, []);

  // ─── Load data on tab change ─────────────────────
  useEffect(() => {
    if (activeTab === 'afripoints' && !pointsData) fetchPoints();
    if (activeTab === 'ambassador' && !ambassadorData) fetchAmbassador();
    if (activeTab === 'credibility' && !credibilityData) fetchCredibility();
  }, [activeTab, pointsData, ambassadorData, credibilityData, fetchPoints, fetchAmbassador, fetchCredibility]);

  // ─── Quiz Logic ──────────────────────────────────
  const handleAnswerSelect = (questionId: string, answer: string) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < DEMO_QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Evaluate quiz
      let score = 0;
      let maxScore = 0;
      for (const q of DEMO_QUIZ_QUESTIONS) {
        maxScore += q.points;
        const userAnswer = quizAnswers[q.id] || '';
        if (userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
          score += q.points;
        }
      }
      const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      setQuizResult({ score, maxScore, percent, passed: percent >= 70 });
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setQuizAnswers({});
    setQuizCompleted(false);
    setQuizResult(null);
  };

  // ─── Earn Points Demo ────────────────────────────
  const handleEarnPoints = async (action: string) => {
    try {
      const res = await fetch('/api/afripoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: DEMO_USER_ID, type: 'earn', action }),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: `+${data.points} AfriPoints !`, description: `Action: ${action}. Nouveau solde: ${data.newBalance}` });
        fetchPoints();
      }
    } catch {
      toast({ title: 'Action enregistrée', description: `+${action === 'quiz_passed' ? 10 : action === 'post_created' ? 5 : 25} points (demo)` });
    }
  };

  // ─── Generate Certificate ────────────────────────
  const handleGenerateCert = async () => {
    setCertGenerating(true);
    try {
      const res = await fetch('/api/academy/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: DEMO_USER_ID, courseId: 'demo-course-001' }),
      });
      if (res.ok) {
        setCertGenerated(true);
        toast({ title: 'Certificat généré !', description: 'Votre certificat PDF est prêt.' });
      }
    } catch {
      // Demo success
      setCertGenerated(true);
      toast({ title: 'Certificat généré !', description: 'Certificat de réussite AfriBayit Academy (demo).' });
    }
    setCertGenerating(false);
  };

  // ─── Apply Ambassador ────────────────────────────
  const handleApplyAmbassador = async () => {
    try {
      const res = await fetch('/api/ambassador', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: DEMO_USER_ID }),
      });
      if (res.ok) {
        toast({ title: 'Bienvenue ambassadeur !', description: 'Votre profil ambassadeur a été créé.' });
        fetchAmbassador();
      }
    } catch {
      toast({ title: 'Inscription réussie (demo)', description: 'Votre profil ambassadeur a été créé.' });
    }
  };

  // ──────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003087] via-[#0047b3] to-[#003087] text-white pt-20 pb-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl sm:text-4xl font-bold mb-2"
            >
              AfriBayit <span className="text-[#D4AF37]">Platform</span>
            </motion.h1>
            <p className="text-sm text-white/70 max-w-xl mx-auto">
              Quiz Academy · Certificats · AfriPoints · Ambassadeur · Crédibilité · Profils Professionnels
            </p>
          </div>

          {/* Feature Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mt-6 justify-center flex-wrap">
            {FEATURE_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'bg-white text-[#003087] shadow-lg shadow-white/20'
                    : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
                }`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* ════════ QUIZ TAB ════════ */}
          {activeTab === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: easeOut }}
            >
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                {/* Quiz Header */}
                <div className="bg-gradient-to-r from-[#003087] to-[#0047b3] p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">📝</span>
                    <div>
                      <h2 className="font-display text-xl font-bold">Quiz — Droit Foncier Africain</h2>
                      <p className="text-sm text-white/70">Testez vos connaissances · 6 questions · 30 min · Score minimum 70%</p>
                    </div>
                  </div>
                  {quizStarted && !quizCompleted && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                        <span>Question {currentQuestion + 1} / {DEMO_QUIZ_QUESTIONS.length}</span>
                        <span>{Math.round(((currentQuestion + 1) / DEMO_QUIZ_QUESTIONS.length) * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${((currentQuestion + 1) / DEMO_QUIZ_QUESTIONS.length) * 100}%` }}
                          className="h-full bg-[#D4AF37] rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {!quizStarted ? (
                    /* Start Screen */
                    <div className="text-center py-8">
                      <span className="text-5xl block mb-4">🧠</span>
                      <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-2">Prêt à tester vos connaissances ?</h3>
                      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                        Ce quiz couvre le droit foncier en Afrique de l&apos;Ouest : Bénin, Côte d&apos;Ivoire, Burkina Faso et Togo.
                        Réussissez avec un score de 70% ou plus pour obtenir votre certificat.
                      </p>
                      <div className="flex flex-wrap gap-3 justify-center mb-6">
                        <span className="px-3 py-1.5 bg-[#003087]/5 text-[#003087] text-xs font-semibold rounded-full">6 Questions</span>
                        <span className="px-3 py-1.5 bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-semibold rounded-full">30 Minutes</span>
                        <span className="px-3 py-1.5 bg-[#00A651]/10 text-[#00A651] text-xs font-semibold rounded-full">3 Tentatives max</span>
                      </div>
                      <button
                        onClick={() => setQuizStarted(true)}
                        className="px-8 py-3 bg-[#003087] text-white rounded-full font-semibold hover:bg-[#0047b3] transition-colors"
                      >
                        Commencer le Quiz →
                      </button>
                    </div>
                  ) : quizCompleted && quizResult ? (
                    /* Results Screen */
                    <div className="text-center py-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className={`w-28 h-28 rounded-full mx-auto mb-4 flex items-center justify-center ${
                          quizResult.passed ? 'bg-[#00A651]/10' : 'bg-[#D4AF37]/10'
                        }`}
                      >
                        <span className="text-5xl">{quizResult.passed ? '🎉' : '📚'}</span>
                      </motion.div>
                      <h3 className={`font-display text-2xl font-bold mb-2 ${quizResult.passed ? 'text-[#00A651]' : 'text-[#D4AF37]'}`}>
                        {quizResult.passed ? 'Félicitations !' : 'Presque !'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Score: <span className="font-mono font-bold">{quizResult.percent}%</span> ({quizResult.score}/{quizResult.maxScore} points)
                      </p>

                      {/* Score Bar */}
                      <div className="max-w-xs mx-auto mb-6">
                        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${quizResult.percent}%` }}
                            transition={{ duration: 1.5, ease: easeOut }}
                            className={`h-full rounded-full ${quizResult.passed ? 'bg-gradient-to-r from-[#00A651] to-[#00C65A]' : 'bg-gradient-to-r from-[#D4AF37] to-[#FFD700]'}`}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                          <span>0%</span>
                          <span className="text-[#00A651] font-bold">70% (minimum)</span>
                          <span>100%</span>
                        </div>
                      </div>

                      {/* Feedback */}
                      <div className="max-w-lg mx-auto text-left space-y-2 mb-6">
                        {DEMO_QUIZ_QUESTIONS.map((q, i) => {
                          const userAnswer = quizAnswers[q.id] || '';
                          const isCorrect = userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim();
                          return (
                            <div key={q.id} className={`p-3 rounded-2xl ${isCorrect ? 'bg-[#00A651]/5 border border-[#00A651]/20' : 'bg-red-50 border border-red-200'}`}>
                              <div className="flex items-start gap-2">
                                <span className="mt-0.5">{isCorrect ? '✅' : '❌'}</span>
                                <div>
                                  <p className="text-xs font-semibold text-[#2C2E2F]">Q{i + 1}: {q.question}</p>
                                  {!isCorrect && <p className="text-xs text-red-600 mt-0.5">Votre réponse: {userAnswer || 'Non répondu'}</p>}
                                  <p className="text-xs text-[#00A651] mt-0.5">Réponse correcte: {q.correctAnswer}</p>
                                  <p className="text-xs text-gray-500 mt-1">{q.explanation}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-3 justify-center">
                        <button onClick={resetQuiz} className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-full font-semibold hover:bg-gray-50 transition-colors">
                          Recommencer
                        </button>
                        {quizResult.passed && (
                          <button onClick={() => setActiveTab('certificates')} className="px-6 py-2.5 bg-[#D4AF37] text-white rounded-full font-semibold hover:bg-[#c9a030] transition-colors">
                            🏅 Obtenir mon Certificat
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Question Screen */
                    <div>
                      {(() => {
                        const q = DEMO_QUIZ_QUESTIONS[currentQuestion];
                        return (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <span className="px-2.5 py-1 bg-[#003087] text-white text-[10px] font-bold rounded-full">
                                Q{currentQuestion + 1}
                              </span>
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-full">
                                {q.type === 'multiple_choice' ? 'Choix multiple' : q.type === 'true_false' ? 'Vrai/Faux' : 'Réponse courte'}
                              </span>
                              <span className="px-2.5 py-1 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-semibold rounded-full ml-auto">
                                {q.points} pt{q.points > 1 ? 's' : ''}
                              </span>
                            </div>
                            <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-5">{q.question}</h3>

                            {q.options ? (
                              <div className="space-y-2.5">
                                {q.options.map((option) => (
                                  <button
                                    key={option}
                                    onClick={() => handleAnswerSelect(q.id, option)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                                      quizAnswers[q.id] === option
                                        ? 'border-[#003087] bg-[#003087]/5 text-[#003087] font-semibold'
                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 text-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                        quizAnswers[q.id] === option ? 'border-[#003087] bg-[#003087]' : 'border-gray-300'
                                      }`}>
                                        {quizAnswers[q.id] === option && (
                                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                          </svg>
                                        )}
                                      </div>
                                      <span className="text-sm">{option}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <input
                                type="text"
                                placeholder="Votre réponse..."
                                value={quizAnswers[q.id] || ''}
                                onChange={(e) => handleAnswerSelect(q.id, e.target.value)}
                                className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-[#003087] focus:outline-none text-sm"
                              />
                            )}

                            <div className="flex justify-between mt-6">
                              <button
                                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestion === 0}
                                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-full font-semibold hover:bg-gray-50 transition-colors disabled:opacity-30"
                              >
                                ← Précédent
                              </button>
                              <button
                                onClick={handleNextQuestion}
                                disabled={!quizAnswers[q.id]}
                                className="px-6 py-2.5 bg-[#003087] text-white rounded-full font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-30"
                              >
                                {currentQuestion === DEMO_QUIZ_QUESTIONS.length - 1 ? 'Terminer ✓' : 'Suivant →'}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════ CERTIFICATES TAB ════════ */}
          {activeTab === 'certificates' && (
            <motion.div
              key="certificates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: easeOut }}
            >
              <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="bg-gradient-to-r from-[#D4AF37] to-[#c9a030] p-6 text-white">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🏅</span>
                    <div>
                      <h2 className="font-display text-xl font-bold">Certificats AfriBayit Academy</h2>
                      <p className="text-sm text-white/70">Générez et vérifiez vos certificats de réussite</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Certificate Preview */}
                  <div className="bg-gradient-to-br from-[#003087]/5 to-[#D4AF37]/5 rounded-3xl p-8 border-2 border-[#D4AF37]/20 relative overflow-hidden">
                    {/* Decorative corners */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#003087]/30" />
                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#003087]/30" />
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#003087]/30" />
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#003087]/30" />

                    <div className="text-center">
                      <p className="text-xs text-[#D4AF37] font-semibold tracking-wider mb-1">AFRIBAYIT ACADEMY</p>
                      <h3 className="font-display text-2xl font-bold text-[#003087] mb-4">CERTIFICAT DE RÉUSSITE</h3>

                      <p className="text-xs text-gray-500 mb-2">Ce certificat est délivré à</p>
                      <p className="font-display text-xl font-bold text-[#003087] mb-3">Adama Diallo</p>

                      <div className="w-20 h-0.5 bg-[#D4AF37] mx-auto mb-3" />

                      <p className="text-xs text-gray-500 mb-2">Pour avoir complété avec succès le cours</p>
                      <p className="text-sm font-semibold text-[#2C2E2F] italic mb-4">&ldquo;Droit Foncier en Afrique de l&apos;Ouest&rdquo;</p>

                      <p className="text-xs text-gray-500 mb-1">Instructeur: <span className="text-[#003087] font-semibold">Me. Kofi Mensah</span></p>
                      <p className="text-xs text-gray-400 mt-3">ID: AFB-C-{Date.now().toString(36).toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Certificate Types */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    {[
                      { type: 'course_completion', label: 'Réussite', desc: 'Cours terminé + quiz réussi', icon: '🏅', color: '#003087' },
                      { type: 'workshop', label: 'Participation', desc: 'Atelier ou workshop', icon: '📜', color: '#009CDE' },
                      { type: 'masterclass', label: 'Masterclass', desc: 'Formation d\'excellence', icon: '👑', color: '#D4AF37' },
                    ].map(cert => (
                      <div key={cert.type} className="p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow text-center">
                        <span className="text-3xl block mb-2">{cert.icon}</span>
                        <h4 className="text-sm font-bold text-[#2C2E2F]">{cert.label}</h4>
                        <p className="text-xs text-gray-500 mt-1">{cert.desc}</p>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 mt-6 justify-center">
                    <button
                      onClick={handleGenerateCert}
                      disabled={certGenerating || certGenerated}
                      className="px-6 py-2.5 bg-[#D4AF37] text-white rounded-full font-semibold hover:bg-[#c9a030] transition-colors disabled:opacity-50"
                    >
                      {certGenerating ? '⏳ Génération...' : certGenerated ? '✅ Certificat Généré' : '🏅 Générer le Certificat'}
                    </button>
                    {certGenerated && (
                      <button className="px-6 py-2.5 border border-[#003087] text-[#003087] rounded-full font-semibold hover:bg-[#003087]/5 transition-colors">
                        📥 Télécharger PDF
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════ AFRIPOINTS TAB ════════ */}
          {activeTab === 'afripoints' && (
            <motion.div
              key="afripoints"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: easeOut }}
            >
              <div className="space-y-6">
                {/* Points Overview */}
                <div className="bg-gradient-to-r from-[#00A651] to-[#00C65A] rounded-3xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/70">Votre solde AfriPoints</p>
                      <motion.p
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="font-mono text-4xl font-bold mt-1"
                      >
                        {pointsLoading ? '...' : (pointsData?.balance ?? 850).toLocaleString()}
                      </motion.p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xl">{pointsData?.level.icon ?? '🥇'}</span>
                        <span className="text-sm font-semibold">{pointsData?.level.name ?? 'Or'}</span>
                        {pointsData?.nextLevel && (
                          <span className="text-xs text-white/60">
                            · {pointsData.nextLevel.pointsNeeded} pts → {pointsData.nextLevel.level.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-5xl">💰</span>
                    </div>
                  </div>

                  {/* Level Progress */}
                  <div className="mt-4">
                    <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(((pointsData?.balance ?? 850) / 1500) * 100, 100)}%`}}
                        transition={{ duration: 1, ease: easeOut }}
                        className="h-full bg-white rounded-full"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-white/60 mt-1">
                      {LEVELS.map(l => (
                        <span key={l.name}>{l.icon} {l.name}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-3xl shadow-sm border p-6">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Gagner des points</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { action: 'quiz_passed', label: 'Quiz réussi', points: 10, icon: '📝' },
                      { action: 'course_completed', label: 'Cours terminé', points: 25, icon: '📚' },
                      { action: 'certificate_earned', label: 'Certificat obtenu', points: 15, icon: '🏅' },
                      { action: 'post_created', label: 'Publication', points: 5, icon: '✍️' },
                      { action: 'review_written', label: 'Avis écrit', points: 10, icon: '💬' },
                      { action: 'property_published', label: 'Annonce publiée', points: 20, icon: '🏠' },
                      { action: 'event_attended', label: 'Événement', points: 15, icon: '🎉' },
                      { action: 'referral_signup', label: 'Parrainage', points: 100, icon: '🤝' },
                    ].map(item => (
                      <button
                        key={item.action}
                        onClick={() => handleEarnPoints(item.action)}
                        className="p-3 rounded-2xl border border-gray-100 hover:border-[#00A651]/30 hover:bg-[#00A651]/5 transition-all text-center group"
                      >
                        <span className="text-2xl block mb-1">{item.icon}</span>
                        <p className="text-xs font-semibold text-[#2C2E2F]">{item.label}</p>
                        <p className="text-[10px] text-[#00A651] font-bold mt-0.5">+{item.points} pts</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Spending & History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Spend Points */}
                  <div className="bg-white rounded-3xl shadow-sm border p-6">
                    <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Dépenser des points</h3>
                    <div className="space-y-2.5">
                      {[
                        { item: 'boost_listing_7d', label: 'Boost annonce 7j', cost: 200, icon: '🚀' },
                        { item: 'boost_listing_30d', label: 'Boost annonce 30j', cost: 500, icon: '🔥' },
                        { item: 'course_discount_10', label: 'Réduction cours 10%', cost: 150, icon: '📉' },
                        { item: 'course_discount_25', label: 'Réduction cours 25%', cost: 300, icon: '📉' },
                        { item: 'premium_feature', label: 'Fonctionnalité premium', cost: 100, icon: '⭐' },
                      ].map(spend => (
                        <div key={spend.item} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg">{spend.icon}</span>
                            <span className="text-sm font-medium text-[#2C2E2F]">{spend.label}</span>
                          </div>
                          <span className="font-mono text-xs font-bold text-[#D4AF37]">{spend.cost} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Transaction History */}
                  <div className="bg-white rounded-3xl shadow-sm border p-6">
                    <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Historique récent</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {(pointsData?.history ?? [
                        { id: '1', type: 'earn', action: 'quiz_passed', points: 10, balanceAfter: 850, createdAt: new Date().toISOString() },
                        { id: '2', type: 'earn', action: 'course_completed', points: 25, balanceAfter: 840, createdAt: new Date().toISOString() },
                        { id: '3', type: 'spend', action: 'boost_listing_7d', points: -200, balanceAfter: 765, createdAt: new Date().toISOString() },
                        { id: '4', type: 'earn', action: 'profile_completed', points: 50, balanceAfter: 815, createdAt: new Date().toISOString() },
                      ]).map(tx => (
                        <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              tx.type === 'earn' ? 'bg-[#00A651]/10 text-[#00A651]' : 'bg-[#D4AF37]/10 text-[#D4AF37]'
                            }`}>
                              {tx.type === 'earn' ? '+' : '-'}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-[#2C2E2F]">{tx.action.replace(/_/g, ' ')}</p>
                              <p className="text-[10px] text-gray-400">Solde: {tx.balanceAfter}</p>
                            </div>
                          </div>
                          <span className={`font-mono text-sm font-bold ${tx.type === 'earn' ? 'text-[#00A651]' : 'text-[#D4AF37]'}`}>
                            {tx.points > 0 ? '+' : ''}{tx.points}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════ AMBASSADOR TAB ════════ */}
          {activeTab === 'ambassador' && (
            <motion.div
              key="ambassador"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: easeOut }}
            >
              <div className="space-y-6">
                {/* Ambassador Status */}
                <div className="bg-gradient-to-r from-[#009CDE] to-[#00b4f0] rounded-3xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-white/70">Programme Ambassadeur</p>
                      <h2 className="font-display text-xl font-bold mt-1 flex items-center gap-2">
                        {ambassadorData?.ambassador?.tierInfo.icon ?? '🥈'} {ambassadorData?.ambassador?.tierInfo.nameFr ?? 'Ambassadeur Argent'}
                      </h2>
                    </div>
                    <span className="text-5xl">🤝</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-2xl p-3 text-center">
                      <p className="font-mono text-xl font-bold">{ambassadorData?.ambassador?.totalReferrals ?? 12}</p>
                      <p className="text-[10px] text-white/70">Parrainages</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3 text-center">
                      <p className="font-mono text-xl font-bold">{((ambassadorData?.ambassador?.totalEarnings ?? 75000) / 1000).toFixed(0)}K</p>
                      <p className="text-[10px] text-white/70">Gains (FCFA)</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-3 text-center">
                      <p className="font-mono text-xl font-bold">{((ambassadorData?.ambassador?.tierInfo.commissionRate ?? 0.10) * 100).toFixed(0)}%</p>
                      <p className="text-[10px] text-white/70">Commission</p>
                    </div>
                  </div>
                </div>

                {/* Tiers Comparison */}
                <div className="bg-white rounded-3xl shadow-sm border p-6">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Paliers Ambassadeur</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { tier: 'bronze', name: 'Bronze', commission: '5%', referrals: '5+', icon: '🥉', color: '#CD7F32', current: ambassadorData?.ambassador?.tier === 'bronze' },
                      { tier: 'silver', name: 'Argent', commission: '10%', referrals: '20+', icon: '🥈', color: '#C0C0C0', current: ambassadorData?.ambassador?.tier === 'silver' },
                      { tier: 'gold', name: 'Or', commission: '15%', referrals: '50+', icon: '🥇', color: '#FFD700', current: ambassadorData?.ambassador?.tier === 'gold' },
                    ].map(t => (
                      <div key={t.tier} className={`p-4 rounded-2xl border-2 transition-all ${t.current ? `border-[${t.color}] shadow-lg` : 'border-gray-100'}`}>
                        <div className="text-center">
                          <span className="text-3xl block mb-2">{t.icon}</span>
                          <h4 className="text-sm font-bold text-[#2C2E2F]">{t.name}</h4>
                          <p className="font-mono text-lg font-bold mt-1" style={{ color: t.color }}>{t.commission}</p>
                          <p className="text-[10px] text-gray-500 mt-1">{t.referrals} filleuls requis</p>
                          {t.current && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-[#00A651]/10 text-[#00A651] text-[10px] font-bold rounded-full">Palier actuel</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Referral Code & Link */}
                <div className="bg-white rounded-3xl shadow-sm border p-6">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Votre lien de parrainage</h3>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Code</p>
                      <p className="font-mono text-sm font-bold text-[#003087]">{ambassadorData?.ambassador?.referralCode ?? 'adama-A7X9'}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">Lien</p>
                      <p className="text-xs text-[#009CDE] truncate">{ambassadorData?.ambassador?.referralLink ?? 'https://afribayit.com/ref/adama-A7X9'}</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(ambassadorData?.ambassador?.referralLink ?? 'https://afribayit.com/ref/adama-A7X9');
                        toast({ title: 'Lien copié !', description: 'Partagez votre lien de parrainage.' });
                      }}
                      className="px-4 py-2 bg-[#003087] text-white rounded-full text-xs font-semibold hover:bg-[#0047b3] transition-colors shrink-0"
                    >
                      📋 Copier
                    </button>
                  </div>

                  {/* Benefits */}
                  <div className="mt-4 space-y-2">
                    {((ambassadorData?.ambassador?.tierInfo.benefits ?? ['Lien de parrainage', 'Commission 10%', 'Page personnalisée', 'Support prioritaire'])).map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#00A651]/10 flex items-center justify-center">
                          <svg className="w-3 h-3 text-[#00A651]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-600">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {!ambassadorData?.isAmbassador && (
                    <button onClick={handleApplyAmbassador} className="mt-4 px-6 py-2.5 bg-[#009CDE] text-white rounded-full font-semibold hover:bg-[#0088c4] transition-colors">
                      🤝 Devenir Ambassadeur
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════ CREDIBILITY TAB ════════ */}
          {activeTab === 'credibility' && (
            <motion.div
              key="credibility"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: easeOut }}
            >
              <div className="space-y-6">
                {/* Score Display */}
                <div className="bg-gradient-to-r from-[#D4AF37] to-[#c9a030] rounded-3xl p-8 text-white text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-32 h-32 rounded-full border-4 border-white/30 mx-auto flex items-center justify-center bg-white/10 mb-4"
                  >
                    <div>
                      <p className="font-mono text-3xl font-bold">{credibilityData?.total ?? 72}</p>
                      <p className="text-xs text-white/70">/ 100</p>
                    </div>
                  </motion.div>
                  <h2 className="font-display text-xl font-bold">Score de Crédibilité</h2>
                  <p className="text-sm text-white/70 mt-1">Évaluation multi-facteurs de votre profil professionnel</p>
                </div>

                {/* Factor Breakdown */}
                <div className="bg-white rounded-3xl shadow-sm border p-6">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-5">Détail des facteurs</h3>
                  <div className="space-y-5">
                    {(credibilityData?.factors ?? [
                      { key: 'profile_completeness', name: 'Complétude du profil', weight: 20, score: 85, weightedScore: 17 },
                      { key: 'verification_status', name: 'Statut de vérification', weight: 25, score: 65, weightedScore: 16.25 },
                      { key: 'activity_score', name: 'Score d\'activité', weight: 20, score: 70, weightedScore: 14 },
                      { key: 'endorsements', name: 'Recommandations', weight: 15, score: 55, weightedScore: 8.25 },
                      { key: 'transaction_history', name: 'Historique transactions', weight: 20, score: 80, weightedScore: 16 },
                    ]).map((factor, i) => {
                      const colors = ['#00A651', '#003087', '#009CDE', '#D4AF37', '#8B5CF6'];
                      const color = colors[i % colors.length];
                      return (
                        <div key={factor.key}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <span className="text-sm font-semibold text-[#2C2E2F]">{factor.name}</span>
                              <span className="text-[10px] text-gray-400 ml-2">({factor.weight}% du total)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold" style={{ color }}>{factor.score}/100</span>
                              <span className="text-[10px] text-gray-400">→ {factor.weightedScore.toFixed(1)} pts</span>
                            </div>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${factor.score}%` }}
                              transition={{ duration: 1, delay: i * 0.15, ease: easeOut }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-white rounded-3xl shadow-sm border p-6">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">💡 Comment améliorer votre score</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { tip: 'Complétez votre profil à 100%', impact: '+20 pts', icon: '👤' },
                      { tip: 'Passez la vérification KYC niveau 3', impact: '+25 pts', icon: '🛡️' },
                      { tip: 'Obtenez plus de recommandations', impact: '+15 pts', icon: '💬' },
                      { tip: 'Complétez des transactions via escrow', impact: '+20 pts', icon: '✅' },
                    ].map(item => (
                      <div key={item.tip} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                        <span className="text-xl">{item.icon}</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-[#2C2E2F]">{item.tip}</p>
                          <p className="text-[10px] text-[#00A651] font-bold">{item.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════ PROFILE TAB ════════ */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: easeOut }}
            >
              <div className="space-y-6">
                {/* Profile Preview */}
                <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                  {/* Cover */}
                  <div className="h-40 bg-gradient-to-r from-[#8B5CF6] to-[#a78bfa] relative">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-30" />
                  </div>

                  {/* Avatar + Info */}
                  <div className="relative -mt-16 px-6 pb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                      <div className="w-28 h-28 rounded-3xl bg-[#8B5CF6] border-4 border-white shadow-lg flex items-center justify-center text-white text-4xl font-bold">
                        AD
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2">
                          <h2 className="font-display text-xl font-bold text-[#2C2E2F]">Adama Diallo</h2>
                          <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold rounded-full">🏅 Vérifié</span>
                        </div>
                        <p className="text-sm text-gray-600">Agent Immobilier Certifié · Spécialiste Investissement</p>
                        <p className="text-xs text-gray-400 mt-0.5">Cotonou, Bénin · <span className="text-[#00A651]">● Disponible</span></p>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-5 py-2 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors">
                          Contacter
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('https://afribayit.com/pro/adama-diallo');
                            toast({ title: 'Lien copié !', description: 'Lien du profil professionnel copié.' });
                          }}
                          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors"
                        >
                          ↗ Partager
                        </button>
                      </div>
                    </div>

                    {/* Credibility Score */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-2xl border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Score de crédibilité</span>
                        <span className="font-mono text-xs font-bold text-[#003087]">72/100</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '72%' }}
                          transition={{ duration: 1, ease: easeOut }}
                          className="h-full rounded-full bg-gradient-to-r from-[#003087] to-[#00A651]"
                        />
                      </div>
                    </div>

                    {/* Certifications */}
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                      {[
                        { name: 'Droit Foncier', icon: '⚖️', color: '#003087' },
                        { name: 'Négociation', icon: '🤝', color: '#D4AF37' },
                        { name: 'GeoTrust', icon: '🛡️', color: '#00A651' },
                      ].map(cert => (
                        <span
                          key={cert.name}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0"
                          style={{ backgroundColor: `${cert.color}10`, color: cert.color }}
                        >
                          {cert.icon} {cert.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div className="bg-white rounded-3xl shadow-sm border p-6">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Compétences & Spécialités</h3>
                  <div className="space-y-3">
                    {[
                      { skill: 'Droit Foncier Africain', endorsements: 24 },
                      { skill: 'Négociation Immobilière', endorsements: 18 },
                      { skill: 'Évaluation Immobilière', endorsements: 12 },
                      { skill: 'Investissement', endorsements: 9 },
                      { skill: 'Gestion de Patrimoine', endorsements: 6 },
                    ].map(item => (
                      <div key={item.skill} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{item.skill}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((item.endorsements / 30) * 100, 100)}%` }}
                              transition={{ duration: 0.8, ease: easeOut }}
                              className="h-full bg-[#D4AF37] rounded-full"
                            />
                          </div>
                          <span className="font-mono text-xs text-gray-400 w-8 text-right">{item.endorsements}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Experience Timeline */}
                <div className="bg-white rounded-3xl shadow-sm border p-6">
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Expérience professionnelle</h3>
                  <div className="relative pl-6 border-l-2 border-[#003087]/10 space-y-5">
                    {[
                      { title: 'Agent Immobilier Senior', company: 'AfriBayit Bénin', period: '2023 - Présent', desc: 'Spécialiste transactions haut de gamme, conseil en investissement immobilier.' },
                      { title: 'Consultant Immobilier', company: 'Cabinet Foncier International', period: '2019 - 2023', desc: 'Conseil en droit foncier, accompagnement des investisseurs internationaux.' },
                      { title: 'Négociateur Immobilier', company: 'Agence Immobilière du Golfe', period: '2016 - 2019', desc: 'Négociation de biens résidentiels et commerciaux à Cotonou.' },
                    ].map((exp, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15, ease: easeOut }}
                        className="relative"
                      >
                        <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-[#003087] border-2 border-white" />
                        <div className="p-4 bg-gray-50 rounded-2xl">
                          <h4 className="text-sm font-bold text-[#2C2E2F]">{exp.title}</h4>
                          <p className="text-xs text-[#003087] font-semibold">{exp.company}</p>
                          <p className="text-xs text-gray-400 mb-1.5">{exp.period}</p>
                          <p className="text-xs text-gray-600">{exp.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Visit Profile CTA */}
                <div className="text-center py-4">
                  <a
                    href="/pro/adama-diallo"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B5CF6] text-white rounded-full font-semibold hover:bg-[#7c3aed] transition-colors"
                  >
                    👤 Voir le profil complet
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
