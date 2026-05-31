'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile, useFollowProfile } from '@/hooks/useProfiles';
import { useCreateConversation } from '@/hooks/useChat';
import { toast } from 'sonner';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';

interface ModuleProps {
  onNavigate?: (section: string) => void;
  userId?: string;
}

interface ProfileData {
  name: string;
  headline: string;
  location: string;
  avatar: string;
  coverPhoto: string;
  availability: 'available' | 'busy' | 'offline';
  bio: string;
  skills: { name: string; endorsements: number }[];
  experience: { id: string; title: string; company: string; period: string; desc: string }[];
  education: { id: string; degree: string; school: string; year: string }[];
  certifications: { id: string; name: string; icon: string; color: string; year: string }[];
  portfolio: { id: string; title: string; image: string; type: string }[];
  recommendations: { id: string; author: string; avatar: string; text: string }[];
  stats: {
    profileViews: number;
    searchAppearances: number;
    connections: number;
    credibilityScore: number;
  };
  profileCompleteness: number;
  userId?: string;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

type TabKey = 'about' | 'experience' | 'portfolio' | 'recommendations' | 'stats';

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-40 sm:h-52 bg-gray-200 rounded-b-3xl" />
      <div className="relative -mt-16 mb-6 px-4">
        <div className="flex items-end gap-4">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gray-200 border-4 border-white" />
          <div className="flex-1 pb-2">
            <div className="h-6 bg-gray-200 rounded w-40 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-64 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-32" />
          </div>
        </div>
      </div>
      <div className="space-y-4 px-4">
        <div className="h-32 bg-gray-100 rounded-3xl" />
        <div className="h-48 bg-gray-100 rounded-3xl" />
      </div>
    </div>
  );
}

export default function ProfessionalProfileModule({ onNavigate, userId }: ModuleProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('about');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isContacting, setIsContacting] = useState(false);

  const { data: profileDataRaw, isLoading, error } = useProfile(userId || 'demo-user');
  const profileData = profileDataRaw as ProfileData | undefined;

  const followProfile = useFollowProfile();
  const createConversation = useCreateConversation();

  // Handle "Suivre" button — creates a connection/conversation and toggles state
  const handleFollow = () => {
    if (isFollowing) return;
    const profileUserId = profileData?.userId || userId || '';
    followProfile.mutate(
      { profileUserId },
      {
        onSuccess: () => {
          setIsFollowing(true);
          toast.success('Vous suivez ce professionnel', { description: `Vous êtes maintenant connecté avec ${profileData?.name}` });
        },
        onError: (error: Error) => {
          toast.error('Erreur lors de l\'abonnement', { description: error.message });
        },
      }
    );
  };

  // Handle "Contacter" button — creates chat conversation and navigates
  const handleContact = () => {
    const profileUserId = profileData?.userId || userId || '';
    setIsContacting(true);
    createConversation.mutate(
      {
        type: 'user_to_user',
        participantIds: [profileUserId],
        metadata: { context: 'professional_contact', profileName: profileData?.name },
      },
      {
        onSuccess: () => {
          toast.success('Conversation créée', { description: `Vous pouvez maintenant contacter ${profileData?.name}` });
          setIsContacting(false);
          if (onNavigate) onNavigate('chat');
        },
        onError: (error: Error) => {
          toast.error('Erreur lors de la création de la conversation', { description: error.message });
          setIsContacting(false);
        },
      }
    );
  };

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'about', label: 'À propos', icon: '👤' },
    { key: 'experience', label: 'Parcours', icon: '💼' },
    { key: 'portfolio', label: 'Portfolio', icon: '📸' },
    { key: 'recommendations', label: 'Recommandations', icon: '💬' },
    { key: 'stats', label: 'Statistiques', icon: '📊' },
  ];

  if (isLoading) {
    return (
      <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <ProfileSkeleton />
        </div>
      </section>
    );
  }

  if (error || !profileData) {
    return (
      <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <div className="text-center py-20">
            <span className="text-4xl block mb-3">⚠️</span>
            <p className="text-gray-600 font-semibold mb-1">Impossible de charger le profil</p>
            <p className="text-sm text-gray-400">{error?.message || 'Profil non trouvé'}</p>
          </div>
        </div>
      </section>
    );
  }

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
            <ImageWithFallback src={profileData.coverPhoto} alt="Couverture" className="w-full h-full" fallbackType="property" />
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
              <ImageWithFallback
                src={profileData.avatar}
                alt={profileData.name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white shadow-lg"
                fallbackType="avatar"
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
              <button
                onClick={handleContact}
                disabled={isContacting || createConversation.isPending}
                className="px-5 py-2 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isContacting || createConversation.isPending ? '...' : 'Contacter'}
              </button>
              <button
                onClick={handleFollow}
                disabled={isFollowing || followProfile.isPending}
                className={`px-4 py-2 border rounded-full text-sm font-semibold transition-colors disabled:cursor-not-allowed ${
                  isFollowing
                    ? 'border-[#00A651] bg-[#00A651]/5 text-[#00A651]'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50'
                }`}
              >
                {followProfile.isPending ? '...' : isFollowing ? 'Suivi ✓' : '✚ Suivre'}
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
                {profileData.experience.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">Aucune expérience renseignée</p>
                  </div>
                ) : (
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
                )}
              </div>
            </motion.div>
          )}

          {/* ===== PORTFOLIO ===== */}
          {activeTab === 'portfolio' && (
            <motion.div key="portfolio" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              {profileData.portfolio.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">📸</span>
                  <p className="text-gray-600 font-semibold mb-1">Aucun projet dans le portfolio</p>
                  <p className="text-sm text-gray-400">Les projets apparaîtront ici</p>
                </div>
              ) : (
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
                        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full group-hover:scale-105 transition-transform duration-500" fallbackType="property" />
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
              )}
            </motion.div>
          )}

          {/* ===== RECOMMENDATIONS ===== */}
          {activeTab === 'recommendations' && (
            <motion.div key="recommendations" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }} className="space-y-4">
              {profileData.recommendations.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-4xl block mb-3">💬</span>
                  <p className="text-gray-600 font-semibold mb-1">Aucune recommandation</p>
                  <p className="text-sm text-gray-400">Les recommandations apparaîtront ici</p>
                </div>
              ) : (
                profileData.recommendations.map((rec, i) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15, ease: easeOut }}
                    className="bg-white rounded-3xl p-5 shadow-sm border"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <ImageWithFallback src={rec.avatar} alt={rec.author} className="w-10 h-10 rounded-full" fallbackType="avatar" />
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
                ))
              )}
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
