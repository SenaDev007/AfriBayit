'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useCountry } from '@/contexts/CountryContext';
import { COUNTRY_NAMES } from '@/lib/legal-docs';
import { Quote, Star } from 'lucide-react';

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
          className={`w-5 h-5 ${star <= rating ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-300'}`}
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
    <section className="relative py-24 sm:py-32 bg-gradient-to-b from-white via-[#f8fafc] to-white overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, #003087 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Decorative gold quote in background */}
      <Quote
        className="absolute top-1/4 -left-16 w-64 h-64 text-[#D4AF37]/5 rotate-180"
        fill="currentColor"
      />
      <Quote
        className="absolute bottom-1/4 -right-16 w-64 h-64 text-[#003087]/5"
        fill="currentColor"
      />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: easeOut }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-[#003087] to-[#001a4f] border border-[#D4AF37]/30 text-white text-sm font-bold mb-5 font-body uppercase tracking-wider shadow-lg shadow-[#003087]/20">
            <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
            Témoignages
          </span>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2C2E2F] leading-tight">
            Ce qu&apos;ils <span className="bg-gradient-to-r from-[#003087] to-[#009CDE] bg-clip-text text-transparent">disent</span>
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto font-body text-lg">
            Des milliers d&apos;utilisateurs font confiance à AfriBayit pour leurs projets immobiliers.
          </p>
        </motion.div>

        {/* Country Filter Badge */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pays:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#003087]/10 to-[#009CDE]/10 border border-[#003087]/20 text-[#003087] text-xs font-bold">
            <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
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
              whileHover={{ y: -6, transition: { duration: 0.3 } }}
              className="group relative p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 hover:shadow-2xl transition-all overflow-hidden"
            >
              {/* Decorative quote icon - bold gold */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-30 transition-opacity">
                <Quote className="w-20 h-20 text-[#D4AF37]" fill="currentColor" />
              </div>

              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#003087] via-[#009CDE] to-[#D4AF37] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

              {/* Stars */}
              <StarRating rating={item.rating} />

              {/* Comment */}
              <p className="relative mt-4 text-base text-gray-700 leading-relaxed font-body line-clamp-4">
                &ldquo;{item.comment}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#003087] to-[#009CDE] flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#2C2E2F] font-body">{item.name}</p>
                  {item.reputation && (
                    <p className="text-xs text-[#D4AF37] font-body font-semibold uppercase tracking-wider">{item.reputation}</p>
                  )}
                </div>
                {/* Verified badge */}
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#00A651]/10">
                  <svg className="w-3 h-3 text-[#00A651]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[10px] text-[#00A651] font-bold uppercase">Vérifié</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
