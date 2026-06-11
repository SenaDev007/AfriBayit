'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { Badge } from '@/components/ui/badge';

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
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-[#D4AF37]' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// Fallback testimonials for when DB is empty
const fallbackTestimonials = [
  {
    id: 'fb1',
    name: 'Kofi Mensah',
    avatar: null,
    rating: 5,
    comment: "AfriBayit m'a permis d'acheter ma villa à Cotonou en toute sécurité. L'escrow et la vérification GeoTrust m'ont rassuré à chaque étape.",
    reputation: 'Expert',
  },
  {
    id: 'fb2',
    name: 'Aminata Diallo',
    avatar: null,
    rating: 5,
    comment: "Grâce à Rebecca IA, j'ai trouvé le terrain idéal à Abidjan en moins d'une semaine. Service exceptionnel !",
    reputation: 'Acteur',
  },
  {
    id: 'fb3',
    name: 'Yao Akossi',
    avatar: null,
    rating: 4,
    comment: "La plateforme est intuitive et les agents certifiés sont très professionnels. Je recommande pour tout investissement immobilier en Afrique.",
    reputation: 'Ambassadeur',
  },
];

export default function TestimonialsSection() {
  const { selectedCountry } = useCountry();

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
      }))
    : fallbackTestimonials;

  return (
    <section className="py-16 md:py-24 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="text-center mb-12 md:mb-16"
        >
          <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 text-xs font-semibold uppercase tracking-wider mb-3">
            Témoignages
          </Badge>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
            Ce qu&apos;ils <span className="text-[#003087]">disent</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-base">
            Des milliers d&apos;utilisateurs font confiance à AfriBayit pour leurs projets immobiliers.
          </p>
        </motion.div>

        {/* Country Filter Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-medium">Pays:</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#003087]/10 text-[#003087] text-xs font-semibold">
            {COUNTRY_NAMES[selectedCountry] || selectedCountry}
          </span>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: easeOut }}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
              className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-lg hover:border-[#003087]/10 transition-all duration-300 cursor-pointer"
            >
              {/* Stars */}
              <StarRating rating={item.rating} />

              {/* Comment */}
              <p className="mt-4 text-sm text-gray-600 leading-relaxed font-body line-clamp-4">
                &ldquo;{item.comment}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-5 flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#003087] to-[#009CDE] flex items-center justify-center text-white font-bold text-sm">
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2C2E2F] font-body">{item.name}</p>
                  {item.reputation && (
                    <p className="text-xs text-gray-400 font-body">{item.reputation}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
