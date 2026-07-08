'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommunityPosts, useCommunityGroups, useCommunityEvents, useCreateCommunityPost, useRegisterCommunityEvent, useReportContent } from '@/hooks/useCommunity';
import { useAuthStore } from '@/stores/authStore';
import { useCountry } from '@/contexts/CountryContext';
import { Handshake } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import { tabs } from './constants';
import { mapPosts, mapGroups, mapEvents, getUserAfriPoints } from './utils';

import ReputationBar from './ReputationBar';
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

  const trendingTopics = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    posts.forEach(p => {
      if (p.category) {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      }
    });
    return Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, count]) => ({ category: cat, count }));
  }, [posts]);

  const handleCreatePost = () => {
    if (!user) { toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour créer un sujet.' }); return; }
    const tags = newPostForm.tags.split(',').map(t => t.trim()).filter(Boolean);
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
    if (!pollForm.question || pollForm.options.filter(o => o.trim()).length < 2) {
      toast({ title: 'Données manquantes', description: 'Veuillez fournir une question et au moins 2 options.' });
      return;
    }
    const content = `📊 Sondage: ${pollForm.question}\n${pollForm.options.filter(o => o.trim()).map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('\n')}`;
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

  const openNewPost = () => {
    if (!user) { toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour créer un sujet.' }); return; }
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

  const filteredPosts = posts.filter(p => {
    if (forumCity && p.city !== forumCity) return false;
    if (forumSearch) {
      const q = forumSearch.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !(typeof p.author === 'string' ? p.author : '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const postsErrObj = postsError as { message?: string } | null;
  const eventsErrObj = eventsError as { message?: string } | null;

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A651]/10 text-[#00A651] text-sm font-semibold mb-4"><Handshake className="w-4 h-4" /> AfriBayit Connect</span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">Communauté <span className="text-[#00A651]">Africaine</span></h1>
          <p className="text-gray-500 max-w-lg mx-auto">Connectez-vous avec des professionnels de l&apos;immobilier, partagez vos expériences, et développez votre réseau.</p>
        </motion.div>

        <ReputationBar user={user} forumCity={forumCity} setForumCity={setForumCity} />

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'forum' && (
          <ForumPanel
            postsLoading={postsLoading}
            postsError={postsErrObj}
            filteredPosts={filteredPosts}
            forumSearch={forumSearch}
            setForumSearch={setForumSearch}
            forumCategory={forumCategory}
            setForumCategory={setForumCategory}
            trendingTopics={trendingTopics}
            onSelectPost={setSelectedPostId}
            onReport={handleReport}
            onNewPost={openNewPost}
            onNewPoll={openNewPoll}
          />
        )}

        {activeTab === 'investor_groups' && (
          <InvestorGroupsPanel
            groups={groups}
            groupsLoading={groupsLoading}
            onSelectGroup={setSelectedGroupId}
            onCreateGroup={openCreateGroup}
            isAuth={!!user}
          />
        )}

        {activeTab === 'news' && <NewsPanel />}

        {activeTab === 'marketplace' && (
          <MarketplacePanel
            contactingService={contactingService}
            onContactService={handleContactService}
          />
        )}

        {activeTab === 'events' && (
          <EventsPanel
            events={events}
            eventsLoading={eventsLoading}
            eventsError={eventsErrObj}
            registeringEventId={registeringEventId}
            isRegisterPending={registerEvent.isPending}
            onSelectEvent={(id) => router.push(`/community/events/${id}`)}
            onRegisterEvent={handleRegisterEvent}
          />
        )}

        {activeTab === 'points' && <AfriPointsPanel userAfriPoints={userAfriPoints} />}

        {activeTab === 'ambassador' && <AmbassadorPanel isAuth={!!user} />}
      </div>

      {/* ============ POST DETAIL DIALOG ============ */}
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

      {/* ============ GROUP DETAIL DIALOG ============ */}
      <AnimatePresence>
        {selectedGroupId && (
          <GroupDetailDialog
            groupId={selectedGroupId}
            onClose={() => setSelectedGroupId(null)}
            user={user ? { id: user.id || '' } : null}
          />
        )}
      </AnimatePresence>

      {/* ============ NEW POST DIALOG ============ */}
      <NewPostDialog
        open={showNewPostDialog}
        onClose={() => setShowNewPostDialog(false)}
        form={newPostForm}
        setForm={setNewPostForm}
        onSubmit={handleCreatePost}
        isPending={createPost.isPending}
      />

      {/* ============ POLL DIALOG ============ */}
      <PollDialog
        open={showPollDialog}
        onClose={() => setShowPollDialog(false)}
        form={pollForm}
        setForm={setPollForm}
        onSubmit={handleCreatePoll}
        isPending={createPost.isPending}
      />

      {/* ============ CREATE GROUP DIALOG ============ */}
      <CreateGroupDialog
        open={showCreateGroupDialog}
        onClose={() => setShowCreateGroupDialog(false)}
        form={newGroupForm}
        setForm={setNewGroupForm}
      />

      {/* ============ REPORT DIALOG ============ */}
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
