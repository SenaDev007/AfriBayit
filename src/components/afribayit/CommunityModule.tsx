'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useCommunityPosts, useCommunityGroups, useCommunityEvents, useCreateCommunityPost, useRegisterCommunityEvent } from '@/hooks/useCommunity';
import { useAuthStore } from '@/stores/authStore';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { timeAgo } from '@/lib/afribayit-utils';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { Medal, Diamond, Gem, Sprout, Star, Trophy, Crown, PenTool, Handshake, Globe, BookOpen, Award, HandshakeIcon, Lock, Bot, AlertTriangle, MessageCircle, User, Calendar, Coins, CheckCircle, PartyPopper, ShoppingCart, Rocket, Sparkles, FileText, Link } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  author: string;
  avatar: string;
  replies: number;
  views: number;
  category: string;
  lastActivity: string;
  createdAt?: string;
}

interface Group {
  id: string;
  name: string;
  role: string;
  city: string;
  score: number;
  avatar: string;
  skills: string[];
  userId?: string;
}

interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  type: string;
  attendees: number;
}

// Niveaux de gamification AfriPoints
const afriPointLevels = [
  { name: 'Bronze', min: 0, icon: <Medal className="w-4 h-4" style={{ color: '#CD7F32' }} />, color: '#CD7F32' },
  { name: 'Argent', min: 200, icon: <Medal className="w-4 h-4" style={{ color: '#C0C0C0' }} />, color: '#C0C0C0' },
  { name: 'Or', min: 500, icon: <Medal className="w-4 h-4" style={{ color: '#FFD700' }} />, color: '#FFD700' },
  { name: 'Platine', min: 1500, icon: <Diamond className="w-4 h-4" style={{ color: '#E5E4E2' }} />, color: '#E5E4E2' },
  { name: 'Diamant', min: 5000, icon: <Gem className="w-4 h-4" style={{ color: '#B9F2FF' }} />, color: '#B9F2FF' },
];

// Niveaux de réputation
const reputationLevels = [
  { name: 'Découvreur', min: 0, max: 100, color: '#6b7280', icon: <Sprout className="w-4 h-4" /> },
  { name: 'Acteur', min: 100, max: 300, color: '#009CDE', icon: <Star className="w-4 h-4" /> },
  { name: 'Expert', min: 300, max: 600, color: '#00A651', icon: <Trophy className="w-4 h-4" /> },
  { name: 'Ambassadeur', min: 600, max: Infinity, color: '#D4AF37', icon: <Crown className="w-4 h-4" /> },
];

// Badges disponibles
const badges = [
  { id: 'first_post', name: 'Premier pas', icon: <PenTool className="w-3.5 h-3.5" />, description: 'Premier sujet publié', earned: true },
  { id: 'helper', name: 'Bon samaritain', icon: <Handshake className="w-3.5 h-3.5" />, description: '5 réponses utiles', earned: false },
  { id: 'reviewer', name: 'Critique immobilier', icon: <Star className="w-3.5 h-3.5" />, description: '3 avis publiés', earned: false },
  { id: 'networker', name: 'Réseauteur', icon: <Globe className="w-3.5 h-3.5" />, description: '10 connexions', earned: false },
  { id: 'student', name: 'Étudiant', icon: <BookOpen className="w-3.5 h-3.5" />, description: '1 cours complété', earned: true },
  { id: 'certified', name: 'Certifié', icon: <Award className="w-3.5 h-3.5" />, description: '1 certificat obtenu', earned: false },
];

// Tiers ambassadeur
const ambassadorTiers = [
  { tier: 'Bronze', commission: '5%', icon: <Medal className="w-5 h-5" style={{ color: '#CD7F32' }} />, color: '#CD7F32', benefits: ['Lien de parrainage', 'Commission 5%', 'Dashboard ambassadeur'] },
  { tier: 'Argent', commission: '10%', icon: <Medal className="w-5 h-5" style={{ color: '#C0C0C0' }} />, color: '#C0C0C0', benefits: ['Tous les avantages Bronze', 'Commission 10%', 'Page personnalisée', 'Support prioritaire'] },
  { tier: 'Or', commission: '15%', icon: <Medal className="w-5 h-5" style={{ color: '#FFD700' }} />, color: '#FFD700', benefits: ['Tous les avantages Argent', 'Commission 15%', 'Événements co-brandés', 'Accès VIP formations'] },
];

const easeOut = [0.16, 1, 0.3, 1] as const;

const tabs = [
  { key: 'forum', label: 'Forum' },
  { key: 'profiles', label: 'Profils Pro' },
  { key: 'events', label: 'Événements' },
  { key: 'points', label: 'AfriPoints' },
  { key: 'ambassador', label: 'Ambassadeur' },
];

function PostSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="flex gap-3">
            <div className="h-3 bg-gray-100 rounded w-16" />
            <div className="h-3 bg-gray-100 rounded w-12" />
            <div className="h-3 bg-gray-100 rounded w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border text-center animate-pulse">
      <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-3" />
      <div className="h-4 bg-gray-200 rounded w-20 mx-auto mb-2" />
      <div className="h-3 bg-gray-100 rounded w-16 mx-auto mb-3" />
      <div className="h-8 bg-gray-200 rounded-full w-24 mx-auto" />
    </div>
  );
}

function EventSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border flex items-center gap-4 animate-pulse">
      <div className="w-14 h-14 rounded-2xl bg-gray-200 shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
        <div className="flex gap-3">
          <div className="h-3 bg-gray-100 rounded w-16" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export default function CommunityModule() {
  const [activeTab, setActiveTab] = useState('forum');
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [newPostForm, setNewPostForm] = useState({ title: '', content: '', category: '', tags: '' });
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const { user } = useAuthStore();
  const router = useRouter();
  const { selectedCountry } = useCountry();

  const { data: postsData, isLoading: postsLoading, error: postsError } = useCommunityPosts(undefined, selectedCountry);
  const { data: groupsData, isLoading: groupsLoading } = useCommunityGroups(undefined, selectedCountry);
  const { data: eventsData, isLoading: eventsLoading, error: eventsError } = useCommunityEvents(selectedCountry);

  const createPost = useCreateCommunityPost();
  const registerEvent = useRegisterCommunityEvent();

  const posts: Post[] = (postsData?.posts as Post[]) || [];
  const groups: Group[] = (groupsData?.groups as Group[]) || [];
  const events: Event[] = (eventsData?.events as Event[]) || [];

  // Dérive le score utilisateur
  const currentUserScore = (user as Record<string, unknown> & { reputationScore?: number })?.reputationScore
    ? Number((user as Record<string, unknown> & { reputationScore?: number }).reputationScore)
    : 0;
  const userRepLevel = reputationLevels.find(l => currentUserScore >= l.min && currentUserScore < l.max) || reputationLevels[0];

  // AfriPoints simulés (sera connecté à l'API)
  const userAfriPoints = (user as Record<string, unknown> & { afriPoints?: number })?.afriPoints
    ? Number((user as Record<string, unknown> & { afriPoints?: number }).afriPoints)
    : 0;
  const afriLevel = afriPointLevels.filter(l => userAfriPoints >= l.min).pop() || afriPointLevels[0];
  const nextLevel = afriPointLevels.find(l => l.min > userAfriPoints);

  const handleCreatePost = () => {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour créer un sujet.' });
      return;
    }
    const tags = newPostForm.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    createPost.mutate(
      {
        title: newPostForm.title,
        content: newPostForm.content,
        category: newPostForm.category || undefined,
        tags: tags.length > 0 ? tags : undefined,
      },
      {
        onSuccess: () => {
          toast({ title: 'Sujet créé', description: 'Votre sujet a été publié avec succès.' });
          setShowNewPostDialog(false);
          setNewPostForm({ title: '', content: '', category: '', tags: '' });
        },
        onError: (err) => {
          toast({ title: 'Erreur', description: err.message || 'Impossible de créer le sujet.', variant: 'destructive' });
        },
      }
    );
  };

  const handleRegisterEvent = (eventId: string) => {
    setRegisteringEventId(eventId);
    registerEvent.mutate(
      { eventId, userId: user?.id },
      {
        onSuccess: () => {
          toast({ title: 'Inscription confirmée', description: 'Vous êtes inscrit à cet événement.' });
          setRegisteringEventId(null);
        },
        onError: (err) => {
          toast({ title: 'Erreur', description: err.message || 'Impossible de s\'inscrire à l\'événement.', variant: 'destructive' });
          setRegisteringEventId(null);
        },
      }
    );
  };

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A651]/10 text-[#00A651] text-sm font-semibold mb-4">
            <Handshake className="w-4 h-4" /> AfriBayit Connect
          </span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">
            Communauté <span className="text-[#00A651]">Africaine</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Connectez-vous avec des professionnels de l&apos;immobilier, partagez vos expériences, et développez votre réseau.
          </p>
        </motion.div>

        {/* Country Filter Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">Pays:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">
            {COUNTRY_NAMES[selectedCountry] || selectedCountry}
          </span>
        </div>

        {/* Reputation + AfriPoints Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-5 shadow-sm border mb-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Réputation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{userRepLevel.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2E2F]">{userRepLevel.name}</p>
                    <p className="text-xs text-gray-500">{currentUserScore} pts de réputation</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${userRepLevel.color}15`, color: userRepLevel.color }}>
                  {userRepLevel.name}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min((currentUserScore / 600) * 100, 100)}%`,
                    backgroundColor: userRepLevel.color,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-gray-400">
                {reputationLevels.slice(0, 3).map((level) => (
                  <span key={level.name} className="flex items-center gap-0.5">{level.icon} {level.name}</span>
                ))}
              </div>
            </div>

            {/* AfriPoints */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{afriLevel.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2E2F]">AfriPoints</p>
                    <p className="text-xs text-gray-500">{userAfriPoints} points</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${afriLevel.color}15`, color: afriLevel.color }}>
                  {afriLevel.name}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all bg-gradient-to-r from-[#D4AF37] to-[#003087]"
                  style={{
                    width: nextLevel ? `${Math.min((userAfriPoints / nextLevel.min) * 100, 100)}%` : '100%',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-gray-400">
                {afriPointLevels.slice(0, 4).map((level) => (
                  <span key={level.name} className="flex items-center gap-0.5">{level.icon} {level.name}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {badges.filter(b => b.earned).map((badge) => (
              <span
                key={badge.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 bg-[#D4AF37]/10 text-[#D4AF37]"
                title={badge.description}
              >
                {badge.icon} {badge.name}
              </span>
            ))}
            {badges.filter(b => !b.earned).map((badge) => (
              <span
                key={badge.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 bg-gray-50 text-gray-300"
                title={badge.description}
              >
                <Lock className="w-3 h-3" /> {badge.name}
              </span>
            ))}
          </div>

          {/* AI Moderation notice */}
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-[#009CDE]/5 rounded-xl">
            <Bot className="w-3.5 h-3.5 text-[#009CDE] shrink-0" />
            <span className="text-[10px] text-[#009CDE] font-medium">Modéré par Rebecca IA — Contenu vérifié automatiquement</span>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Forum */}
        {activeTab === 'forum' && (
          <div className="space-y-3">
            {postsLoading && (
              Array.from({ length: 4 }).map((_, i) => (
                <PostSkeleton key={i} />
              ))
            )}
            {postsError && (
              <div className="text-center py-12">
                <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold mb-1">Impossible de charger les posts</p>
                <p className="text-sm text-gray-400">{postsError.message}</p>
              </div>
            )}
            {!postsLoading && !postsError && posts.length === 0 && (
              <div className="text-center py-12">
                <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold mb-1">Aucun sujet de discussion</p>
                <p className="text-sm text-gray-400">Soyez le premier à lancer un débat !</p>
              </div>
            )}
            {!postsLoading && !postsError && posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08, ease: easeOut }}
                className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <ImageWithFallback src={post.avatar} alt="" className="w-10 h-10 rounded-full shrink-0" fallbackType="avatar" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-[#2C2E2F] mb-1">{post.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="font-medium text-[#003087]">{post.author}</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full">{post.category}</span>
                      <span>{post.replies} réponses</span>
                      <span>{post.views} vues</span>
                      <span className="text-gray-400">{post.createdAt ? timeAgo(post.createdAt) : post.lastActivity}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            <button
              onClick={() => {
                if (!user) {
                  toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour créer un sujet.' });
                  return;
                }
                setShowNewPostDialog(true);
              }}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-[#003087] hover:text-[#003087] transition-colors"
            >
              + Nouveau sujet
            </button>
          </div>
        )}

        {/* Profiles */}
        {activeTab === 'profiles' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {groupsLoading && (
              Array.from({ length: 3 }).map((_, i) => (
                <ProfileSkeleton key={i} />
              ))
            )}
            {!groupsLoading && groups.length === 0 && (
              <div className="col-span-full text-center py-12">
                <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold mb-1">Aucun profil trouvé</p>
                <p className="text-sm text-gray-400">Revenez plus tard</p>
              </div>
            )}
            {!groupsLoading && groups.map((profile, i) => {
              const repLevel = reputationLevels.find(l => profile.score >= l.min && profile.score < l.max) || reputationLevels[0];
              return (
                <motion.div
                  key={profile.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: easeOut }}
                  className="bg-white rounded-3xl p-6 shadow-sm border text-center"
                >
                  <ImageWithFallback src={profile.avatar} alt="" className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-[#D4AF37]" fallbackType="avatar" />
                  <h3 className="font-semibold text-[#2C2E2F]">{profile.name}</h3>
                  <p className="text-xs text-[#D4AF37] font-medium">{profile.role}</p>
                  <p className="text-xs text-gray-500 mb-3">{profile.city}</p>
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <span className="text-lg">{repLevel.icon}</span>
                    <span className="text-xs font-semibold" style={{ color: repLevel.color }}>{repLevel.name}</span>
                    <span className="text-xs text-gray-400">({profile.score} pts)</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="px-2.5 py-1 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-full">{skill}</span>
                    ))}
                  </div>
                  <button
                    onClick={() => router.push(`/pro/${(profile.name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`)}
                    className="px-6 py-2 bg-[#003087] text-white rounded-full text-xs font-semibold hover:bg-[#0047b3] transition-colors"
                  >
                    Voir le profil
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Events */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            {eventsLoading && (
              Array.from({ length: 4 }).map((_, i) => (
                <EventSkeleton key={i} />
              ))
            )}
            {eventsError && (
              <div className="text-center py-12">
                <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold mb-1">Impossible de charger les événements</p>
                <p className="text-sm text-gray-400">{eventsError.message}</p>
              </div>
            )}
            {!eventsLoading && !eventsError && events.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-semibold mb-1">Aucun événement à venir</p>
                <p className="text-sm text-gray-400">Revenez bientôt pour de nouveaux événements</p>
              </div>
            )}
            {!eventsLoading && !eventsError && events.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08, ease: easeOut }}
                className="bg-white rounded-2xl p-5 shadow-sm border flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#003087]/10 flex flex-col items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-[#003087]">{event.date.split(' ')[0]}</span>
                  <span className="text-[10px] text-[#003087]/60">{event.date.split(' ')[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-[#2C2E2F]">{event.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full font-medium">{event.type}</span>
                    <span>{event.location}</span>
                    <span>{event.attendees} participants</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRegisterEvent(event.id)}
                  disabled={registeringEventId === event.id && registerEvent.isPending}
                  className="px-4 py-2 bg-[#003087] text-white rounded-full text-xs font-semibold shrink-0 disabled:opacity-60"
                >
                  {registeringEventId === event.id && registerEvent.isPending ? 'Inscription...' : 'S\'inscrire'}
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* AfriPoints */}
        {activeTab === 'points' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Solde AfriPoints */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border text-center">
              <span className="inline-flex items-center justify-center mb-2">{afriLevel.icon}</span>
              <p className="font-mono text-3xl font-bold text-[#D4AF37]">{userAfriPoints}</p>
              <p className="text-sm text-gray-500 mb-1">AfriPoints</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${afriLevel.color}15`, color: afriLevel.color }}>
                Niveau {afriLevel.name}
              </span>
              {nextLevel && (
                <p className="text-xs text-gray-400 mt-2">
                  Plus que <span className="font-semibold text-[#003087]">{nextLevel.min - userAfriPoints} points</span> pour atteindre le niveau {nextLevel.name}
                </p>
              )}
            </div>

            {/* Gagner des points */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border">
              <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Coins className="w-5 h-5" /> Gagner des AfriPoints</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { action: 'Profil complété', points: 50, icon: <User className="w-5 h-5" /> },
                  { action: 'Sujet publié', points: 5, icon: <PenTool className="w-5 h-5" /> },
                  { action: 'Avis publié', points: 10, icon: <Star className="w-5 h-5" /> },
                  { action: 'Cours complété', points: 25, icon: <BookOpen className="w-5 h-5" /> },
                  { action: 'Quiz réussi', points: 10, icon: <CheckCircle className="w-5 h-5" /> },
                  { action: 'Certificat obtenu', points: 15, icon: <Award className="w-5 h-5" /> },
                  { action: 'Parrainage', points: 100, icon: <Handshake className="w-5 h-5" /> },
                  { action: 'Événement participé', points: 15, icon: <PartyPopper className="w-5 h-5" /> },
                ].map((item) => (
                  <div key={item.action} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <span className="text-gray-500">{item.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#2C2E2F]">{item.action}</p>
                      <p className="text-xs text-[#D4AF37] font-semibold">+{item.points} pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dépenser des points */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border">
              <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Dépenser des AfriPoints</h3>
              <div className="space-y-3">
                {[
                  { item: 'Boost annonce 7 jours', cost: 200, icon: <Rocket className="w-5 h-5" /> },
                  { item: 'Boost annonce 30 jours', cost: 500, icon: <Rocket className="w-5 h-5" /> },
                  { item: 'Fonctionnalité premium', cost: 100, icon: <Sparkles className="w-5 h-5" /> },
                  { item: 'Réduction cours 10%', cost: 150, icon: <BookOpen className="w-5 h-5" /> },
                  { item: 'Réduction cours 25%', cost: 300, icon: <BookOpen className="w-5 h-5" /> },
                ].map((item) => (
                  <div key={item.item} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500">{item.icon}</span>
                      <p className="text-sm font-medium text-[#2C2E2F]">{item.item}</p>
                    </div>
                    <span className="px-3 py-1 bg-[#003087]/10 text-[#003087] text-xs font-semibold rounded-full">
                      {item.cost} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Ambassador Program */}
        {activeTab === 'ambassador' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Hero Ambassador */}
            <div className="bg-gradient-to-r from-[#003087] to-[#0047b3] rounded-3xl p-6 text-white text-center">
              <Crown className="w-10 h-10 mx-auto mb-2 text-[#D4AF37]" />
              <h3 className="font-display text-xl font-bold mb-2">Programme Ambassadeur</h3>
              <p className="text-sm text-white/70 mb-4">
                Représentez AfriBayit dans votre communauté et gagnez des commissions sur chaque filleul.
              </p>
              <button
                onClick={() => {
                  if (!user) {
                    toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour devenir ambassadeur.' });
                    return;
                  }
                  toast({ title: 'Candidature envoyée', description: 'Votre demande sera examinée sous 48h.' });
                }}
                className="px-6 py-2.5 bg-[#D4AF37] text-[#003087] rounded-full text-sm font-bold hover:bg-[#e5c349] transition-colors"
              >
                Devenir Ambassadeur
              </button>
            </div>

            {/* Tiers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {ambassadorTiers.map((tier, i) => (
                <motion.div
                  key={tier.tier}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, ease: easeOut }}
                  className="bg-white rounded-3xl p-5 shadow-sm border text-center"
                >
                  <span className="flex items-center justify-center mb-2">{tier.icon}</span>
                  <h4 className="font-bold text-[#2C2E2F] mb-1">{tier.tier}</h4>
                  <p className="text-lg font-mono font-bold mb-3" style={{ color: tier.color }}>
                    {tier.commission}
                  </p>
                  <div className="space-y-1.5">
                    {tier.benefits.map((b) => (
                      <p key={b} className="text-xs text-gray-500 flex items-center gap-1 justify-center"><CheckCircle className="w-3 h-3 text-[#00A651]" /> {b}</p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Comment ça marche */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border">
              <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4">Comment ça marche ?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { step: '1', title: 'Inscrivez-vous', desc: 'Remplissez le formulaire de candidature ambassadeur', icon: <FileText className="w-6 h-6" /> },
                  { step: '2', title: 'Partagez votre lien', desc: 'Diffusez votre lien de parrainage unique', icon: <Link className="w-6 h-6" /> },
                  { step: '3', title: 'Gagnez des commissions', desc: 'Recevez des commissions sur chaque filleul actif', icon: <Coins className="w-6 h-6" /> },
                ].map((s) => (
                  <div key={s.step} className="text-center p-4 bg-gray-50 rounded-2xl">
                    <span className="flex items-center justify-center mb-2 text-[#003087]">{s.icon}</span>
                    <div className="w-8 h-8 rounded-full bg-[#003087] text-white text-sm font-bold flex items-center justify-center mx-auto mb-2">
                      {s.step}
                    </div>
                    <p className="text-sm font-semibold text-[#2C2E2F] mb-1">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* New Post Dialog */}
        {showNewPostDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowNewPostDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-4">Nouveau sujet</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Titre</label>
                  <input
                    type="text"
                    value={newPostForm.title}
                    onChange={(e) => setNewPostForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Sujet de discussion"
                    className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Contenu</label>
                  <textarea
                    rows={4}
                    value={newPostForm.content}
                    onChange={(e) => setNewPostForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Décrivez votre sujet..."
                    className="w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none focus:border-[#003087] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Catégorie</label>
                  <select
                    value={newPostForm.category}
                    onChange={(e) => setNewPostForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    <option value="discussion">Discussion</option>
                    <option value="question">Question</option>
                    <option value="conseil">Conseil</option>
                    <option value="temoignage">Témoignage</option>
                    <option value="annonce">Annonce</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Tags (séparés par des virgules)</label>
                  <input
                    type="text"
                    value={newPostForm.tags}
                    onChange={(e) => setNewPostForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="ex: investissement, Côte d'Ivoire"
                    className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNewPostDialog(false)}
                    className="flex-1 py-3 border rounded-full text-sm font-semibold text-gray-600"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={createPost.isPending || !newPostForm.title || !newPostForm.content}
                    className="flex-1 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-wait"
                  >
                    {createPost.isPending ? 'Publication...' : 'Publier'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
