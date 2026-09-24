'use client';

import { motion } from 'framer-motion';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { timeAgo } from '@/lib/afribayit-utils';
import { Award, Clock, FileText, Star } from 'lucide-react';
import type { Course } from './types';
import { easeOut } from './types';

interface CourseCardProps {
  course: Course;
  index: number;
  enrollingCourseId: string | null;
  isEnrolling: boolean;
  onSelect: (id: string) => void;
  onEnroll: (id: string) => void;
}

export default function CourseCard({
  course,
  index,
  enrollingCourseId,
  isEnrolling,
  onSelect,
  onEnroll,
}: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: easeOut }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl overflow-hidden shadow-lg border border-primary-pale card-shimmer group cursor-pointer w-full"
      onClick={() => onSelect(course.id)}
    >
      {/* Image — same pattern as PropertyCard: aspect-[4/3], fill, absolute */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <ImageWithFallback
          src={course.image}
          alt={course.title}
          className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-500"
          fallbackType="course"
          fill
        />
        {/* Left badges: level, certificate, free */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-3 py-1 bg-primary-deep text-white text-[11px] font-bold rounded-full shadow-md">
            {course.level}
          </span>
          {course.certificate && (
            <span className="px-3 py-1 bg-accent-yellow text-primary-deep text-[11px] font-bold rounded-full flex items-center gap-1 shadow-md">
              <Award className="w-3 h-3" /> Certifiant
            </span>
          )}
          {course.price === 0 && (
            <span className="px-3 py-1 bg-[#00A651] text-white text-[11px] font-bold rounded-full shadow-md">
              Gratuit
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category + views */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-medium text-primary-deep bg-primary-pale px-2 py-0.5 rounded-full">
            {course.category}
          </span>
          <span className="text-[11px] text-gray-400">•</span>
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <Star className="w-3 h-3 text-accent-yellow fill-accent-yellow" />
            {course.rating}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-1 group-hover:text-primary-green transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-gray-text mb-3">Par {course.instructor}</p>

        {/* Details row */}
        <div className="flex items-center gap-4 text-xs text-gray-text mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {course.duration}
          </span>
          {course.lessons && (
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> {course.lessons} leçons
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {course.students}
          </span>
        </div>

        {/* Price + Enroll */}
        <div className="flex items-center justify-between pt-3 border-t border-primary-pale/60">
          <p className="font-mono text-lg font-bold text-accent-dark">
            {course.price === 0 ? 'Gratuit' : `${new Intl.NumberFormat('fr-FR').format(course.price)} FCFA`}
          </p>
          <button
            onClick={(e) => { e.stopPropagation(); onEnroll(course.id); }}
            disabled={enrollingCourseId === course.id && isEnrolling}
            className="px-4 py-2 rounded-full bg-primary-green text-white text-xs font-bold hover:bg-primary-deep transition-all disabled:opacity-60 shadow-md"
          >
            {enrollingCourseId === course.id && isEnrolling ? 'Inscription...' : "S'inscrire"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
