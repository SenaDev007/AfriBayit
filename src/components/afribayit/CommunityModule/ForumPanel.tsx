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
          className="bg-white rounded-2xl p-5 shadow-sm border hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-3">
            <ImageWithFallback
              src={post.avatar}
              alt=""
              className="w-10 h-10 rounded-full shrink-0 cursor-pointer"
              fallbackType="avatar"
              onClick={() => onSelectPost(post.id)}
            />
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectPost(post.id)}>
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
            <button onClick={(e) => { e.stopPropagation(); onReport(post.id); }} className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors" title="Signaler ce contenu">
              <Flag className="w-4 h-4 text-gray-300 hover:text-[#D93025]" />
            </button>
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
