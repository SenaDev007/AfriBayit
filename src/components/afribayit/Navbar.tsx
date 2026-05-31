'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COUNTRIES_CONFIG } from '@/lib/afribayit-utils';
import { useCountry, type CountryCode } from '@/contexts/CountryContext';

interface NavbarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenNotifications: () => void;
  notificationCount: number;
  isLoggedIn: boolean;
}

// Config constants (not from DB)
const NAV_LINKS = [
  { key: 'acheter', label: 'Acheter', section: 'search' },
  { key: 'louer', label: 'Louer', section: 'search-rent' },
  { key: 'investir', label: 'Investir', section: 'search-invest' },
  { key: 'artisans', label: 'Artisans', section: 'artisans' },
  { key: 'academie', label: 'Académie', section: 'academy' },
] as const;

const MOBILE_NAV_ITEMS = [
  { key: 'home', label: 'Accueil', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { key: 'search', label: 'Rechercher', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { key: 'artisans', label: 'Artisans', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'academy', label: 'Académie', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { key: 'dashboard', label: 'Profil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
] as const;

export default function Navbar({
  activeSection,
  onNavigate,
  onOpenAuth,
  onOpenNotifications,
  notificationCount,
  isLoggedIn,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedCountry, setSelectedCountry } = useCountry();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'glass shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo */}
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => onNavigate('home')}
            >
              <div className="w-9 h-9 rounded-xl bg-[#003087] flex items-center justify-center">
                <span className="text-white font-bold text-lg font-display">A</span>
              </div>
              <div>
                <span className={`font-display text-xl font-bold ${scrolled ? 'text-[#003087]' : 'text-white'}`}>
                  Afri<span className="text-[#D4AF37]">Bayit</span>
                </span>
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <motion.button
                  key={link.key}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate(link.section)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    activeSection === link.section
                      ? scrolled
                        ? 'bg-[#003087] text-white'
                        : 'bg-white/20 text-white'
                      : scrolled
                        ? 'text-[#2C2E2F] hover:bg-gray-100'
                        : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </motion.button>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Country Selector */}
              <div className="hidden sm:block relative">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value as CountryCode)}
                  className={`appearance-none text-xs font-medium pl-3 pr-7 py-1.5 rounded-full border cursor-pointer ${
                    scrolled
                      ? 'bg-white border-gray-200 text-[#2C2E2F]'
                      : 'bg-white/10 border-white/20 text-white'
                  }`}
                >
                  {COUNTRIES_CONFIG.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Notifications */}
              {isLoggedIn && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenNotifications}
                  className={`relative p-2 rounded-full transition-all ${
                    scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                  }`}
                >
                  <svg className={`w-5 h-5 ${scrolled ? 'text-[#2C2E2F]' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-[#D93025] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {notificationCount}
                    </span>
                  )}
                </motion.button>
              )}

              {/* Dashboard (if logged in) */}
              {isLoggedIn && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate('dashboard')}
                  className={`hidden sm:flex px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeSection === 'dashboard'
                      ? 'bg-[#003087] text-white'
                      : scrolled
                        ? 'text-[#003087] hover:bg-blue-50'
                        : 'text-white hover:bg-white/10'
                  }`}
                >
                  Dashboard
                </motion.button>
              )}

              {/* Login / Profile */}
              {!isLoggedIn ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onOpenAuth('login')}
                  className={`hidden sm:flex px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    scrolled
                      ? 'text-[#003087] hover:bg-blue-50'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  Connexion
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate('dashboard')}
                  className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#D4AF37]"
                >
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </motion.button>
              )}

              {/* CTA - Publier */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-[#D4AF37] hover:bg-[#b8961f] text-white rounded-full text-sm font-semibold shadow-lg transition-colors"
                onClick={() => isLoggedIn ? onNavigate('agent-dashboard') : onOpenAuth('register')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Publier
              </motion.button>

              {/* Mobile Menu Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-lg ${scrolled ? 'text-[#2C2E2F]' : 'text-white'}`}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-display text-xl font-bold text-[#003087]">
                  Afri<span className="text-[#D4AF37]">Bayit</span>
                </span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-1">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.key}
                    onClick={() => {
                      onNavigate(link.section);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                      activeSection === link.section
                        ? 'bg-[#003087] text-white'
                        : 'text-[#2C2E2F] hover:bg-gray-100'
                    }`}
                  >
                    {link.label}
                  </button>
                ))}

                <div className="pt-4 border-t mt-4">
                  <button
                    onClick={() => {
                      onOpenAuth('login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 rounded-2xl text-sm font-medium text-[#003087] hover:bg-blue-50"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-[#D4AF37] text-white rounded-full text-sm font-semibold"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Publier une annonce
                  </button>
                </div>

                {/* Mobile Country Selector */}
                <div className="pt-4 border-t mt-4">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value as CountryCode)}
                    className="w-full appearance-none text-sm font-medium px-4 py-2.5 rounded-full border border-gray-200 bg-white text-[#2C2E2F]"
                  >
                    {COUNTRIES_CONFIG.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass border-t border-white/20 safe-area-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {MOBILE_NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                activeSection === item.key
                  ? 'text-[#003087]'
                  : 'text-gray-400'
              }`}
            >
              <svg
                className={`w-5 h-5 ${activeSection === item.key ? 'text-[#003087]' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={activeSection === item.key ? 2.5 : 1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className={`text-[10px] ${activeSection === item.key ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
