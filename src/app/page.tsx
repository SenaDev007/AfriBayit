'use client';

import HeroSection from '@/components/afribayit/HeroSection';
import TrustSection from '@/components/afribayit/TrustSection';
import HowItWorks from '@/components/afribayit/HowItWorks';
import PaysCouverts from '@/components/afribayit/PaysCouverts';
import FeaturedProperties from '@/components/afribayit/FeaturedProperties';
import ModulesSection from '@/components/afribayit/ModulesSection';
import TestimonialsSection from '@/components/afribayit/TestimonialsSection';
import CTABanner from '@/components/afribayit/CTABanner';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import { useState } from 'react';
import RebeccaChat from '@/components/afribayit/RebeccaChat';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { onNavigate, onSelectProperty } = useAfriBayitNav();
  const [isRebeccaOpen, setIsRebeccaOpen] = useState(false);

  return (
    <>
      <HeroSection
        onNavigate={onNavigate}
        onOpenRebecca={() => setIsRebeccaOpen(true)}
      />
      <TrustSection />
      <HowItWorks />
      <PaysCouverts />
      <FeaturedProperties
        onSelectProperty={onSelectProperty}
        onNavigate={onNavigate}
      />
      <ModulesSection />
      <TestimonialsSection />
      <CTABanner onNavigate={onNavigate} />

      {/* Rebecca Chat Widget */}
      <RebeccaChat isOpen={isRebeccaOpen} onClose={() => setIsRebeccaOpen(false)} />

      {/* Rebecca FAB Button */}
      {!isRebeccaOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsRebeccaOpen(true)}
          className="fixed bottom-24 sm:bottom-8 right-4 sm:right-6 z-40 w-14 h-14 bg-[#003087] rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] rounded-full flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">IA</span>
          </span>
        </motion.button>
      )}
    </>
  );
}
