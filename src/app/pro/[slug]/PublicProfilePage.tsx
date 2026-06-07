'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { AlertTriangle, Award, BarChart3, Camera, Circle, Coins, GraduationCap, MessageCircle, User } from 'lucide-react';
import { geoServiceLabel } from '@/lib/geotrust/service-codes';

interface ProfileData {
  profile: {
    slug: string;
    headline: string | null;
    bio: string | null;
    specialities: string[];
    languages: Array<{ lang: string; level: string }>;
    availability: string | null;
    credibilityScore: number;
    completenessPct: number;
    experience: Array<{ id: string; title: string; company: string; period: string; desc: string }>;
    education: Array<{ id: string; degree: string; school: string; year: string }>;
    certifications: Array<{ id: string; name: string; icon: string; color: string; year: string }>;
    portfolio: Array<{ id: string; title: string; image: string; type: string }>;
    country: string | null;
    zone: string | null;
    agencyName: string | null;
    skillEndorsements: Record<string, number>;
  };
  user: {
    id: string;
    name: string;
    avatar: string | null;
    coverPhoto: string | null;
    country: string | null;
    city: string | null;
    bio: string | null;
    role: string;
    verified: boolean;
    credibilityScore: number;
    afriPoints: number;
    premiumTier: string | null;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: { name: string; avatar: string | null };
  }>;
}

const easeOut = [0.16, 1, 0.3, 1] as const;

type TabKey = 'about' | 'experience' | 'portfolio' | 'reviews' | 'stats';

export default function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = useParams<{ slug: string }>();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('about');

  useEffect(() => {
    async function fetchProfile() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/pro/${slug}`);
        if (!res.ok) {
          throw new Error('Profil introuvable.');
        }
        const data = await res.json();
        setProfileData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement.');
      } finally {
        setIsLoading(false);
      }
    }

    if (slug) {
      fetchProfile();
    }
  }, [slug]);

  const handleContact = () => {
    toast({ title: 'Conversation créée', description: 'Vous pouvez maintenant contacter ce professionnel.' });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Lien copié', description: 'Le lien du profil a été copié.' });
    } catch {
      toast({ title: 'Lien', description: url });
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'about', label: 'À propos', icon: <User className="w-4 h-4" /> },
    { key: 'experience', label: 'Parcours', icon: null },
    { key: 'portfolio', label: 'Portfolio', icon: <Camera className="w-4 h-4" /> },
    { key: 'reviews', label: 'Avis', icon: <MessageCircle className="w-4 h-4" /> },
    { key: 'stats', label: 'Crédibilité', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  if (isLoading) {
    return (
      <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
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
        </div>
      </section>
    );
  }

  if (error || !profileData) {
    return (
      <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <div className="text-center py-20">
            <span className="text-4xl block mb-3"><AlertTriangle className="w-10 h-10" /></span>
            <p className="text-gray-600 font-semibold mb-1">Profil introuvable</p>
            <p className="text-sm text-gray-400">{error || 'Ce profil n\'existe pas ou n\'est pas public.'}</p>
          </div>
        </div>
      </section>
    );
  }

  const { profile, user, reviews } = profileData;

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        {/* Cover Photo */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative -mx-4 sm:-mx-6 -mt-4">
          <div className="h-40 sm:h-52 rounded-b-3xl overflow-hidden">
            <ImageWithFallback src={user.coverPhoto || ''} alt="Couverture" className="w-full h-full" fallbackType="property" />
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
                src={user.avatar || ''}
                alt={user.name}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-4 border-white shadow-lg"
                fallbackType="avatar"
              />
              <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white ${
                profile.availability === 'available' ? 'bg-[#00A651]' : 'bg-[#D4AF37]'
              }`} />
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-[#2C2E2F]">{user.name}</h1>
                {user.verified && (
                  <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold rounded-full"><Award className="w-4 h-4" /> Vérifié</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{profile.headline || user.role}</p>
              <p className="text-xs text-gray-400">
                {[user.city, user.country].filter(Boolean).join(' · ')}
                {profile.availability === 'available' && <span className="text-[#00A651] ml-2"><Circle className="w-4 h-4" /> Disponible</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleContact}
                className="px-5 py-2 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors"
              >
                Contacter
              </button>
              <button
                onClick={handleShare}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                ↗ Partager
              </button>
            </div>
          </div>

          {/* Credibility Score Bar */}
          <div className="mt-4 p-3 bg-white rounded-2xl border shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">Score de crédibilité</span>
              <span className="font-mono text-xs font-bold text-[#003087]">{profile.credibilityScore}/100</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profile.credibilityScore}%` }}
                transition={{ duration: 1, ease: easeOut }}
                className="h-full rounded-full bg-gradient-to-r from-[#003087] to-[#00A651]"
              />
            </div>
          </div>

          {/* Certifications Badges */}
          {profile.certifications.length > 0 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {profile.certifications.map(cert => (
                <span
                  key={cert.id}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0"
                  style={{ backgroundColor: `${cert.color}10`, color: cert.color }}
                >
                  {cert.icon} {cert.name}
                </span>
              ))}
            </div>
          )}
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

        {/* About Tab */}
        {activeTab === 'about' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="bg-white rounded-3xl p-5 shadow-sm border">
              <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-3">À propos</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{profile.bio || user.bio || 'Aucune description pour le moment.'}</p>
            </div>

            {/* Skills with endorsements */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border">
              <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-3">Compétences & Spécialités</h3>
              <div className="space-y-3">
                {Object.entries(profile.skillEndorsements).length > 0 ? (
                  Object.entries(profile.skillEndorsements).map(([skill, count]) => (
                    <div key={skill} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{skill}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((count / 50) * 100, 100)}%` }}
                            transition={{ duration: 0.8, ease: easeOut }}
                            className="h-full bg-[#D4AF37] rounded-full"
                          />
                        </div>
                        <span className="font-mono text-xs text-gray-400 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  profile.specialities.map((skill) => (
                    <span key={skill} className="inline-block px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-full mr-2 mb-2">
                      {geoServiceLabel(skill)}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Education */}
            {profile.education.length > 0 && (
              <div className="bg-white rounded-3xl p-5 shadow-sm border">
                <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-3">Formation</h3>
                <div className="space-y-3">
                  {profile.education.map(edu => (
                    <div key={edu.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-[#003087]/10 flex items-center justify-center shrink-0">
                        <span className="text-lg"><GraduationCap className="w-4 h-4" /></span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#2C2E2F]">{edu.degree}</p>
                        <p className="text-xs text-gray-500">{edu.school} · {edu.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-3xl p-5 shadow-sm border">
              <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Expérience professionnelle</h3>
              {profile.experience.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-400">Aucune expérience renseignée</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-[#003087]/10 space-y-6">
                  {profile.experience.map((exp, i) => (
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

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {profile.portfolio.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3"><Camera className="w-10 h-10" /></span>
                <p className="text-gray-600 font-semibold mb-1">Aucun projet dans le portfolio</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.portfolio.map((item, i) => (
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
                      <span className="text-[10px] font-medium text-[#009CDE]">{item.type}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3"><MessageCircle className="w-10 h-10" /></span>
                <p className="text-gray-600 font-semibold mb-1">Aucun avis pour le moment</p>
              </div>
            ) : (
              reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, ease: easeOut }}
                  className="bg-white rounded-3xl p-5 shadow-sm border"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <ImageWithFallback src={review.reviewer.avatar || ''} alt={review.reviewer.name} className="w-10 h-10 rounded-full" fallbackType="avatar" />
                    <div>
                      <p className="text-sm font-semibold text-[#2C2E2F]">{review.reviewer.name}</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} className={`w-3 h-3 ${s <= review.rating ? 'text-[#D4AF37]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed italic">&ldquo;{review.comment}&rdquo;</p>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Stats / Credibility Tab */}
        {activeTab === 'stats' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {[
                { label: 'Score crédibilité', value: profile.credibilityScore, icon: null, color: '#D4AF37', suffix: '/100' },
                { label: 'AfriPoints', value: user.afriPoints, icon: <Coins className="w-4 h-4" />, color: '#003087' },
                { label: 'Avis reçus', value: reviews.length, icon: <MessageCircle className="w-4 h-4" />, color: '#009CDE' },
                { label: 'Complétude', value: profile.completenessPct, icon: <BarChart3 className="w-4 h-4" />, color: '#00A651', suffix: '%' },
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
                    {stat.value}{stat.suffix || ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Credibility breakdown */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border">
              <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Détail du score de crédibilité</h3>
              <div className="space-y-3">
                {[
                  { label: 'Complétude du profil', value: Math.round(profile.completenessPct * 0.2 / 0.2), color: '#00A651' },
                  { label: 'Vérification KYC', value: Math.min(user.verified ? 75 : 25, 100), color: '#D4AF37' },
                  { label: 'Activité plateforme', value: Math.min(reviews.length * 10 + 20, 100), color: '#009CDE' },
                  { label: 'Recommandations', value: Math.min(Object.values(profile.skillEndorsements).reduce((a, b) => a + b, 0) * 10, 100), color: '#003087' },
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

            {/* Structured data for SEO */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'Person',
                  name: user.name,
                  jobTitle: profile.headline || user.role,
                  description: profile.bio || user.bio,
                  address: {
                    '@type': 'PostalAddress',
                    addressLocality: user.city,
                    addressCountry: user.country,
                  },
                  url: `https://afribayit.com/pro/${profile.slug}`,
                }),
              }}
            />
          </motion.div>
        )}
      </div>
    </section>
  );
}
