import { motion } from 'framer-motion';
import {
  Award, BadgeCheck, BarChart3, BookOpen, GraduationCap, Zap,
} from 'lucide-react';
import type { AcademyTabKey } from './types';

// CDC §5.6.3 — Course categories aligned with the CDC
export const categories = [
  'Tous',
  'Investissement immobilier',
  'Droit foncier par pays',
  'Gestion locative',
  'Techniques de vente',
  'Découverte AfriBayit',
  'BTP & Rénovation',
];

export const academyTabs: { key: AcademyTabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'catalogue', label: 'Catalogue', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'my_courses', label: 'Mes Formations', icon: <GraduationCap className="w-4 h-4" /> },
  { key: 'certifications', label: 'Certifications', icon: <Award className="w-4 h-4" /> },
];

// CDC §5.6 — 5 learning paths (Débutant, Investisseur, Professionnel, Légal, Artisan)
export const LEARNING_PATHS = [
  {
    id: 'debutant',
    title: 'Débutant',
    description: 'Découverte de l\'immobilier africain',
    courses: ['Découverte AfriBayit', 'Droit foncier Bénin 2023', 'Investissement Immobilier 101'],
    color: '#003087',
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    id: 'investisseur',
    title: 'Investisseur',
    description: 'Stratégies d\'investissement et ROI',
    courses: ['Calcul de rentabilité', 'Défiscalisation en Afrique', 'Analyse de marché'],
    color: '#D4AF37',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: 'professionnel',
    title: 'Professionnel',
    description: 'Agent certifié et gestion immobilière',
    courses: ['Techniques de vente', 'Négociation immobilière', 'Certification Agent'],
    color: '#00A651',
    icon: <BadgeCheck className="w-5 h-5" />,
  },
  {
    id: 'legal',
    title: 'Légal',
    description: 'Droit foncier OHADA et fiscalité',
    courses: ['Code foncier OHADA', 'Réglementation CI', 'Fiscalité immobilière'],
    color: '#009CDE',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    id: 'artisan',
    title: 'Artisan',
    description: 'Normes BTP et certifications professionnelles',
    courses: ['Normes BTP', 'Éco-construction', 'Lecture de plans'],
    color: '#D93025',
    icon: <GraduationCap className="w-5 h-5" />,
  },
];

export function CourseSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border animate-pulse">
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
          <div className="h-8 w-20 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function LearningPaths() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10"
    >
      <h2 className="font-display text-lg font-bold text-[#0a2a5e] mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-[#D4AF37]" /> Parcours recommandés
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {LEARNING_PATHS.map((path, i) => (
          <motion.div
            key={path.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${path.color}15`, color: path.color }}
            >
              {path.icon}
            </div>
            <h3 className="font-display text-base font-bold text-[#0a2a5e] mb-1 group-hover:text-[#003087] transition-colors">
              {path.title}
            </h3>
            <p className="text-xs text-gray-500 mb-3">{path.description}</p>
            <div className="space-y-1.5">
              {path.courses.map((course, ci) => (
                <div key={ci} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0" style={{ borderColor: path.color }}>
                    <span className="text-[9px] font-bold" style={{ color: path.color }}>{ci + 1}</span>
                  </div>
                  {course}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold group-hover:gap-2 transition-all" style={{ color: path.color }}>
              Commencer <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Reviews are now fetched from backend API (/academy/courses/:id/reviews)
// Do not use mock data — all data must come from the database.

// What you'll learn bullet points (used in CourseDetailDialog)
// These are generic defaults — actual course content comes from the API
export const whatYouWillLearn = [
  'Maîtriser les fondamentaux de l\'investissement',
  'Comprendre le cadre juridique foncier',
  'Analyser un marché immobilier local',
  'Négocier efficacement une transaction',
  'Évaluer la rentabilité d\'un projet',
  'Gérer les risques liés à l\'investissement',
];

// Default curriculum (used as placeholder while loading from API)
export const defaultCurriculum: { title: string; type: string; duration: string }[] = [];
