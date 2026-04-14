'use client'

import Link from 'next/link'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  ArrowUp
} from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

export function Footer() {
  const { t } = useLanguage()
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const footerLinks = {
    quick: [
      { href: '/properties', label: t('nav.properties') },
      { href: '/hotels', label: t('nav.hotels') },
      { href: '/learning', label: t('nav.learning') },
      { href: '/community', label: t('nav.community') },
      { href: '/about', label: t('nav.about') },
      { href: '/contact', label: t('nav.contact') },
    ],
    services: [
      { href: '/services/property-search', label: 'Recherche de propriétés' },
      { href: '/services/virtual-tours', label: 'Visites virtuelles' },
      { href: '/services/investment-advice', label: 'Conseils d\'investissement' },
      { href: '/services/legal-support', label: 'Support juridique' },
      { href: '/services/valuation', label: 'Évaluation immobilière' },
      { href: '/services/marketing', label: 'Marketing immobilier' },
    ],
    support: [
      { href: '/help', label: 'Centre d\'aide' },
      { href: '/faq', label: 'FAQ' },
      { href: '/contact', label: 'Nous contacter' },
      { href: '/status', label: 'Statut du service' },
      { href: '/feedback', label: 'Retours' },
      { href: '/bug-report', label: 'Signaler un bug' },
    ],
    legal: [
      { href: '/privacy', label: 'Politique de confidentialité' },
      { href: '/terms', label: 'Conditions d\'utilisation' },
      { href: '/cookies', label: 'Politique des cookies' },
      { href: '/gdpr', label: 'RGPD' },
      { href: '/disclaimer', label: 'Avertissement' },
      { href: '/accessibility', label: 'Accessibilité' },
    ],
  }

  const socialLinks = [
    { href: 'https://facebook.com/afribayit', icon: Facebook, label: 'Facebook' },
    { href: 'https://twitter.com/afribayit', icon: Twitter, label: 'Twitter' },
    { href: 'https://instagram.com/afribayit', icon: Instagram, label: 'Instagram' },
    { href: 'https://linkedin.com/company/afribayit', icon: Linkedin, label: 'LinkedIn' },
    { href: 'https://youtube.com/@afribayit', icon: Youtube, label: 'YouTube' },
  ]

  return (
    <footer className="bg-neutral-900 dark:bg-neutral-950 text-white">
      {/* Scroll to Top Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: showScrollTop ? 1 : 0,
          scale: showScrollTop ? 1 : 0
        }}
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      >
        <ArrowUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform duration-200" />
      </motion.button>

      <div className="container-custom">
        {/* Main Footer Content */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-6 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">AfriBayit</span>
            </Link>

            <p className="text-neutral-300 mb-6 leading-relaxed">
              {t('footer.description')}
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-neutral-300">
                <Mail className="w-5 h-5 text-primary-400" />
                <span>contact@afribayit.com</span>
              </div>
              <div className="flex items-center space-x-3 text-neutral-300">
                <Phone className="w-5 h-5 text-primary-400" />
                <span>+225 20 30 40 50</span>
              </div>
              <div className="flex items-center space-x-3 text-neutral-300">
                <MapPin className="w-5 h-5 text-primary-400" />
                <span>Abidjan, Côte d'Ivoire</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">
              {t('footer.quick.links')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.quick.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-neutral-300 hover:text-primary-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">
              {t('footer.services')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-neutral-300 hover:text-primary-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">
              {t('footer.support')}
            </h3>
            <ul className="space-y-3 mb-8">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-neutral-300 hover:text-primary-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-lg font-semibold mb-6 text-white">
              {t('footer.legal')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-neutral-300 hover:text-primary-400 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="py-8 border-t border-neutral-800">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4 text-white">
              {t('newsletter.title')}
            </h3>
            <p className="text-neutral-300 mb-6">
              {t('newsletter.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder={t('newsletter.placeholder')}
                className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button className="btn btn-primary whitespace-nowrap">
                {t('newsletter.button')}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="py-8 border-t border-neutral-800">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Copyright */}
            <p className="text-neutral-400 text-sm">
              {t('footer.copyright')}
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="text-neutral-400 text-sm mr-2">
                {t('footer.social')}:
              </span>
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-neutral-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors duration-200 group"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5 text-neutral-400 group-hover:text-white" />
                </a>
              ))}
            </div>

            {/* Language & Currency */}
            <div className="flex items-center space-x-4 text-sm text-neutral-400">
              <span>Français</span>
              <span>•</span>
              <span>XOF</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
