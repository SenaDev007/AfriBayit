'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCommunityPost, useCommunityPostReplies, useCreateReply } from '@/hooks/useCommunity';
import { timeAgo } from '@/lib/afribayit-utils';
import { toast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { Eye, Flag, MessageCircle, MessageSquare, Send, X } from 'lucide-react';

interface PostDetailDialogProps {
  postId: string;
  onClose: () => void;
  user: { id: string } | null;
  onReport: (id: string) => void;
}

export default function PostDetailDialog({ postId, onClose, user, onReport }: PostDetailDialogProps) {
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
