'use client'

import { useState, useEffect } from 'react'
import { HeroSection } from '@/components/sections/HeroSection'
import { FeaturedProperties } from '@/components/sections/FeaturedProperties'
import { ServicesSection } from '@/components/sections/ServicesSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { StatsSection } from '@/components/sections/StatsSection'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 350)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <section id="cdc-section-1-hero">
        <HeroSection />
      </section>

      <section id="cdc-section-2-kpis">
        <StatsSection />
      </section>

      <section id="cdc-section-3-properties">
        <FeaturedProperties />
      </section>

      <section id="cdc-section-4-modules">
        <ServicesSection />
      </section>

      <section id="cdc-section-5-social-proof">
        <TestimonialsSection />
      </section>
    </div>
  )
}
