'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCommunityPosts, useCommunityGroups, useCommunityEvents, useCreateCommunityPost, useRegisterCommunityEvent, useReportContent, useCommunityPost, useCommunityPostReplies, useCreateReply, useLikePost, useCommunityGroup, useCommunityGroupMembers, useJoinGroup } from '@/hooks/useCommunity';
import { useAuthStore } from '@/stores/authStore';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { timeAgo } from '@/lib/afribayit-utils';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import {
  Medal, Diamond, Gem, Sprout, Star, Trophy, Crown, PenTool, Handshake, Globe, BookOpen, Award,
  Lock, Bot, AlertTriangle, MessageCircle, User, Calendar, Coins, CheckCircle, PartyPopper,
  ShoppingCart, Rocket, Sparkles, FileText, Link, Flag, ShieldCheck, Newspaper, Store,
  Users, TrendingUp, MapPin, Eye, ThumbsUp, MessageSquare, Briefcase, Landmark, Wrench,
  Search, Filter, ChevronRight, ArrowRight, Building2, CircleDot, X, Send, Plus, BarChart3,
  Phone, Mail, Heart, Quote, Hash, Megaphone,
} from 'lucide-react';

interface PostAuthor {
  id: string;
  name: string;
  avatar?: string;
  reputation?: string;
}

interface Post {
  id: string;
  title: string;
  author: string | PostAuthor;
  avatar: string;
  replies: number;
  views: number;
  category: string;
  lastActivity: string;
  createdAt?: string;
  city?: string;
  country?: string;
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

// AfriPoints levels
const afriPointLevels = [
  { name: 'Bronze', min: 0, icon: <Medal className="w-4 h-4" style={{ color: '#CD7F32' }} />, color: '#CD7F32' },
  { name: 'Argent', min: 200, icon: <Medal className="w-4 h-4" style={{ color: '#C0C0C0' }} />, color: '#C0C0C0' },
  { name: 'Or', min: 500, icon: <Medal className="w-4 h-4" style={{ color: '#FFD700' }} />, color: '#FFD700' },
  { name: 'Platine', min: 1500, icon: <Diamond className="w-4 h-4" style={{ color: '#E5E4E2' }} />, color: '#E5E4E2' },
  { name: 'Diamant', min: 5000, icon: <Gem className="w-4 h-4" style={{ color: '#B9F2FF' }} />, color: '#B9F2FF' },
];

// Reputation levels
const reputationLevels = [
  { name: 'Découvreur', min: 0, max: 100, color: '#6b7280', icon: <Sprout className="w-4 h-4" /> },
  { name: 'Acteur', min: 100, max: 300, color: '#009CDE', icon: <Star className="w-4 h-4" /> },
  { name: 'Expert', min: 300, max: 600, color: '#00A651', icon: <Trophy className="w-4 h-4" /> },
  { name: 'Ambassadeur', min: 600, max: 1001, color: '#D4AF37', icon: <Crown className="w-4 h-4" /> },
];

// Badges
const badges = [
  { id: 'first_post', name: 'Premier pas', icon: <PenTool className="w-3.5 h-3.5" />, description: 'Premier sujet publié', earned: true },
  { id: 'helper', name: 'Bon samaritain', icon: <Handshake className="w-3.5 h-3.5" />, description: '5 réponses utiles', earned: false },
  { id: 'reviewer', name: 'Critique immobilier', icon: <Star className="w-3.5 h-3.5" />, description: '3 avis publiés', earned: false },
  { id: 'networker', name: 'Réseauteur', icon: <Globe className="w-3.5 h-3.5" />, description: '10 connexions', earned: false },
  { id: 'student', name: 'Étudiant', icon: <BookOpen className="w-3.5 h-3.5" />, description: '1 cours complété', earned: true },
  { id: 'certified', name: 'Certifié', icon: <Award className="w-3.5 h-3.5" />, description: '1 certificat obtenu', earned: false },
];

// Ambassador tiers
const ambassadorTiers = [
  { tier: 'Bronze', commission: '5%', icon: <Medal className="w-5 h-5" style={{ color: '#CD7F32' }} />, color: '#CD7F32', benefits: ['Lien de parrainage', 'Commission 5%', 'Dashboard ambassadeur'] },
  { tier: 'Argent', commission: '10%', icon: <Medal className="w-5 h-5" style={{ color: '#C0C0C0' }} />, color: '#C0C0C0', benefits: ['Tous les avantages Bronze', 'Commission 10%', 'Page personnalisée', 'Support prioritaire'] },
  { tier: 'Or', commission: '15%', icon: <Medal className="w-5 h-5" style={{ color: '#FFD700' }} />, color: '#FFD700', benefits: ['Tous les avantages Argent', 'Commission 15%', 'Événements co-brandés', 'Accès VIP formations'] },
];

// Forum categories for filter
const FORUM_CATEGORIES = [
  { key: '', label: 'Toutes' },
  { key: 'discussion', label: 'Discussion' },
  { key: 'question', label: 'Question' },
  { key: 'success_story', label: 'Témoignage' },
  { key: 'market_analysis', label: 'Marché' },
  { key: 'legal', label: 'Juridique' },
  { key: 'investment', label: 'Investissement' },
  { key: 'event', label: 'Événement' },
];

// Services marketplace items
const SERVICES_ITEMS = [
  { id: 's1', title: 'Photographe immobilier professionnel', provider: 'Kofi Mensah', city: 'Cotonou', price: 25000, rating: 4.9, category: 'Photo', avatar: '' },
  { id: 's2', title: 'Expertise foncière certifiée', provider: 'Me. Adjo Dossou', city: 'Abidjan', price: 75000, rating: 4.8, category: 'Juridique', avatar: '' },
  { id: 's3', title: 'Home staging complet', provider: 'Aminata Traoré', city: 'Lomé', price: 150000, rating: 4.7, category: 'Décoration', avatar: '' },
  { id: 's4', title: 'Inspection technique du bâtiment', provider: 'GeoTrust Bénin', city: 'Cotonou', price: 50000, rating: 5.0, category: 'Technique', avatar: '' },
  { id: 's5', title: 'Vidéo aérienne par drone', provider: 'DroneView Africa', city: 'Abidjan', price: 35000, rating: 4.6, category: 'Photo', avatar: '' },
];

const easeOut = [0.16, 1, 0.3, 1] as const;

const tabs = [
  { key: 'forum', label: 'Forum' },
  { key: 'investor_groups', label: 'Groupes Invest' },
  { key: 'news', label: 'Actualités' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'events', label: 'Événements' },
  { key: 'points', label: 'AfriPoints' },
  { key: 'ambassador', label: 'Ambassadeur' },
];

function PostSkeleton() {
  return (<div className="bg-white rounded-2xl p-5 shadow-sm border animate-pulse"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" /><div className="flex-1"><div className="h-4 bg-gray-200 rounded w-3/4 mb-2" /><div className="flex gap-3"><div className="h-3 bg-gray-100 rounded w-16" /><div className="h-3 bg-gray-100 rounded w-12" /><div className="h-3 bg-gray-100 rounded w-14" /></div></div></div></div>);
}

function EventSkeleton() {
  return (<div className="bg-white rounded-2xl p-5 shadow-sm border flex items-center gap-4 animate-pulse"><div className="w-14 h-14 rounded-2xl bg-gray-200 shrink-0" /><div className="flex-1"><div className="h-4 bg-gray-200 rounded w-48 mb-2" /><div className="flex gap-3"><div className="h-3 bg-gray-100 rounded w-16" /><div className="h-3 bg-gray-100 rounded w-20" /></div></div></div>);
}

export default function CommunityModule() {
  const [activeTab, setActiveTab] = useState('forum');
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [newPostForm, setNewPostForm] = useState({ title: '', content: '', category: '', tags: '' });
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [forumCity, setForumCity] = useState('');
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [forumCategory, setForumCategory] = useState('');
  const [forumSearch, setForumSearch] = useState('');
  // Post detail dialog
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  // Group detail dialog
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  // Create group dialog
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({ name: '', description: '', type: 'Privé', city: '' });
  // Poll creation
  const [showPollDialog, setShowPollDialog] = useState(false);
  const [pollForm, setPollForm] = useState({ question: '', options: ['', ''] });
  const [pollVotes, setPollVotes] = useState<Record<string, string>>({});
  // Marketplace contact
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

  const posts: Post[] = ((postsData?.posts as Record<string, unknown>[]) || []).map(p => {
    const authorObj = p.author as Record<string, unknown> | null;
    let authorName = '';
    try {
      if (authorObj && typeof authorObj === 'object') {
        authorName = String(authorObj.name ?? '');
      } else if (typeof p.author === 'string') {
        authorName = p.author;
      }
    } catch { authorName = ''; }
    let authorAvatar = '';
    try {
      if (authorObj && typeof authorObj === 'object') {
        authorAvatar = String(authorObj.avatar ?? '');
      } else if (typeof p.avatar === 'string') {
        authorAvatar = p.avatar;
      }
    } catch { authorAvatar = ''; }
    const toDateStr = (v: unknown): string => {
      if (!v) return '';
      if (v instanceof Date) return v.toISOString();
      if (typeof v === 'string') return v;
      return String(v);
    };
    return {
      id: String(p.id ?? ''),
      title: String(p.title ?? ''),
      author: authorName,
      avatar: authorAvatar,
      replies: Number(p.replies ?? (p._count && (p._count as Record<string, number>).replies_rel) ?? 0),
      views: Number(p.views ?? 0),
      category: String(p.category ?? ''),
      lastActivity: toDateStr(p.lastActivity || p.createdAt),
      createdAt: toDateStr(p.createdAt) || undefined,
      city: p.city != null ? String(p.city) : undefined,
      country: p.country != null ? String(p.country) : undefined,
    };
  });
  const groups: Group[] = ((groupsData?.groups as Record<string, unknown>[]) || []).map(g => ({
    id: String(g.id ?? ''),
    name: String(g.name ?? ''),
    role: String(g.type ?? ''),
    city: String(g.city ?? ''),
    score: Number(g.members ?? 0),
    avatar: String(g.coverImage ?? ''),
    skills: typeof g.type === 'string' ? [g.type] : [],
    userId: g.organizerId != null ? String(g.organizerId) : undefined,
  }));
  const events: Event[] = ((eventsData?.events as Record<string, unknown>[]) || []).map(e => {
    let dateStr = '';
    try {
      const d = e.eventDate ? new Date(e.eventDate as string | Date) : null;
      if (d && !isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      }
    } catch { dateStr = ''; }
    const venue = String(e.venue ?? e.city ?? '');
    const isVirt = e.isVirtual === true || e.isVirtual === 'true';
    return {
      id: String(e.id ?? ''),
      title: String(e.title ?? ''),
      date: dateStr,
      location: venue + (isVirt ? ' (Virtuel)' : ''),
      type: String(e.eventType ?? ''),
      attendees: Number(e.maxAttendees ?? e.attendees ?? 0),
    };
  });

  const currentUserScore = (user as unknown as Record<string, unknown> & { reputationScore?: number })?.reputationScore ? Number((user as unknown as Record<string, unknown> & { reputationScore?: number }).reputationScore) : 0;
  const userRepLevel = reputationLevels.find(l => currentUserScore >= l.min && currentUserScore < l.max) || reputationLevels[0];
  const userAfriPoints = (user as unknown as Record<string, unknown> & { afriPoints?: number })?.afriPoints ? Number((user as unknown as Record<string, unknown> & { afriPoints?: number }).afriPoints) : 0;
  const afriLevel = afriPointLevels.filter(l => userAfriPoints >= l.min).pop() || afriPointLevels[0];
  const nextLevel = afriPointLevels.find(l => l.min > userAfriPoints);

  // Trending topics - computed from posts
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
    createPost.mutate({ title: newPostForm.title, content: newPostForm.content, category: newPostForm.category || undefined, tags: tags.length > 0 ? tags : undefined }, {
      onSuccess: () => { toast({ title: 'Sujet créé', description: 'Votre sujet a été publié avec succès.' }); setShowNewPostDialog(false); setNewPostForm({ title: '', content: '', category: '', tags: '' }); },
      onError: (err) => { toast({ title: 'Erreur', description: err.message || 'Impossible de créer le sujet.', variant: 'destructive' }); },
    });
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
    // Create poll as a post
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

  const eventTypeIcon = (type: string | null | undefined) => {
    const t = (type || '').toLowerCase();
    if (t.includes('summit')) return <Trophy className="w-5 h-5 text-[#D4AF37]" />;
    if (t.includes('networking')) return <Users className="w-5 h-5 text-[#009CDE]" />;
    if (t.includes('portes ouvertes') || t.includes('virtuel')) return <Globe className="w-5 h-5 text-[#00A651]" />;
    if (t.includes('formation')) return <BookOpen className="w-5 h-5 text-[#003087]" />;
    return <Calendar className="w-5 h-5 text-[#D4AF37]" />;
  };

  // Filter posts by country, city, and category
  const filteredPosts = posts.filter(p => {
    if (forumCity && p.city !== forumCity) return false;
    if (forumSearch) {
      const q = forumSearch.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !(typeof p.author === 'string' ? p.author : '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <section className="min-h-screen pt-20 pb-24 lg:pb-8 bg-gray-50/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00A651]/10 text-[#00A651] text-sm font-semibold mb-4"><Handshake className="w-4 h-4" /> AfriBayit Connect</span>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#2C2E2F] mb-3">Communauté <span className="text-[#00A651]">Africaine</span></h1>
          <p className="text-gray-500 max-w-lg mx-auto">Connectez-vous avec des professionnels de l&apos;immobilier, partagez vos expériences, et développez votre réseau.</p>
        </motion.div>

        {/* Country + City Filter */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">Pays:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">{COUNTRY_NAMES[selectedCountry] || selectedCountry}</span>
          <span className="text-xs text-gray-400 mx-1">|</span>
          <span className="text-xs text-gray-500 font-medium">Ville:</span>
          <select value={forumCity} onChange={e => setForumCity(e.target.value)} className="text-xs border rounded-full px-3 py-1 focus:outline-none focus:ring-1 focus:ring-[#003087]">
            <option value="">Toutes les villes</option>
            <option value="Cotonou">Cotonou</option>
            <option value="Abidjan">Abidjan</option>
            <option value="Lomé">Lomé</option>
            <option value="Ouagadougou">Ouagadougou</option>
          </select>
        </div>

        {/* Reputation + AfriPoints Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-5 shadow-sm border mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{userRepLevel.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2E2F]">{userRepLevel.name}</p>
                    <p className="text-xs text-gray-500">Score AfriBayit : {currentUserScore}/1000</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${userRepLevel.color}15`, color: userRepLevel.color }}>{userRepLevel.name}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((currentUserScore / 1000) * 100, 100)}%`, backgroundColor: userRepLevel.color }} />
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-gray-400">
                {reputationLevels.map((level) => (<span key={level.name} className="flex items-center gap-0.5">{level.icon} {level.name}</span>))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{afriLevel.icon}</span>
                  <div><p className="text-sm font-semibold text-[#2C2E2F]">AfriPoints</p><p className="text-xs text-gray-500">{userAfriPoints} points</p></div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${afriLevel.color}15`, color: afriLevel.color }}>{afriLevel.name}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all bg-gradient-to-r from-[#D4AF37] to-[#003087]" style={{ width: nextLevel ? `${Math.min((userAfriPoints / nextLevel.min) * 100, 100)}%` : '100%' }} />
              </div>
              <div className="flex justify-between mt-1 text-[9px] text-gray-400">{afriPointLevels.slice(0, 4).map((level) => (<span key={level.name} className="flex items-center gap-0.5">{level.icon} {level.name}</span>))}</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {badges.filter(b => b.earned).map((badge) => (<span key={badge.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 bg-[#D4AF37]/10 text-[#D4AF37]" title={badge.description}>{badge.icon} {badge.name}</span>))}
            {badges.filter(b => !b.earned).map((badge) => (<span key={badge.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 bg-gray-50 text-gray-300" title={badge.description}><Lock className="w-3 h-3" /> {badge.name}</span>))}
          </div>
          {/* NLP moderation + Signalement + Rebecca AI */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#009CDE]/5 rounded-xl">
              <Bot className="w-3.5 h-3.5 text-[#009CDE] shrink-0" />
              <span className="text-[10px] text-[#009CDE] font-medium">Modération NLP — Rebecca IA</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#D4AF37]/5 rounded-xl">
              <Flag className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
              <span className="text-[10px] text-[#D4AF37] font-medium">Signalement</span>
            </div>
            <button
              onClick={() => toast({ title: 'Rebecca IA', description: 'Ouvrez le chat Rebecca pour obtenir de l\'aide.' })}
              className="flex items-center gap-2 px-3 py-2 bg-[#00A651]/5 rounded-xl hover:bg-[#00A651]/10 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#00A651] shrink-0" />
              <span className="text-[10px] text-[#00A651] font-medium">Chat Rebecca IA</span>
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {tabs.map((tab) => (<button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>{tab.label}</button>))}
        </div>

        {/* ============ FORUM TAB ============ */}
        {activeTab === 'forum' && (
          <div className="space-y-3">
            {/* Search + Category Filter + Trending */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              {/* Search + Filters */}
              <div className="lg:col-span-3 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={forumSearch}
                    onChange={e => setForumSearch(e.target.value)}
                    placeholder="Rechercher dans le forum..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-full border text-sm outline-none focus:border-[#003087] transition-colors"
                  />
                  {forumSearch && (
                    <button onClick={() => setForumSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {FORUM_CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setForumCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${forumCategory === cat.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-500 border hover:bg-gray-50'}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trending Topics */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border">
                <h4 className="text-xs font-semibold text-[#2C2E2F] mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" /> Tendances</h4>
                {trendingTopics.length > 0 ? (
                  <div className="space-y-2">
                    {trendingTopics.map(t => (
                      <button
                        key={t.category}
                        onClick={() => setForumCategory(t.category)}
                        className="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
                      >
                        <span className="text-xs text-gray-700 flex items-center gap-1.5">
                          <Hash className="w-3 h-3 text-[#003087]" />
                          {t.category}
                        </span>
                        <span className="text-[10px] text-gray-400">{t.count} sujets</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {['Investissement', 'Juridique', 'Marché', 'Construction', 'Négociation'].map(topic => (
                      <button key={topic} onClick={() => setForumCategory(topic.toLowerCase())} className="w-full flex items-center justify-between text-left hover:bg-gray-50 rounded-lg p-1.5 transition-colors">
                        <span className="text-xs text-gray-700 flex items-center gap-1.5"><Hash className="w-3 h-3 text-[#003087]" />{topic}</span>
                        <TrendingUp className="w-3 h-3 text-[#D4AF37]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Posts */}
            {postsLoading && Array.from({ length: 4 }).map((_, i) => (<PostSkeleton key={i} />))}
            {postsError && (<div className="text-center py-12"><AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-600 font-semibold mb-1">Impossible de charger les posts</p><p className="text-sm text-gray-400">{postsError.message}</p></div>)}
            {!postsLoading && !postsError && filteredPosts.length === 0 && (<div className="text-center py-12"><MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-600 font-semibold mb-1">Aucun sujet de discussion</p><p className="text-sm text-gray-400">Soyez le premier à lancer un débat !</p></div>)}
            {!postsLoading && !postsError && filteredPosts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.08, ease: easeOut }} className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <ImageWithFallback src={post.avatar} alt="" className="w-10 h-10 rounded-full shrink-0 cursor-pointer" fallbackType="avatar" onClick={() => setSelectedPostId(post.id)} />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedPostId(post.id)}>
                    <h3 className="font-semibold text-sm text-[#2C2E2F] mb-1 hover:text-[#003087] transition-colors">{post.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      <span className="font-medium text-[#003087]">{typeof post.author === 'object' && post.author !== null ? String((post.author as PostAuthor)?.name ?? '') : String(post.author ?? '')}</span>
                      <span className="px-2 py-0.5 bg-gray-100 rounded-full">{post.category}</span>
                      {post.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{post.city}</span>}
                      <span>{post.replies} réponses</span>
                      <span>{post.views} vues</span>
                      <span className="text-gray-400">{post.createdAt ? timeAgo(post.createdAt) : post.lastActivity}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleReport(post.id); }} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Signaler ce contenu">
                    <Flag className="w-4 h-4 text-gray-300 hover:text-[#D93025]" />
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={() => { if (!user) { toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour créer un sujet.' }); return; } setShowNewPostDialog(true); }} className="flex-1 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-[#003087] hover:text-[#003087] transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Nouveau sujet
              </button>
              <button onClick={() => { if (!user) { toast({ title: 'Connexion requise' }); return; } setShowPollDialog(true); }} className="py-3 px-4 border-2 border-dashed border-[#D4AF37]/40 rounded-2xl text-sm text-[#D4AF37] hover:border-[#D4AF37] transition-colors flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> Sondage
              </button>
            </div>
          </div>
        )}

        {/* ============ INVESTOR GROUPS TAB ============ */}
        {activeTab === 'investor_groups' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-1 flex items-center gap-2"><Landmark className="w-5 h-5 text-[#00A651]" /> Groupes d&apos;investisseurs</h3>
                  <p className="text-xs text-gray-500">Groupes privés segmentés par profil pour des échanges qualitatifs.</p>
                </div>
                <button
                  onClick={() => { if (!user) { toast({ title: 'Connexion requise' }); return; } setShowCreateGroupDialog(true); }}
                  className="px-4 py-2 bg-[#00A651] text-white rounded-full text-xs font-semibold hover:bg-[#008f47] transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Créer un groupe
                </button>
              </div>
              {groupsLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl border animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              )}
              {!groupsLoading && groups.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucun groupe disponible</p>
                </div>
              )}
              {!groupsLoading && groups.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {groups.map((group, i) => (
                    <motion.div key={group.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, ease: easeOut }} className="p-4 bg-gray-50 rounded-2xl border cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedGroupId(group.id)}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm text-[#2C2E2F]">{group.name}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${group.role === 'Premium' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#003087]/10 text-[#003087]'}`}>{group.role || 'Privé'}</span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{group.city || 'En ligne'}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{group.score} membres</span>
                        {group.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{group.city}</span>}
                      </div>
                      <div className="flex gap-1 flex-wrap mb-3">
                        {group.skills.map(p => (<span key={p} className="px-2 py-0.5 bg-white rounded-full text-[10px] font-medium text-gray-600 border">{p}</span>))}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedGroupId(group.id); }} className="w-full py-2 bg-[#003087] text-white rounded-full text-xs font-semibold hover:bg-[#0047b3] transition-colors">Voir le groupe</button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ============ NEWS TAB ============ */}
        {activeTab === 'news' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center gap-2 mb-2"><Newspaper className="w-5 h-5 text-[#003087]" /><h3 className="font-display text-base font-bold text-[#2C2E2F]">Actualités immobilières</h3></div>
            {/* Show empty state since this should be dynamic from API */}
            <div className="text-center py-12">
              <Newspaper className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-semibold mb-1">Actualités bientôt disponibles</p>
              <p className="text-sm text-gray-400">Les actualités immobilières pour votre pays seront bientôt publiées par notre équipe éditoriale.</p>
            </div>
          </motion.div>
        )}

        {/* ============ MARKETPLACE TAB ============ */}
        {activeTab === 'marketplace' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-2 mb-2"><Store className="w-5 h-5 text-[#D4AF37]" /><h3 className="font-display text-base font-bold text-[#2C2E2F]">Marketplace de services</h3><span className="text-xs text-gray-400">Services peer-to-peer entre professionnels</span></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERVICES_ITEMS.map((svc, i) => (
                <motion.div key={svc.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, ease: easeOut }} className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-[#003087]/10 text-[#003087] rounded-full text-[10px] font-bold">{svc.category}</span>
                    <span className="flex items-center gap-1 text-xs text-[#D4AF37]"><Star className="w-3 h-3" />{svc.rating}</span>
                  </div>
                  <h4 className="font-semibold text-sm text-[#2C2E2F] mb-1">{svc.title}</h4>
                  <p className="text-xs text-gray-500 mb-2">Par {svc.provider} · {svc.city}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-mono text-sm font-bold text-[#00A651]">{new Intl.NumberFormat('fr-FR').format(svc.price)} FCFA</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleContactService(svc.id, svc.provider)}
                        disabled={contactingService === svc.id}
                        className="px-3 py-1.5 bg-[#003087] text-white rounded-full text-xs font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-60"
                      >
                        {contactingService === svc.id ? 'Envoi...' : 'Contacter'}
                      </button>
                      <button
                        onClick={() => toast({ title: 'Réservation', description: 'Fonctionnalité de réservation bientôt disponible.' })}
                        className="px-3 py-1.5 border border-[#D4AF37] text-[#D4AF37] rounded-full text-xs font-semibold hover:bg-[#D4AF37]/5 transition-colors"
                      >
                        Réserver
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ============ EVENTS TAB ============ */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { label: 'Tous', type: '' },
                { label: 'Summit mensuel', type: 'Summit' },
                { label: 'Networking trimestriel', type: 'Networking' },
                { label: 'Portes ouvertes virtuelles', type: 'Portes ouvertes' },
                { label: 'Formation communautaire', type: 'Formation' },
              ].map(et => (
                <button key={et.label} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white text-gray-600 border hover:bg-gray-50 whitespace-nowrap">{et.label}</button>
              ))}
            </div>
            {eventsLoading && Array.from({ length: 4 }).map((_, i) => (<EventSkeleton key={i} />))}
            {eventsError && (<div className="text-center py-12"><AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-600 font-semibold mb-1">Impossible de charger les événements</p></div>)}
            {!eventsLoading && !eventsError && events.length === 0 && (<div className="text-center py-12"><Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-600 font-semibold mb-1">Aucun événement à venir</p></div>)}
            {!eventsLoading && !eventsError && events.map((event, i) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.08, ease: easeOut }} className="bg-white rounded-2xl p-5 shadow-sm border flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/community/events/${event.id}`)}>
                <div className="w-14 h-14 rounded-2xl bg-[#003087]/10 flex flex-col items-center justify-center shrink-0">
                  <span className="text-lg font-bold text-[#003087]">{event.date.split(' ')[0]}</span>
                  <span className="text-[10px] text-[#003087]/60">{event.date.split(' ')[1]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-[#2C2E2F] hover:text-[#003087] transition-colors">{event.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full font-medium">{eventTypeIcon(event.type)} {event.type}</span>
                    <span>{event.location}</span>
                    <span>{event.attendees} participants</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleRegisterEvent(event.id); }} disabled={registeringEventId === event.id && registerEvent.isPending} className="px-4 py-2 bg-[#003087] text-white rounded-full text-xs font-semibold shrink-0 disabled:opacity-60">
                  {registeringEventId === event.id && registerEvent.isPending ? 'Inscription...' : 'S\'inscrire'}
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* ============ AFRIPOINTS TAB ============ */}
        {activeTab === 'points' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="bg-white rounded-3xl p-6 shadow-sm border text-center">
              <span className="inline-flex items-center justify-center mb-2">{afriLevel.icon}</span>
              <p className="font-mono text-3xl font-bold text-[#D4AF37]">{userAfriPoints}</p>
              <p className="text-sm text-gray-500 mb-1">AfriPoints</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${afriLevel.color}15`, color: afriLevel.color }}>Niveau {afriLevel.name}</span>
              {nextLevel && (<p className="text-xs text-gray-400 mt-2">Plus que <span className="font-semibold text-[#003087]">{nextLevel.min - userAfriPoints} points</span> pour atteindre le niveau {nextLevel.name}</p>)}
            </div>
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
                ].map((item) => (<div key={item.action} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl"><span className="text-gray-500">{item.icon}</span><div className="flex-1"><p className="text-sm font-medium text-[#2C2E2F]">{item.action}</p><p className="text-xs text-[#D4AF37] font-semibold">+{item.points} pts</p></div></div>))}
              </div>
            </div>
            <div className="bg-white rounded-3xl p-5 shadow-sm border">
              <h3 className="font-display text-base font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Dépenser des AfriPoints</h3>
              <div className="space-y-3">
                {[
                  { item: 'Boost annonce 7 jours', cost: 200, icon: <Rocket className="w-5 h-5" /> },
                  { item: 'Boost annonce 30 jours', cost: 500, icon: <Rocket className="w-5 h-5" /> },
                  { item: 'Fonctionnalité premium', cost: 100, icon: <Sparkles className="w-5 h-5" /> },
                  { item: 'Réduction cours 10%', cost: 150, icon: <BookOpen className="w-5 h-5" /> },
                  { item: 'Réduction cours 25%', cost: 300, icon: <BookOpen className="w-5 h-5" /> },
                ].map((item) => (<div key={item.item} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl"><div className="flex items-center gap-3"><span className="text-gray-500">{item.icon}</span><p className="text-sm font-medium text-[#2C2E2F]">{item.item}</p></div><span className="px-3 py-1 bg-[#003087]/10 text-[#003087] text-xs font-semibold rounded-full">{item.cost} pts</span></div>))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ============ AMBASSADOR TAB ============ */}
        {activeTab === 'ambassador' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="bg-gradient-to-r from-[#003087] to-[#0047b3] rounded-3xl p-6 text-white text-center">
              <Crown className="w-10 h-10 mx-auto mb-2 text-[#D4AF37]" />
              <h3 className="font-display text-xl font-bold mb-2">Programme Ambassadeur</h3>
              <p className="text-sm text-white/70 mb-4">Représentez AfriBayit dans votre communauté et gagnez des commissions sur chaque filleul.</p>
              <button onClick={() => { if (!user) { toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour devenir ambassadeur.' }); return; } toast({ title: 'Candidature envoyée', description: 'Votre demande sera examinée sous 48h.' }); }} className="px-6 py-2.5 bg-[#D4AF37] text-[#003087] rounded-full text-sm font-bold hover:bg-[#e5c349] transition-colors">Devenir Ambassadeur</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {ambassadorTiers.map((tier, i) => (
                <motion.div key={tier.tier} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1, ease: easeOut }} className="bg-white rounded-3xl p-5 shadow-sm border text-center">
                  <span className="flex items-center justify-center mb-2">{tier.icon}</span>
                  <h4 className="font-bold text-[#2C2E2F] mb-1">{tier.tier}</h4>
                  <p className="text-lg font-mono font-bold mb-3" style={{ color: tier.color }}>{tier.commission}</p>
                  <div className="space-y-1.5">{tier.benefits.map((b) => (<p key={b} className="text-xs text-gray-500 flex items-center gap-1 justify-center"><CheckCircle className="w-3 h-3 text-[#00A651]" /> {b}</p>))}</div>
                </motion.div>
              ))}
            </div>
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
                    <div className="w-8 h-8 rounded-full bg-[#003087] text-white text-sm font-bold flex items-center justify-center mx-auto mb-2">{s.step}</div>
                    <p className="text-sm font-semibold text-[#2C2E2F] mb-1">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ============ POST DETAIL DIALOG ============ */}
      <AnimatePresence>
        {selectedPostId && (
          <PostDetailDialog
            postId={selectedPostId}
            onClose={() => setSelectedPostId(null)}
            user={user}
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
            user={user}
          />
        )}
      </AnimatePresence>

      {/* ============ NEW POST DIALOG ============ */}
      {showNewPostDialog && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowNewPostDialog(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-4">Nouveau sujet</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Titre</label>
                <input type="text" value={newPostForm.title} onChange={(e) => setNewPostForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Sujet de discussion" className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Contenu</label>
                <textarea rows={4} value={newPostForm.content} onChange={(e) => setNewPostForm(prev => ({ ...prev, content: e.target.value }))} placeholder="Décrivez votre sujet... Utilisez @ pour mentionner un membre" className="w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none focus:border-[#003087] transition-colors" />
                <p className="text-[10px] text-gray-400 mt-1">💡 Utilisez @pseudo pour mentionner un membre</p>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Catégorie</label>
                <select value={newPostForm.category} onChange={(e) => setNewPostForm(prev => ({ ...prev, category: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors">
                  <option value="">Sélectionnez une catégorie</option>
                  <option value="discussion">Discussion</option>
                  <option value="question">Question</option>
                  <option value="success_story">Témoignage de succès</option>
                  <option value="market_analysis">Analyse de marché</option>
                  <option value="legal">Juridique</option>
                  <option value="event">Événement</option>
                  <option value="investment">Investissement</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Tags (séparés par des virgules)</label>
                <input type="text" value={newPostForm.tags} onChange={(e) => setNewPostForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="ex: investissement, Côte d'Ivoire" className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors" />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-[#009CDE]/5 rounded-xl">
                <Bot className="w-3.5 h-3.5 text-[#009CDE] shrink-0" />
                <span className="text-[10px] text-[#009CDE] font-medium">Rebecca IA vérifiera votre contenu avant publication</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowNewPostDialog(false)} className="flex-1 py-3 border rounded-full text-sm font-semibold text-gray-600">Annuler</button>
                <button onClick={handleCreatePost} disabled={createPost.isPending || !newPostForm.title || !newPostForm.content} className="flex-1 py-3 bg-[#003087] text-white rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-wait">{createPost.isPending ? 'Publication...' : 'Publier'}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ============ POLL DIALOG ============ */}
      {showPollDialog && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowPollDialog(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#D4AF37]" /> Créer un sondage</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Question</label>
                <input type="text" value={pollForm.question} onChange={e => setPollForm(p => ({ ...p, question: e.target.value }))} placeholder="Posez votre question..." className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors" />
              </div>
              {pollForm.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#003087]/10 flex items-center justify-center text-xs font-bold text-[#003087] shrink-0">{String.fromCharCode(65 + i)}</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={e => {
                      const newOpts = [...pollForm.options];
                      newOpts[i] = e.target.value;
                      setPollForm(p => ({ ...p, options: newOpts }));
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1 px-4 py-2.5 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
                  />
                  {i >= 2 && (
                    <button onClick={() => setPollForm(p => ({ ...p, options: p.options.filter((_, idx) => idx !== i) }))} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>
              ))}
              {pollForm.options.length < 6 && (
                <button onClick={() => setPollForm(p => ({ ...p, options: [...p.options, ''] }))} className="w-full py-2 border-2 border-dashed rounded-2xl text-xs text-gray-400 hover:border-[#003087] hover:text-[#003087] transition-colors">
                  + Ajouter une option
                </button>
              )}
              <div className="flex gap-3">
                <button onClick={() => setShowPollDialog(false)} className="flex-1 py-3 border rounded-full text-sm font-semibold text-gray-600">Annuler</button>
                <button onClick={handleCreatePoll} disabled={createPost.isPending} className="flex-1 py-3 bg-[#D4AF37] text-[#003087] rounded-full text-sm font-bold disabled:opacity-50">{createPost.isPending ? 'Publication...' : 'Publier le sondage'}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ============ CREATE GROUP DIALOG ============ */}
      {showCreateGroupDialog && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowCreateGroupDialog(false)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-xl font-bold text-[#2C2E2F] mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-[#00A651]" /> Créer un groupe</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nom du groupe</label>
                <input type="text" value={newGroupForm.name} onChange={e => setNewGroupForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Investisseurs Lomé" className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Description</label>
                <textarea rows={3} value={newGroupForm.description} onChange={e => setNewGroupForm(p => ({ ...p, description: e.target.value }))} placeholder="Décrivez l'objectif du groupe..." className="w-full px-4 py-3 rounded-2xl border text-sm outline-none resize-none focus:border-[#003087] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Type</label>
                <select value={newGroupForm.type} onChange={e => setNewGroupForm(p => ({ ...p, type: e.target.value }))} className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors">
                  <option value="Privé">Privé</option>
                  <option value="Public">Public</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Ville</label>
                <input type="text" value={newGroupForm.city} onChange={e => setNewGroupForm(p => ({ ...p, city: e.target.value }))} placeholder="Ville ou En ligne" className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreateGroupDialog(false)} className="flex-1 py-3 border rounded-full text-sm font-semibold text-gray-600">Annuler</button>
                <button
                  onClick={() => {
                    if (!newGroupForm.name) { toast({ title: 'Nom requis' }); return; }
                    toast({ title: 'Groupe créé', description: 'Votre groupe a été créé avec succès.' });
                    setShowCreateGroupDialog(false);
                    setNewGroupForm({ name: '', description: '', type: 'Privé', city: '' });
                  }}
                  className="flex-1 py-3 bg-[#00A651] text-white rounded-full text-sm font-semibold hover:bg-[#008f47] transition-colors"
                >
                  Créer le groupe
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ============ REPORT DIALOG ============ */}
      {showReportDialog && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4" onClick={() => { setShowReportDialog(false); setReportReason(''); }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold text-[#2C2E2F] mb-1 flex items-center gap-2"><Flag className="w-5 h-5 text-[#D93025]" /> Signaler ce contenu</h3>
            <p className="text-xs text-gray-500 mb-4">Notre équipe de modération examinera votre signalement sous 24h.</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Raison du signalement</label>
                <select value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors">
                  <option value="">Sélectionnez une raison</option>
                  <option value="spam">Spam ou contenu indésirable</option>
                  <option value="hate">Discours de haine</option>
                  <option value="harassment">Harcèlement</option>
                  <option value="misinformation">Fausse information</option>
                  <option value="inappropriate">Contenu inapproprié</option>
                  <option value="scam">Arnaque / fraude</option>
                  <option value="other">Autre</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowReportDialog(false); setReportReason(''); }} className="flex-1 py-3 border rounded-full text-sm font-semibold text-gray-600">Annuler</button>
                <button onClick={submitReport} disabled={reportSubmitting || !reportReason} className="flex-1 py-3 bg-[#D93025] text-white rounded-full text-sm font-semibold disabled:opacity-50">{reportSubmitting ? 'Envoi...' : 'Signaler'}</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}

// ============ Post Detail Dialog Sub-Component ============

function PostDetailDialog({
  postId,
  onClose,
  user,
  onReport,
}: {
  postId: string;
  onClose: () => void;
  user: { id: string } | null;
  onReport: (id: string) => void;
}) {
  const { data, isLoading } = useCommunityPost(postId);
  const { data: repliesData, isLoading: repliesLoading } = useCommunityPostReplies(postId);
  const createReply = useCreateReply(postId);
  const [replyContent, setReplyContent] = useState('');

  const postData = data?.data as Record<string, unknown> | undefined;
  const postAuthor = postData?.author as Record<string, unknown> | undefined;
  const replies = ((repliesData?.data as Record<string, unknown>[]) || []);

  const handleReply = () => {
    if (!user) { toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour répondre.' }); return; }
    if (!replyContent.trim()) return;
    createReply.mutate({ content: replyContent.trim() }, {
      onSuccess: () => {
        toast({ title: 'Réponse publiée', description: 'Votre réponse a été ajoutée.' });
        setReplyContent('');
      },
      onError: (err) => { toast({ title: 'Erreur', description: err.message || 'Impossible de publier la réponse.', variant: 'destructive' }); },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/60 flex items-start justify-center overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8 mx-4"
        onClick={e => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="p-8 animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-32 bg-gray-100 rounded" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-5 border-b">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <ImageWithFallback
                    src={postAuthor?.avatar ? String(postAuthor.avatar) : ''}
                    alt=""
                    className="w-10 h-10 rounded-full"
                    fallbackType="avatar"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#003087] cursor-pointer hover:underline">
                      {postAuthor?.name ? String(postAuthor.name) : 'Auteur'}
                    </p>
                    <p className="text-xs text-gray-500">{postData?.createdAt ? timeAgo(String(postData.createdAt)) : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {Boolean(postData?.category) && (
                    <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600">
                      {String(postData?.category)}
                    </span>
                  )}
                  <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-[#2C2E2F] mb-2">
                {postData?.title ? String(postData.title) : 'Discussion'}
              </h2>
              {Boolean(postData?.content) && (
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {String(postData?.content)}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {Number(postData?.views ?? 0)} vues</span>
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {replies.length} réponses</span>
                <button
                  onClick={() => onReport(postId)}
                  className="flex items-center gap-1 text-gray-400 hover:text-[#D93025] transition-colors"
                >
                  <Flag className="w-3 h-3" /> Signaler
                </button>
              </div>
            </div>

            {/* Replies */}
            <div className="p-5 max-h-[40vh] overflow-y-auto">
              <h4 className="text-sm font-semibold text-[#2C2E2F] mb-3">Réponses ({replies.length})</h4>
              {repliesLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex gap-3 p-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                      <div className="flex-1"><div className="h-3 bg-gray-200 rounded w-3/4 mb-2" /><div className="h-2 bg-gray-100 rounded w-full" /></div>
                    </div>
                  ))}
                </div>
              )}
              {!repliesLoading && replies.length === 0 && (
                <div className="text-center py-6">
                  <MessageCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Aucune réponse pour le moment</p>
                  <p className="text-xs text-gray-400">Soyez le premier à répondre !</p>
                </div>
              )}
              {!repliesLoading && replies.length > 0 && (
                <div className="space-y-3">
                  {replies.map((reply, i) => {
                    const replyAuthor = reply.author as Record<string, unknown> | undefined;
                    return (
                      <motion.div
                        key={String(reply.id ?? i)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-3 p-3 bg-gray-50 rounded-2xl"
                      >
                        <ImageWithFallback
                          src={replyAuthor?.avatar ? String(replyAuthor.avatar) : ''}
                          alt=""
                          className="w-8 h-8 rounded-full shrink-0"
                          fallbackType="avatar"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-[#003087]">
                              {replyAuthor?.name ? String(replyAuthor.name) : 'Membre'}
                            </span>
                            <span className="text-[10px] text-gray-400">{reply.createdAt ? timeAgo(String(reply.createdAt)) : ''}</span>
                          </div>
                          <p className="text-sm text-gray-600">{String(reply.content ?? '')}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Reply input */}
            <div className="p-5 border-t bg-gray-50/50 rounded-b-3xl">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={replyContent}
                  onChange={e => setReplyContent(e.target.value)}
                  placeholder={user ? 'Écrire une réponse... Utilisez @ pour mentionner' : 'Connectez-vous pour répondre'}
                  disabled={!user}
                  className="flex-1 px-4 py-2.5 rounded-full border text-sm outline-none focus:border-[#003087] transition-colors disabled:opacity-50"
                  onKeyDown={e => { if (e.key === 'Enter') handleReply(); }}
                />
                <button
                  onClick={handleReply}
                  disabled={!user || !replyContent.trim() || createReply.isPending}
                  className="px-4 py-2.5 bg-[#003087] text-white rounded-full text-sm font-semibold hover:bg-[#0047b3] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {createReply.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============ Group Detail Dialog Sub-Component ============

function GroupDetailDialog({
  groupId,
  onClose,
  user,
}: {
  groupId: string;
  onClose: () => void;
  user: { id: string } | null;
}) {
  const { data, isLoading } = useCommunityGroup(groupId);
  const { data: membersData, isLoading: membersLoading } = useCommunityGroupMembers(groupId);
  const joinGroup = useJoinGroup(groupId);

  const groupData = data?.data as Record<string, unknown> | undefined;
  const members = ((membersData?.data as Record<string, unknown>[]) || []);

  const handleJoin = () => {
    if (!user) { toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour rejoindre ce groupe.' }); return; }
    joinGroup.mutate(undefined, {
      onSuccess: () => { toast({ title: 'Bienvenue !', description: 'Vous avez rejoint le groupe.' }); },
      onError: (err) => { toast({ title: 'Erreur', description: err.message || 'Impossible de rejoindre le groupe.', variant: 'destructive' }); },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/60 flex items-start justify-center overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl my-8 mx-4"
        onClick={e => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="p-8 animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-1/2" />
            <div className="h-32 bg-gray-100 rounded" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-5 border-b">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-[#2C2E2F]">
                    {groupData?.name ? String(groupData.name) : 'Groupe'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${String(groupData?.type) === 'Premium' ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-[#003087]/10 text-[#003087]'}`}>
                      {String(groupData?.type ?? 'Privé')}
                    </span>
                    {Boolean(groupData?.city) && (
                      <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="w-3 h-3" />{String(groupData?.city)}</span>
                    )}
                  </div>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              {Boolean(groupData?.description) && (
                <p className="text-sm text-gray-600">{String(groupData?.description)}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {Number(groupData?.members ?? members.length)} membres</span>
              </div>
            </div>

            {/* Members list */}
            <div className="p-5 max-h-[40vh] overflow-y-auto">
              <h4 className="text-sm font-semibold text-[#2C2E2F] mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#003087]" /> Membres
              </h4>
              {membersLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center gap-2 p-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200" />
                      <div className="flex-1"><div className="h-3 bg-gray-200 rounded w-24" /></div>
                    </div>
                  ))}
                </div>
              )}
              {!membersLoading && members.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">Aucun membre pour le moment</p>
              )}
              {!membersLoading && members.length > 0 && (
                <div className="space-y-2">
                  {members.map((member, i) => {
                    const memberUser = member.user as Record<string, unknown> | undefined;
                    return (
                      <div key={String(member.id ?? i)} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                        <ImageWithFallback
                          src={memberUser?.avatar ? String(memberUser.avatar) : ''}
                          alt=""
                          className="w-8 h-8 rounded-full"
                          fallbackType="avatar"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#2C2E2F] truncate">
                            {memberUser?.name ? String(memberUser.name) : 'Membre'}
                          </p>
                          <p className="text-[10px] text-gray-400">{String(member.role ?? 'Membre')}</p>
                        </div>
                        {String(member.role) === 'organizer' && (
                          <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full text-[10px] font-bold">Organisateur</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Join button */}
            <div className="p-5 border-t bg-gray-50/50 rounded-b-3xl">
              <div className="flex gap-3">
                <button
                  onClick={() => toast({ title: 'Messagerie', description: 'Ouvrez la messagerie pour contacter ce groupe.' })}
                  className="flex-1 py-3 border rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Message
                </button>
                <button
                  onClick={handleJoin}
                  disabled={!user || joinGroup.isPending}
                  className="flex-1 py-3 bg-[#00A651] text-white rounded-full text-sm font-semibold hover:bg-[#008f47] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {joinGroup.isPending ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Users className="w-4 h-4" /> Rejoindre</>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
