'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/constants';
import { Quote, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/use-translate';

const easeOut = [0.16, 1, 0.3, 1] as const;

interface ReviewData {
  id: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    avatar: string | null;
    reputation: string;
  };
}

interface ReviewsResponse {
  reviews: ReviewData[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${star <= rating ? 'text-[#FFCC00] fill-[#FFCC00]' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

const fallbackTestimonials = [
  {
    id: 'fb1',
    name: 'Kofi Mensah',
    avatar: null,
    rating: 5,
    comment: "AfriBayit m'a permis d'acheter ma villa à Cotonou en toute sécurité. L'escrow et la vérification GeoTrust m'ont rassuré à chaque étape.",
    reputation: 'Expert',
    location: 'Cotonou, Bénin',
  },
  {
    id: 'fb2',
    name: 'Aminata Diallo',
    avatar: null,
    rating: 5,
    comment: "Grâce à Rebecca IA, j'ai trouvé le terrain idéal à Abidjan en moins d'une semaine. Service exceptionnel !",
    reputation: 'Acteur',
    location: 'Abidjan, Côte d\'Ivoire',
  },
  {
    id: 'fb3',
    name: 'Yao Akossi',
    avatar: null,
    rating: 4,
    comment: "La plateforme est intuitive et les agents certifiés sont très professionnels. Je recommande pour tout investissement immobilier en Afrique.",
    reputation: 'Ambassadeur',
    location: 'Abidjan, Côte d\'Ivoire',
  },
];

export default function TestimonialsSection() {
  const { selectedCountry } = useCountry();
  const { t } = useTranslation();

  const { data: reviewsData } = useQuery<ReviewsResponse>({
    queryKey: ['reviews-landing', selectedCountry],
    queryFn: () => apiFetch<ReviewsResponse>(`/api/reviews?limit=6&rating=4&country=${selectedCountry}`),
    staleTime: 5 * 60 * 1000,
  });

  const reviews = reviewsData?.reviews?.length
    ? reviewsData.reviews.slice(0, 6)
    : [];

  const displayItems = reviews.length > 0
    ? reviews.map((r) => ({
        id: r.id,
        name: r.reviewer?.name || 'Utilisateur',
        avatar: r.reviewer?.avatar,
        rating: r.rating,
        comment: r.comment || '',
        reputation: r.reviewer?.reputation || '',
        location: '',
      }))
    : fallbackTestimonials;

  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#003366]">
            <span className="h-px w-8 bg-[#003366]" />
            {t('testimonials.badge', 'Témoignages')}
            <span className="h-px w-8 bg-[#003366]" />
          </span>
          <h2 className="mt-6 font-[family-name:var(--font-inter),Georgia,serif] text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
            {t('testimonials.title', "Ce qu'ils")} {t('testimonials.titleAccent', 'disent')}
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-[family-name:var(--font-inter),system-ui,sans-serif] text-lg text-gray-500">
            {t('testimonials.subtitle', "Des milliers d'utilisateurs font confiance à AfriBayit pour leurs projets immobiliers.")}
          </p>
        </motion.div>

        {/* Country filter badge */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <span className="font-[family-name:var(--font-inter),system-ui,sans-serif] text-xs font-medium uppercase tracking-wider text-gray-400">
            {t('testimonials.country', 'Pays')}:
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#003366]/20 bg-[#003366]/5 px-3 py-1.5 font-[family-name:var(--font-inter),system-ui,sans-serif] text-xs font-semibold text-[#003366]">
            <span className="h-1.5 w-1.5 rounded-lg bg-[#FFCC00]" />
            {COUNTRY_NAMES[selectedCountry] || selectedCountry}
          </span>
        </div>

        {/* Testimonials Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {displayItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
              className="group relative rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#003366]/20 hover:shadow-lg hover:shadow-gray-200/50"
            >
              {/* Quote icon */}
              <Quote className="absolute right-5 top-5 h-12 w-12 text-gray-100 transition-colors group-hover:text-[#FFCC00]/20" fill="currentColor" />

              {/* Stars */}
              <StarRating rating={item.rating} />

              {/* Comment */}
              <p className="relative mt-4 font-[family-name:var(--font-inter),system-ui,sans-serif] text-base leading-relaxed text-gray-700 line-clamp-4">
                &ldquo;{item.comment}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#003366] font-[family-name:var(--font-inter),system-ui,sans-serif] text-sm font-bold text-white">
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-[family-name:var(--font-inter),system-ui,sans-serif] text-sm font-bold text-gray-900">{item.name}</p>
                  {item.reputation && (
                    <p className="font-[family-name:var(--font-inter),system-ui,sans-serif] text-xs font-semibold uppercase tracking-wider text-[#8B6914]">
                      {item.reputation}
                    </p>
                  )}
                </div>
                {/* Verified */}
                <div className="flex items-center gap-1 rounded-lg bg-[#3399FF]/10 px-2 py-1">
                  <svg className="h-3 w-3 text-[#3399FF]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-[family-name:var(--font-inter),system-ui,sans-serif] text-[10px] font-bold uppercase text-[#3399FF]">
                    {t('testimonials.verified', 'Vérifié')}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
