'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourses, useEnrollCourse, useMyEnrollments, useMyCertificates, useCourseDetail } from '@/hooks/useCourses';
import { useAuthStore } from '@/stores/authStore';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { timeAgo, formatDate } from '@/lib/afribayit-utils';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import {
  AlertTriangle, Award, Search, BookOpen, GraduationCap,
  Clock, Users, Star, Play, ChevronRight, Filter, X, CheckCircle2,
  BarChart3, FileText, Zap, ArrowRight, Download, Eye, MessageSquare,
  RefreshCcw, BadgeCheck,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  instructorBio?: string;
  instructorAvatar?: string;
  rating: number;
  students: number;
  duration: string;
  price: number;
  image: string;
  level: string;
  certificate: boolean;
  description?: string;
  lessons?: number;
  reviews?: number;
  createdAt?: string;
  modules?: { id?: string; title: string; duration?: string; type?: string }[];
}

interface Enrollment {
  id: string;
  courseId: string;
  progress: number;
  completed: boolean;
  enrolledAt: string;
  course?: Course;
}

interface CertificateItem {
  id: string;
  courseId: string;
  courseTitle?: string;
  certificateId: string;
  issuedAt: string;
  downloadUrl?: string;
  course?: Course;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const categories = ['Tous', 'Investissement', 'Certification', 'Juridique', 'Technique', 'Construction', 'Business'];

const academyTabs = [
  { key: 'catalogue', label: 'Catalogue', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'my_courses', label: 'Mes Formations', icon: <GraduationCap className="w-4 h-4" /> },
  { key: 'certifications', label: 'Certifications', icon: <Award className="w-4 h-4" /> },
];

// Learning paths suggestions
const LEARNING_PATHS = [
  {
    id: 'lp1',
    title: 'Investisseur Débutant',
    description: 'De zéro à premier investissement',
    courses: ['Investissement Immobilier 101', 'Analyse de Marché', 'Financement & Crédit'],
    color: '#003087',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: 'lp2',
    title: 'Agent Certifié',
    description: 'Obtenez votre certification professionnelle',
    courses: ['Droit Foncier', 'Négociation Avancée', 'Certification Agent'],
    color: '#D4AF37',
    icon: <BadgeCheck className="w-5 h-5" />,
  },
  {
    id: 'lp3',
    title: 'Promoteur Immobilier',
    description: 'Maîtrisez la construction et la promotion',
    courses: ['Gestion de Projet BTP', 'Réglementation Urbaine', 'Marketing Immobilier'],
    color: '#00A651',
    icon: <BarChart3 className="w-5 h-5" />,
  },
];

function CourseSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border animate-pulse">
      <div className="aspect-[16/9] bg-gray-200" />
      <div className="p-5">
        <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
        <div className="flex gap-4 mb-4">
          <div className="h-3 bg-gray-100 rounded w-16" />
          <div className="h-3 bg-gray-100 rounded w-12" />
        </div>
        <div className="flex justify-between items-center pt-3 border-t">
          <div className="h-5 bg-gray-200 rounded w-20" />
          <div className="h-8 w-20 bg-gray-200 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function AcademyModule() {
  const [activeTab, setActiveTab] = useState('catalogue');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [isPlaying, setIsPlaying] = useState(false);
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

  const enrollCourse = useEnrollCourse();
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useMyEnrollments(user?.id);
  const { data: certificatesData, isLoading: certificatesLoading } = useMyCertificates(user?.id);

  const courses: Course[] = (data?.courses as Course[]) || [];

  // Apply search + price filter
  const filtered = courses.filter(c => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!c.title.toLowerCase().includes(q) && !c.category.toLowerCase().includes(q) && !c.instructor.toLowerCase().includes(q)) return false;
    }
    if (priceFilter === 'free' && c.price > 0) return false;
    if (priceFilter === 'paid' && c.price === 0) return false;
    if (selectedCategory !== 'Tous' && c.category !== selectedCategory) return false;
    return true;
  });

  // Enrollments and certificates
  const enrollments: Enrollment[] = ((enrollmentsData?.enrollments as Record<string, unknown>[]) || []).map(e => ({
    id: String(e.id ?? ''),
    courseId: String(e.courseId ?? ''),
    progress: Number(e.progress ?? 0),
    completed: e.completed === true,
    enrolledAt: String(e.enrolledAt ?? e.createdAt ?? ''),
    course: e.course as Course | undefined,
  }));

  const certificates: CertificateItem[] = ((certificatesData?.certificates as Record<string, unknown>[]) || []).map(c => ({
    id: String(c.id ?? ''),
    courseId: String(c.courseId ?? ''),
    courseTitle: String((c as Record<string, unknown>).courseTitle ?? (c.course as Record<string, unknown>)?.title ?? ''),
    certificateId: String(c.certificateId ?? ''),
    issuedAt: String(c.issuedAt ?? c.createdAt ?? ''),
    downloadUrl: (c as Record<string, unknown>).downloadUrl as string | undefined,
    course: (c as Record<string, unknown>).course as Course | undefined,
  }));

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

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#003087]/10 text-[#003087] text-sm font-semibold mb-4">
            <GraduationCap className="w-4 h-4" /> AfriBayit Academy
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Formations <span className="text-[#003087]">Immobilières</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Montez en compétences avec nos formations certifiantes. Investissement, droit foncier, négociation, et plus encore.
          </p>
        </motion.div>

        {/* Country Filter Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">Pays:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">
            {COUNTRY_NAMES[selectedCountry] || selectedCountry}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {academyTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ============ CATALOGUE TAB ============ */}
        {activeTab === 'catalogue' && (
          <>
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une formation..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm outline-none focus:border-[#003087] transition-colors"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPriceFilter('all')}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${priceFilter === 'all' ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border'}`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setPriceFilter('free')}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${priceFilter === 'free' ? 'bg-[#00A651] text-white' : 'bg-white text-gray-600 border'}`}
                >
                  Gratuites
                </button>
                <button
                  onClick={() => setPriceFilter('paid')}
                  className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${priceFilter === 'paid' ? 'bg-[#D4AF37] text-white' : 'bg-white text-gray-600 border'}`}
                >
                  Payantes
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Learning Paths */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10"
            >
              <h2 className="font-display text-lg font-bold text-[#2C2E2F] mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#D4AF37]" /> Parcours recommandés
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {LEARNING_PATHS.map((path, i) => (
                  <motion.div
                    key={path.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, ease: easeOut }}
                    className="bg-white rounded-3xl p-5 shadow-sm border hover:shadow-md transition-shadow cursor-pointer group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                      style={{ backgroundColor: `${path.color}15`, color: path.color }}
                    >
                      {path.icon}
                    </div>
                    <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-1 group-hover:text-[#003087] transition-colors">
                      {path.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">{path.description}</p>
                    <div className="space-y-1.5">
                      {path.courses.map((course, ci) => (
                        <div key={ci} className="flex items-center gap-2 text-xs text-gray-600">
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: path.color }}>
                            <span className="text-[9px] font-bold" style={{ color: path.color }}>{ci + 1}</span>
                          </div>
                          {course}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all" style={{ color: path.color }}>
                      Commencer <ArrowRight className="w-3 h-3" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Loading */}
            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CourseSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-12">
                <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold mb-1">Impossible de charger les formations</p>
                <p className="text-sm text-gray-400">{error.message}</p>
              </div>
            )}

            {/* Empty */}
            {!isLoading && !error && filtered.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold mb-1">Aucune formation trouvée</p>
                <p className="text-sm text-gray-400">Essayez une autre catégorie ou recherche</p>
              </div>
            )}

            {/* Course Cards */}
            {!isLoading && !error && filtered.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((course, i) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border group cursor-pointer"
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    <div className="relative aspect-[16/9]">
                      <ImageWithFallback src={course.image} alt={course.title} className="w-full h-full group-hover:scale-105 transition-transform duration-500" fallbackType="course" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="px-3 py-1 bg-[#003087] text-white text-[10px] font-bold rounded-full">
                          {course.level}
                        </span>
                        {course.certificate && (
                          <span className="px-3 py-1 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                            <Award className="w-3 h-3" /> Certifiant
                          </span>
                        )}
                        {course.price === 0 && (
                          <span className="px-3 py-1 bg-[#00A651] text-white text-[10px] font-bold rounded-full">
                            Gratuit
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-5">
                      <span className="text-[10px] font-medium text-[#009CDE] bg-[#009CDE]/5 px-2 py-0.5 rounded-full">
                        {course.category}
                      </span>
                      <h3 className="font-display text-lg font-bold text-[#2C2E2F] mt-2 mb-1 group-hover:text-[#003087] transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-500 mb-3">Par {course.instructor}</p>
                      {course.createdAt && (
                        <p className="text-[10px] text-gray-400 mb-2">Publié {timeAgo(course.createdAt)}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {course.rating} ({course.students})
                        </span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.duration}</span>
                        {course.lessons && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {course.lessons} leçons</span>}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <p className="font-mono text-lg font-bold text-[#D4AF37]">
                          {course.price === 0 ? 'Gratuit' : `${new Intl.NumberFormat('fr-FR').format(course.price)} FCFA`}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEnroll(course.id); }}
                          disabled={enrollingCourseId === course.id && enrollCourse.isPending}
                          className="px-4 py-2 bg-[#003087] text-white rounded-full text-xs font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-60"
                        >
                          {enrollingCourseId === course.id && enrollCourse.isPending ? 'Inscription...' : 'S\'inscrire'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ============ MY COURSES TAB ============ */}
        {activeTab === 'my_courses' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {!user && (
              <div className="text-center py-16">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-2">Connectez-vous</h3>
                <p className="text-sm text-gray-500 mb-4">Veuillez vous connecter pour voir vos formations</p>
                <button onClick={() => router.push('/auth/login')} className="px-6 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors">
                  Se connecter
                </button>
              </div>
            )}

            {user && enrollmentsLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl p-5 shadow-sm border animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
                    <div className="h-2 bg-gray-100 rounded-full mb-2" />
                    <div className="h-8 bg-gray-200 rounded-full w-32" />
                  </div>
                ))}
              </div>
            )}

            {user && !enrollmentsLoading && enrollments.length === 0 && (
              <div className="text-center py-16">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-2">Aucune formation suivie</h3>
                <p className="text-sm text-gray-500 mb-4">Explorez notre catalogue et inscrivez-vous à une formation</p>
                <button onClick={() => setActiveTab('catalogue')} className="px-6 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors">
                  Explorer le catalogue
                </button>
              </div>
            )}

            {user && !enrollmentsLoading && enrollments.length > 0 && (
              <div className="space-y-4">
                {/* Stats summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
                    <p className="text-2xl font-bold text-[#003087]">{enrollments.length}</p>
                    <p className="text-xs text-gray-500">Formations</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
                    <p className="text-2xl font-bold text-[#00A651]">{enrollments.filter(e => e.completed).length}</p>
                    <p className="text-xs text-gray-500">Terminées</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
                    <p className="text-2xl font-bold text-[#D4AF37]">{enrollments.filter(e => !e.completed).length}</p>
                    <p className="text-xs text-gray-500">En cours</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
                    <p className="text-2xl font-bold text-[#009CDE]">{certificates.length}</p>
                    <p className="text-xs text-gray-500">Certificats</p>
                  </div>
                </div>

                {enrollments.map((enrollment, i) => {
                  const course = enrollment.course;
                  return (
                    <motion.div
                      key={enrollment.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, ease: easeOut }}
                      className="bg-white rounded-3xl p-5 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => course ? setSelectedCourseId(course.id) : undefined}
                    >
                      <div className="flex items-start gap-4">
                        {course?.image && (
                          <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0">
                            <ImageWithFallback src={course.image} alt={course?.title || ''} className="w-full h-full object-cover" fallbackType="course" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-sm text-[#2C2E2F] hover:text-[#003087] transition-colors truncate">
                              {course?.title || `Formation #${enrollment.courseId}`}
                            </h3>
                            {enrollment.completed ? (
                              <span className="px-2.5 py-0.5 bg-[#00A651]/10 text-[#00A651] rounded-full text-[10px] font-bold whitespace-nowrap flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Terminé
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full text-[10px] font-bold whitespace-nowrap">
                                En cours
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mb-2">Par {course?.instructor || 'Instructeur'} · {course?.duration || ''}</p>

                          {/* Progress bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${enrollment.progress}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                style={{
                                  background: enrollment.completed
                                    ? '#00A651'
                                    : 'linear-gradient(to right, #003087, #009CDE)',
                                }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-[#003087] min-w-[32px] text-right">
                              {enrollment.progress}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <p className="text-[10px] text-gray-400">
                              Inscrit le {formatDate(enrollment.enrolledAt)}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (course) setSelectedCourseId(course.id);
                              }}
                              className="text-xs font-semibold text-[#003087] hover:text-[#0047b3] flex items-center gap-1"
                            >
                              {enrollment.completed ? 'Revoir' : 'Continuer'} <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ============ CERTIFICATIONS TAB ============ */}
        {activeTab === 'certifications' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {!user && (
              <div className="text-center py-16">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-2">Connectez-vous</h3>
                <p className="text-sm text-gray-500 mb-4">Veuillez vous connecter pour voir vos certifications</p>
                <button onClick={() => router.push('/auth/login')} className="px-6 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors">
                  Se connecter
                </button>
              </div>
            )}

            {user && certificatesLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-3" />
                    <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
            )}

            {user && !certificatesLoading && certificates.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-10 h-10 text-[#D4AF37]" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-2">Aucun certificat obtenu</h3>
                <p className="text-sm text-gray-500 mb-4">Complétez des formations certifiantes pour obtenir vos certificats</p>
                <button onClick={() => setActiveTab('catalogue')} className="px-6 py-2.5 bg-[#D4AF37] text-[#003087] rounded-full text-sm font-bold hover:bg-[#e5c349] transition-colors">
                  Voir les formations certifiantes
                </button>
              </div>
            )}

            {user && !certificatesLoading && certificates.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {certificates.map((cert, i) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, ease: easeOut }}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border"
                  >
                    {/* Certificate header with gold accent */}
                    <div className="h-2 bg-gradient-to-r from-[#D4AF37] to-[#c9a22e]" />
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                          <Award className="w-6 h-6 text-[#D4AF37]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-1">
                            {cert.courseTitle || cert.course?.title || 'Formation'}
                          </h3>
                          <p className="text-xs text-gray-500 mb-1">Certificat #{cert.certificateId}</p>
                          <p className="text-xs text-gray-400">Délivré le {formatDate(cert.issuedAt)}</p>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => {
                            if (cert.downloadUrl) {
                              window.open(cert.downloadUrl, '_blank');
                            } else {
                              toast({ title: 'Bientôt', description: 'Le téléchargement sera bientôt disponible.' });
                            }
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#003087] text-white rounded-full text-xs font-semibold hover:bg-[#0047b3] transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> Télécharger
                        </button>
                        <button
                          onClick={() => {
                            toast({ title: 'Partagé !', description: 'Lien de certificat copié dans le presse-papier.' });
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 border rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" /> Partager
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
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

// ============ Course Detail Dialog Sub-Component ============

function CourseDetailDialog({
  courseId,
  onClose,
  onEnroll,
  enrollingCourseId,
  isEnrolling,
  user,
}: {
  courseId: string;
  onClose: () => void;
  onEnroll: (id: string) => void;
  enrollingCourseId: string | null;
  isEnrolling: boolean;
  user: { id: string } | null;
}) {
  const { data, isLoading } = useCourseDetail(courseId);
  const [activeSection, setActiveSection] = useState<'overview' | 'curriculum' | 'reviews'>('overview');

  const course = data?.course as Record<string, unknown> | undefined;

  const courseData: Course = course ? {
    id: String(course.id ?? courseId),
    title: String(course.title ?? ''),
    category: String(course.category ?? ''),
    instructor: String((course as Record<string, unknown>).instructor ?? ''),
    instructorBio: String((course as Record<string, unknown>).instructorBio ?? ''),
    instructorAvatar: String((course as Record<string, unknown>).instructorAvatar ?? ''),
    rating: Number((course as Record<string, unknown>).rating ?? 0),
    students: Number((course as Record<string, unknown>).students ?? 0),
    duration: String((course as Record<string, unknown>).duration ?? ''),
    price: Number((course as Record<string, unknown>).price ?? 0),
    image: String((course as Record<string, unknown>).image ?? ''),
    level: String((course as Record<string, unknown>).level ?? ''),
    certificate: (course as Record<string, unknown>).certificate === true,
    description: String((course as Record<string, unknown>).description ?? ''),
    lessons: Number((course as Record<string, unknown>).lessons ?? 0),
    reviews: Number((course as Record<string, unknown>).reviews ?? 0),
    modules: (course as Record<string, unknown>).modules as Course['modules'],
  } : {
    id: courseId,
    title: '',
    category: '',
    instructor: '',
    rating: 0,
    students: 0,
    duration: '',
    price: 0,
    image: '',
    level: '',
    certificate: false,
  };

  // Mock reviews for demo
  const mockReviews = [
    { id: 'r1', user: 'Aminata K.', rating: 5, comment: 'Excellente formation ! Très bien structurée et instructive.', date: 'Il y a 3j' },
    { id: 'r2', user: 'Kofi M.', rating: 4, comment: 'Bon contenu, quelques vidéos pourraient être plus détaillées.', date: 'Il y a 1 semaine' },
    { id: 'r3', user: 'Fatou D.', rating: 5, comment: 'Merci pour cette formation. J\'ai pu réaliser mon premier investissement grâce à ces conseils.', date: 'Il y a 2 semaines' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/60 flex items-start justify-center overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl my-8 mx-4"
        onClick={e => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="p-8 animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-32 bg-gray-100 rounded" />
          </div>
        ) : (
          <>
            {/* Course image */}
            <div className="relative aspect-[16/9]">
              <ImageWithFallback src={courseData.image} alt={courseData.title} className="w-full h-full rounded-t-3xl" fallbackType="course" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-3xl" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-5 right-5">
                <div className="flex gap-1.5 mb-2">
                  <span className="px-3 py-1 bg-[#003087] text-white text-[10px] font-bold rounded-full">{courseData.level}</span>
                  {courseData.certificate && (
                    <span className="px-3 py-1 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                      <Award className="w-3 h-3" /> Certifiant
                    </span>
                  )}
                  {courseData.price === 0 && (
                    <span className="px-3 py-1 bg-[#00A651] text-white text-[10px] font-bold rounded-full">Gratuit</span>
                  )}
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white">{courseData.title}</h2>
              </div>
            </div>

            {/* Course info bar */}
            <div className="flex flex-wrap items-center gap-4 px-5 py-3 bg-gray-50 border-b text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {courseData.rating} ({courseData.students} étudiants)
              </span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {courseData.duration}</span>
              {(courseData.lessons ?? 0) > 0 && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {courseData.lessons} leçons</span>}
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {courseData.students} inscrits</span>
              <span className="text-[#009CDE] bg-[#009CDE]/5 px-2 py-0.5 rounded-full font-medium">{courseData.category}</span>
            </div>

            {/* Detail Tabs */}
            <div className="flex border-b">
              {[
                { key: 'overview' as const, label: 'Aperçu' },
                { key: 'curriculum' as const, label: 'Programme' },
                { key: 'reviews' as const, label: 'Avis' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
                    activeSection === tab.key
                      ? 'text-[#003087] border-b-2 border-[#003087]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-5 max-h-[50vh] overflow-y-auto">
              {activeSection === 'overview' && (
                <div className="space-y-5">
                  {/* Description */}
                  <div>
                    <h3 className="font-semibold text-sm text-[#2C2E2F] mb-2">Description</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {courseData.description || 'Découvrez cette formation complète conçue pour les professionnels de l\'immobilier en Afrique de l\'Ouest. Apprenez les fondamentaux, maîtrisez les aspects juridiques et développez vos compétences pratiques.'}
                    </p>
                  </div>

                  {/* Instructor */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <h3 className="font-semibold text-sm text-[#2C2E2F] mb-3">Instructeur</h3>
                    <div className="flex items-center gap-3">
                      <ImageWithFallback
                        src={courseData.instructorAvatar || ''}
                        alt={courseData.instructor}
                        className="w-12 h-12 rounded-full"
                        fallbackType="avatar"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#003087] cursor-pointer hover:underline">
                          {courseData.instructor || 'Expert AfriBayit'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {courseData.instructorBio || 'Formateur certifié avec plus de 10 ans d\'expérience dans l\'immobilier ouest-africain.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* What you'll learn */}
                  <div>
                    <h3 className="font-semibold text-sm text-[#2C2E2F] mb-3">Ce que vous allez apprendre</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        'Maîtriser les fondamentaux de l\'investissement',
                        'Comprendre le cadre juridique foncier',
                        'Analyser un marché immobilier local',
                        'Négocier efficacement une transaction',
                        'Évaluer la rentabilité d\'un projet',
                        'Gérer les risques liés à l\'investissement',
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle2 className="w-4 h-4 text-[#00A651] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'curriculum' && (
                <div className="space-y-2">
                  {courseData.modules && courseData.modules.length > 0 ? (
                    courseData.modules.map((mod, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-[#003087]/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[#003087]">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2C2E2F]">{mod.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400">
                            {mod.type === 'video' && <Play className="w-3 h-3" />}
                            {mod.type === 'text' && <FileText className="w-3 h-3" />}
                            {mod.type === 'quiz' && <Award className="w-3 h-3" />}
                            {mod.duration || '15 min'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {[
                        { title: 'Introduction & Contexte', type: 'video', duration: '12 min' },
                        { title: 'Les fondamentaux', type: 'video', duration: '25 min' },
                        { title: 'Étude de cas pratique', type: 'text', duration: '15 min' },
                        { title: 'Aspects juridiques', type: 'video', duration: '30 min' },
                        { title: 'Quiz de validation', type: 'quiz', duration: '10 min' },
                        { title: 'Mise en pratique', type: 'video', duration: '20 min' },
                        { title: 'Quiz final & Certificat', type: 'quiz', duration: '15 min' },
                      ].map((mod, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                          <div className="w-8 h-8 rounded-full bg-[#003087]/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-[#003087]">{i + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#2C2E2F]">{mod.title}</p>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                              {mod.type === 'video' && <Play className="w-3 h-3" />}
                              {mod.type === 'text' && <FileText className="w-3 h-3" />}
                              {mod.type === 'quiz' && <Award className="w-3 h-3" />}
                              {mod.duration}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {activeSection === 'reviews' && (
                <div className="space-y-4">
                  {/* Rating summary */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#003087]">{courseData.rating || '4.8'}</p>
                      <div className="flex gap-0.5 my-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className="w-3 h-3" fill={s <= Math.round(courseData.rating || 5) ? '#D4AF37' : '#e5e7eb'} />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{courseData.reviews || 24} avis</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map(star => {
                        const pct = star === 5 ? 72 : star === 4 ? 20 : star === 3 ? 5 : star === 2 ? 2 : 1;
                        return (
                          <div key={star} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-gray-500">{star}</span>
                            <Star className="w-3 h-3 text-[#D4AF37]" fill="#D4AF37" />
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-[#D4AF37] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-8 text-gray-400">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reviews list */}
                  {mockReviews.map(review => (
                    <div key={review.id} className="p-4 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#003087]/10 flex items-center justify-center text-xs font-bold text-[#003087]">
                          {review.user.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#2C2E2F]">{review.user}</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className="w-3 h-3" fill={s <= review.rating ? '#D4AF37' : '#e5e7eb'} />
                            ))}
                            <span className="text-[10px] text-gray-400 ml-1">{review.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with price and enroll */}
            <div className="flex items-center justify-between p-5 border-t bg-gray-50/50 rounded-b-3xl">
              <div>
                <p className="font-mono text-xl font-bold text-[#D4AF37]">
                  {courseData.price === 0 ? 'Gratuit' : `${new Intl.NumberFormat('fr-FR').format(courseData.price)} FCFA`}
                </p>
                {courseData.certificate && (
                  <p className="text-[10px] text-[#00A651] flex items-center gap-1">
                    <Award className="w-3 h-3" /> Certificat inclus
                  </p>
                )}
              </div>
              <button
                onClick={() => onEnroll(courseId)}
                disabled={enrollingCourseId === courseId && isEnrolling}
                className="px-6 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {enrollingCourseId === courseId && isEnrolling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Inscription...
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4" /> S'inscrire
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
