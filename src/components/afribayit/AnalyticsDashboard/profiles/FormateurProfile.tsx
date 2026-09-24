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
import { useTranslation } from '@/lib/i18n/use-translate';

export default function FormateurProfile() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <BookOpen className="w-5 h-5 text-primary-green mb-1" />
          <p className="font-serif font-black text-xl text-primary-deep">{FORMATEUR_ANALYTICS.coursesPublished}</p>
          <p className="text-xs text-gray-text">{t('analytics.formateurProfile.coursesPublished', 'Cours publiés')}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <GraduationCap className="w-5 h-5 text-primary-deep mb-1" />
          <p className="font-serif font-black text-xl text-primary-deep">{FORMATEUR_ANALYTICS.totalStudents}</p>
          <p className="text-xs text-gray-text">{t('analytics.formateurProfile.totalStudents', 'Inscrits total')}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <Percent className="w-5 h-5 text-[#00A651] mb-1" />
          <p className="font-serif font-black text-xl text-[#00A651]">{FORMATEUR_ANALYTICS.completionRate}%</p>
          <p className="text-xs text-gray-text">{t('analytics.formateurProfile.completionRate', 'Taux complétion')}</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <Star className="w-5 h-5 text-accent-yellow mb-1" />
          <p className="font-serif font-black text-xl text-primary-deep">{FORMATEUR_ANALYTICS.avgRating}</p>
          <p className="text-xs text-gray-text">{t('analytics.formateurProfile.reviewsLabel', 'Notes & avis')} ({FORMATEUR_ANALYTICS.notesAvis.total})</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-lg border border-primary-pale">
          <BadgeCheck className="w-5 h-5 text-[#00A651] mb-1" />
          <p className="font-serif font-black text-xl text-[#00A651]">{FORMATEUR_ANALYTICS.certificationsDelivrees}</p>
          <p className="text-xs text-gray-text">{t('analytics.formateurProfile.certificationsIssued', 'Certifications délivrées')}</p>
        </div>
      </div>

      {/* Inscrits par cours + Revenus générés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
          <h3 className="font-serif text-lg font-bold text-primary-deep mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-primary-green" /> {t('analytics.formateurProfile.studentsPerCourse', 'Inscrits par cours')}</h3>
          <div className="space-y-3">
            {FORMATEUR_ANALYTICS.inscritsParCours.map(course => (
              <div key={course.name} className="p-3 bg-primary-pale/30 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm text-primary-deep">{course.name}</p>
                  <span className="font-mono text-sm font-bold text-primary-deep">{course.students} {t('analytics.formateurProfile.enrolled', 'inscrits')}</span>
                </div>
                <div className="h-2 bg-primary-pale rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary-green" style={{ width: `${course.completion}%` }} />
                </div>
                <p className="text-xs text-gray-text mt-1">{t('analytics.formateurProfile.completionRateColon', 'Taux complétion')}: {course.completion}%</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
          <h3 className="font-serif text-lg font-bold text-primary-deep mb-4 flex items-center gap-2"><CircleDollarSign className="w-5 h-5 text-[#00A651]" /> {t('analytics.formateurProfile.revenueGenerated', 'Revenus générés')}</h3>
          <div className="text-center mb-4">
            <p className="font-serif font-black text-3xl text-[#00A651]">{formatPrice(FORMATEUR_ANALYTICS.monthlyRevenue)}</p>
            <p className="text-xs text-gray-text">{t('analytics.formateurProfile.thisMonth', 'ce mois')}</p>
          </div>
          <div className="space-y-3">
            {FORMATEUR_ANALYTICS.topCourses.map(course => (
              <div key={course.name} className="flex items-center justify-between p-3 bg-primary-pale/30 rounded-2xl">
                <div><p className="font-semibold text-sm text-primary-deep">{course.name}</p><p className="text-xs text-gray-text">{course.students} {t('analytics.formateurProfile.students', 'étudiants')} · <span className="text-accent-yellow">{course.rating}/5</span></p></div>
                <p className="font-mono text-sm font-bold text-[#00A651]">{formatPrice(course.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-lg border border-primary-pale">
        <h3 className="font-serif text-lg font-bold text-primary-deep mb-4">{t('analytics.formateurProfile.conversionFunnel', 'Entonnoir de conversion formateur')}</h3>
        <div className="space-y-3">
          {FORMATEUR_ANALYTICS.conversionFunnel.map((stage, i) => (
            <div key={stage.stage} className="flex items-center gap-4">
              <div className="w-40 shrink-0 text-sm text-gray-text">{stage.stage}</div>
              <div className="flex-1 flex items-center gap-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${stage.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1, ease: easeOut }} className="h-8 rounded-xl flex items-center justify-end pr-2" style={{ backgroundColor: i === FORMATEUR_ANALYTICS.conversionFunnel.length - 1 ? '#00A651' : '#009CDE', minWidth: '40px' }}>
                  <span className="text-white text-xs font-mono font-bold">{stage.count}</span>
                </motion.div>
                <span className="text-xs text-gray-text w-12">{stage.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
