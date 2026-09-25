'use client';

/**
 * ForumPanel — Vue « canal Discord » du forum AfriBayit Connect.
 *
 * Refonte temps réel (2026-09) — le canal est désormais CHAT-FIRST :
 *   1. En-tête de canal : #nom, description, recherche, filtre, actions
 *      (nouveau sujet / sondage / membres).
 *   2. Chat temps réel (ChannelChat) : messages en direct, composer réel,
 *      envoi optimiste, synchro incrémentale 2,5 s — le cœur Discord-like.
 *   3. « Sujets du canal » (repliable) : les discussions longues (posts),
 *      conservées sous le flux de chat avec leur propre défilement.
 */

import { useState } from 'react';
import { timeAgo } from '@/lib/afribayit-utils';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import ChannelChat from './ChannelChat';
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
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
  const [threadsOpen, setThreadsOpen] = useState(true);

  return (
    <div className="flex flex-col h-full min-h-0">
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

      {/* ── Corps : chat temps réel + sujets du canal ────────────── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Chat temps réel — cœur du canal */}
        <div className="flex-1 min-h-0 flex flex-col border-b border-white/10">
          <ChannelChat
            channelKey={channel.key || 'accueil'}
            channelLabel={channel.label}
          />
        </div>

        {/* Sujets du canal (discussions longues) — repliable */}
        <div className={`shrink-0 flex flex-col transition-all ${threadsOpen ? 'max-h-[38%]' : 'max-h-11'}`}>
          <button
            onClick={() => setThreadsOpen((v) => !v)}
            className="shrink-0 flex items-center gap-2 px-4 sm:px-6 h-11 text-left hover:bg-white/[0.03] transition-colors"
            aria-expanded={threadsOpen}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 text-white/40 transition-transform ${!threadsOpen && '-rotate-90'}`}
            />
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
              Sujets du canal
            </span>
            <span className="text-[10px] font-mono-data bg-white/10 text-white/60 rounded-full px-1.5 py-0.5">
              {filteredPosts.length}
            </span>
            <span className="ml-auto text-[9px] text-white/25 hidden sm:inline">
              discussions structurées — cliquez pour {threadsOpen ? 'replier' : 'déplier'}
            </span>
          </button>

          {threadsOpen && (
            <div className="flex-1 min-h-0 overflow-y-auto border-t border-white/5">
              {postsLoading && (
                <div className="px-4 sm:px-6 py-3 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <PostSkeleton key={i} />
                  ))}
                </div>
              )}

              {postsError && (
                <div className="px-6 py-8 text-center">
                  <AlertTriangle className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-white/70 font-semibold mb-1 text-sm">
                    {t('community.unableToLoadPosts', 'Impossible de charger les posts')}
                  </p>
                  <p className="text-xs text-white/30">{postsError.message}</p>
                </div>
              )}

              {!postsLoading && !postsError && filteredPosts.length === 0 && (
                <div className="px-6 py-6 text-center">
                  <MessageCircle className="w-7 h-7 text-white/20 mx-auto mb-2" />
                  <p className="text-white/60 text-xs font-semibold mb-1">Aucun sujet structuré dans ce canal</p>
                  <p className="text-[11px] text-white/30 mb-3">
                    Le chat en direct ci-dessus reste actif — créez un sujet pour une discussion longue.
                  </p>
                  <button
                    onClick={onNewPost}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-white/70 text-[11px] font-bold hover:bg-white/15 hover:text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Lancer un sujet
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
                    className="group px-4 sm:px-6 py-2.5 hover:bg-white/[0.04] transition-colors border-b border-white/5"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <button
                        onClick={() => onSelectPost(post.id)}
                        className="shrink-0 w-9 h-9 rounded-full overflow-hidden relative bg-white/10 mt-0.5"
                      >
                        <ImageWithFallback src={post.avatar} alt="" className="absolute inset-0 w-full h-full" fallbackType="avatar" fill />
                      </button>

                      {/* Corps du sujet */}
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectPost(post.id)}>
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className="text-white text-[13px] font-bold truncate max-w-[180px] sm:max-w-xs">{authorName || 'Membre'}</span>
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
          )}
        </div>
      </div>
    </div>
  );
}
