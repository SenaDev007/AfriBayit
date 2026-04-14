'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { HeroSection } from '@/components/sections/HeroSection'
import { SearchSection } from '@/components/sections/SearchSection'
import { FeaturedProperties } from '@/components/sections/FeaturedProperties'
import { ServicesSection } from '@/components/sections/ServicesSection'
import { TestimonialsSection } from '@/components/sections/TestimonialsSection'
import { StatsSection } from '@/components/sections/StatsSection'
import { NewsletterSection } from '@/components/sections/NewsletterSection'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

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
      {/* Hero Section */}
      <HeroSection />
      
      {/* Search Section */}
      <SearchSection />
      
      {/* Stats Section */}
      <StatsSection />
      
      {/* Featured Properties */}
      <FeaturedProperties />
      
      {/* Services Section */}
      <ServicesSection />
      
      {/* Testimonials */}
      <TestimonialsSection />
      
      {/* Newsletter */}
      <NewsletterSection />
    </div>
  )
}
