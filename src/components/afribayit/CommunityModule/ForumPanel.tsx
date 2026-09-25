'use client';

/**
 * ForumPanel — Vue « canal Discord » du forum AfriBayit Connect.
 *
 * - En-tête de canal : #nom, description, recherche, filtre ville,
 *   actions (nouveau sujet / sondage / membres).
 * - Flux de messages : avatar + auteur + badge réputation + horodatage,
 *   titre en gras, extrait, compteurs d'engagement (réponses / vues).
 * - Composeur : barre de saisie façon Discord qui ouvre le dialogue
 *   de publication avec le canal présélectionné.
 */

import { timeAgo } from '@/lib/afribayit-utils';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import {
  AlertTriangle,
  BarChart3,
  Flag,
  Hash,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react';
import { FORUM_CATEGORIES } from './constants';
import { PostSkeleton } from './utils';
import type { Post, PostAuthor, TrendingTopic } from './types';
import { useTranslation } from '@/lib/i18n/use-translate';

export interface ForumChannel {
  key: string;
  label: string;
  desc: string;
}

interface ForumPanelProps {
  postsLoading: boolean;
  postsError: { message?: string } | null;
  filteredPosts: Post[];
  forumSearch: string;
  setForumSearch: (v: string) => void;
  forumCategory: string;
  setForumCategory: (v: string) => void;
  channel: ForumChannel;
  onSelectPost: (id: string) => void;
  onReport: (id: string) => void;
  onNewPost: () => void;
  onNewPoll: () => void;
  onToggleMembers: () => void;
  membersCount: number;
}

export default function ForumPanel({
  postsLoading,
  postsError,
  filteredPosts,
  forumSearch,
  setForumSearch,
  forumCategory,
  setForumCategory,
  channel,
  onSelectPost,
  onReport,
  onNewPost,
  onNewPoll,
  onToggleMembers,
  membersCount,
}: ForumPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full">
      {/* ── En-tête du canal ─────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 px-4 h-14 border-b border-white/10 bg-[#0D1B38]">
        <Hash className="w-5 h-5 text-white/40 shrink-0" />
        <div className="min-w-0 hidden sm:block">
          <p className="text-white text-sm font-bold truncate">{channel.label}</p>
          <p className="text-white/35 text-[10px] truncate">{channel.desc}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Recherche dans le canal */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              value={forumSearch}
              onChange={(e) => setForumSearch(e.target.value)}
              placeholder="Rechercher dans le canal…"
              className="w-44 lg:w-56 pl-8 pr-7 py-1.5 rounded-full bg-white/10 border border-white/10 text-white text-[11px] placeholder:text-white/30 outline-none focus:border-primary-green/60 focus:bg-white/15 transition-colors"
            />
            {forumSearch && (
              <button onClick={() => setForumSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filtre ville */}
          <select
            value={forumCategory}
            onChange={(e) => setForumCategory(e.target.value)}
            className="hidden lg:block py-1.5 px-2.5 rounded-full bg-white/10 border border-white/10 text-white/70 text-[11px] outline-none focus:border-primary-green/60 cursor-pointer"
            title="Filtrer par sous-canal"
          >
            {FORUM_CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key} className="bg-noir-vert text-white">
                {cat.label === 'Toutes' ? 'Tous les sujets' : cat.label}
              </option>
            ))}
          </select>

          {/* Actions */}
          <button
            onClick={onNewPoll}
            title="Créer un sondage"
            className="p-2 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/15 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMembers}
            title="Afficher / masquer les membres"
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/15 transition-colors text-[11px] font-semibold"
          >
            <Users className="w-4 h-4" /> {membersCount}
          </button>
          <button
            onClick={onNewPost}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary-green text-white text-[11px] font-bold hover:bg-primary-deep transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Nouveau sujet
          </button>
        </div>
      </div>

      {/* ── Flux de messages ─────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Bandeau de bienvenue du canal (comme Discord) */}
        <div className="px-4 sm:px-6 pt-8 pb-4 border-b border-white/5">
          <div className="w-14 h-14 rounded-full bg-primary-deep flex items-center justify-center mb-3">
            <Hash className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-white text-xl font-bold">Bienvenue dans #{channel.label}</h2>
          <p className="text-white/40 text-xs mt-1 max-w-xl">
            {channel.desc}. Cliquez sur une discussion pour ouvrir le fil et répondre.
          </p>
        </div>

        {postsLoading && (
          <div className="px-4 sm:px-6 py-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-white/10 rounded w-32" />
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                  <div className="h-2 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {postsError && (
          <div className="px-6 py-12 text-center">
            <AlertTriangle className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/70 font-semibold mb-1">{t('community.unableToLoadPosts', 'Impossible de charger les posts')}</p>
            <p className="text-sm text-white/30">{postsError.message}</p>
          </div>
        )}

        {!postsLoading && !postsError && filteredPosts.length === 0 && (
          <div className="px-6 py-12 text-center">
            <MessageCircle className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/70 font-semibold mb-1">{t('community.noDiscussion', 'Aucun sujet de discussion')}</p>
            <p className="text-sm text-white/30 mb-4">{t('community.beFirstToPost', 'Soyez le premier à lancer le débat !')}</p>
            <button
              onClick={onNewPost}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-green text-white text-xs font-bold hover:bg-primary-deep transition-colors"
            >
              <Plus className="w-4 h-4" /> Lancer une discussion
            </button>
          </div>
        )}

        {!postsLoading && !postsError && filteredPosts.map((post) => {
          const authorName =
            typeof post.author === 'object' && post.author !== null
              ? String((post.author as PostAuthor)?.name ?? '')
              : String(post.author ?? '');
          const authorReputation =
            typeof post.author === 'object' && post.author !== null
              ? String((post.author as PostAuthor)?.reputation ?? '')
              : '';
          return (
            <article
              key={post.id}
              className="group px-4 sm:px-6 py-3 hover:bg-white/[0.04] transition-colors border-b border-white/5"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <button
                  onClick={() => onSelectPost(post.id)}
                  className="shrink-0 w-10 h-10 rounded-full overflow-hidden relative bg-white/10 mt-0.5"
                >
                  <ImageWithFallback src={post.avatar} alt="" className="absolute inset-0 w-full h-full" fallbackType="avatar" fill />
                </button>

                {/* Corps du message */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectPost(post.id)}>
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-white text-sm font-bold truncate max-w-[180px] sm:max-w-xs">{authorName || 'Membre'}</span>
                    {authorReputation && (
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 text-[9px] font-semibold">{authorReputation}</span>
                    )}
                    <span className="text-white/25 text-[10px]">{post.createdAt ? timeAgo(post.createdAt) : post.lastActivity}</span>
                  </div>

                  <h3 className="text-white/90 text-[13px] font-semibold leading-snug mb-1 group-hover:text-white transition-colors">
                    {post.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/30">
                    {post.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {post.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> {post.replies} {t('community.repliesLabel', 'réponses')}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {post.views} {t('community.viewsLabel', 'vues')}
                    </span>
                  </div>
                </div>

                {/* Signaler */}
                <button
                  onClick={(e) => { e.stopPropagation(); onReport(post.id); }}
                  className="shrink-0 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
                  title={t('community.reportContent', 'Signaler ce contenu')}
                >
                  <Flag className="w-3.5 h-3.5 text-white/30 hover:text-accent-yellow" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* ── Composeur ────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-white/10 bg-[#0D1B38]">
        <button
          onClick={onNewPost}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white/40 text-xs hover:bg-white/15 hover:border-primary-green/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="truncate">Démarrer une discussion dans #{channel.label}…</span>
        </button>
        <p className="mt-2 text-[9px] text-white/25 flex items-center gap-1.5">
          <svg viewBox="0 0 16 16" className="w-3 h-3 fill-current" aria-hidden>
            <path d="M6.5 11.2L3.8 8.5l1.2-1.2 1.5 1.5 3.9-3.9 1.2 1.2-5.1 5.1z" />
          </svg>
          Modération IA Rebecca · Chartes de la communauté AfriBayit
        </p>
      </div>
    </div>
  );
}
