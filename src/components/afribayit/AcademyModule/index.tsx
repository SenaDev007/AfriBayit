'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCourses, useEnrollCourse, useMyEnrollments, useMyCertificates } from '@/hooks/useCourses';
import { useAuthStore } from '@/stores/authStore';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { toast } from '@/hooks/use-toast';
import { GraduationCap } from 'lucide-react';
import type { Course, Enrollment, CertificateItem, AcademyTabKey } from './types';
import { academyTabs } from './constants';
import CataloguePanel from './CataloguePanel';
import MyCoursesPanel from './MyCoursesPanel';
import CertificationsPanel from './CertificationsPanel';
import CourseDetailDialog from './CourseDetailDialog';

export default function AcademyModule() {
  const [activeTab, setActiveTab] = useState<AcademyTabKey>('catalogue');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
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
          <CataloguePanel
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            priceFilter={priceFilter}
            setPriceFilter={setPriceFilter}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            isLoading={isLoading}
            error={error}
            filtered={filtered}
            enrollingCourseId={enrollingCourseId}
            isEnrolling={enrollCourse.isPending}
            onSelect={(id) => setSelectedCourseId(id)}
            onEnroll={handleEnroll}
          />
        )}

        {/* ============ MY COURSES TAB ============ */}
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

        {/* ============ CERTIFICATIONS TAB ============ */}
        {activeTab === 'certifications' && (
          <CertificationsPanel
            user={user}
            certificatesLoading={certificatesLoading}
            certificates={certificates}
            onLogin={() => router.push('/auth/login')}
            onGoToCatalogue={() => setActiveTab('catalogue')}
          />
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
