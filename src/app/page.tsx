'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAfriBayitNav } from '@/hooks/useAfriBayitNav';
import HeroSection from '@/components/afribayit/HeroSection';
import TrustSection from '@/components/afribayit/TrustSection';
import HowItWorks from '@/components/afribayit/HowItWorks';
import PaysCouverts from '@/components/afribayit/PaysCouverts';
import FeaturedProperties from '@/components/afribayit/FeaturedProperties';
import ModulesSection from '@/components/afribayit/ModulesSection';
import TestimonialsSection from '@/components/afribayit/TestimonialsSection';
import CTABanner from '@/components/afribayit/CTABanner';

export default function HomePage() {
  const { onNavigate, onSelectProperty } = useAfriBayitNav();
  const [isRebeccaOpen, setIsRebeccaOpen] = useState(false);

  const handleOpenRebecca = useCallback(() => {
    setIsRebeccaOpen(true);
  }, []);

  return (
    <div className="min-h-screen">
      <HeroSection onNavigate={onNavigate} onOpenRebecca={handleOpenRebecca} />
      <TrustSection />
      <HowItWorks />
      <PaysCouverts />
      <FeaturedProperties onSelectProperty={onSelectProperty} onNavigate={onNavigate} />
      <ModulesSection />
      <TestimonialsSection />
      <CTABanner onNavigate={onNavigate} />
    </div>
  );
}
