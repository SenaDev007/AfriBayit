'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  CheckCircle
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Button } from '@/components/ui/Button'

// Real testimonials will be fetched from API

export function TestimonialsSection() {
  const { t } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [testimonials, setTestimonials] = useState<any[]>([])
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  // Fetch testimonials and stats from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testimonialsRes, statsRes] = await Promise.all([
          fetch('/api/testimonials'),
          fetch('/api/stats')
        ])

        if (testimonialsRes.ok) {
          const testimonialsData = await testimonialsRes.json()
          setTestimonials(testimonialsData.testimonials || [])
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData.stats || [])
        }
      } catch (error) {
        // Handle error silently
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const nextTestimonial = () => {
    if (testimonials.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }
  }

  const prevTestimonial = () => {
    if (testimonials.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    }
  }

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-primary-50 to-accent-50 dark:from-neutral-800 dark:to-neutral-900">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
              {t('testimonials.title')}
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {t('testimonials.subtitle')}
            </p>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
        >
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center animate-pulse">
                <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mx-auto"></div>
              </div>
            ))
          ) : (
            stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-neutral-600 dark:text-neutral-300 font-medium">
                  {stat.label}
                </div>
              </div>
            ))
          )}
        </motion.div>

        {/* Testimonials Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8 md:p-12">
              {/* Quote Icon */}
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                  <Quote className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
              </div>

              {/* Testimonial Content */}
              <div className="text-center mb-8">
                {loading ? (
                  <div className="animate-pulse">
                    <div className="flex justify-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-6 h-6 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                      ))}
                    </div>
                    <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded mb-4"></div>
                    <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mx-auto"></div>
                  </div>
                ) : testimonials.length > 0 ? (
                  <>
                    <div className="flex justify-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${i < testimonials[currentIndex].rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-neutral-300'
                            }`}
                        />
                      ))}
                    </div>

                    <blockquote className="text-xl md:text-2xl text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
                      "{testimonials[currentIndex].text}"
                    </blockquote>
                  </>
                ) : (
                  <div className="text-neutral-500 dark:text-neutral-400">
                    Aucun témoignage disponible pour le moment.
                  </div>
                )}
              </div>

              {/* Author Info */}
              {!loading && testimonials.length > 0 && (
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <div className="relative">
                      <img
                        src={testimonials[currentIndex].avatar}
                        alt={testimonials[currentIndex].name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      {testimonials[currentIndex].verified && (
                        <CheckCircle className="absolute -bottom-1 -right-1 w-6 h-6 text-green-500 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {testimonials[currentIndex].name}
                      </div>
                      <div className="text-neutral-600 dark:text-neutral-300">
                        {testimonials[currentIndex].role}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-neutral-400">
                        {testimonials[currentIndex].location}
                      </div>
                    </div>
                  </div>

                  <div className="text-center md:text-right">
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                      Investissement
                    </div>
                    <div className="font-semibold text-primary-600 dark:text-primary-400">
                      {testimonials[currentIndex].investment}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          {!loading && testimonials.length > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-full shadow-lg flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
              >
                <ChevronLeft className="w-6 h-6 text-neutral-600 dark:text-neutral-300" />
              </button>

              {/* Dots */}
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors duration-200 ${index === currentIndex
                      ? 'bg-primary-600'
                      : 'bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500'
                      }`}
                  />
                ))}
              </div>

              <button
                onClick={nextTestimonial}
                className="w-12 h-12 bg-white dark:bg-neutral-800 rounded-full shadow-lg flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
              >
                <ChevronRight className="w-6 h-6 text-neutral-600 dark:text-neutral-300" />
              </button>
            </div>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-16"
        >
          <Button size="lg" className="shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
            Rejoindre la communauté
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
