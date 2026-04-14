'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { Mail, CheckCircle, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { Button } from '@/components/ui/Button'

export function NewsletterSection() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || isLoading) return

    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsSubscribed(true)
    setIsLoading(false)
    setEmail('')
  }

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }} />
          </div>

          <div className="relative z-10">
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-3xl flex items-center justify-center">
                <Mail className="w-10 h-10 text-white" />
              </div>
            </div>

            {/* Content */}
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t('newsletter.title')}
            </h2>
            
            <p className="text-xl text-neutral-300 mb-12 leading-relaxed max-w-2xl mx-auto">
              {t('newsletter.subtitle')}
            </p>

            {/* Success State */}
            {isSubscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 max-w-md mx-auto"
              >
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-400 mb-2">
                  Inscription réussie !
                </h3>
                <p className="text-green-300">
                  Vous recevrez bientôt nos dernières actualités et opportunités immobilières.
                </p>
              </motion.div>
            ) : (
              /* Newsletter Form */
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: 0.2 }}
                onSubmit={handleSubscribe}
                className="max-w-md mx-auto"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('newsletter.placeholder')}
                      required
                      className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent backdrop-blur-sm"
                    />
                  </div>
                  
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!email || isLoading}
                    loading={isLoading}
                    className="whitespace-nowrap shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
                  >
                    {isLoading ? (
                      'Inscription...'
                    ) : (
                      <>
                        {t('newsletter.button')}
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.form>
            )}

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center"
            >
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Actualités exclusives</h3>
                <p className="text-neutral-400 text-sm">
                  Recevez les dernières nouvelles du marché immobilier africain
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-accent-500/20 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-accent-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Opportunités spéciales</h3>
                <p className="text-neutral-400 text-sm">
                  Accès en avant-première aux meilleures offres immobilières
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-secondary-500/20 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-secondary-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Conseils d'experts</h3>
                <p className="text-neutral-400 text-sm">
                  Guides et conseils d'investissement par nos experts
                </p>
              </div>
            </motion.div>

            {/* Privacy Note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-sm text-neutral-400 mt-8"
            >
              Nous respectons votre vie privée. Vous pouvez vous désabonner à tout moment.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
