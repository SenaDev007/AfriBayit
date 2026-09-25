'use client';

import { motion } from 'framer-motion';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { formatDate } from '@/lib/afribayit-utils';
import { BookOpen, CheckCircle2, ChevronRight, GraduationCap } from 'lucide-react';
import type { Enrollment } from './types';
import { easeOut } from './types';

interface MyCoursesPanelProps {
  user: { id: string } | null;
  enrollmentsLoading: boolean;
  enrollments: Enrollment[];
  certificatesCount: number;
  onSelect: (id: string) => void;
  onLogin: () => void;
  onGoToCatalogue: () => void;
}

export default function MyCoursesPanel({
  user, enrollmentsLoading, enrollments, certificatesCount, onSelect, onLogin, onGoToCatalogue,
}: MyCoursesPanelProps) {
  if (!user) {
    return (
      <div className="text-center py-16">
        <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-2">Connectez-vous</h3>
        <p className="text-sm text-gray-text mb-4">Veuillez vous connecter pour voir vos formations</p>
        <button onClick={onLogin} className="px-6 py-2.5 rounded-full bg-primary-green text-white text-sm font-bold shadow-md hover:bg-primary-deep hover:shadow-lg transition-all">
          Se connecter
        </button>
      </div>
    );
  }

  if (enrollmentsLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white rounded-3xl p-5 shadow-lg border border-gray-200 animate-pulse">
            <div className="h-4 bg-primary-pale rounded w-3/4 mb-3" />
            <div className="h-3 bg-primary-pale/60 rounded-full w-1/2 mb-4" />
            <div className="h-2 bg-primary-pale/60 rounded-full mb-2" />
            <div className="h-8 bg-primary-pale rounded-full w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-16">
        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-2">Aucune formation suivie</h3>
        <p className="text-sm text-gray-text mb-4">Explorez notre catalogue et inscrivez-vous à une formation</p>
        <button onClick={onGoToCatalogue} className="px-6 py-2.5 rounded-full bg-primary-green text-white text-sm font-bold shadow-md hover:bg-primary-deep hover:shadow-lg transition-all">
          Explorer le catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale text-center">
          <p className="text-2xl font-bold text-primary-deep">{enrollments.length}</p>
          <p className="text-xs text-gray-text">Formations</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale text-center">
          <p className="text-2xl font-bold text-green-600">{enrollments.filter(e => e.completed).length}</p>
          <p className="text-xs text-gray-text">Terminées</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale text-center">
          <p className="text-2xl font-bold text-accent-dark">{enrollments.filter(e => !e.completed).length}</p>
          <p className="text-xs text-gray-text">En cours</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale text-center">
          <p className="text-2xl font-bold text-primary-green">{certificatesCount}</p>
          <p className="text-xs text-gray-text">Certificats</p>
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
            className="bg-white rounded-3xl p-5 shadow-lg border border-primary-pale hover:shadow-xl transition-shadow cursor-pointer card-shimmer"
            onClick={() => course ? onSelect(course.id) : undefined}
          >
            <div className="flex items-start gap-4">
              {course?.image && (
                <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0">
                  <ImageWithFallback src={course.image} alt={course?.title || ''} className="w-full h-full object-cover" fallbackType="course" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-sm text-primary-deep hover:text-primary-green transition-colors truncate">
                    {course?.title || `Formation #${enrollment.courseId}`}
                  </h3>
                  {enrollment.completed ? (
                    <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-bold whitespace-nowrap flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Terminé
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-accent-yellow/15 text-accent-dark rounded-full text-[10px] font-bold whitespace-nowrap border border-accent-yellow/30">
                      En cours
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-text mb-2">Par {course?.instructor || 'Instructeur'} · {course?.duration || ''}</p>

                {/* Progress bar */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-primary-pale/60 rounded-full overflow-hidden">
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
                  <span className="text-xs font-semibold text-primary-deep min-w-[32px] text-right">
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
                      if (course) onSelect(course.id);
                    }}
                    className="text-xs font-semibold text-primary-deep hover:text-primary-green flex items-center gap-1"
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
  );
}
