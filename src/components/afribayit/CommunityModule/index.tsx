'use client';

/**
 * CommunityModule — Workspace « Discord-like » d'AfriBayit Connect.
 *
 * Structure (refonte 2026-09) :
 *   ┌────┬──────────────┬────────────────────────────┬────────────┐
 *   │ R  │ Canaux       │ En-tête du canal            │ Membres    │
 *   │ a  │ # général    ├────────────────────────────┤ ● En ligne │
 *   │ i  │ # marché     │ Flux de messages + composer │ ● Modos    │
 *   │ l  │ # juridique  │                             │            │
 *   │    │ [utilisateur]│                             │            │
 *   └────┴──────────────┴────────────────────────────┴────────────┘
 *
 * - Rail espaces (72px) : Forum, Groupes, Actus, Marketplace, Événements,
 *   AfriPoints, Ambassadeur — indicateur d'activité façon Discord.
 * - Sidebar canaux : catégories repliables, canaux # avec compteurs,
 *   groupes = canaux privés 🔒, panneau utilisateur en bas.
 * - Zone principale : en-tête de canal + messages (forum) ou panneau
 *   intégré (autres espaces) + composeur.
 * - Rail membres : dérivé des auteurs des posts, avec rôles.
 * Palette sombre AfriBayit : #060D1A / #0A1226 / navy — lisible et sobre.
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import {
  useCommunityPosts, useCommunityGroups, useCommunityEvents,
  useCreateCommunityPost, useRegisterCommunityEvent, useReportContent,
} from '@/hooks/useCommunity';
import { useAuthStore } from '@/stores/authStore';
import { useCountry } from '@/contexts/CountryContext';
import {
  Handshake, MessageCircle, Users, Newspaper, Store, Calendar, Coins, Crown,
  Hash, Lock, Plus, Search, ChevronDown, Sparkles, ShieldCheck,
  LogIn, Eye, EyeOff,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { COUNTRY_NAMES } from '@/lib/constants';

import { mapPosts, mapGroups, mapEvents, getUserAfriPoints, getUserReputationScore } from './utils';
import { reputationLevels } from './constants';

import ForumPanel from './ForumPanel';
import InvestorGroupsPanel from './InvestorGroupsPanel';
import NewsPanel from './NewsPanel';
import MarketplacePanel from './MarketplacePanel';
import EventsPanel from './EventsPanel';
import AfriPointsPanel from './AfriPointsPanel';
import AmbassadorPanel from './AmbassadorPanel';

import PostDetailDialog from './dialogs/PostDetailDialog';
import GroupDetailDialog from './dialogs/GroupDetailDialog';
import NewPostDialog from './dialogs/NewPostDialog';
import PollDialog from './dialogs/PollDialog';
import CreateGroupDialog from './dialogs/CreateGroupDialog';
import ReportDialog from './dialogs/ReportDialog';

import type { CommunityTabKey, NewPostFormState, NewGroupFormState, PollFormState } from './types';

/* ── Définition des espaces (rail serveur) ─────────────────────────── */
const SPACES: { key: CommunityTabKey; label: string; icon: typeof Hash; description: string }[] = [
  { key: 'forum', label: 'Forum', icon: MessageCircle, description: 'Les discussions de la communauté immobilière' },
  { key: 'investor_groups', label: 'Groupes Invest', icon: Users, description: 'Groupes privés d’investisseurs par ville et stratégie' },
  { key: 'news', label: 'Actualités', icon: Newspaper, description: 'La revue immobilière d’AfriBayit' },
  { key: 'marketplace', label: 'Marketplace', icon: Store, description: 'Services entre membres de la communauté' },
  { key: 'events', label: 'Événements', icon: Calendar, description: 'Rencontres, visites et ateliers networking' },
  { key: 'points', label: 'AfriPoints', icon: Coins, description: 'Programme de fidélité et paliers' },
  { key: 'ambassador', label: 'Ambassadeur', icon: Crown, description: 'Programme ambassadeurs AfriBayit' },
];

/* ── Canaux du forum (catégorie = canal Discord) ───────────────────── */
const FORUM_CHANNEL_GROUPS: { group: string; channels: { key: string; label: string; desc: string }[] }[] = [
  {
    group: 'Canaux généraux',
    channels: [
      { key: '', label: 'accueil', desc: 'Toutes les discussions de la communauté' },
      { key: 'discussion', label: 'discussion', desc: 'Échanges ouverts sur l’immobilier ouest-africain' },
      { key: 'question', label: 'questions-réponses', desc: 'Posez vos questions, la communauté répond' },
      { key: 'success_story', label: 'témoignages', desc: 'Vos réussites et retours d’expérience' },
    ],
  },
  {
    group: 'Canaux thématiques',
    channels: [
      { key: 'market_analysis', label: 'marché', desc: 'Analyses et tendances du marché immobilier' },
      { key: 'legal', label: 'juridique', desc: 'Droit foncier, titres de propriété, contentieux' },
      { key: 'investment', label: 'investissement', desc: 'Stratégies d’investissement et rentabilité' },
      { key: 'event', label: 'événements', desc: 'Annonces de rencontres et ateliers' },
    ],
  },
];

const FORUM_CHANNELS = FORUM_CHANNEL_GROUPS.flatMap((g) => g.channels);

export default function CommunityModule() {
  const [activeTab, setActiveTab] = useState<CommunityTabKey>('forum');
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [newPostForm, setNewPostForm] = useState<NewPostFormState>({ title: '', content: '', category: '', tags: '' });
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [forumCity, setForumCity] = useState('');
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [forumCategory, setForumCategory] = useState('');
  const [forumSearch, setForumSearch] = useState('');
  const [showMembersRail, setShowMembersRail] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState<NewGroupFormState>({ name: '', description: '', type: 'Privé', city: '' });
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [pollForm, setPollForm] = useState<PollFormState>({ question: '', options: ['', ''] });
  const [contactingService, setContactingService] = useState<string | null>(null);

  const { user } = useAuthStore();
  const router = useRouter();
  const { selectedCountry } = useCountry();

  const { data: postsData, isLoading: postsLoading, error: postsError } = useCommunityPosts(forumCategory || undefined, selectedCountry);
  const { data: groupsData, isLoading: groupsLoading } = useCommunityGroups(undefined, selectedCountry);
  const { data: eventsData, isLoading: eventsLoading, error: eventsError } = useCommunityEvents(selectedCountry);

  const createPost = useCreateCommunityPost();
  const registerEvent = useRegisterCommunityEvent();
  const reportContent = useReportContent();

  const posts = useMemo(
    () => mapPosts((postsData?.posts as Record<string, unknown>[]) || []),
    [postsData]
  );
  const groups = useMemo(
    () => mapGroups((groupsData?.groups as Record<string, unknown>[]) || []),
    [groupsData]
  );
  const events = useMemo(
    () => mapEvents((eventsData?.events as Record<string, unknown>[]) || []),
    [eventsData]
  );

  const userAfriPoints = getUserAfriPoints(user);
  const userScore = getUserReputationScore(user);
  const userRepLevel = reputationLevels.find((l) => userScore >= l.min && userScore < l.max) || reputationLevels[0];

  /* Membres dérivés des auteurs de posts (rail droit) */
  const members = useMemo(() => {
    const map = new Map<string, { name: string; avatar: string; reputation: string; count: number }>();
    posts.forEach((p) => {
      const name = typeof p.author === 'object' && p.author !== null ? String(p.author.name ?? '') : String(p.author ?? '');
      if (!name) return;
      const prev = map.get(name);
      map.set(name, {
        name,
        avatar: p.avatar,
        reputation: typeof p.author === 'object' && p.author !== null ? String(p.author.reputation ?? '') : '',
        count: (prev?.count ?? 0) + 1,
      });
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 24);
  }, [posts]);

  /* Compteurs de messages par canal */
  const channelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    posts.forEach((p) => {
      const key = p.category || '';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [posts]);

  /* ── Handlers (inchangés) ─────────────────────────────────────── */

  const handleCreatePost = () => {
    if (!user) { toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour créer un sujet.' }); return; }
    const tags = newPostForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
    createPost.mutate(
      { title: newPostForm.title, content: newPostForm.content, category: newPostForm.category || undefined, tags: tags.length > 0 ? tags : undefined },
      {
        onSuccess: () => {
          toast({ title: 'Sujet créé', description: 'Votre sujet a été publié avec succès.' });
          setShowNewPostDialog(false);
          setNewPostForm({ title: '', content: '', category: '', tags: '' });
        },
        onError: (err) => { toast({ title: 'Erreur', description: err.message || 'Impossible de créer le sujet.', variant: 'destructive' }); },
      }
    );
  };

  const handleRegisterEvent = (eventId: string) => {
    setRegisteringEventId(eventId);
    registerEvent.mutate({ eventId, userId: user?.id }, {
      onSuccess: () => { toast({ title: 'Inscription confirmée', description: 'Vous êtes inscrit à cet événement.' }); setRegisteringEventId(null); },
      onError: (err) => { toast({ title: 'Erreur', description: err.message || 'Impossible de s\'inscrire.', variant: 'destructive' }); setRegisteringEventId(null); },
    });
  };

  const handleReport = (postId: string) => {
    if (!user) { toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour signaler.' }); return; }
    setReportingPostId(postId);
    setShowReportDialog(true);
  };

  const submitReport = () => {
    if (!reportingPostId || !reportReason.trim()) {
      toast({ title: 'Raison requise', description: 'Veuillez indiquer la raison du signalement.' });
      return;
    }
    setReportSubmitting(true);
    reportContent.mutate(
      { content: 'Signalement de contenu', contentId: reportingPostId, type: 'post', reason: reportReason.trim() },
      {
        onSuccess: () => {
          toast({ title: 'Signalement envoyé', description: 'Notre équipe de modération examinera ce contenu sous 24h.' });
          setShowReportDialog(false);
          setReportReason('');
          setReportingPostId(null);
          setReportSubmitting(false);
        },
        onError: () => {
          toast({ title: 'Erreur', description: 'Impossible d\'envoyer le signalement.', variant: 'destructive' });
          setReportSubmitting(false);
        },
      }
    );
  };

  const handleCreatePoll = () => {
    if (!user) { toast({ title: 'Connexion requise' }); return; }
    if (!pollForm.question || pollForm.options.filter((o) => o.trim()).length < 2) {
      toast({ title: 'Données manquantes', description: 'Veuillez fournir une question et au moins 2 options.' });
      return;
    }
    const content = `📊 Sondage: ${pollForm.question}\n${pollForm.options.filter((o) => o.trim()).map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')}`;
    createPost.mutate({ title: pollForm.question, content, category: 'discussion', tags: ['sondage'] }, {
      onSuccess: () => { toast({ title: 'Sondage créé', description: 'Votre sondage a été publié.' }); setShowPollDialog(false); setPollForm({ question: '', options: ['', ''] }); },
      onError: (err) => { toast({ title: 'Erreur', description: err.message, variant: 'destructive' }); },
    });
  };

  const handleContactService = (serviceId: string, provider: string) => {
    if (!user) { toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour contacter ce prestataire.' }); return; }
    setContactingService(serviceId);
    setTimeout(() => {
      toast({ title: 'Message envoyé', description: `Votre demande de contact a été envoyée à ${provider}.` });
      setContactingService(null);
    }, 1000);
  };

  /* Ouvre le composeur avec le canal courant présélectionné */
  const openNewPost = () => {
    if (!user) { toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour créer un sujet.' }); return; }
    setNewPostForm((f) => ({ ...f, category: forumCategory || f.category }));
    setShowNewPostDialog(true);
  };
  const openNewPoll = () => {
    if (!user) { toast({ title: 'Connexion requise' }); return; }
    setShowPollDialog(true);
  };
  const openCreateGroup = () => {
    if (!user) { toast({ title: 'Connexion requise' }); return; }
    setShowCreateGroupDialog(true);
  };

  const filteredPosts = posts.filter((p) => {
    if (forumCity && p.city !== forumCity) return false;
    if (forumSearch) {
      const q = forumSearch.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !(typeof p.author === 'string' ? p.author : '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const postsErrObj = postsError as { message?: string } | null;
  const eventsErrObj = eventsError as { message?: string } | null;

  const activeSpace = SPACES.find((s) => s.key === activeTab) ?? SPACES[0];
  const activeChannel = FORUM_CHANNELS.find((c) => c.key === forumCategory) ?? FORUM_CHANNELS[0];

  /* ── Rendu des panneaux selon l'espace actif ── */
  const renderMain = () => {
    switch (activeTab) {
      case 'forum':
        return (
          <ForumPanel
            postsLoading={postsLoading}
            postsError={postsErrObj}
            filteredPosts={filteredPosts}
            forumSearch={forumSearch}
            setForumSearch={setForumSearch}
            forumCategory={forumCategory}
            setForumCategory={setForumCategory}
            channel={activeChannel}
            onSelectPost={setSelectedPostId}
            onReport={handleReport}
            onNewPost={openNewPost}
            onNewPoll={openNewPoll}
            onToggleMembers={() => setShowMembersRail((v) => !v)}
            membersCount={members.length}
          />
        );
      case 'investor_groups':
        return (
          <LightPanel
            icon={<Users className="w-4 h-4" />}
            title="Groupes d'investisseurs"
            action={
              <button onClick={openCreateGroup} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-deep text-white text-[11px] font-bold hover:bg-primary-green transition-colors">
                <Plus className="w-3.5 h-3.5" /> Créer un groupe
              </button>
            }
          >
            <InvestorGroupsPanel
              groups={groups}
              groupsLoading={groupsLoading}
              onSelectGroup={setSelectedGroupId}
              onCreateGroup={openCreateGroup}
              isAuth={!!user}
            />
          </LightPanel>
        );
      case 'news':
        return (
          <LightPanel icon={<Newspaper className="w-4 h-4" />} title="Actualités immobilières">
            <NewsPanel />
          </LightPanel>
        );
      case 'marketplace':
        return (
          <LightPanel icon={<Store className="w-4 h-4" />} title="Marketplace de services">
            <MarketplacePanel contactingService={contactingService} onContactService={handleContactService} />
          </LightPanel>
        );
      case 'events':
        return (
          <LightPanel icon={<Calendar className="w-4 h-4" />} title="Événements">
            <EventsPanel
              events={events}
              eventsLoading={eventsLoading}
              eventsError={eventsErrObj}
              registeringEventId={registeringEventId}
              isRegisterPending={registerEvent.isPending}
              onSelectEvent={(id) => router.push(`/community/events/${id}`)}
              onRegisterEvent={handleRegisterEvent}
            />
          </LightPanel>
        );
      case 'points':
        return (
          <LightPanel icon={<Coins className="w-4 h-4" />} title="AfriPoints">
            <AfriPointsPanel userAfriPoints={userAfriPoints} />
          </LightPanel>
        );
      case 'ambassador':
        return (
          <LightPanel icon={<Crown className="w-4 h-4" />} title="Programme ambassadeur">
            <AmbassadorPanel isAuth={!!user} />
          </LightPanel>
        );
    }
  };

  return (
    <section className="bg-[#060D1A]">
      {/* ── Fenêtre applicative Discord-like ── */}
      <div className="h-[calc(100vh-4rem)] sm:h-[calc(100vh-4.5rem)] flex overflow-hidden">
        {/* Rail espaces (desktop) */}
        <nav aria-label="Espaces de la communauté" className="hidden md:flex flex-col items-center gap-2 w-[72px] shrink-0 bg-[#060D1A] py-3 border-r border-white/5">
          {/* Bouton accueil AfriBayit Connect */}
          <button
            onClick={() => setActiveTab('forum')}
            title="AfriBayit Connect — Forum"
            className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'forum' ? 'bg-primary-deep rounded-xl' : 'bg-white/10 hover:bg-primary-deep hover:rounded-xl'
            }`}
          >
            <Handshake className="w-6 h-6 text-white" />
            {activeTab === 'forum' && <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-full bg-white" />}
          </button>
          <div className="w-8 h-px bg-white/10 my-1" />
          {SPACES.slice(1).map((space) => {
            const Icon = space.icon;
            const active = activeTab === space.key;
            return (
              <button
                key={space.key}
                onClick={() => setActiveTab(space.key)}
                title={space.label}
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  active ? 'bg-primary-deep rounded-xl' : 'bg-white/10 hover:bg-primary-deep hover:rounded-xl'
                }`}
              >
                <Icon className="w-5 h-5 text-white" />
                {active && <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-full bg-white" />}
              </button>
            );
          })}
          <div className="mt-auto flex flex-col items-center gap-2">
            <button
              onClick={() => router.push('/help')}
              title="Aide & règles de la communauté"
              className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-primary-green flex items-center justify-center transition-all"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </button>
          </div>
        </nav>

        {/* Sidebar canaux */}
        <nav aria-label="Canaux" className="hidden md:flex flex-col w-60 shrink-0 bg-noir-vert border-r border-white/5">
          {/* En-tête serveur */}
          <button
            onClick={() => router.push('/community')}
            className="flex items-center justify-between px-4 h-14 border-b border-white/10 hover:bg-white/5 transition-colors text-left"
          >
            <div className="min-w-0">
              <p className="text-white text-sm font-bold truncate">AfriBayit Connect</p>
              <p className="text-white/40 text-[10px] truncate">{COUNTRY_NAMES[selectedCountry] || selectedCountry}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
          </button>

          {/* Liste des canaux — scrollable */}
          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
            {activeTab === 'forum' && (
              <>
                {FORUM_CHANNEL_GROUPS.map((group) => (
                  <div key={group.group}>
                    <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">{group.group}</p>
                    {group.channels.map((ch) => {
                      const active = forumCategory === ch.key;
                      const count = channelCounts[ch.key] ?? 0;
                      return (
                        <button
                          key={ch.label}
                          onClick={() => setForumCategory(ch.key)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                            active ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <Hash className={`w-4 h-4 shrink-0 ${active ? 'text-primary-green' : 'text-white/30'}`} />
                          <span className="text-[13px] truncate flex-1">{ch.label}</span>
                          {count > 0 && (
                            <span className="text-[10px] font-mono-data bg-white/10 text-white/60 rounded-full px-1.5 py-0.5 shrink-0">{count}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </>
            )}

            {activeTab === 'investor_groups' && (
              <div>
                <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Groupes privés — {groups.length}</p>
                {groups.slice(0, 12).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroupId(g.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-white/50 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Lock className="w-4 h-4 shrink-0 text-accent-yellow/70" />
                    <span className="text-[13px] truncate flex-1">{g.name}</span>
                    <span className="text-[10px] font-mono-data text-white/30 shrink-0">{g.score}</span>
                  </button>
                ))}
                <button
                  onClick={openCreateGroup}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-primary-green hover:bg-white/5 text-left transition-colors mt-1"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span className="text-[13px]">Créer un groupe</span>
                </button>
              </div>
            )}

            {activeTab === 'events' && (
              <div>
                <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Prochains événements</p>
                {events.slice(0, 10).map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => router.push(`/community/events/${ev.id}`)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-white/50 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Calendar className="w-4 h-4 shrink-0 text-primary-green/70" />
                    <span className="text-[13px] truncate flex-1">{ev.title}</span>
                    <span className="text-[10px] font-mono-data text-white/30 shrink-0">{ev.attendees}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Canaux simples pour les autres espaces */}
            {!['forum', 'investor_groups', 'events'].includes(activeTab) && (
              <div>
                <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Espace</p>
                <button
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left bg-white/10 text-white"
                >
                  {activeSpace.key === 'marketplace' && <Store className="w-4 h-4 shrink-0 text-primary-green" />}
                  {activeSpace.key === 'news' && <Newspaper className="w-4 h-4 shrink-0 text-primary-green" />}
                  {activeSpace.key === 'points' && <Coins className="w-4 h-4 shrink-0 text-primary-green" />}
                  {activeSpace.key === 'ambassador' && <Crown className="w-4 h-4 shrink-0 text-accent-yellow" />}
                  <span className="text-[13px] truncate">{activeSpace.label.toLowerCase()}</span>
                </button>
                <p className="px-2 mt-3 text-[10px] text-white/30 leading-relaxed">{activeSpace.description}</p>
              </div>
            )}
          </div>

          {/* Panneau utilisateur */}
          <div className="border-t border-white/10 bg-[#060D1A] px-3 py-2.5">
            {user ? (
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden bg-white/10">
                  <ImageWithFallback src={(user as { avatar?: string }).avatar || ''} alt="" className="absolute inset-0 w-full h-full" fallbackType="avatar" fill />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#060D1A]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-bold truncate">{(user as { name?: string }).name ?? 'Membre'}</p>
                  <p className="text-[10px] truncate" style={{ color: userRepLevel.color }}>{userRepLevel.name} · {userAfriPoints} pts</p>
                </div>
                <button onClick={() => router.push('/profile')} title="Mon profil" className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary-green text-white text-xs font-bold hover:bg-primary-deep transition-colors"
              >
                <LogIn className="w-4 h-4" /> Se connecter
              </button>
            )}
          </div>
        </nav>

        {/* Zone principale */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#0D1B38]">
          {/* Rail espaces mobile */}
          <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-white/10 overflow-x-auto scrollbar-hide">
            {SPACES.map((space) => {
              const Icon = space.icon;
              const active = activeTab === space.key;
              return (
                <button
                  key={space.key}
                  onClick={() => setActiveTab(space.key)}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
                    active ? 'bg-primary-deep text-white' : 'bg-white/10 text-white/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {space.label}
                </button>
              );
            })}
          </div>

          {/* Canaux mobile */}
          {activeTab === 'forum' && (
            <div className="md:hidden flex items-center gap-1.5 px-3 py-2 border-b border-white/10 overflow-x-auto scrollbar-hide">
              {FORUM_CHANNELS.map((ch) => {
                const active = forumCategory === ch.key;
                return (
                  <button
                    key={ch.label}
                    onClick={() => setForumCategory(ch.key)}
                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                      active ? 'bg-white/15 text-white' : 'text-white/45'
                    }`}
                  >
                    <Hash className="w-3 h-3" /> {ch.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Contenu principal (scrollable) */}
          <div className="flex-1 min-h-0 overflow-y-auto">{renderMain()}</div>
        </div>

        {/* Rail membres */}
        {showMembersRail && (
          <aside aria-label="Membres en ligne" className="hidden xl:flex flex-col w-56 shrink-0 bg-noir-vert border-l border-white/5">
            <div className="px-3 h-14 flex items-center border-b border-white/10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Membres — {members.length}</p>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-3">
              {/* Modération */}
              <p className="px-2 mb-1 text-[10px] font-bold uppercase tracking-wider text-accent-yellow/70">Modération</p>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary-green/20 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-primary-green" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-semibold truncate">Rebecca IA</p>
                  <p className="text-[9px] text-accent-yellow/70 truncate">Modération NLP · En ligne</p>
                </div>
              </div>

              {/* Membres actifs */}
              <p className="px-2 mt-4 mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Actifs — {members.length}</p>
              {members.length === 0 && (
                <p className="px-2 py-2 text-[11px] text-white/30">Aucun membre actif sur ce canal pour l’instant.</p>
              )}
              {members.map((m) => (
                <button
                  key={m.name}
                  onClick={() => {
                    if (m.name) {
                      setForumSearch(m.name);
                      setActiveTab('forum');
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left transition-colors"
                >
                  <div className="relative shrink-0 w-7 h-7 rounded-full overflow-hidden bg-white/10">
                    <ImageWithFallback src={m.avatar} alt="" className="absolute inset-0 w-full h-full" fallbackType="avatar" fill />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-noir-vert" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/80 text-xs font-medium truncate">{m.name}</p>
                    <p className="text-[9px] text-white/35 truncate">{m.reputation || 'Membre'} · {m.count} message{m.count > 1 ? 's' : ''}</p>
                  </div>
                </button>
              ))}

              {/* Rôles */}
              <p className="px-2 mt-4 mb-1 text-[10px] font-bold uppercase tracking-wider text-white/40">Rôles</p>
              <ul className="px-2 space-y-1.5 text-[10px] text-white/40">
                <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent-yellow" /> Modérateur</li>
                <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /> Investisseur vérifié</li>
                <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary-green" /> Membre</li>
              </ul>
            </div>
          </aside>
        )}
      </div>

      {/* Bascule du rail membres (mobile/desktop compact) */}
      <button
        onClick={() => setShowMembersRail((v) => !v)}
        className="hidden md:flex fixed bottom-4 right-4 z-40 items-center gap-2 px-3 py-2 rounded-full bg-noir-vert border border-white/10 text-white/70 hover:text-white shadow-lg transition-colors"
        title={showMembersRail ? 'Masquer les membres' : 'Afficher les membres'}
      >
        {showMembersRail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        <span className="text-[11px] font-semibold">Membres</span>
      </button>

      {/* ============ DIALOGS (inchangés) ============ */}
      <AnimatePresence>
        {selectedPostId && (
          <PostDetailDialog
            postId={selectedPostId}
            onClose={() => setSelectedPostId(null)}
            user={user ? { id: user.id || '' } : null}
            onReport={handleReport}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedGroupId && (
          <GroupDetailDialog
            groupId={selectedGroupId}
            onClose={() => setSelectedGroupId(null)}
            user={user ? { id: user.id || '' } : null}
          />
        )}
      </AnimatePresence>

      <NewPostDialog
        open={showNewPostDialog}
        onClose={() => setShowNewPostDialog(false)}
        form={newPostForm}
        setForm={setNewPostForm}
        onSubmit={handleCreatePost}
        isPending={createPost.isPending}
      />

      <PollDialog
        open={showPollDialog}
        onClose={() => setShowPollDialog(false)}
        form={pollForm}
        setForm={setPollForm}
        onSubmit={handleCreatePoll}
        isPending={createPost.isPending}
      />

      <CreateGroupDialog
        open={showCreateGroupDialog}
        onClose={() => setShowCreateGroupDialog(false)}
        form={newGroupForm}
        setForm={setNewGroupForm}
      />

      <ReportDialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        reason={reportReason}
        setReason={setReportReason}
        onSubmit={submitReport}
        isSubmitting={reportSubmitting}
      />
    </section>
  );
}

/* ── Panneau clair intégré (espaces non-forum) ────────────────────── */
function LightPanel({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="bg-cream rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-primary-pale bg-white">
          <div className="w-9 h-9 rounded-xl bg-primary-pale flex items-center justify-center text-primary-deep shrink-0">{icon}</div>
          <h2 className="font-serif text-base font-bold text-primary-deep truncate">{title}</h2>
          <div className="ml-auto flex items-center gap-2">{action}</div>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
