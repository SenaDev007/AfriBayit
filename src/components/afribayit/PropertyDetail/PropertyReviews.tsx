'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Star, ThumbsUp } from 'lucide-react';
import { easeOut, type ReviewData } from './types';

interface PropertyReviewsProps {
  reviews: ReviewData[];
  avgRating: string | null;
  isAuthenticated: boolean;
  showReviewForm: boolean;
  setShowReviewForm: (v: boolean) => void;
  reviewRating: number;
  setReviewRating: (n: number) => void;
  reviewComment: string;
  setReviewComment: (s: string) => void;
  reviewSubmitting: boolean;
  onSubmitReview: () => void;
}

export default function PropertyReviews({
  reviews,
  avgRating,
  isAuthenticated,
  showReviewForm,
  setShowReviewForm,
  reviewRating,
  setReviewRating,
  reviewComment,
  setReviewComment,
  reviewSubmitting,
  onSubmitReview,
}: PropertyReviewsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: easeOut }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-[#2C2E2F] flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-[#003087]" />
          Avis ({reviews.length})
        </h2>
        {isAuthenticated && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="text-sm font-semibold text-[#003087] hover:underline flex items-center gap-1"
          >
            <Star className="w-4 h-4" />
            {showReviewForm ? 'Annuler' : 'Donner un avis'}
          </button>
        )}
      </div>

      {/* Rating Summary */}
      {avgRating && (
        <div className="flex items-center gap-3 p-4 bg-[#D4AF37]/5 rounded-2xl mb-4">
          <div className="text-3xl font-bold text-[#D4AF37]">{avgRating}</div>
          <div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(Number(avgRating))
                      ? 'text-[#D4AF37] fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">{reviews.length} avis vérifiés</p>
          </div>
        </div>
      )}

      {/* Review Form */}
      <AnimatePresence>
        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="p-4 bg-gray-50 rounded-2xl border">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-gray-700">Votre note :</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= reviewRating
                            ? 'text-[#D4AF37] fill-current'
                            : 'text-gray-300 hover:text-[#D4AF37]/50'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Partagez votre expérience avec ce bien..."
                className="w-full p-3 border rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] outline-none"
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={onSubmitReview}
                  disabled={reviewSubmitting || !reviewComment.trim()}
                  className="px-5 py-2 bg-[#003087] text-white text-sm font-semibold rounded-full hover:bg-[#0047b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {reviewSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ThumbsUp className="w-4 h-4" />
                  )}
                  Publier l&apos;avis
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 bg-white rounded-2xl border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-[#003087]/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#003087]">
                    {review.reviewer.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#2C2E2F]">{review.reviewer.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= review.rating
                              ? 'text-[#D4AF37] fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {review.verified && (
                      <span className="text-[9px] text-[#00A651] font-medium">Vérifié</span>
                    )}
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-600 ml-12">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-2xl">
          <MessageCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Aucun avis pour le moment</p>
          {isAuthenticated && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="mt-2 text-sm font-semibold text-[#003087] hover:underline"
            >
              Soyez le premier à donner votre avis
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
