'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

export interface Testimonial {
  text: string;
  highlight?: string;
  image?: string;
  name: string;
  role: string;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
  speed?: number; // Durée en secondes d'un défilement complet
  direction?: 'left' | 'right'; // Direction de défilement
  cardHeight?: number; // Hauteur des cartes
  className?: string;
}

/**
 * Carrousel de témoignages défilant — portage du design Win-Agro
 * (components/ui/testimonials-carousel.tsx) sur la palette AfriBayit :
 * cartes blanches arrondies 3xl, surlignage des passages clés en
 * navy pâle, marquee gauche/droite pausable, modale d'expansion premium.
 */
export const TestimonialsCarousel: React.FC<TestimonialsCarouselProps> = ({
  testimonials,
  speed = 35,
  direction = 'left',
  cardHeight = 240,
  className,
}) => {
  const loopTestimonials = [...testimonials, ...testimonials, ...testimonials];

  // État du témoignage étendu (modale)
  const [expandedTestimonial, setExpandedTestimonial] = useState<Testimonial | null>(null);

  // Pause tactile mobile (identique Win-Agro)
  const [touchPaused, setTouchPaused] = useState(false);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = () => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    setTouchPaused(true);
  };

  const handleTouchEnd = () => {
    touchTimeoutRef.current = setTimeout(() => {
      setTouchPaused(false);
    }, 2500);
  };

  React.useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    };
  }, []);

  const isPaused = touchPaused || !!expandedTestimonial;

  const truncateText = (text: string, limit: number = 140) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };

  const renderTextWithHighlight = (fullText: string, highlightText?: string, isTruncated: boolean = false) => {
    const textToProcess = isTruncated ? truncateText(fullText) : fullText;

    if (!highlightText || !textToProcess.includes(highlightText)) {
      return textToProcess;
    }

    return textToProcess.split(highlightText).map((part, idx, arr) => (
      <React.Fragment key={idx}>
        {part}
        {idx !== arr.length - 1 && (
          <span className="text-primary-deep font-bold bg-primary-pale/50 px-1.5 py-0.5 rounded-md border border-primary-green/15 shadow-sm not-italic">
            {highlightText}
          </span>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className={`overflow-hidden w-full ${className}`}>
      <div
        className={`flex gap-6 w-max ${
          direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'
        } hover:[animation-play-state:paused] pointer-events-auto`}
        style={{ ...(isPaused ? { animationPlayState: 'paused' as const } : {}), animationDuration: `${speed}s` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {loopTestimonials.map((t, index) => {
          const { text, highlight, image, name, role } = t;
          const isLong = text.length > 140;

          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.03, y: -4, borderColor: 'rgba(0, 156, 222, 0.3)' }}
              className="bg-white border border-primary-pale/60 shadow-md rounded-3xl p-6 flex flex-col justify-between flex-shrink-0 w-[340px] transition-colors duration-200 cursor-default card-shimmer relative"
              style={{ height: cardHeight }}
            >
              <div className="flex-1 flex flex-col justify-start">
                <p className="text-[13.5px] leading-relaxed text-gray-text font-sans break-words whitespace-normal overflow-hidden italic">
                  {renderTextWithHighlight(text, highlight, true)}
                </p>
                {isLong && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedTestimonial(t);
                    }}
                    className="text-[11px] text-primary-green font-sans font-bold hover:text-primary-deep transition-colors text-left mt-1.5 cursor-pointer underline flex items-center gap-0.5"
                  >
                    Lire la suite ➔
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-primary-pale/40">
                {image ? (
                  <img
                    src={image}
                    alt={name}
                    className="h-11 w-11 rounded-full object-cover border border-primary-green/20"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-11 w-11 rounded-full bg-primary-pale flex items-center justify-center border border-primary-green/20 text-primary-deep font-serif font-black text-sm select-none shadow-sm shrink-0">
                    {name ? name.charAt(0).toUpperCase() : '?'}
                  </div>
                )}
                <div className="flex flex-col">
                  <div className="font-serif font-bold text-primary-deep text-sm leading-tight">{name}</div>
                  <div className="text-primary-green/80 font-sans font-semibold text-xs mt-0.5">{role}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modale de témoignage étendu — design premium Win-Agro */}
      {expandedTestimonial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-noir-vert/85 backdrop-blur-md transition-all duration-300">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-xl bg-white border border-primary-pale rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 relative"
          >
            {/* Bouton de fermeture */}
            <button
              onClick={() => setExpandedTestimonial(null)}
              aria-label="Fermer le témoignage"
              className="absolute top-4 right-4 p-2 rounded-full bg-primary-pale/50 hover:bg-primary-pale text-primary-deep hover:scale-105 transition-all cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Citation */}
            <div className="flex-1 overflow-y-auto max-h-[50vh] pr-2 mt-4">
              <p className="text-base sm:text-lg leading-relaxed text-primary-deep font-serif italic font-medium whitespace-pre-line">
                &quot;{renderTextWithHighlight(expandedTestimonial.text, expandedTestimonial.highlight, false)}&quot;
              </p>
            </div>

            {/* Pied de profil */}
            <div className="flex items-center gap-3 pt-4 border-t border-primary-pale/40">
              {expandedTestimonial.image ? (
                <img
                  src={expandedTestimonial.image}
                  alt={expandedTestimonial.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-primary-green/20"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-primary-pale flex items-center justify-center border-2 border-primary-green/20 text-primary-deep font-serif font-black text-base select-none shadow-md shrink-0">
                  {expandedTestimonial.name ? expandedTestimonial.name.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              <div className="flex flex-col">
                <div className="font-serif font-black text-primary-deep text-base leading-tight">
                  {expandedTestimonial.name}
                </div>
                <div className="text-primary-green font-sans font-bold text-xs mt-0.5">{expandedTestimonial.role}</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default TestimonialsCarousel;
