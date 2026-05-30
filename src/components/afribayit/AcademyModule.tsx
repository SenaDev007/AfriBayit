'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { courses } from '@/lib/mockData';

const easeOut = [0.16, 1, 0.3, 1] as const;

const categories = ['Tous', 'Investissement', 'Certification', 'Juridique', 'Technique', 'Construction', 'Business'];

export default function AcademyModule() {
  const [selectedCategory, setSelectedCategory] = React.useState('Tous');

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

        {/* Course Cards */}
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
