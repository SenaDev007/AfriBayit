'use client';

import { motion } from 'framer-motion';
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
  TrendingUp,
  X,
} from 'lucide-react';
import { FORUM_CATEGORIES, easeOut } from './constants';
import { PostSkeleton } from './utils';
import type { Post, PostAuthor, TrendingTopic } from './types';

interface ForumPanelProps {
  postsLoading: boolean;
  postsError: { message?: string } | null;
  filteredPosts: Post[];
  forumSearch: string;
  setForumSearch: (v: string) => void;
  forumCategory: string;
  setForumCategory: (v: string) => void;
  trendingTopics: TrendingTopic[];
  onSelectPost: (id: string) => void;
  onReport: (id: string) => void;
  onNewPost: () => void;
  onNewPoll: () => void;
}

export default function ForumPanel({
  postsLoading,
  postsError,
  filteredPosts,
  forumSearch,
  setForumSearch,
  forumCategory,
  setForumCategory,
  trendingTopics,
  onSelectPost,
  onReport,
  onNewPost,
  onNewPoll,
}: ForumPanelProps) {
  return (
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
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none focus:border-[#003087] transition-colors"
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${forumCategory === cat.key ? 'bg-[#003087] text-white' : 'bg-white text-gray-500 border hover:bg-gray-50'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trending Topics */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <h4 className="text-xs font-semibold text-[#0a2a5e] mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-[#D4AF37]" /> Tendances</h4>
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
      {postsLoading && Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)}
      {postsError && (
        <div className="text-center py-12">
          <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold mb-1">Impossible de charger les posts</p>
          <p className="text-sm text-gray-400">{postsError.message}</p>
        </div>
      )}
      {!postsLoading && !postsError && filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-semibold mb-1">Aucun sujet de discussion</p>
          <p className="text-sm text-gray-400">Soyez le premier à lancer un débat !</p>
        </div>
      )}
      {!postsLoading && !postsError && filteredPosts.map((post, i) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.08, ease: easeOut }}
          className="bg-white rounded-2xl shadow-sm border hover:shadow-lg hover:border-[#003087]/20 transition-all overflow-hidden group"
        >
          {/* LinkedIn-style colored top border */}
          <div className="h-1 bg-gradient-to-r from-[#003087] via-[#00A651] to-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-5">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="shrink-0 w-11 h-11 rounded-full overflow-hidden border-2 border-[#003087]/10 relative bg-gray-100 cursor-pointer" onClick={() => onSelectPost(post.id)}>
                <ImageWithFallback
                  src={post.avatar}
                  alt=""
                  className="absolute inset-0 w-full h-full"
                  fallbackType="avatar"
                  fill
                />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectPost(post.id)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-[#003087]">
                    {typeof post.author === 'object' && post.author !== null ? String((post.author as PostAuthor)?.name ?? '') : String(post.author ?? '')}
                  </span>
                  <span className="text-[10px] text-gray-400">·</span>
                  <span className="text-[10px] text-gray-400">{post.createdAt ? timeAgo(post.createdAt) : post.lastActivity}</span>
                </div>
                <h3 className="font-semibold text-[#0a2a5e] mb-2 group-hover:text-[#003087] transition-colors text-sm leading-snug">{post.title}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {post.category && (
                    <span className="px-2 py-0.5 bg-[#003087]/5 text-[#003087] text-[10px] font-semibold rounded-full">{post.category}</span>
                  )}
                  {post.city && (
                    <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                      <MapPin className="w-2.5 h-2.5" />
                      {post.city}
                    </span>
                  )}
                </div>
              </div>
              {/* Report button */}
              <button onClick={(e) => { e.stopPropagation(); onReport(post.id); }} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Signaler ce contenu">
                <Flag className="w-3.5 h-3.5 text-gray-300 hover:text-[#D93025]" />
              </button>
            </div>
            {/* LinkedIn-style engagement bar */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {post.replies} réponses
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {post.views} vues
                </span>
              </div>
              <span className="text-[10px] text-gray-300">Cliquez pour ouvrir →</span>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={onNewPost} className="flex-1 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400 hover:border-[#003087] hover:text-[#003087] transition-colors flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Nouveau sujet
        </button>
        <button onClick={onNewPoll} className="py-3 px-4 border-2 border-dashed border-[#D4AF37]/40 rounded-2xl text-sm text-[#D4AF37] hover:border-[#D4AF37] transition-colors flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Sondage
        </button>
      </div>
    </div>
  );
}
