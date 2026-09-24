'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Star, ThumbsUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';
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
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35, ease: easeOut }}
      className="mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-xl font-bold text-primary-deep flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary-green" />
          {t('propertyDetail.reviews.heading', 'Avis')} ({reviews.length})
        </h2>
        {isAuthenticated && (
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="text-sm font-bold text-primary-deep hover:underline flex items-center gap-1"
          >
            <Star className="w-4 h-4" />
            {showReviewForm
              ? t('propertyDetail.reviews.cancel', 'Annuler')
              : t('propertyDetail.reviews.giveReview', 'Donner un avis')}
          </button>
        )}
      </div>

      {/* Rating Summary */}
      {avgRating && (
        <div className="flex items-center gap-3 p-4 bg-accent-yellow/10 border border-accent-yellow/30 rounded-3xl mb-4">
          <div className="font-serif text-3xl font-black text-accent-dark">{avgRating}</div>
          <div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(Number(avgRating))
                      ? 'text-accent-yellow fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-text">{reviews.length} {t('propertyDetail.reviews.verifiedReviews', 'avis vérifiés')}</p>
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
            <div className="p-4 bg-primary-pale/30 rounded-3xl border border-primary-pale">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-bold text-gray-text">{t('propertyDetail.reviews.yourRating', 'Votre note :')}</span>
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
                            ? 'text-accent-yellow fill-current'
                            : 'text-gray-300 hover:text-accent-yellow/50'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={t('propertyDetail.reviews.commentPlaceholder', 'Partagez votre expérience avec ce bien...')}
                className="w-full p-3 border border-primary-pale bg-white rounded-xl text-sm resize-none focus:ring-2 focus:ring-primary-green/30 focus:border-primary-green outline-none transition-all"
                rows={3}
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={onSubmitReview}
                  disabled={reviewSubmitting || !reviewComment.trim()}
                  className="px-5 py-2 bg-primary-green text-white text-sm font-bold rounded-full hover:bg-primary-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {reviewSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ThumbsUp className="w-4 h-4" />
                  )}
                  {t('propertyDetail.reviews.publish', 'Publier l\'avis')}
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
            <div key={review.id} className="p-4 bg-white rounded-3xl border border-primary-pale shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-primary-pale flex items-center justify-center">
                  <span className="text-sm font-bold text-primary-deep">
                    {review.reviewer.name?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-primary-deep">{review.reviewer.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3 h-3 ${
                            star <= review.rating
                              ? 'text-accent-yellow fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {review.verified && (
                      <span className="text-[9px] text-green-600 font-bold">{t('propertyDetail.reviews.verified', 'Vérifié')}</span>
                    )}
                  </div>
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-text ml-12">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-primary-pale/30 rounded-3xl">
          <MessageCircle className="w-10 h-10 text-primary-green/50 mx-auto mb-2" />
          <p className="text-sm text-gray-text">{t('propertyDetail.reviews.emptyTitle', 'Aucun avis pour le moment')}</p>
          {isAuthenticated && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="mt-2 text-sm font-bold text-primary-deep hover:underline"
            >
              {t('propertyDetail.reviews.beFirstCTA', 'Soyez le premier à donner votre avis')}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
