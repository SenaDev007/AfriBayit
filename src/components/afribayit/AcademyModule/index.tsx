'use client';

/**
 * AcademyModule — AfriBayit Academy, l'école virtuelle de l'immobilier
 * ouest-africain (CDC §5.6).
 *
 * Structure (refonte 2026-09) — véritable campus numérique organisé :
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ Bandeau école : blason, titre, statistiques, session         │
 *   ├──────────────┬───────────────────────────────────────────────┤
 *   │ MON ESPACE   │ Tableau de bord / Catalogue / Mes formations  │
 *   │ FILIÈRES     │ Certifications / Webinaires / Communauté      │
 *   │ FACULTÉS     │ (cartes de cours structurées façon LMS)       │
 *   └──────────────┴───────────────────────────────────────────────┘
 *
 * Zéro animation 3D — structure éditoriale sobre et lisible.
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { useCourses, useEnrollCourse, useMyEnrollments, useMyCertificates } from '@/hooks/useCourses';
import { useAuthStore } from '@/stores/authStore';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/constants';
import { apiFetch } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import {
  GraduationCap, Award, ShieldCheck, BookOpen, Video, Users, LayoutDashboard,
  PlayCircle, Trophy, ChevronRight, CalendarDays, Clock,
} from 'lucide-react';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import type { Course, Enrollment, CertificateItem, AcademyTabKey } from './types';
import { academyTabs, categories, LEARNING_PATHS } from './constants';
import CataloguePanel from './CataloguePanel';
import MyCoursesPanel from './MyCoursesPanel';
import CertificationsPanel from './CertificationsPanel';
import WebinarsPanel from './WebinarsPanel';
import PeerLearningPanel from './PeerLearningPanel';
import CourseCard from './CourseCard';
import CourseDetailDialog from './CourseDetailDialog';

interface AcademyStats {
  courseCount: number;
  enrollmentCount: number;
  certificateCount: number;
  satisfactionRate: number | null;
}

/* Libellés de navigation de l'école */
const NAV_ITEMS: { key: AcademyTabKey; label: string; icon: typeof LayoutDashboard; hint: string }[] = [
  { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, hint: 'Votre progression' },
  { key: 'catalogue', label: 'Catalogue', icon: BookOpen, hint: 'Toutes les formations' },
  { key: 'my_courses', label: 'Mes formations', icon: GraduationCap, hint: 'Cours en cours' },
  { key: 'certifications', label: 'Certifications', icon: Award, hint: 'Diplômes obtenus' },
  { key: 'webinars', label: 'Webinaires', icon: Video, hint: 'Sessions live' },
  { key: 'peer_learning', label: 'Communauté', icon: Users, hint: 'Apprentissage pair à pair' },
];

export default function AcademyModule() {
  const [activeTab, setActiveTab] = useState<AcademyTabKey>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();
  const { selectedCountry } = useCountry();

  const { data, isLoading, error } = useCourses(
    selectedCategory === 'Tous' ? undefined : selectedCategory,
    undefined,
    selectedCountry
  );

  // Statistiques de l'école (anciennement portées par le hero de la page)
  const { data: stats } = useQuery<AcademyStats>({
    queryKey: ['academy-stats'],
    queryFn: () => apiFetch<AcademyStats>('/api/academy/stats'),
    staleTime: 5 * 60 * 1000,
  });

  const enrollCourse = useEnrollCourse();
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useMyEnrollments(user?.id);
  const { data: certificatesData, isLoading: certificatesLoading } = useMyCertificates(user?.id);

  const courses: Course[] = (data?.courses as Course[]) || [];
  const selectedPath = LEARNING_PATHS.find((p) => p.id === selectedPathId) ?? null;

  // Apply search + price + path filter
  const filtered = courses.filter((c) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.title.toLowerCase().includes(q) && !c.category.toLowerCase().includes(q) && !c.instructor.toLowerCase().includes(q)) return false;
    }
    if (priceFilter === 'free' && Number(c.price) > 0) return false;
    if (priceFilter === 'paid' && c.price === 0) return false;
    if (selectedCategory !== 'Tous' && c.category !== selectedCategory) return false;
    if (selectedPath && !selectedPath.courses.some((title) => c.title.toLowerCase().includes(title.toLowerCase()) || title.toLowerCase().includes(c.title.toLowerCase()))) return false;
    return true;
  });

  // Enrollments and certificates
  const enrollments: Enrollment[] = ((enrollmentsData?.enrollments as Record<string, unknown>[]) || []).map((e) => ({
    id: String(e.id ?? ''),
    courseId: String(e.courseId ?? ''),
    progress: Number(e.progress ?? 0),
    completed: e.completed === true,
    enrolledAt: String(e.enrolledAt ?? e.createdAt ?? ''),
    course: e.course as Course | undefined,
  }));

  const certificates: CertificateItem[] = ((certificatesData?.certificates as Record<string, unknown>[]) || []).map((c) => ({
    id: String(c.id ?? ''),
    courseId: String(c.courseId ?? ''),
    courseTitle: String((c as Record<string, unknown>).courseTitle ?? (c.course as Record<string, unknown>)?.title ?? ''),
    certificateId: String(c.certificateId ?? ''),
    issuedAt: String(c.issuedAt ?? c.createdAt ?? ''),
    downloadUrl: (c as Record<string, unknown>).downloadUrl as string | undefined,
    course: (c as Record<string, unknown>).course as Course | undefined,
  }));

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
  const inProgress = enrollments.filter((e) => !e.completed);
  const recommended = courses.filter((c) => !enrolledCourseIds.has(c.id)).slice(0, 3);

  const handleEnroll = (courseId: string) => {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour vous inscrire à une formation.' });
      router.push('/auth/login');
      return;
    }
    setEnrollingCourseId(courseId);
    enrollCourse.mutate(
      { courseId, userId: user.id },
      {
        onSuccess: () => {
          toast({ title: 'Inscription réussie', description: 'Vous êtes maintenant inscrit à cette formation.' });
          setEnrollingCourseId(null);
        },
        onError: (err) => {
          toast({ title: 'Erreur', description: err.message || 'Impossible de s\'inscrire à la formation.', variant: 'destructive' });
          setEnrollingCourseId(null);
        },
      }
    );
  };

  const goCatalogue = (category?: string, pathId?: string | null) => {
    if (category !== undefined) setSelectedCategory(category);
    if (pathId !== undefined) setSelectedPathId(pathId);
    setActiveTab('catalogue');
  };

  /* ── Sidebar école ── */
  const schoolSidebar = (
    <>
      <div className="bg-white rounded-2xl border border-primary-pale shadow-sm overflow-hidden">
        <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-primary-deep uppercase tracking-wider">Mon espace</p>
        <nav className="p-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors ${
                  active ? 'bg-primary-pale text-primary-deep' : 'text-gray-text hover:bg-primary-pale/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-primary-deep' : 'text-gray-400'}`} />
                <span className="text-[13px] font-semibold truncate">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary-deep shrink-0" />}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-white rounded-2xl border border-primary-pale shadow-sm overflow-hidden">
        <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-primary-deep uppercase tracking-wider">Filières certifiantes</p>
        <nav className="p-1.5">
          {LEARNING_PATHS.map((path) => {
            const active = selectedPathId === path.id;
            return (
              <button
                key={path.id}
                onClick={() => goCatalogue(undefined, active ? null : path.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors ${
                  active ? 'bg-primary-pale text-primary-deep' : 'text-gray-text hover:bg-primary-pale/60'
                }`}
              >
                <span
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: path.color }}
                >
                  {path.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold truncate">{path.title}</span>
                  <span className="block text-[10px] text-gray-400 truncate">{path.courses.length} formations</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-white rounded-2xl border border-primary-pale shadow-sm overflow-hidden">
        <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-primary-deep uppercase tracking-wider">Facultés</p>
        <nav className="p-1.5 max-h-72 overflow-y-auto">
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => goCatalogue(active && cat === 'Tous' ? 'Tous' : cat)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-colors ${
                  active ? 'bg-primary-pale text-primary-deep font-semibold' : 'text-gray-text hover:bg-primary-pale/60'
                }`}
              >
                <span className="text-[12px] truncate">{cat}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );

  return (
    <section className="min-h-screen pb-24 bg-cream">
      {/* ── Bandeau de l'école ──────────────────────────────────── */}
      <div className="bg-primary-deep">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Blason */}
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
              <GraduationCap className="w-9 h-9 text-white" />
            </div>

            {/* Identité */}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-accent-yellow mb-1">
                École virtuelle · Session {new Date().getFullYear()}
              </p>
              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                AfriBayit <span className="text-accent-yellow">Academy</span>
              </h1>
              <p className="text-white/70 text-sm mt-1 max-w-2xl">
                L&apos;école de l&apos;immobilier ouest-africain — formations certifiantes, webinaires live
                et parcours professionnels dans 4 pays.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-white/60">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-accent-yellow" />
                  Certificats vérifiables par QR code
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                  Paiement sécurisé via escrow
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-white/60" />
                  {LEARNING_PATHS.length} filières · {categories.length - 1} facultés
                </span>
              </div>
            </div>

            {/* Statistiques */}
            <dl className="shrink-0 grid grid-cols-3 gap-3 md:gap-4 md:grid-cols-1 md:w-52">
              {[
                { label: 'Formations', value: stats?.courseCount ?? 0 },
                { label: 'Apprenants', value: stats?.enrollmentCount ?? 0 },
                { label: 'Certificats délivrés', value: stats?.certificateCount ?? 0 },
              ].map((s) => (
                <div key={s.label} className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-center md:text-left">
                  <dd className="text-xl font-bold text-white font-mono-data leading-none">{s.value}</dd>
                  <dt className="text-[9px] uppercase tracking-wider text-white/50 mt-1">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* ── Corps de l'école ───────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Navigation mobile */}
        <div className="md:hidden flex gap-1.5 overflow-x-auto pb-3 mb-2 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors ${
                  active ? 'bg-primary-deep text-white' : 'bg-white text-gray-text border border-primary-pale'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {item.label}
              </button>
            );
          })}
        </div>

        <div className="md:grid md:grid-cols-[264px_minmax(0,1fr)] gap-5 items-start">
          {/* Sidebar école — desktop */}
          <aside className="hidden md:block sticky top-[148px] sm:top-[164px] max-h-[calc(100vh-176px)] overflow-y-auto pr-1 space-y-4">
            {schoolSidebar}
          </aside>

          {/* Contenu principal */}
          <main className="min-w-0">
            {/* ============ TABLEAU DE BORD ============ */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Reprendre l'apprentissage */}
                <div className="bg-white rounded-2xl border border-primary-pale shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-base font-bold text-primary-deep flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-primary-green" />
                      Reprendre l&apos;apprentissage
                    </h2>
                    {inProgress.length > 0 && (
                      <button onClick={() => setActiveTab('my_courses')} className="text-[11px] font-bold text-primary-green hover:text-primary-deep">
                        Tout voir →
                      </button>
                    )}
                  </div>
                  {!user ? (
                    <div className="text-center py-6">
                      <GraduationCap className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-text font-semibold mb-1">Reprenez là où vous vous êtes arrêté</p>
                      <p className="text-xs text-gray-400 mb-4">Connectez-vous pour retrouver votre progression et vos certificats.</p>
                      <button onClick={() => router.push('/auth/login')} className="px-5 py-2.5 rounded-full bg-primary-deep text-white text-xs font-bold hover:bg-primary-green transition-colors">
                        Se connecter à l&apos;école
                      </button>
                    </div>
                  ) : inProgress.length === 0 ? (
                    <div className="text-center py-6">
                      <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-text font-semibold mb-1">Aucune formation en cours</p>
                      <p className="text-xs text-gray-400 mb-4">Explorez le catalogue et démarrez votre première formation certifiante.</p>
                      <button onClick={() => setActiveTab('catalogue')} className="px-5 py-2.5 rounded-full bg-primary-deep text-white text-xs font-bold hover:bg-primary-green transition-colors">
                        Parcourir le catalogue
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {inProgress.slice(0, 4).map((e) => (
                        <button
                          key={e.id}
                          onClick={() => e.courseId && setSelectedCourseId(e.courseId)}
                          className="text-left p-4 rounded-xl border border-primary-pale hover:border-primary-green/40 hover:bg-primary-pale/30 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div className="shrink-0 w-11 h-11 rounded-xl overflow-hidden relative bg-primary-pale">
                              {e.course?.image && (
                                <ImageWithFallback src={e.course.image} alt="" className="absolute inset-0 w-full h-full" fallbackType="property" fill />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-primary-deep truncate">{e.course?.title ?? 'Formation'}</p>
                              <p className="text-[10px] text-gray-400 truncate">{e.course?.instructor}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] mb-1.5">
                            <span className="text-gray-400">Progression</span>
                            <span className="font-bold text-primary-deep font-mono-data">{e.progress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-primary-pale overflow-hidden">
                            <div className="h-full rounded-full bg-primary-green transition-all" style={{ width: `${Math.min(e.progress, 100)}%` }} />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Diplômes + webinaires */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('certifications')}
                    className="text-left bg-white rounded-2xl border border-primary-pale shadow-sm p-5 hover:border-accent-yellow/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-pale flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-accent-dark" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary-deep">Mes certifications</p>
                        <p className="text-[11px] text-gray-400">Diplômes vérifiables publiquement</p>
                      </div>
                    </div>
                    <p className="font-mono-data text-2xl font-bold text-primary-deep">
                      {user ? certificates.length : '—'}
                      <span className="text-xs text-gray-400 font-normal ml-1.5">certificat{certificates.length > 1 ? 's' : ''} obtenu{certificates.length > 1 ? 's' : ''}</span>
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab('webinars')}
                    className="text-left bg-white rounded-2xl border border-primary-pale shadow-sm p-5 hover:border-primary-green/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-pale flex items-center justify-center">
                        <CalendarDays className="w-5 h-5 text-primary-deep" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary-deep">Webinaires live</p>
                        <p className="text-[11px] text-gray-400">Sessions avec experts du secteur</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-text flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      Consultez le planning des prochaines sessions
                    </p>
                  </button>
                </div>

                {/* Filières */}
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="font-serif text-base font-bold text-primary-deep">Filières certifiantes</h2>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">5 parcours professionnels</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {LEARNING_PATHS.map((path) => (
                      <button
                        key={path.id}
                        onClick={() => goCatalogue(undefined, path.id)}
                        className="text-left bg-white rounded-2xl border border-primary-pale shadow-sm p-4 hover:shadow-md hover:border-primary-green/30 transition-all"
                      >
                        <div className="flex items-center gap-3 mb-2.5">
                          <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: path.color }}>
                            {path.icon}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-primary-deep truncate">{path.title}</p>
                            <p className="text-[10px] text-gray-400 truncate">{path.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {path.courses.slice(0, 3).map((c) => (
                            <span key={c} className="px-2 py-0.5 rounded-full bg-primary-pale text-primary-deep text-[9px] font-semibold truncate max-w-full">
                              {c}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommandations */}
                {recommended.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3 px-1">
                      <h2 className="font-serif text-base font-bold text-primary-deep">Recommandé pour vous</h2>
                      <button onClick={() => setActiveTab('catalogue')} className="text-[11px] font-bold text-primary-green hover:text-primary-deep">
                        Tout le catalogue →
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-5">
                      {recommended.map((course, i) => (
                        <div key={course.id} className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)]">
                          <CourseCard
                            course={course}
                            index={i}
                            enrollingCourseId={enrollingCourseId}
                            isEnrolling={enrollCourse.isPending}
                            onSelect={(id) => setSelectedCourseId(id)}
                            onEnroll={handleEnroll}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============ CATALOGUE ============ */}
            {activeTab === 'catalogue' && (
              <>
                {selectedPath && (
                  <div className="mb-4 flex items-center gap-3 bg-white rounded-2xl border border-primary-pale shadow-sm px-4 py-3">
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: selectedPath.color }}>
                      {selectedPath.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-primary-deep">Filière « {selectedPath.title} »</p>
                      <p className="text-[11px] text-gray-400 truncate">{selectedPath.description} — {filtered.length} formation{filtered.length > 1 ? 's' : ''} correspondante{filtered.length > 1 ? 's' : ''}</p>
                    </div>
                    <button
                      onClick={() => setSelectedPathId(null)}
                      className="shrink-0 px-3 py-1.5 rounded-full border border-primary-deep/20 text-primary-deep text-[11px] font-bold hover:bg-primary-pale transition-colors"
                    >
                      Quitter la filière
                    </button>
                  </div>
                )}
                <CataloguePanel
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  priceFilter={priceFilter}
                  setPriceFilter={setPriceFilter}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  isLoading={isLoading}
                  error={error as Error | null}
                  filtered={filtered}
                  enrollingCourseId={enrollingCourseId}
                  isEnrolling={enrollCourse.isPending}
                  onSelect={(id) => setSelectedCourseId(id)}
                  onEnroll={handleEnroll}
                />
              </>
            )}

            {/* ============ MES FORMATIONS ============ */}
            {activeTab === 'my_courses' && (
              <MyCoursesPanel
                user={user}
                enrollmentsLoading={enrollmentsLoading}
                enrollments={enrollments}
                certificatesCount={certificates.length}
                onSelect={(id) => setSelectedCourseId(id)}
                onLogin={() => router.push('/auth/login')}
                onGoToCatalogue={() => setActiveTab('catalogue')}
              />
            )}

            {/* ============ CERTIFICATIONS ============ */}
            {activeTab === 'certifications' && (
              <CertificationsPanel
                user={user}
                certificatesLoading={certificatesLoading}
                certificates={certificates}
                onLogin={() => router.push('/auth/login')}
                onGoToCatalogue={() => setActiveTab('catalogue')}
              />
            )}

            {/* ============ WEBINAIRES (CDC §5.6.4) ============ */}
            {activeTab === 'webinars' && <WebinarsPanel />}

            {/* ============ APPRENTISSAGE PAR LES PAIRS (CDC §5.6.4) ============ */}
            {activeTab === 'peer_learning' && <PeerLearningPanel />}
          </main>
        </div>
      </div>

      {/* ============ COURSE DETAIL DIALOG ============ */}
      <AnimatePresence>
        {selectedCourseId && (
          <CourseDetailDialog
            courseId={selectedCourseId}
            onClose={() => setSelectedCourseId(null)}
            onEnroll={handleEnroll}
            enrollingCourseId={enrollingCourseId}
            isEnrolling={enrollCourse.isPending}
            user={user}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
