import { motion } from 'framer-motion';
import {
  Award, BadgeCheck, BarChart3, BookOpen, GraduationCap, Zap,
} from 'lucide-react';
import type { AcademyTabKey } from './types';

export const categories = ['Tous', 'Investissement', 'Certification', 'Juridique', 'Technique', 'Construction', 'Business'];

export const academyTabs: { key: AcademyTabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'catalogue', label: 'Catalogue', icon: <BookOpen className="w-4 h-4" /> },
  { key: 'my_courses', label: 'Mes Formations', icon: <GraduationCap className="w-4 h-4" /> },
  { key: 'certifications', label: 'Certifications', icon: <Award className="w-4 h-4" /> },
];

// Learning paths suggestions
export const LEARNING_PATHS = [
  {
    id: 'lp1',
    title: 'Investisseur Débutant',
    description: 'De zéro à premier investissement',
    courses: ['Investissement Immobilier 101', 'Analyse de Marché', 'Financement & Crédit'],
    color: '#003087',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    id: 'lp2',
    title: 'Agent Certifié',
    description: 'Obtenez votre certification professionnelle',
    courses: ['Droit Foncier', 'Négociation Avancée', 'Certification Agent'],
    color: '#D4AF37',
    icon: <BadgeCheck className="w-5 h-5" />,
  },
  {
    id: 'lp3',
    title: 'Promoteur Immobilier',
    description: 'Maîtrisez la construction et la promotion',
    courses: ['Gestion de Projet BTP', 'Réglementation Urbaine', 'Marketing Immobilier'],
    color: '#00A651',
    icon: <BarChart3 className="w-5 h-5" />,
  },
];

export function CourseSkeleton() {
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

export function LearningPaths() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10"
    >
      <h2 className="font-display text-lg font-bold text-[#2C2E2F] mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-[#D4AF37]" /> Parcours recommandés
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {LEARNING_PATHS.map((path, i) => (
          <motion.div
            key={path.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-3xl p-5 shadow-sm border hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `${path.color}15`, color: path.color }}
            >
              {path.icon}
            </div>
            <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-1 group-hover:text-[#003087] transition-colors">
              {path.title}
            </h3>
            <p className="text-xs text-gray-500 mb-3">{path.description}</p>
            <div className="space-y-1.5">
              {path.courses.map((course, ci) => (
                <div key={ci} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: path.color }}>
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

// Mock reviews for CourseDetailDialog
export const mockReviews = [
  { id: 'r1', user: 'Aminata K.', rating: 5, comment: 'Excellente formation ! Très bien structurée et instructive.', date: 'Il y a 3j' },
  { id: 'r2', user: 'Kofi M.', rating: 4, comment: 'Bon contenu, quelques vidéos pourraient être plus détaillées.', date: 'Il y a 1 semaine' },
  { id: 'r3', user: 'Fatou D.', rating: 5, comment: 'Merci pour cette formation. J\'ai pu réaliser mon premier investissement grâce à ces conseils.', date: 'Il y a 2 semaines' },
];

// What you'll learn bullet points (used in CourseDetailDialog)
export const whatYouWillLearn = [
  'Maîtriser les fondamentaux de l\'investissement',
  'Comprendre le cadre juridique foncier',
  'Analyser un marché immobilier local',
  'Négocier efficacement une transaction',
  'Évaluer la rentabilité d\'un projet',
  'Gérer les risques liés à l\'investissement',
];

// Default curriculum (when course has no modules)
export const defaultCurriculum = [
  { title: 'Introduction & Contexte', type: 'video', duration: '12 min' },
  { title: 'Les fondamentaux', type: 'video', duration: '25 min' },
  { title: 'Étude de cas pratique', type: 'text', duration: '15 min' },
  { title: 'Aspects juridiques', type: 'video', duration: '30 min' },
  { title: 'Quiz de validation', type: 'quiz', duration: '10 min' },
  { title: 'Mise en pratique', type: 'video', duration: '20 min' },
  { title: 'Quiz final & Certificat', type: 'quiz', duration: '15 min' },
];
