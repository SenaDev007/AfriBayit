'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ThumbsUp, MessageSquare, Eye, Flag, MapPin, Calendar,
  Send, AlertTriangle, Bot, Loader2, User as UserIcon, Clock, Tag,
} from 'lucide-react';
import { useCommunityPost, useCommunityPostReplies, useCreateReply, useLikePost, useReportContent } from '@/hooks/useCommunity';
import { useAuthStore } from '@/stores/authStore';
import { timeAgo, formatDate } from '@/lib/afribayit-utils';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';

const easeOut = [0.16, 1, 0.3, 1] as const;

const CATEGORY_LABELS: Record<string, string> = {
  discussion: 'Discussion',
  question: 'Question',
  success_story: 'Témoignage de succès',
  market_analysis: 'Analyse de marché',
  legal: 'Juridique',
  event: 'Événement',
  investment: 'Investissement',
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { user } = useAuthStore();

  const { data: postData, isLoading: postLoading, error: postError } = useCommunityPost(postId);
  const { data: repliesData, isLoading: repliesLoading } = useCommunityPostReplies(postId);
  const createReply = useCreateReply(postId);
  const likePost = useLikePost(postId);
  const reportContent = useReportContent();

  const [replyContent, setReplyContent] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);

  // Parse post data
  const post = postData?.data as Record<string, unknown> | undefined;
  const author = post?.author as Record<string, unknown> | undefined;
  const repliesRel = post?.replies_rel as Record<string, unknown>[] | undefined;

  // Use replies from the post detail (included) or from the separate endpoint
  const repliesList = repliesRel || (repliesData?.data as Record<string, unknown>[]) || [];

  const handleReply = () => {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour répondre.' });
      return;
    }
    if (!replyContent.trim()) return;
    createReply.mutate({ content: replyContent.trim() }, {
      onSuccess: () => {
        setReplyContent('');
        toast({ title: 'Réponse publiée', description: 'Votre réponse a été ajoutée.' });
      },
      onError: (err: Error) => {
        toast({ title: 'Erreur', description: err.message || 'Impossible de publier la réponse.', variant: 'destructive' });
      },
    });
  };

  const handleLike = () => {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour aimer.' });
      return;
    }
    const newLiked = !liked;
    setLiked(newLiked);
    likePost.mutate(newLiked, {
      onError: () => {
        setLiked(!newLiked);
        toast({ title: 'Erreur', description: 'Impossible de modifier votre like.', variant: 'destructive' });
      },
    });
  };

  const handleReport = () => {
    if (!user) {
      toast({ title: 'Connexion requise', description: 'Veuillez vous connecter pour signaler.' });
      return;
    }
    if (!reportReason.trim()) {
      toast({ title: 'Raison requise', description: 'Veuillez indiquer la raison du signalement.' });
      return;
    }
    setReportSubmitting(true);
    const contentToReport = String(post?.content || post?.title || '');
    reportContent.mutate(
      { content: contentToReport, contentId: postId, type: 'post', reason: reportReason.trim() },
      {
        onSuccess: () => {
          toast({ title: 'Signalement envoyé', description: 'Notre équipe de modération examinera ce contenu sous 24h.' });
          setShowReportDialog(false);
          setReportReason('');
          setReportSubmitting(false);
        },
        onError: () => {
          toast({ title: 'Erreur', description: 'Impossible d\'envoyer le signalement.', variant: 'destructive' });
          setReportSubmitting(false);
        },
      }
    );
  };

  const parseTags = (tags: unknown): string[] => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags.map(String);
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }
    return [];
  };

  if (postLoading) {
    return (
      <div className="min-h-screen pt-20 pb-24 bg-gray-50/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4">
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
              <div className="h-4 w-2/3 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className="min-h-screen pt-20 pb-24 bg-gray-50/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-600 mb-2">Sujet introuvable</h2>
          <p className="text-sm text-gray-400 mb-6">{postError?.message || 'Ce sujet n\'existe pas ou a été supprimé.'}</p>
          <button onClick={() => router.push('/community')} className="px-6 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#0047b3] transition-colors">Retour au forum</button>
        </div>
      </div>
    );
  }

  const tags = parseTags(post.tags);

  return (
    <div className="min-h-screen pt-20 pb-24 bg-gray-50/30">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <button onClick={() => router.push('/community')} className="inline-flex items-center gap-2 text-sm text-[#003087] font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" /> Retour au forum
          </button>
        </motion.div>

        {/* Post Content */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: easeOut }} className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          {/* Author header */}
          <div className="flex items-start gap-3 mb-5">
            <ImageWithFallback
              src={String(author?.avatar || '')}
              alt={String(author?.name || 'Auteur')}
              className="w-12 h-12 rounded-lg shrink-0"
              fallbackType="avatar"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#0a2a5e]">{String(author?.name || 'Anonyme')}</p>
              <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap mt-0.5">
                {Boolean(post.category) && (
                  <span className="px-2 py-0.5 bg-[#003087]/10 text-[#003087] rounded-full font-medium">
                    {CATEGORY_LABELS[String(post.category)] || String(post.category)}
                  </span>
                )}
                {Boolean(post.city) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{String(post.city)}</span>}
                {Boolean(post.country) && <span>{String(post.country)}</span>}
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(String(post.createdAt || ''))}</span>
              </div>
            </div>
            <button
              onClick={() => setShowReportDialog(true)}
              className="shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Signaler ce contenu"
            >
              <Flag className="w-4 h-4 text-gray-300 hover:text-[#D93025]" />
            </button>
          </div>

          {/* Title */}
          <h1 className="font-display text-xl sm:text-2xl font-bold text-[#0a2a5e] mb-4">{String(post.title || '')}</h1>

          {/* Content */}
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-5">{String(post.content || '')}</div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-5">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              {tags.map(tag => (
                <span key={tag} className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">#{tag}</span>
              ))}
            </div>
          )}

          {/* Stats bar */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${liked ? 'bg-[#003087]/10 text-[#003087]' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-[#003087]' : ''}`} />
              {Number(post.likes || 0) + (liked ? 1 : 0)} J&apos;aime
            </button>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-500">
              <MessageSquare className="w-4 h-4" />
              {Number(post.replies || 0)} réponses
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-500">
              <Eye className="w-4 h-4" />
              {Number(post.views || 0)} vues
            </span>
          </div>

          {/* NLP moderation notice */}
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-[#009CDE]/5 rounded-xl">
            <Bot className="w-3.5 h-3.5 text-[#009CDE] shrink-0" />
            <span className="text-[10px] text-[#009CDE] font-medium">Modéré par Rebecca IA — Contenu vérifié</span>
          </div>
        </motion.div>

        {/* Reply Input */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4, ease: easeOut }} className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold text-sm text-[#0a2a5e] mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#003087]" /> Répondre
          </h3>
          <div className="flex gap-3">
            <textarea
              rows={3}
              value={replyContent}
              onChange={e => setReplyContent(e.target.value)}
              placeholder={user ? 'Écrivez votre réponse...' : 'Connectez-vous pour répondre...'}
              disabled={!user}
              className="flex-1 px-4 py-3 rounded-2xl border text-sm outline-none resize-none focus:border-[#003087] transition-colors disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={handleReply}
              disabled={!user || !replyContent.trim() || createReply.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003087] text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-[#0047b3] transition-colors"
            >
              {createReply.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Répondre
            </button>
          </div>
        </motion.div>

        {/* Replies */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-[#0a2a5e] flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#003087]" />
            {repliesList.length} réponse{repliesList.length !== 1 ? 's' : ''}
          </h3>

          {repliesLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-200 shrink-0" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!repliesLoading && repliesList.length === 0 && (
            <div className="text-center py-8 bg-white rounded-2xl shadow-sm border">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucune réponse pour le moment</p>
              <p className="text-xs text-gray-400">Soyez le premier à répondre !</p>
            </div>
          )}

          {!repliesLoading && repliesList.map((reply, i) => {
            const replyAuthor = reply.author as Record<string, unknown> | undefined;
            return (
              <motion.div
                key={String(reply.id || i)}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, ease: easeOut }}
                className="bg-white rounded-2xl p-5 shadow-sm border"
              >
                <div className="flex items-start gap-3">
                  <ImageWithFallback
                    src={String(replyAuthor?.avatar || '')}
                    alt={String(replyAuthor?.name || 'Auteur')}
                    className="w-9 h-9 rounded-lg shrink-0"
                    fallbackType="avatar"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-[#003087]">{String(replyAuthor?.name || 'Anonyme')}</span>
                      <span className="text-xs text-gray-400">{timeAgo(String(reply.createdAt || ''))}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{String(reply.content || '')}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Report Dialog */}
        {showReportDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowReportDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-display text-lg font-bold text-[#0a2a5e] mb-1 flex items-center gap-2">
                <Flag className="w-5 h-5 text-[#D93025]" /> Signaler ce contenu
              </h3>
              <p className="text-xs text-gray-500 mb-4">Notre équipe de modération examinera votre signalement sous 24h.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1.5 block">Raison du signalement</label>
                  <select
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border text-sm outline-none focus:border-[#003087] transition-colors"
                  >
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
                  <button onClick={() => { setShowReportDialog(false); setReportReason(''); }} className="flex-1 py-3 border rounded-lg text-sm font-semibold text-gray-600">Annuler</button>
                  <button
                    onClick={handleReport}
                    disabled={reportSubmitting || !reportReason}
                    className="flex-1 py-3 bg-[#D93025] text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                  >
                    {reportSubmitting ? 'Envoi...' : 'Signaler'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
