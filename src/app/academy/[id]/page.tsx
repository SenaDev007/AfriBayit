'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  BookOpen,
  Clock,
  Users,
  Award,
  Star,
  CheckCircle2,
  FileText,
  Video,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { apiFetch, apiPost, apiPatch } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import CourseLessonViewer from '@/components/afribayit/CourseLessonViewer';
import QuizTaker from '@/components/afribayit/QuizTaker';
import type { QuizQuestion } from '@/lib/constants';

// ─── Types ────────────────────────────────────────────────────────

interface ModuleItem {
  id?: string;
  title: string;
  duration?: string;
  videoUrl?: string;
  content?: string;
  type?: 'video' | 'text' | 'quiz';
}

interface CourseData {
  id: string;
  title: string;
  slug?: string;
  category: string;
  country: string;
  instructorId: string;
  instructor: string;
  description?: string;
  duration: string;
  price: number;
  currency: string;
  level: string;
  certificate: boolean;
  rating: number;
  students: number;
  image?: string;
  videoUrl?: string;
  published: boolean;
  modules: ModuleItem[] | null;
  createdAt: string;
  enrollments: EnrollmentData[];
  quizzes: QuizData[];
  certificates_rel: CertificateData[];
}

interface EnrollmentData {
  id: string;
  userId: string;
  progress: number;
  completed: boolean;
  completedModules?: string; // JSON string
  enrolledAt: string;
  completedAt?: string;
}

interface QuizData {
  id: string;
  title: string;
  timeLimit: number;
  passingScore: number;
  maxAttempts: number;
  _count: { attempts: number };
}

interface CertificateData {
  id: string;
  certificateId: string;
  userId: string;
}

interface QuizDisplayData {
  id: string;
  courseId: string;
  title: string;
  description: string;
  timeLimitMinutes: number;
  passingScorePercent: number;
  maxAttempts: number;
  questions: Omit<QuizQuestion, 'correctAnswer' | 'explanation'>[];
}

// ─── Constants ────────────────────────────────────────────────────

const levelLabels: Record<string, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
  expert: 'Expert',
};

const categoryLabels: Record<string, string> = {
  immobilier: 'Immobilier',
  droit_foncier: 'Droit Foncier',
  investissement: 'Investissement',
  construction: 'Construction',
  finance: 'Finance',
  certification: 'Certification',
};

const easeOut = [0.16, 1, 0.3, 1] as const;

// ─── Page Component ───────────────────────────────────────────────

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const courseId = params.id as string;

  const [course, setCourse] = useState<CourseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'quiz'>(
    'overview'
  );
  const [expandedModules, setExpandedModules] = useState(true);
  const [quizData, setQuizData] = useState<QuizDisplayData | null>(null);
  const [quizTotalAttempts, setQuizTotalAttempts] = useState(0);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [userCertificate, setUserCertificate] =
    useState<CertificateData | null>(null);

  // ─── Fetch course ────────────────────────────────────────────

  useEffect(() => {
    async function fetchCourse() {
      try {
        setIsLoading(true);
        const data = await apiFetch<CourseData>(`/api/courses/${courseId}`);
        setCourse(data);

        // Check if user is enrolled
        if (user) {
          const userEnrollment = data.enrollments?.find(
            (e) => e.userId === user.id
          );
          if (userEnrollment) {
            setEnrollment(userEnrollment);
          }

          // Check for certificate
          const userCert = data.certificates_rel?.find(
            (c) => c.userId === user.id
          );
          if (userCert) {
            setUserCertificate(userCert);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Erreur de chargement.'
        );
      } finally {
        setIsLoading(false);
      }
    }
    fetchCourse();
  }, [courseId, user]);

  // ─── Enroll handler ──────────────────────────────────────────

  const handleEnroll = async () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description:
          'Veuillez vous connecter pour vous inscrire à cette formation.',
      });
      router.push('/auth/login');
      return;
    }

    setIsEnrolling(true);
    try {
      const res = await apiPost<{ data: EnrollmentData }>(
        '/api/courses/enrollments',
        { courseId, userId: user.id }
      );
      setEnrollment(res.data);
      toast({
        title: 'Inscription réussie !',
        description: 'Vous êtes maintenant inscrit à cette formation.',
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description:
          err instanceof Error
            ? err.message
            : "Impossible de s'inscrire à la formation.",
        variant: 'destructive',
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  // ─── Load quiz ───────────────────────────────────────────────

  const handleLoadQuiz = async () => {
    if (!course?.quizzes?.length) return;

    setIsLoadingQuiz(true);
    try {
      const res = await apiFetch<{
        quiz: QuizDisplayData;
        totalAttempts: number;
      }>(`/api/academy/quiz/${courseId}`);
      setQuizData(res.quiz);
      setQuizTotalAttempts(res.totalAttempts);
      setActiveTab('quiz');
    } catch (err) {
      toast({
        title: 'Erreur',
        description:
          err instanceof Error
            ? err.message
            : 'Impossible de charger le quiz.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  // ─── Progress update from lesson viewer ──────────────────────

  const handleProgressUpdate = (progress: number) => {
    if (enrollment) {
      setEnrollment({
        ...enrollment,
        progress,
        completed: progress >= 100,
      });
    }
  };

  // ─── Loading state ───────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50/30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-64 bg-gray-200 rounded-2xl" />
                <div className="h-8 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-1/2 bg-gray-100 rounded" />
              </div>
              <div className="h-96 bg-gray-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────

  if (error || !course) {
    return (
      <div className="min-h-screen pt-20 bg-gray-50/30 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-1">
            Cours introuvable
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {error || "Ce cours n'existe pas ou n'est plus disponible."}
          </p>
          <button
            onClick={() => router.push('/academy')}
            className="px-6 py-2 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors"
          >
            Retour à l&apos;académie
          </button>
        </div>
      </div>
    );
  }

  // ─── Derived data ────────────────────────────────────────────

  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.completed || false;
  const hasQuiz = course.quizzes && course.quizzes.length > 0;
  const moduleList = course.modules || [];
  const totalModules = moduleList.length;

  return (
    <div className="min-h-screen pt-20 pb-16 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ─── Back button ──────────────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/academy')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#003087] transition-colors mb-6 mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux formations
        </motion.button>

        {/* ─── Hero + Sidebar grid ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ─── Left: Main content ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course hero image / video */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOut }}
              className="rounded-2xl overflow-hidden shadow-sm border"
            >
              {course.videoUrl && isEnrolled ? (
                <div className="aspect-video bg-black">
                  <video
                    controls
                    className="w-full h-full"
                    preload="metadata"
                  >
                    <source src={course.videoUrl} type="video/mp4" />
                    Votre navigateur ne supporte pas la lecture vidéo.
                  </video>
                </div>
              ) : (
                <div className="relative aspect-[16/9]">
                  <ImageWithFallback
                    src={course.image || ''}
                    alt={course.title}
                    className="w-full h-full"
                    fallbackType="course"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#003087] text-white text-[10px] font-bold rounded-full mb-2">
                      {levelLabels[course.level] || course.level}
                    </span>
                    {course.certificate && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full ml-1.5">
                        <Award className="w-3 h-3" /> Certifiant
                      </span>
                    )}
                  </div>
                </div>
              )}
            </motion.div>

            {/* ─── Tab navigation ──────────────────────────────── */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(
                [
                  { key: 'overview', label: 'Aperçu', icon: BookOpen },
                  ...(isEnrolled
                    ? [
                        {
                          key: 'lessons',
                          label: `Modules (${totalModules})`,
                          icon: Video,
                        },
                      ]
                    : []),
                  ...(isEnrolled && hasQuiz
                    ? [{ key: 'quiz', label: 'Quiz', icon: FileText }]
                    : []),
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === key
                      ? 'bg-white shadow-sm text-[#003087]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* ─── Tab content ─────────────────────────────────── */}
            <AnimatePresence mode="wait">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Course info */}
                  <div className="bg-white rounded-2xl border shadow-sm p-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#2C2E2F] mb-2">
                      {course.title}
                    </h1>
                    <p className="text-gray-500 mb-4">
                      Par{' '}
                      <span className="font-medium text-[#003087]">
                        {course.instructor}
                      </span>
                    </p>

                    {/* Quick stats */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#D4AF37]" />
                        {course.rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.students} étudiants
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {categoryLabels[course.category] || course.category}
                      </span>
                    </div>

                    {/* Description */}
                    {course.description && (
                      <div className="prose prose-sm max-w-none text-gray-700 border-t pt-4">
                        <p>{course.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Module list (preview) */}
                  {totalModules > 0 && (
                    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                      <button
                        onClick={() => setExpandedModules(!expandedModules)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <h3 className="font-semibold text-[#2C2E2F] flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-[#003087]" />
                          Programme ({totalModules} modules)
                        </h3>
                        {expandedModules ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedModules && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t max-h-96 overflow-y-auto"
                          >
                            {moduleList.map((mod, idx) => {
                              const modType = mod.type || 'video';
                              return (
                                <div
                                  key={mod.id || idx}
                                  className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-gray-50/50"
                                >
                                  <div className="w-8 h-8 rounded-full bg-[#003087]/10 flex items-center justify-center flex-shrink-0">
                                    {modType === 'video' ? (
                                      <Play className="w-3.5 h-3.5 text-[#003087]" />
                                    ) : modType === 'text' ? (
                                      <FileText className="w-3.5 h-3.5 text-[#003087]" />
                                    ) : (
                                      <Zap className="w-3.5 h-3.5 text-[#003087]" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#2C2E2F] truncate">
                                      {idx + 1}. {mod.title}
                                    </p>
                                  </div>
                                  {mod.duration && (
                                    <span className="text-xs text-gray-400 flex-shrink-0">
                                      {mod.duration}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Quiz availability card */}
                  {hasQuiz && !isEnrolled && (
                    <div className="bg-gradient-to-r from-[#003087]/5 to-[#009CDE]/5 rounded-2xl border border-[#003087]/10 p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#003087]/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-[#003087]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#2C2E2F] text-sm">
                          Quiz de validation
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Ce cours comporte un quiz (
                          {course.quizzes[0]?.passingScore}% de réussite
                          requis). Inscrivez-vous pour y accéder.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Certificate availability card */}
                  {course.certificate && !isEnrolled && (
                    <div className="bg-gradient-to-r from-[#D4AF37]/5 to-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20 p-5 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                        <Award className="w-5 h-5 text-[#D4AF37]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#2C2E2F] text-sm">
                          Certificat de réussite
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Obtenez un certificat officiel AfriBayit en réussissant
                          cette formation.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* LESSONS TAB */}
              {activeTab === 'lessons' && isEnrolled && (
                <motion.div
                  key="lessons"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <CourseLessonViewer
                    courseId={course.id}
                    enrollmentId={enrollment!.id}
                    modules={moduleList}
                    videoUrl={course.videoUrl}
                    currentProgress={enrollment!.progress}
                    completedModules={
                      enrollment!.completedModules
                        ? JSON.parse(enrollment!.completedModules)
                        : []
                    }
                    onProgressUpdate={handleProgressUpdate}
                  />
                </motion.div>
              )}

              {/* QUIZ TAB */}
              {activeTab === 'quiz' && isEnrolled && hasQuiz && (
                <motion.div
                  key="quiz"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {quizData && user ? (
                    <QuizTaker
                      courseId={course.id}
                      quiz={quizData}
                      userId={user.id}
                      totalAttempts={quizTotalAttempts}
                      onCertificateRequest={() =>
                        setActiveTab('overview')
                      }
                    />
                  ) : (
                    <div className="bg-white rounded-2xl border shadow-sm p-8 text-center">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <h3 className="font-semibold text-[#2C2E2F] mb-1">
                        Quiz de validation
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Testez vos connaissances et validez votre formation.
                      </p>
                      <button
                        onClick={handleLoadQuiz}
                        disabled={isLoadingQuiz}
                        className="px-6 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-50"
                      >
                        {isLoadingQuiz
                          ? 'Chargement...'
                          : 'Commencer le quiz'}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Right: Sidebar ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
            className="space-y-5"
          >
            {/* Price & Enroll card */}
            <div className="bg-white rounded-2xl border shadow-sm p-6 sticky top-24">
              {/* Price */}
              <div className="mb-4">
                {course.price > 0 ? (
                  <p className="text-3xl font-bold text-[#D4AF37]">
                    {new Intl.NumberFormat('fr-FR').format(course.price)}{' '}
                    <span className="text-sm font-normal text-gray-400">
                      {course.currency}
                    </span>
                  </p>
                ) : (
                  <p className="text-3xl font-bold text-[#00A651]">Gratuit</p>
                )}
              </div>

              {/* CTA button */}
              {!isEnrolled ? (
                <button
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                  className="w-full py-3.5 bg-[#003087] text-white rounded-xl font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isEnrolling ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Inscription...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      S&apos;inscrire
                    </>
                  )}
                </button>
              ) : isCompleted ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-[#00A651]/10 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-[#00A651]" />
                    <span className="text-sm font-semibold text-[#00A651]">
                      Formation terminée !
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveTab('lessons')}
                    className="w-full py-3 bg-gray-100 text-[#003087] rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Revoir les modules
                  </button>
                  {hasQuiz && (
                    <button
                      onClick={handleLoadQuiz}
                      disabled={isLoadingQuiz}
                      className="w-full py-3 bg-[#003087] text-white rounded-xl font-semibold hover:bg-[#0047b3] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4" />
                      Passer le quiz
                    </button>
                  )}
                  {userCertificate && (
                    <a
                      href={`/api/academy/certificates/generate?download=true&certificateId=${userCertificate.certificateId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-[#D4AF37] text-white rounded-xl font-semibold hover:bg-[#c9a22e] transition-colors flex items-center justify-center gap-2"
                    >
                      <Award className="w-4 h-4" />
                      Télécharger le certificat
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setActiveTab('lessons')}
                    className="w-full py-3.5 bg-[#003087] text-white rounded-xl font-semibold hover:bg-[#0047b3] transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Continuer
                  </button>
                  {hasQuiz && (
                    <button
                      onClick={handleLoadQuiz}
                      disabled={isLoadingQuiz}
                      className="w-full py-3 bg-gray-100 text-[#003087] rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <FileText className="w-4 h-4" />
                      Passer le quiz
                    </button>
                  )}
                </div>
              )}

              {/* Course details list */}
              <div className="mt-5 space-y-3 border-t pt-5">
                {[
                  {
                    icon: BookOpen,
                    label: 'Niveau',
                    value: levelLabels[course.level] || course.level,
                  },
                  {
                    icon: Clock,
                    label: 'Durée',
                    value: course.duration,
                  },
                  {
                    icon: Users,
                    label: 'Étudiants',
                    value: `${course.students} inscrits`,
                  },
                  {
                    icon: Star,
                    label: 'Note',
                    value: `${course.rating.toFixed(1)} / 5`,
                  },
                  {
                    icon: Shield,
                    label: 'Certificat',
                    value: course.certificate ? 'Oui' : 'Non',
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="flex items-center gap-2 text-gray-500">
                      <Icon className="w-4 h-4" />
                      {label}
                    </span>
                    <span className="font-medium text-[#2C2E2F]">{value}</span>
                  </div>
                ))}
              </div>

              {/* Progress bar (enrolled) */}
              {isEnrolled && !isCompleted && (
                <div className="mt-5 border-t pt-5">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Votre progression</span>
                    <span className="font-semibold text-[#003087]">
                      {Math.round(enrollment.progress)}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#003087] to-[#009CDE] rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.round(enrollment.progress)}%`,
                      }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Inscrit le{' '}
                    {new Date(enrollment.enrolledAt).toLocaleDateString(
                      'fr-FR'
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Instructor card */}
            <div className="bg-white rounded-2xl border shadow-sm p-5">
              <h4 className="text-sm font-semibold text-[#2C2E2F] mb-3">
                Instructeur
              </h4>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#003087]/10 flex items-center justify-center text-[#003087] font-bold text-lg">
                  {course.instructor.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-[#2C2E2F] text-sm">
                    {course.instructor}
                  </p>
                  <p className="text-xs text-gray-500">
                    Formateur certifié AfriBayit
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
