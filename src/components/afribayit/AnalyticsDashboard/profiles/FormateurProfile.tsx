'use client';

import { motion } from 'framer-motion';
import {
  BadgeCheck,
  BookOpen,
  CircleDollarSign,
  GraduationCap,
  Percent,
  Star,
} from 'lucide-react';
import { FORMATEUR_ANALYTICS, easeOut } from '../demoData';
import { formatPrice } from '../utils';

export default function FormateurProfile() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <BookOpen className="w-5 h-5 text-[#009CDE] mb-1" />
          <p className="font-mono text-xl font-bold text-[#0a2a5e]">{FORMATEUR_ANALYTICS.coursesPublished}</p>
          <p className="text-xs text-gray-500">Cours publiés</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <GraduationCap className="w-5 h-5 text-[#003087] mb-1" />
          <p className="font-mono text-xl font-bold text-[#0a2a5e]">{FORMATEUR_ANALYTICS.totalStudents}</p>
          <p className="text-xs text-gray-500">Inscrits total</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <Percent className="w-5 h-5 text-[#00A651] mb-1" />
          <p className="font-mono text-xl font-bold text-[#00A651]">{FORMATEUR_ANALYTICS.completionRate}%</p>
          <p className="text-xs text-gray-500">Taux complétion</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <Star className="w-5 h-5 text-[#D4AF37] mb-1" />
          <p className="font-mono text-xl font-bold text-[#0a2a5e]">{FORMATEUR_ANALYTICS.avgRating}</p>
          <p className="text-xs text-gray-500">Notes & avis ({FORMATEUR_ANALYTICS.notesAvis.total})</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <BadgeCheck className="w-5 h-5 text-[#00A651] mb-1" />
          <p className="font-mono text-xl font-bold text-[#00A651]">{FORMATEUR_ANALYTICS.certificationsDelivrees}</p>
          <p className="text-xs text-gray-500">Certifications délivrées</p>
        </div>
      </div>

      {/* Inscrits par cours + Revenus générés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-[#009CDE]" /> Inscrits par cours</h3>
          <div className="space-y-3">
            {FORMATEUR_ANALYTICS.inscritsParCours.map(course => (
              <div key={course.name} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm text-[#0a2a5e]">{course.name}</p>
                  <span className="font-mono text-sm font-bold text-[#003087]">{course.students} inscrits</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-lg bg-[#009CDE]" style={{ width: `${course.completion}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Taux complétion : {course.completion}%</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-4 flex items-center gap-2"><CircleDollarSign className="w-5 h-5 text-[#00A651]" /> Revenus générés</h3>
          <div className="text-center mb-4">
            <p className="font-mono text-3xl font-bold text-[#00A651]">{formatPrice(FORMATEUR_ANALYTICS.monthlyRevenue)}</p>
            <p className="text-xs text-gray-500">ce mois</p>
          </div>
          <div className="space-y-3">
            {FORMATEUR_ANALYTICS.topCourses.map(course => (
              <div key={course.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div><p className="font-semibold text-sm text-[#0a2a5e]">{course.name}</p><p className="text-xs text-gray-500">{course.students} étudiants · <span className="text-[#D4AF37]">{course.rating}/5</span></p></div>
                <p className="font-mono text-sm font-bold text-[#00A651]">{formatPrice(course.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-4">Entonnoir de conversion formateur</h3>
        <div className="space-y-3">
          {FORMATEUR_ANALYTICS.conversionFunnel.map((stage, i) => (
            <div key={stage.stage} className="flex items-center gap-4">
              <div className="w-40 shrink-0 text-sm text-gray-600">{stage.stage}</div>
              <div className="flex-1 flex items-center gap-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stage.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }} className="h-8 rounded-xl flex items-center justify-end pr-2" style={{ backgroundColor: i === FORMATEUR_ANALYTICS.conversionFunnel.length - 1 ? '#00A651' : '#009CDE', minWidth: '40px' }}>
                  <span className="text-white text-xs font-mono font-bold">{stage.count}</span>
                </motion.div>
                <span className="text-xs text-gray-500 w-12">{stage.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
