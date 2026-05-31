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

// Static config — reputation levels
const reputationLevels = [
  { name: 'Découvreur', min: 0, max: 100, color: '#6b7280', icon: '🌱' },
  { name: 'Acteur', min: 100, max: 300, color: '#009CDE', icon: '⭐' },
  { name: 'Expert', min: 300, max: 600, color: '#00A651', icon: '🏆' },
  { name: 'Ambassadeur', min: 600, max: Infinity, color: '#D4AF37', icon: '👑' },
];

const easeOut = [0.16, 1, 0.3, 1] as const;

const tabs = [
  { key: 'forum', label: 'Forum' },
  { key: 'profiles', label: 'Profils Pro' },
  { key: 'events', label: 'Événements' },
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

  // Derive user score from user data — fallback to 0 if not available
  const currentUserScore = (user as Record<string, unknown> & { reputationScore?: number })?.reputationScore
    ? Number((user as Record<string, unknown> & { reputationScore?: number }).reputationScore)
    : 0;
  const userRepLevel = reputationLevels.find(l => currentUserScore >= l.min && currentUserScore < l.max) || reputationLevels[0];

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
            🤝 AfriBayit Connect
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

        {/* Reputation Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-5 shadow-sm border mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{userRepLevel.icon}</span>
              <div>
                <p className="text-sm font-semibold text-[#2C2E2F]">{userRepLevel.name}</p>
                <p className="text-xs text-gray-500">{currentUserScore} points de réputation</p>
              </div>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: `${userRepLevel.color}15`, color: userRepLevel.color }}>
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
          <div className="flex justify-between mt-1.5 text-[10px] text-gray-400">
            {reputationLevels.map((level) => (
              <span key={level.name}>{level.icon} {level.name}</span>
            ))}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
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
                <span className="text-4xl block mb-3">⚠️</span>
                <p className="text-gray-600 font-semibold mb-1">Impossible de charger les posts</p>
                <p className="text-sm text-gray-400">{postsError.message}</p>
              </div>
            )}
            {!postsLoading && !postsError && posts.length === 0 && (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">💬</span>
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
                <span className="text-4xl block mb-3">👤</span>
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
                    onClick={() => router.push(`/profile/${profile.userId || profile.id}`)}
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
                <span className="text-4xl block mb-3">⚠️</span>
                <p className="text-gray-600 font-semibold mb-1">Impossible de charger les événements</p>
                <p className="text-sm text-gray-400">{eventsError.message}</p>
              </div>
            )}
            {!eventsLoading && !eventsError && events.length === 0 && (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">📅</span>
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
