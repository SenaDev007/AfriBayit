'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  Search,
  User,
  Heart,
  Globe,
  Sun,
  Moon,
  ChevronDown,
  Building2,
  Hotel,
  GraduationCap,
  Users,
  Home,
  LogIn,
  UserPlus,
  Settings,
  LogOut,
  RotateCcw
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { useTheme } from '@/components/providers/ThemeProvider'
import { cn } from '@/lib/utils'

const languages = [
  { code: 'fr', name: 'Français', flag: '\u{1F1EB}\u{1F1F7}' }, // 🇫🇷
  { code: 'en', name: 'English', flag: '\u{1F1FA}\u{1F1F8}' }, // 🇺🇸
  { code: 'ar', name: 'العربية', flag: '\u{1F1E9}\u{1F1FF}' }, // 🇩🇿
  { code: 'pt', name: 'Português', flag: '\u{1F1E7}\u{1F1F7}' }, // 🇧🇷
  { code: 'es', name: 'Español', flag: '\u{1F1EA}\u{1F1F8}' }, // 🇪🇸
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isPastHero, setIsPastHero] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const { user, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme, actualTheme } = useTheme()

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const heroHeight = window.innerHeight // Full viewport height for hero

      // Background becomes blurred when scrolled (even slightly)
      setIsScrolled(scrollY > 20)

      // Elements stay white until we're past the entire hero section
      // Use full viewport height + some padding to ensure we're truly past the hero
      setIsPastHero(scrollY > heroHeight + 100)
    }

    // Check initial scroll position
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle clicking outside language dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showLanguageMenu && !target.closest('[data-language-dropdown]')) {
        setShowLanguageMenu(false)
      }
    }

    if (showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showLanguageMenu])

  // Handle clicking outside user menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showUserMenu && !target.closest('[data-user-menu]')) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleLogout = async () => {
    try {
      await logout()
      setShowUserMenu(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false)
    handleLogout()
  }

  const handleLogoutCancel = () => {
    setShowLogoutModal(false)
  }

  const toggleTheme = () => {
    setTheme(actualTheme === 'light' ? 'dark' : 'light')
  }

  const handleSearchClick = () => {
    setShowSearchModal(true)
    console.log('Search clicked - opening search modal')
  }

  const handleFavoritesClick = () => {
    setShowFavorites(true)
    console.log('Favorites clicked - opening favorites panel')
  }

  const handleResetTestData = async () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser toutes les données de test ? Cette action est irréversible.')) {
      return
    }

    try {
      setIsResetting(true)

      // Try the full reset first
      console.log('Attempting full reset...')
      const response = await fetch('/api/admin/reset-test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        alert('✅ Données de test réinitialisées avec succès !')
        window.location.reload()
        return
      }

      // If full reset fails, try simple reset
      const simpleResponse = await fetch('/api/admin/simple-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (simpleResponse.ok) {
        const result = await simpleResponse.json()
        alert('✅ Données utilisateur réinitialisées avec succès !\n\nNote: Seules les données utilisateur ont été réinitialisées.')
        window.location.reload()
        return
      }

      // If both fail, show detailed error
      const errorData = await response.json()
      throw new Error(errorData.message || 'Erreur lors de la réinitialisation')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      alert(`❌ Erreur lors de la réinitialisation des données de test:\n\n${errorMessage}`)
    } finally {
      setIsResetting(false)
    }
  }

  const currentLanguage = languages.find(lang => lang.code === language)


  return (
    <nav className={cn(
      'navbar fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled
        ? 'bg-white/10 dark:bg-neutral-800/10 backdrop-blur-md shadow-lg border-b border-white/20 dark:border-neutral-700'
        : 'bg-transparent'
    )}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 mr-6 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className={cn(
              "text-2xl font-bold cursor-pointer",
              !isPastHero
                ? "text-white drop-shadow-lg"
                : "bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent"
            )}>
              AfriBayit
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link
              href="/properties"
              className={cn(
                "flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer",
                !isPastHero
                  ? "text-white/90 hover:text-white hover:bg-white/10"
                  : "text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              )}
            >
              <Building2 className="w-4 h-4" />
              <span>{t('nav.properties')}</span>
            </Link>

            <Link
              href="/hotels"
              className={cn(
                "flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer",
                !isPastHero
                  ? "text-white/90 hover:text-white hover:bg-white/10"
                  : "text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              )}
            >
              <Hotel className="w-4 h-4" />
              <span>{t('nav.hotels')}</span>
            </Link>

            <Link
              href="/learning"
              className={cn(
                "flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer",
                !isPastHero
                  ? "text-white/90 hover:text-white hover:bg-white/10"
                  : "text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              )}
            >
              <GraduationCap className="w-4 h-4" />
              <span>{t('nav.learning')}</span>
            </Link>

            <Link
              href="/community"
              className={cn(
                "flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer",
                !isPastHero
                  ? "text-white/90 hover:text-white hover:bg-white/10"
                  : "text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              )}
            >
              <Users className="w-4 h-4" />
              <span>{t('nav.community')}</span>
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Search Button */}
            <button
              onClick={handleSearchClick}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 cursor-pointer",
                !isPastHero
                  ? "text-white/90 hover:text-white hover:bg-white/10"
                  : "text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              )}
              title="Rechercher"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Favorites Button */}
            <button
              onClick={handleFavoritesClick}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 cursor-pointer",
                !isPastHero
                  ? "text-white/90 hover:text-white hover:bg-white/10"
                  : "text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              )}
              title="Favoris"
            >
              <Heart className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 cursor-pointer",
                !isPastHero
                  ? "text-white/90 hover:text-white hover:bg-white/10"
                  : "text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              )}
            >
              {actualTheme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            {/* Reset Test Data Button - Development Only */}
            <button
              onClick={handleResetTestData}
              disabled={isResetting}
              className={cn(
                "p-2 rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                !isPastHero
                  ? "text-white/70 hover:text-white hover:bg-white/10"
                  : "text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700"
              )}
              title="Réinitialiser les données de test"
            >
              <RotateCcw className={`w-5 h-5 ${isResetting ? 'animate-spin' : ''}`} />
            </button>

            {/* Language Selector */}
            <div className="relative" data-language-dropdown>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className={cn(
                  "flex items-center space-x-1 p-2 rounded-lg transition-all duration-200 cursor-pointer",
                  !isPastHero
                    ? "text-white/90 hover:text-white hover:bg-white/10"
                    : "text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                )}
              >
                <span className={`text-lg flag-emoji flag-${currentLanguage?.code}`} title={currentLanguage?.name}>
                  {currentLanguage?.flag}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showLanguageMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as any)
                          setShowLanguageMenu(false)
                        }}
                        className={cn(
                          'w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200 cursor-pointer text-neutral-700 dark:text-neutral-300',
                          language === lang.code && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                        )}
                      >
                        <span className={`text-lg flag-emoji flag-${lang.code}`} title={lang.name}>
                          {lang.flag}
                        </span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu or Auth Buttons */}
            {user ? (
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={cn(
                    "flex items-center space-x-2 p-2 rounded-lg transition-all duration-200 cursor-pointer",
                    !isPastHero
                      ? "text-white/90 hover:text-white hover:bg-white/10"
                      : "text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  )}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.firstName || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-primary-600" />
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-700">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate" title={user.email}>
                          {user.email}
                        </p>
                      </div>

                      <Link
                        href="/dashboard"
                        className="flex items-center space-x-3 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200 cursor-pointer"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Home className="w-4 h-4" />
                        <span>{t('nav.dashboard')}</span>
                      </Link>

                      <Link
                        href="/profile"
                        className="flex items-center space-x-3 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200 cursor-pointer"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        <span>{t('nav.profile')}</span>
                      </Link>

                      <Link
                        href="/settings"
                        className="flex items-center space-x-3 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200 cursor-pointer"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Paramètres</span>
                      </Link>

                      <div className="border-t border-neutral-100 dark:border-neutral-700 my-2" />

                      <button
                        onClick={handleLogoutClick}
                        className="flex items-center space-x-3 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 w-full text-left cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Se déconnecter</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className={cn(
                    "px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer",
                    !isPastHero
                      ? "text-white/90 hover:text-white hover:bg-white/10"
                      : "text-neutral-700 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                  )}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/auth/register"
                  className={cn(
                    "btn cursor-pointer",
                    !isPastHero
                      ? "btn-primary bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30"
                      : "btn-primary"
                  )}
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "lg:hidden p-2 rounded-lg transition-all duration-200 cursor-pointer",
                !isPastHero
                  ? "text-white/90 hover:text-white hover:bg-white/10"
                  : "text-neutral-700 hover:text-primary-600 hover:bg-primary-50"
              )}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
            >
              <div className="py-4 space-y-2">
                <Link
                  href="/properties"
                  className="flex items-center space-x-3 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200 cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  <Building2 className="w-5 h-5" />
                  <span>{t('nav.properties')}</span>
                </Link>

                <Link
                  href="/hotels"
                  className="flex items-center space-x-3 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200 cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  <Hotel className="w-5 h-5" />
                  <span>{t('nav.hotels')}</span>
                </Link>

                <Link
                  href="/learning"
                  className="flex items-center space-x-3 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200 cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>{t('nav.learning')}</span>
                </Link>

                <Link
                  href="/community"
                  className="flex items-center space-x-3 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200 cursor-pointer"
                  onClick={() => setIsOpen(false)}
                >
                  <Users className="w-5 h-5" />
                  <span>{t('nav.community')}</span>
                </Link>

                {!user && (
                  <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                    <Link
                      href="/auth/login"
                      className="flex items-center space-x-3 px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200 cursor-pointer"
                      onClick={() => setIsOpen(false)}
                    >
                      <LogIn className="w-5 h-5" />
                      <span>{t('nav.login')}</span>
                    </Link>

                    <Link
                      href="/auth/register"
                      className="flex items-center space-x-3 px-4 py-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200 cursor-pointer"
                      onClick={() => setIsOpen(false)}
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>{t('nav.register')}</span>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search Modal */}
        <AnimatePresence>
          {showSearchModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
              onClick={() => setShowSearchModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Recherche Avancée
                  </h3>
                  <button
                    onClick={() => setShowSearchModal(false)}
                    className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Rechercher des propriétés, hôtels, cours..."
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400"
                    autoFocus
                  />

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowSearchModal(false)}
                      className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors duration-200"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        console.log('Search executed')
                        setShowSearchModal(false)
                      }}
                      className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                    >
                      Rechercher
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Favorites Modal */}
        <AnimatePresence>
          {showFavorites && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
              onClick={() => setShowFavorites(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Mes Favoris
                  </h3>
                  <button
                    onClick={() => setShowFavorites(false)}
                    className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center py-8">
                  <Heart className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    Vous n'avez pas encore de favoris
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">
                    Explorez nos propriétés et ajoutez vos préférées ici
                  </p>
                  <button
                    onClick={() => {
                      console.log('Navigate to properties')
                      setShowFavorites(false)
                    }}
                    className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                  >
                    Explorer les propriétés
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logout Confirmation Modal */}
        <AnimatePresence>
          {showLogoutModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={handleLogoutCancel}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <LogOut className="w-8 h-8 text-red-600 dark:text-red-400" />
                  </div>

                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                    Se déconnecter
                  </h3>

                  <p className="text-neutral-600 dark:text-neutral-300 mb-6">
                    Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
                  </p>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleLogoutCancel}
                      className="flex-1 px-4 py-2 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors duration-200"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleLogoutConfirm}
                      className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
