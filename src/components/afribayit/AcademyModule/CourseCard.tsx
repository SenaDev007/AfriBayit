'use client';

import { motion } from 'framer-motion';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { timeAgo } from '@/lib/afribayit-utils';
import { Award, Clock, FileText } from 'lucide-react';
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
      className="bg-white rounded-3xl overflow-hidden shadow-sm border group cursor-pointer"
      onClick={() => onSelect(course.id)}
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
            onClick={(e) => { e.stopPropagation(); onEnroll(course.id); }}
            disabled={enrollingCourseId === course.id && isEnrolling}
            className="px-4 py-2 bg-[#003087] text-white rounded-full text-xs font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-60"
          >
            {enrollingCourseId === course.id && isEnrolling ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
