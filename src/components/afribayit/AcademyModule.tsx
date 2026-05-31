'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCourses } from '@/hooks/useCourses';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { timeAgo } from '@/lib/afribayit-utils';

interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  rating: number;
  students: number;
  duration: string;
  price: number;
  image: string;
  level: string;
  certificate: boolean;
  createdAt?: string;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const categories = ['Tous', 'Investissement', 'Certification', 'Juridique', 'Technique', 'Construction', 'Business'];

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
  const [selectedCategory, setSelectedCategory] = React.useState('Tous');
  const { selectedCountry } = useCountry();

  const { data, isLoading, error } = useCourses(
    selectedCategory === 'Tous' ? undefined : selectedCategory,
    undefined,
    selectedCountry
  );

  const courses: Course[] = (data?.courses as Course[]) || [];

  const filtered = selectedCategory === 'Tous'
    ? courses
    : courses.filter(c => c.category === selectedCategory);

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#003087]/10 text-[#003087] text-sm font-semibold mb-4">
            📚 AfriBayit Academy
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
            <span className="text-4xl block mb-3">⚠️</span>
            <p className="text-gray-600 font-semibold mb-1">Impossible de charger les formations</p>
            <p className="text-sm text-gray-400">{error.message}</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">📚</span>
            <p className="text-gray-600 font-semibold mb-1">Aucune formation trouvée</p>
            <p className="text-sm text-gray-400">Essayez une autre catégorie</p>
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
              >
                <div className="relative aspect-[16/9]">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="px-3 py-1 bg-[#003087] text-white text-[10px] font-bold rounded-full">
                      {course.level}
                    </span>
                    {course.certificate && (
                      <span className="px-3 py-1 bg-[#D4AF37] text-white text-[10px] font-bold rounded-full">
                        🏅 Certifiant
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
                    <span>⏱ {course.duration}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <p className="font-mono-data text-lg font-bold text-[#D4AF37]">
                      {new Intl.NumberFormat('fr-FR').format(course.price)} FCFA
                    </p>
                    <button className="px-4 py-2 bg-[#003087] text-white rounded-full text-xs font-semibold hover:bg-[#0047b3] transition-colors">
                      S&apos;inscrire
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Video Player Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 bg-white rounded-3xl overflow-hidden shadow-sm border"
        >
          <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 cursor-pointer hover:bg-white/30 transition-colors">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <p className="text-white/60 text-sm">Aperçu du cours</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
