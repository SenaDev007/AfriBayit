'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile, useFollowProfile } from '@/hooks/useProfiles';
import { useCreateConversation } from '@/hooks/useChat';
import { toast } from 'sonner';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { apiPost } from '@/lib/api';
import {
  AlertTriangle, Award, BarChart3, BookOpen, Camera, Check, ChevronRight,
  Circle, Clock, Copy, Eye, FileBadge, GraduationCap, Handshake,
  Link2, MapPin, MessageCircle, PlusCircle, Search, Shield, Star,
  ThumbsUp, Trophy, User, Users, Globe, BadgeCheck, Briefcase
} from 'lucide-react';

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
  skills: { name: string; endorsements: number; endorsedByMe?: boolean }[];
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
  slug?: string;
  specialities?: string;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

type TabKey = 'about' | 'experience' | 'portfolio' | 'recommendations' | 'stats';

// Certification icon map - maps cert icon string to lucide icon
const CERT_ICONS: Record<string, React.ReactNode> = {
  kyc: <Shield className="w-4 h-4" />,
  agent: <BadgeCheck className="w-4 h-4" />,
  notary: <FileBadge className="w-4 h-4" />,
  geometer: <Globe className="w-4 h-4" />,
  default: <Award className="w-4 h-4" />,
};

function getCertIcon(iconStr: string): React.ReactNode {
  return CERT_ICONS[iconStr] || CERT_ICONS.default;
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-40 sm:h-52 bg-gray-200 rounded-b-3xl" />
      <div className="relative -mt-16 mb-6 px-4">
        <div className="flex items-end gap-4">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gray-200 border-4 border-white" />
          <div className="flex-1 pb-2"><div className="h-6 bg-gray-200 rounded w-40 mb-2" /><div className="h-4 bg-gray-100 rounded w-64 mb-1" /><div className="h-3 bg-gray-100 rounded w-32" /></div>
        </div>
      </div>
      <div className="space-y-4 px-4"><div className="h-32 bg-gray-100 rounded-3xl" /><div className="h-48 bg-gray-100 rounded-3xl" /></div>
    </div>
  );
}

// ─── Credibility Score Ring ──────────────────────────────────────

function CredibilityRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 80) return '#00A651';
    if (s >= 60) return '#009CDE';
    if (s >= 40) return '#D4AF37';
    return '#D93025';
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E5E7EB" strokeWidth={4} />
        <motion.circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={getColor(score)} strokeWidth={4}
          strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }} transition={{ duration: 1.5, ease: easeOut }} />
      </svg>
      <span className="absolute font-mono text-lg font-bold" style={{ color: getColor(score) }}>{score}</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────

export default function ProfessionalProfileModule({ onNavigate, userId }: ModuleProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('about');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isContacting, setIsContacting] = useState(false);
  const [endorsingSkill, setEndorsingSkill] = useState<string | null>(null);
  const [showCopied, setShowCopied] = useState(false);

  const { data: profileDataRaw, isLoading, error } = useProfile(userId || 'demo-user');
  const profileData = profileDataRaw as ProfileData | undefined;

  const followProfile = useFollowProfile();
  const createConversation = useCreateConversation();

  const handleFollow = () => {
    if (isFollowing) return;
    const profileUserId = profileData?.userId || userId || '';
    followProfile.mutate({ profileUserId }, {
      onSuccess: () => { setIsFollowing(true); toast.success('Vous suivez ce professionnel', { description: `Connecte avec ${profileData?.name}` }); },
      onError: (error: Error) => { toast.error('Erreur', { description: error.message }); },
    });
  };

  const handleContact = () => {
    const profileUserId = profileData?.userId || userId || '';
    setIsContacting(true);
    createConversation.mutate({
      type: 'user_to_user', participantIds: [profileUserId],
      metadata: { context: 'professional_contact', profileName: profileData?.name },
    }, {
      onSuccess: () => { toast.success('Conversation creee', { description: `Vous pouvez contacter ${profileData?.name}` }); setIsContacting(false); if (onNavigate) onNavigate('chat'); },
      onError: (error: Error) => { toast.error('Erreur', { description: error.message }); setIsContacting(false); },
    });
  };

  // Endorse a skill
  const handleEndorse = async (skillName: string) => {
    if (!profileData?.userId) return;
    setEndorsingSkill(skillName);
    try {
      await apiPost('/api/profiles/endorseskill', { profileUserId: profileData.userId, skill: skillName });
      toast.success('Competence endorsee', { description: `Vous avez endosse "${skillName}"` });
    } catch {
      toast.error('Erreur', { description: 'Impossible d\'endosser cette competence' });
    }
    setEndorsingSkill(null);
  };

  // Copy public profile URL
  const handleCopyProfileUrl = () => {
    const slug = profileData?.slug || profileData?.userId || 'demo';
    const url = `${window.location.origin}/pro/${slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setShowCopied(true);
      toast.success('Lien copie');
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'about', label: 'A propos', icon: <User className="w-4 h-4" /> },
    { key: 'experience', label: 'Parcours', icon: <Briefcase className="w-4 h-4" /> },
    { key: 'portfolio', label: 'Portfolio', icon: <Camera className="w-4 h-4" /> },
    { key: 'recommendations', label: 'Recommandations', icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'stats', label: 'Statistiques', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6"><ProfileSkeleton /></div>
      </section>
    );
  }

  if (error || !profileData) {
    return (
      <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <div className="text-center py-20">
            <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold mb-1">Impossible de charger le profil</p>
            <p className="text-sm text-gray-400">{error?.message || 'Profil non trouve'}</p>
          </div>
        </div>
      </section>
    );
  }

  const publicProfileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/pro/${profileData.slug || profileData.userId || 'demo'}`;

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        {/* Cover Photo */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative -mx-4 sm:-mx-6 -mt-4">
          <div className="h-40 sm:h-52 rounded-b-3xl overflow-hidden">
            <ImageWithFallback src={profileData.coverPhoto} alt="Couverture" className="w-full h-full" fallbackType="property" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </motion.div>

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ease: easeOut }} className="relative -mt-16 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="relative">
              <ImageWithFallback src={profileData.avatar} alt={profileData.name} className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white shadow-lg" fallbackType="avatar" />
              <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white ${
                profileData.availability === 'available' ? 'bg-[#00A651]' : profileData.availability === 'busy' ? 'bg-[#D4AF37]' : 'bg-gray-400'
              }`} />
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-[#2C2E2F]">{profileData.name}</h1>
                <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold rounded-full flex items-center gap-1"><Award className="w-3 h-3" /> Certifie</span>
              </div>
              <p className="text-sm text-gray-600 mb-1">{profileData.headline}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <MapPin className="w-3 h-3" /> {profileData.location}
                <span className={`flex items-center gap-1 ${profileData.availability === 'available' ? 'text-[#00A651]' : 'text-[#D4AF37]'}`}>
                  <Circle className="w-3 h-3 fill-current" /> {profileData.availability === 'available' ? 'Disponible' : profileData.availability === 'busy' ? 'Occupe' : 'Hors ligne'}
                </span>
              </div>

              {/* Public Profile URL */}
              <div className="flex items-center gap-2 mt-2">
                <Link2 className="w-3.5 h-3.5 text-[#003087]" />
                <span className="text-xs text-[#003087] font-medium truncate max-w-[200px]">{publicProfileUrl}</span>
                <button onClick={handleCopyProfileUrl} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                  {showCopied ? <Check className="w-3.5 h-3.5 text-[#00A651]" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleContact} disabled={isContacting || createConversation.isPending}
                className="px-5 py-2 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isContacting || createConversation.isPending ? '...' : 'Contacter'}
              </button>
              <button onClick={handleFollow} disabled={isFollowing || followProfile.isPending}
                className={`px-4 py-2 border rounded-full text-sm font-semibold transition-colors disabled:cursor-not-allowed flex items-center gap-1.5 ${
                  isFollowing ? 'border-[#00A651] bg-[#00A651]/5 text-[#00A651]' : 'border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50'
                }`}>
                {isFollowing ? <><Check className="w-4 h-4" /> Suivi</> : <><PlusCircle className="w-4 h-4" /> Suivre</>}
              </button>
            </div>
          </div>

          {/* Profile Completeness + Credibility Score */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-2xl border shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Completude du profil</span>
                <span className="font-mono text-xs font-bold text-[#003087]">{profileData.profileCompleteness}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${profileData.profileCompleteness}%` }} transition={{ duration: 1, ease: easeOut }}
                  className="h-full rounded-full bg-gradient-to-r from-[#003087] to-[#009CDE]" />
              </div>
            </div>
            <div className="p-3 bg-white rounded-2xl border shadow-sm flex items-center gap-3">
              <CredibilityRing score={profileData.stats.credibilityScore} size={48} />
              <div>
                <p className="text-xs text-gray-500">Score de credibilite</p>
                <p className="font-mono text-lg font-bold text-[#2C2E2F]">{profileData.stats.credibilityScore}/100</p>
              </div>
            </div>
          </div>

          {/* Certifications Badges */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {profileData.certifications.map(cert => (
              <span key={cert.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0"
                style={{ backgroundColor: `${cert.color}10`, color: cert.color }}>
                {getCertIcon(cert.icon)} {cert.name}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
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
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-3">A propos</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{profileData.bio}</p>
              </div>

              {/* Skills & Endorsements */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-3 flex items-center gap-2"><ThumbsUp className="w-5 h-5 text-[#D4AF37]" /> Competences & Endossements</h3>
                <div className="space-y-3">
                  {profileData.skills.map(skill => (
                    <div key={skill.name} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700 font-medium">{skill.name}</span>
                          <span className="font-mono text-xs text-gray-400">{skill.endorsements} endossement{skill.endorsements !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((skill.endorsements / 50) * 100, 100)}%` }} transition={{ duration: 0.8, ease: easeOut }}
                            className="h-full bg-[#D4AF37] rounded-full" />
                        </div>
                      </div>
                      <button onClick={() => handleEndorse(skill.name)} disabled={endorsingSkill === skill.name || skill.endorsedByMe}
                        className={`ml-3 p-2 rounded-xl transition-all flex items-center gap-1 ${
                          skill.endorsedByMe ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-gray-50 text-gray-500 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]'
                        }`}>
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-[10px] font-semibold">{skill.endorsedByMe ? 'Endosse' : '+'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-3 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-[#003087]" /> Formation</h3>
                <div className="space-y-3">
                  {profileData.education.map(edu => (
                    <div key={edu.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-[#003087]/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4 text-[#003087]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#2C2E2F]">{edu.degree}</p>
                        <p className="text-xs text-gray-500">{edu.school} · {edu.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
                  <Eye className="w-5 h-5 text-[#003087] mx-auto mb-1" />
                  <p className="font-mono text-lg font-bold text-[#003087]">{new Intl.NumberFormat('fr-FR').format(profileData.stats.profileViews)}</p>
                  <p className="text-[10px] text-gray-500">Vues</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
                  <Users className="w-5 h-5 text-[#00A651] mx-auto mb-1" />
                  <p className="font-mono text-lg font-bold text-[#00A651]">{profileData.stats.connections}</p>
                  <p className="text-[10px] text-gray-500">Connexions</p>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border text-center">
                  <Shield className="w-5 h-5 text-[#D4AF37] mx-auto mb-1" />
                  <p className="font-mono text-lg font-bold text-[#D4AF37]">{profileData.stats.credibilityScore}</p>
                  <p className="text-[10px] text-gray-500">Credibilite</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== EXPERIENCE ===== */}
          {activeTab === 'experience' && (
            <motion.div key="experience" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4, ease: easeOut }}>
              <div className="bg-white rounded-3xl p-5 shadow-sm border">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-[#003087]" /> Experience professionnelle</h3>
                {profileData.experience.length === 0 ? (
                  <div className="text-center py-8"><p className="text-sm text-gray-400">Aucune experience renseignee</p></div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-[#003087]/10 space-y-6">
                    {profileData.experience.map((exp, i) => (
                      <motion.div key={exp.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15, ease: easeOut }} className="relative">
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
                  <Camera className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-semibold mb-1">Aucun projet dans le portfolio</p>
                  <p className="text-sm text-gray-400">Les projets apparaitront ici</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profileData.portfolio.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, ease: easeOut }}
                      whileHover={{ y: -4 }} className="bg-white rounded-3xl overflow-hidden shadow-sm border group cursor-pointer">
                      <div className="aspect-[4/3] overflow-hidden">
                        <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full group-hover:scale-105 transition-transform duration-500" fallbackType="property" />
                      </div>
                      <div className="p-3">
                        <h4 className="text-sm font-semibold text-[#2C2E2F] truncate">{item.title}</h4>
                        <span className={`text-[10px] font-medium ${item.type === 'Vente' ? 'text-[#D4AF37]' : 'text-[#009CDE]'}`}>{item.type}</span>
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
                  <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 font-semibold mb-1">Aucune recommandation</p>
                  <p className="text-sm text-gray-400">Les recommandations apparaitront ici</p>
                </div>
              ) : (
                profileData.recommendations.map((rec, i) => (
                  <motion.div key={rec.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15, ease: easeOut }}
                    className="bg-white rounded-3xl p-5 shadow-sm border">
                    <div className="flex items-center gap-3 mb-3">
                      <ImageWithFallback src={rec.avatar} alt={rec.author} className="w-10 h-10 rounded-full" fallbackType="avatar" />
                      <div>
                        <p className="text-sm font-semibold text-[#2C2E2F]">{rec.author}</p>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${s <= 5 ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-200'}`} />
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
                  { label: 'Vues du profil', value: profileData.stats.profileViews, icon: <Eye className="w-5 h-5" />, color: '#003087' },
                  { label: 'Apparitions recherche', value: profileData.stats.searchAppearances, icon: <Search className="w-5 h-5" />, color: '#009CDE' },
                  { label: 'Connexions', value: profileData.stats.connections, icon: <Handshake className="w-5 h-5" />, color: '#00A651' },
                  { label: 'Score credibilite', value: profileData.stats.credibilityScore, icon: <Shield className="w-5 h-5" />, color: '#D4AF37', suffix: '/100' },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, ease: easeOut }}
                    className="bg-white rounded-2xl p-5 shadow-sm border text-center">
                    <span className="block mb-2" style={{ color: stat.color }}>{stat.icon}</span>
                    <p className="font-mono text-2xl font-bold" style={{ color: stat.color }}>
                      {new Intl.NumberFormat('fr-FR').format(stat.value)}{stat.suffix || ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Credibility breakdown */}
              <div className="bg-white rounded-3xl p-5 shadow-sm border mt-5">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-[#D4AF37]" /> Detail du score de credibilite</h3>
                <div className="flex items-center justify-center mb-6">
                  <CredibilityRing score={profileData.stats.credibilityScore} size={120} />
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Verification KYC', value: 100, color: '#00A651', icon: <Shield className="w-4 h-4" /> },
                    { label: 'Certifications', value: 95, color: '#D4AF37', icon: <Award className="w-4 h-4" /> },
                    { label: 'Avis clients', value: 88, color: '#009CDE', icon: <Star className="w-4 h-4" /> },
                    { label: 'Activite plateforme', value: 85, color: '#003087', icon: <Clock className="w-4 h-4" /> },
                    { label: 'Endossements', value: 72, color: '#D4AF37', icon: <ThumbsUp className="w-4 h-4" /> },
                    { label: 'Recommandations', value: 80, color: '#00A651', icon: <MessageCircle className="w-4 h-4" /> },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 flex items-center gap-1.5">{item.icon} {item.label}</span>
                        <span className="font-mono text-xs font-bold" style={{ color: item.color }}>{item.value}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 0.8, ease: easeOut }}
                          className="h-full rounded-full" style={{ backgroundColor: item.color }} />
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
