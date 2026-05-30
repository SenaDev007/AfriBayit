'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModuleProps {
  onNavigate?: (section: string) => void;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

const profileData = {
  name: 'Aminata Diallo',
  headline: 'Agent Immobilier Certifié · Spécialiste Haut Standing Abidjan',
  location: 'Abidjan, Côte d\'Ivoire',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop&crop=face',
  coverPhoto: 'https://images.unsplash.com/photo-1560520031-3a4dc4e9de0c?w=800&h=300&fit=crop',
  availability: 'available' as const,
  bio: 'Agent immobilier certifié avec plus de 8 ans d\'expérience sur le marché ivoirien. Spécialisée dans les biens haut standing à Cocody, Plateau et Marcory. Membre fondatrice du réseau AfriBayit Côte d\'Ivoire. Passionnée par l\'accompagnement personnalisé et la transparence des transactions.',
  skills: [
    { name: 'Négociation immobilière', endorsements: 42 },
    { name: 'Estimation de biens', endorsements: 38 },
    { name: 'Droit foncier ivoirien', endorsements: 31 },
    { name: 'Home staging', endorsements: 25 },
    { name: 'Investissement locatif', endorsements: 19 },
    { name: 'Gestion locative', endorsements: 15 },
  ],
  experience: [
    { id: 'exp-1', title: 'Agent Immobilier Certifié', company: 'AfriBayit Immobilière Côte d\'Ivoire', period: '2022 – Présent', desc: 'Gestion d\'un portefeuille de 52 biens. Spécialiste transactions haut standing. Certification AfriBayit Level 3.' },
    { id: 'exp-2', title: 'Consultante Immobilière', company: 'SCI Les Palmiers', period: '2019 – 2022', desc: 'Conseil en investissement immobilier. Gestion d\'un parc de 30 logements locatifs.' },
    { id: 'exp-3', title: 'Assistante Commerciale', company: 'Agence Immobilière du Plateau', period: '2016 – 2019', desc: 'Prospection, visites et suivi des dossiers de vente et location.' },
  ],
  education: [
    { id: 'edu-1', degree: 'Master Immobilier & Urbanisme', school: 'Université Félix Houphouët-Boigny', year: '2016' },
    { id: 'edu-2', degree: 'Licence Droit des Affaires', school: 'Université Joseph Ki-Zerbo', year: '2014' },
  ],
  certifications: [
    { id: 'cert-1', name: 'Agent Certifié AfriBayit', icon: '🏅', color: '#D4AF37', year: '2023' },
    { id: 'cert-2', name: 'GeoTrust Expert', icon: '✅', color: '#00A651', year: '2023' },
    { id: 'cert-3', name: 'Academy : Investissement Immobilier', icon: '📚', color: '#009CDE', year: '2022' },
    { id: 'cert-4', name: 'Droit Foncier Africain', icon: '⚖️', color: '#003087', year: '2022' },
  ],
  portfolio: [
    { id: 'p-1', title: 'Villa Prestige Les Cocotiers', image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=400&h=300&fit=crop', type: 'Vente' },
    { id: 'p-2', title: 'Penthouse Signature Cocody', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop', type: 'Vente' },
    { id: 'p-3', title: 'Appartement Standing Marcory', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop', type: 'Location' },
  ],
  recommendations: [
    { id: 'rec-1', author: 'Kouassi Jean', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face', text: 'Aminata est une professionnelle exceptionnelle. Elle a su trouver la villa de nos rêves en un temps record. Transparence totale sur les processus.' },
    { id: 'rec-2', author: 'Mme. Lawson Afi', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=60&h=60&fit=crop&crop=face', text: 'Grâce à son expertise du marché, j\'ai pu investir dans les meilleures conditions. Je recommande vivement !' },
  ],
  stats: {
    profileViews: 1240,
    searchAppearances: 89,
    connections: 156,
    credibilityScore: 92,
  },
  profileCompleteness: 85,
};

type TabKey = 'about' | 'experience' | 'portfolio' | 'recommendations' | 'stats';

export default function ProfessionalProfileModule({ onNavigate }: ModuleProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('about');

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'about', label: 'À propos', icon: '👤' },
    { key: 'experience', label: 'Parcours', icon: '💼' },
    { key: 'portfolio', label: 'Portfolio', icon: '📸' },
    { key: 'recommendations', label: 'Recommandations', icon: '💬' },
    { key: 'stats', label: 'Statistiques', icon: '📊' },
  ];

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        {/* Cover Photo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative -mx-4 sm:-mx-6 -mt-4"
        >
          <div className="h-40 sm:h-52 rounded-b-3xl overflow-hidden">
            <img src={profileData.coverPhoto} alt="Couverture" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </motion.div>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, ease: easeOut }}
          className="relative -mt-16 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="relative">
              <img
                src={profileData.avatar}
                alt={profileData.name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white shadow-lg object-cover"
              />
              <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white ${
                profileData.availability === 'available' ? 'bg-[#00A651]' : 'bg-[#D4AF37]'
              }`} />
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-[#2C2E2F]">{profileData.name}</h1>
                <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold rounded-full">🏅 Certifié</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{profileData.headline}</p>
              <p className="text-xs text-gray-400">{profileData.location} · <span className="text-[#00A651]">● Disponible</span></p>
            </div>
            <div className="flex gap-2">
              <button className="px-5 py-2 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors">
                Contacter
              </button>
              <button className="px-4 py-2 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                ✚ Suivre
              </button>
            </div>
          </div>

          {/* Profile Completeness */}
          <div className="mt-4 p-3 bg-white rounded-2xl border shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Complétude du profil</span>
              <span className="font-mono text-xs font-bold text-[#003087]">{profileData.profileCompleteness}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profileData.profileCompleteness}%` }}
                transition={{ duration: 1, ease: easeOut }}
                className="h-full rounded-full bg-gradient-to-r from-[#003087] to-[#009CDE]"
              />
            </div>
          </div>

          {/* Certifications Badges */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {profileData.certifications.map(cert => (
              <span
                key={cert.id}
                className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0"
                style={{ backgroundColor: `${cert.color}10`, color: cert.color }}
              >
                {cert.icon} {cert.name}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ===== ABOUT ===== */}
          {activeTab === 'about' && (
            <motion.div key="about" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="space-y-5">
              {/* Bio */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-3">À propos</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{profileData.bio}</p>
              </div>

              {/* Skills */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-3">Compétences & Spécialités</h3>
                <div className="space-y-3">
                  {profileData.skills.map(skill => (
                    <div key={skill.name} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{skill.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((skill.endorsements / 50) * 100, 100)}%` }}
                            transition={{ duration: 0.8, ease: easeOut }}
                            className="h-full bg-[#D4AF37] rounded-full"
                          />
                        </div>
                        <span className="font-mono text-xs text-gray-400 w-8 text-right">{skill.endorsements}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-3">Formation</h3>
                <div className="space-y-3">
                  {profileData.education.map(edu => (
                    <div key={edu.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-[#003087]/10 flex items-center justify-center shrink-0">
                        <span className="text-lg">🎓</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#2C2E2F]">{edu.degree}</p>
                        <p className="text-xs text-gray-500">{edu.school} · {edu.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== EXPERIENCE ===== */}
          {activeTab === 'experience' && (
            <motion.div key="experience" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="bg-white rounded-3xl p-5 shadow-sm border">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Expérience professionnelle</h3>
                <div className="relative pl-6 border-l-2 border-[#003087]/10 space-y-6">
                  {profileData.experience.map((exp, i) => (
                    <motion.div
                      key={exp.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15, ease: easeOut }}
                      className="relative"
                    >
                      <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-[#003087] border-2 border-white" />
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <h4 className="text-sm font-bold text-[#2C2E2F]">{exp.title}</h4>
                        <p className="text-xs text-[#003087] font-semibold">{exp.company}</p>
                        <p className="text-xs text-gray-400 mb-2">{exp.period}</p>
                        <p className="text-xs text-gray-600">{exp.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== PORTFOLIO ===== */}
          {activeTab === 'portfolio' && (
            <motion.div key="portfolio" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profileData.portfolio.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, ease: easeOut }}
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border group cursor-pointer"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-3">
                      <h4 className="text-sm font-semibold text-[#2C2E2F] truncate">{item.title}</h4>
                      <span className={`text-[10px] font-medium ${item.type === 'Vente' ? 'text-[#D4AF37]' : 'text-[#009CDE]'}`}>
                        {item.type}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ===== RECOMMENDATIONS ===== */}
          {activeTab === 'recommendations' && (
            <motion.div key="recommendations" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="space-y-4">
              {profileData.recommendations.map((rec, i) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, ease: easeOut }}
                  className="bg-white rounded-3xl p-5 shadow-sm border"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img src={rec.avatar} alt={rec.author} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-semibold text-[#2C2E2F]">{rec.author}</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} className="w-3 h-3 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed italic">&ldquo;{rec.text}&rdquo;</p>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ===== STATS ===== */}
          {activeTab === 'stats' && (
            <motion.div key="stats" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Vues du profil', value: profileData.stats.profileViews, icon: '👁️', color: '#003087' },
                  { label: 'Apparitions recherche', value: profileData.stats.searchAppearances, icon: '🔍', color: '#009CDE' },
                  { label: 'Connexions', value: profileData.stats.connections, icon: '🤝', color: '#00A651' },
                  { label: 'Score crédibilité', value: profileData.stats.credibilityScore, icon: '⭐', color: '#D4AF37', suffix: '/100' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, ease: easeOut }}
                    className="bg-white rounded-2xl p-5 shadow-sm border text-center"
                  >
                    <span className="text-2xl block mb-2">{stat.icon}</span>
                    <p className="font-mono text-2xl font-bold" style={{ color: stat.color }}>
                      {new Intl.NumberFormat('fr-FR').format(stat.value)}{stat.suffix || ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Credibility breakdown */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border mt-5">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Détail du score de crédibilité</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Vérification KYC', value: 100, color: '#00A651' },
                    { label: 'Certifications', value: 95, color: '#D4AF37' },
                    { label: 'Avis clients', value: 88, color: '#009CDE' },
                    { label: 'Activité plateforme', value: 85, color: '#003087' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">{item.label}</span>
                        <span className="font-mono text-xs font-bold" style={{ color: item.color }}>{item.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 0.8, ease: easeOut }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
