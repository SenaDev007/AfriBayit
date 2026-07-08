'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { useCourseDetail } from '@/hooks/useCourses';
import {
  Award, CheckCircle2, Clock, FileText, GraduationCap, Play, Star, Users, X,
} from 'lucide-react';
import type { Course, CourseDetailDialogProps } from './types';
import { whatYouWillLearn, defaultCurriculum } from './constants';

export default function CourseDetailDialog({
  courseId, onClose, onEnroll, enrollingCourseId, isEnrolling, user,
}: CourseDetailDialogProps) {
  void user; // kept for API parity with original
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
            {/* Course image — same pattern as PropertyCard */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl">
              <ImageWithFallback
                src={courseData.image}
                alt={courseData.title}
                className="absolute inset-0 w-full h-full"
                fallbackType="course"
                fill
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors z-10"
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
                      <div className="w-12 h-12 rounded-full overflow-hidden relative shrink-0">
                        <ImageWithFallback
                          src={courseData.instructorAvatar || ''}
                          alt={courseData.instructor}
                          className="absolute inset-0 w-full h-full"
                          fallbackType="avatar"
                          fill
                        />
                      </div>
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
                      {whatYouWillLearn.map((item, i) => (
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
                      <CurriculumRow key={i} index={i} title={mod.title} type={mod.type} duration={mod.duration || '15 min'} />
                    ))
                  ) : (
                    <>
                      {defaultCurriculum.map((mod, i) => (
                        <CurriculumRow key={i} index={i} title={mod.title} type={mod.type} duration={mod.duration} />
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
                      <p className="text-xs text-gray-500">{courseData?.reviews as any || 24} avis</p>
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

                  {/* Reviews list — fetched from API */}
                  {((courseData as any)?.reviews || []).map((review: any) => (
                    <div key={review.id || review._id} className="p-4 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#003366]/10 flex items-center justify-center text-xs font-bold text-[#003366]">
                          {(review.reviewer?.name || review.user || 'U').charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#2C2E2F]">{review.reviewer?.name || review.user}</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className="w-3 h-3" fill={s <= (review.rating || 0) ? '#FFCC00' : '#e5e7eb'} />
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

function CurriculumRow({ index, title, type, duration }: { index: number; title: string; type?: string; duration: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <div className="w-8 h-8 rounded-full bg-[#003087]/10 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-[#003087]">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2C2E2F]">{title}</p>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          {type === 'video' && <Play className="w-3 h-3" />}
          {type === 'text' && <FileText className="w-3 h-3" />}
          {type === 'quiz' && <Award className="w-3 h-3" />}
          {duration}
        </div>
      </div>
    </div>
  );
}
