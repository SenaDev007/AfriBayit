'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import HeroSection from '@/components/afribayit/HeroSection';
import FeaturedProperties from '@/components/afribayit/FeaturedProperties';
import HowItWorks from '@/components/afribayit/HowItWorks';
import ModulesSection from '@/components/afribayit/ModulesSection';
import TrustSection from '@/components/afribayit/TrustSection';
import PaysCouverts from '@/components/afribayit/PaysCouverts';
import TestimonialsSection from '@/components/afribayit/TestimonialsSection';
import CTABanner from '@/components/afribayit/CTABanner';

export default function HomePage() {
  const router = useRouter();
  const [rebeccaOpen, setRebeccaOpen] = useState(false);

  const handleNavigate = useCallback((section: string) => {
    switch (section) {
      case 'search':
        router.push('/search');
        break;
      case 'publish':
        router.push('/publish');
        break;
      case 'booking':
        router.push('/booking');
        break;
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'chat':
        // Rebecca is handled by AppShell
        break;
      default:
        router.push(`/${section}`);
    }
  }, [router]);

  const handleSelectProperty = useCallback((id: string) => {
    router.push(`/property/${id}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Search Bar */}
      <HeroSection
        onNavigate={handleNavigate}
        onOpenRebecca={() => setRebeccaOpen(true)}
      />

      {/* Trust & Security Section */}
      <TrustSection />

      {/* Featured Properties */}
      <FeaturedProperties
        onSelectProperty={handleSelectProperty}
        onNavigate={handleNavigate}
      />

      {/* How It Works - 4 Steps */}
      <HowItWorks />

      {/* Modules Ecosystem */}
      <ModulesSection />

      {/* Countries Covered */}
      <PaysCouverts />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* CTA Banner */}
      <CTABanner onNavigate={handleNavigate} />
    </div>
  );
}
