'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { COUNTRIES_CONFIG } from '@/lib/afribayit-utils';
import { useCountry, type CountryCode } from '@/contexts/CountryContext';
import { useLocale } from '@/lib/i18n/context';
import { useTranslation } from '@/lib/i18n/use-translate';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import {
  Home, Search, Building2, Key, CalendarDays, Shield, LogOut,
  CreditCard, BarChart3, User, Coins, TrendingUp, Wrench,
  GraduationCap, Users, MapPin, Hotel, BedDouble,
  FileCheck, Wallet, Bell, Plus, Languages, ChevronDown,
  LayoutDashboard, Briefcase, ShieldCheck, Star, Landmark,
  MessageCircle, Eye, Settings, ChevronRight, Menu, X
} from 'lucide-react';
import DashboardSwitcher from '@/components/afribayit/DashboardSwitcher';

interface NavbarProps {
  onOpenNotifications: () => void;
  notificationCount: number;
}

/* ──────────────── Desktop Nav Groups (Mega Menu) ──────────────── */
const NAV_GROUPS = [
  {
    key: 'immobilier',
    label: 'Immobilier',
    icon: Building2,
    items: [
      { key: 'acheter', label: 'Acheter', href: '/search?tab=achat', icon: Home },
      { key: 'louer', label: 'Louer', href: '/search?tab=location', icon: Key },
      { key: 'investir', label: 'Investir', href: '/search?tab=investissement', icon: TrendingUp },
      { key: 'court_duree', label: 'Location courte durée', href: '/short-term', icon: CalendarDays },
    ],
  },
  {
    key: 'hospitality',
    label: 'Hôtellerie',
    icon: Hotel,
    items: [
      { key: 'sejours', label: 'Séjours (Hôtels & Guesthouses)', href: '/sejours', icon: Hotel, gold: true },
    ],
  },
  {
    key: 'services',
    label: 'Services',
    icon: Wrench,
    items: [
      { key: 'artisans', label: 'Artisans BTP', href: '/artisans', icon: Wrench },
      { key: 'notaire', label: 'Notaires', href: '/notary', icon: Landmark },
      { key: 'geotrust', label: 'GeoTrust', href: '/geotrust', icon: ShieldCheck },
      { key: 'academie', label: 'Académie', href: '/academy', icon: GraduationCap },
      { key: 'escrow', label: 'Escrow sécurisé', href: '/escrow', icon: Shield },
      { key: 'wallet', label: 'Portefeuille', href: '/wallet', icon: Wallet },
      { key: 'subscriptions', label: 'Abonnements', href: '/subscriptions', icon: CreditCard },
    ],
  },
  {
    key: 'communaute',
    label: 'Communauté',
    icon: Users,
    items: [
      { key: 'forum', label: 'Forum & Groupes', href: '/community', icon: MessageCircle },
      { key: 'profils', label: 'Profils professionnels', href: '/profile', icon: Briefcase },
      { key: 'analytics', label: 'Analytics', href: '/analytics', icon: BarChart3 },
    ],
  },
] as const;

/* ──────────────── Flatten for active-key detection ──────────────── */
const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items.map(i => ({ ...i, groupKey: g.key })));

/* ──────────────── Mobile Nav Items (bottom bar) ──────────────── */
const MOBILE_BOTTOM_ITEMS = [
  { key: 'home', label: 'Accueil', href: '/', Icon: Home },
  { key: 'search', label: 'Rechercher', href: '/search', Icon: Search },
  { key: 'artisans', label: 'Artisans', href: '/artisans', Icon: Wrench },
  { key: 'academy', label: 'Académie', href: '/academy', Icon: GraduationCap },
  { key: 'dashboard', label: 'Profil', href: '/dashboard', Icon: User },
] as const;

/* ──────────────── Profile Menu Items ──────────────── */
const PROFILE_MENU_ITEMS = [
  { label: 'Mon profil', href: '/profile', icon: User },
  { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { label: 'Mes annonces', href: '/agent-dashboard', icon: Building2 },
  { label: 'Mon portefeuille', href: '/wallet', icon: Wallet },
  { label: 'Escrow & Transactions', href: '/escrow', icon: Shield },
  { label: 'Vérification KYC', href: '/kyc', icon: ShieldCheck },
  { label: 'Paramètres du compte', href: '/settings', icon: Settings },
  { label: 'Mes abonnements', href: '/subscriptions', icon: CreditCard },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Espace Notaire', href: '/notary-dashboard', icon: Landmark },
] as const;

/* ══════════════════════════════════════════════════════════════════ */
export default function Navbar({ onOpenNotifications, notificationCount }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const groupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { selectedCountry, setSelectedCountry } = useCountry();
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const isLoggedIn = !!session?.user;
  // Multi-role support (CDC V4 §3.1.1): prefer the new `roles` array if present,
  // fall back to the legacy single `role` field for backward compat.
  const userRoles: string[] = (session?.user?.roles && session.user.roles.length > 0)
    ? session.user.roles
    : session?.user?.role
      ? [session.user.role]
      : [];
  const userRole = session?.user?.role || userRoles[0] || '';
  const isAdmin = userRoles.includes('admin');
  const isNotary = userRoles.includes('notary');
  const isMultiRole = userRoles.length > 1;

  /* Scroll listener */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close menus on route change */
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMobileMenuOpen(false);
      setProfileMenuOpen(false);
      setOpenGroup(null);
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  /* Close mega-menu on outside click */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* Active key detection */
  const getActiveKey = (): string => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/search')) {
      if (pathname.includes('location')) return 'louer';
      if (pathname.includes('investissement')) return 'investir';
      return 'acheter';
    }
    if (pathname.startsWith('/short-term')) return 'court_duree';
    if (pathname.startsWith('/hospitality') || pathname.startsWith('/sejours')) return 'sejours';
    if (pathname.startsWith('/guesthouse') || pathname.startsWith('/sejours')) return 'sejours';
    if (pathname.startsWith('/booking') || pathname.startsWith('/sejours')) return 'sejours';
    if (pathname.startsWith('/hotel-dashboard')) return 'hotel-dashboard';
    if (pathname.startsWith('/artisans')) return 'artisans';
    if (pathname.startsWith('/notary') && !pathname.includes('notary-dashboard')) return 'notaire';
    if (pathname.startsWith('/geotrust')) return 'geotrust';
    if (pathname.startsWith('/academy')) return 'academie';
    if (pathname.startsWith('/escrow')) return 'escrow';
    if (pathname.startsWith('/wallet')) return 'wallet';
    if (pathname.startsWith('/subscriptions')) return 'subscriptions';
    if (pathname.startsWith('/community')) return 'forum';
    if (pathname.startsWith('/profile') || pathname.startsWith('/pro/')) return 'profils';
    if (pathname.startsWith('/analytics')) return 'analytics';
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    if (pathname.startsWith('/agent-dashboard')) return 'dashboard';
    if (pathname.startsWith('/notary-dashboard')) return 'dashboard';
    if (pathname.startsWith('/admin')) return 'admin';
    return '';
  };

  const activeKey = getActiveKey();
  const activeGroup = ALL_NAV_ITEMS.find(i => i.key === activeKey)?.groupKey ?? '';

  const navigate = (href: string) => {
    router.push(href);
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
    setOpenGroup(null);
  };

  /* Hover handlers for mega menu (with delay so it doesn't flicker) */
  const handleGroupEnter = (key: string) => {
    if (groupTimeoutRef.current) clearTimeout(groupTimeoutRef.current);
    setOpenGroup(key);
  };
  const handleGroupLeave = () => {
    groupTimeoutRef.current = setTimeout(() => setOpenGroup(null), 200);
  };
  const handleMegaEnter = () => {
    if (groupTimeoutRef.current) clearTimeout(groupTimeoutRef.current);
  };
  const handleMegaLeave = () => {
    setOpenGroup(null);
  };

  /* ── Color helpers ── */
  const textColor = scrolled ? 'text-[#0a2a5e]' : 'text-white';
  const mutedColor = scrolled ? 'text-gray-500' : 'text-white/70';

  return (
    <>
      {/* ──────────── Desktop Navbar ──────────── */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        aria-label="Menu principal"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'glass shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">

            {/* Logo */}
            <motion.div
              className="flex items-center gap-2 cursor-pointer shrink-0"
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate('/')}
            >
              <img
                src="/logo.png"
                alt="AfriBayit"
                className={`h-14 w-auto object-contain transition-all duration-300 ${
                  !scrolled && pathname === '/' ? 'brightness-0 invert drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]' : ''
                }`}
              />
            </motion.div>

            {/* Center: Nav Groups with Mega Menu */}
            <div className="hidden lg:flex items-center gap-0.5" ref={megaRef}>
              {NAV_GROUPS.map((group) => {
                const GroupIcon = group.icon;
                const isGroupActive = activeGroup === group.key;
                const isOpen = openGroup === group.key;

                return (
                  <div
                    key={group.key}
                    className="relative"
                    onMouseEnter={() => handleGroupEnter(group.key)}
                    onMouseLeave={handleGroupLeave}
                  >
                    {/* Group trigger */}
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isGroupActive
                          ? scrolled
                            ? 'bg-[#003087] text-white'
                            : 'bg-white/20 text-white'
                          : scrolled
                            ? 'text-[#0a2a5e] hover:bg-gray-100'
                            : 'text-white/90 hover:bg-white/10'
                      }`}
                    >
                      <GroupIcon className="w-4 h-4" />
                      {group.label}
                      <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </motion.button>

                    {/* Mega dropdown */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          onMouseEnter={handleMegaEnter}
                          onMouseLeave={handleMegaLeave}
                          className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                        >
                          <div className="py-1">
                            {group.items.map((item) => {
                              const ItemIcon = item.icon;
                              const isGold = 'gold' in item && item.gold;
                              const isActive = activeKey === item.key;

                              return (
                                <button
                                  key={item.key}
                                  onClick={() => navigate(item.href)}
                                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                                    isActive
                                      ? 'bg-[#003087]/5 text-[#003087] font-semibold'
                                      : isGold
                                        ? 'text-[#D4AF37] hover:bg-[#D4AF37]/5 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <ItemIcon className={`w-4 h-4 ${isGold ? 'text-[#D4AF37]' : isActive ? 'text-[#003087]' : 'text-gray-400'}`} />
                                  {item.label}
                                  {isGold && <Star className="w-3 h-3 text-[#D4AF37] ml-auto" />}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Country Selector */}
              <div className="hidden sm:block relative">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value as CountryCode)}
                  className={`appearance-none text-xs font-medium pl-3 pr-7 py-1.5 rounded-lg border cursor-pointer ${
                    scrolled ? 'bg-white border-gray-200 text-[#0a2a5e]' : 'bg-white/10 border-white/20 text-white'
                  }`}
                >
                  {COUNTRIES_CONFIG.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Language Switcher */}
              <button
                onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
                className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  scrolled ? 'bg-white border-gray-200 text-[#0a2a5e] hover:bg-gray-50' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
                title={locale === 'fr' ? 'Switch to English' : 'Passer en Français'}
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{locale === 'fr' ? 'FR' : 'EN'}</span>
              </button>

              {/* Notifications bell */}
              {isLoggedIn && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenNotifications}
                  className={`relative p-2 rounded-lg transition-all ${scrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'}`}
                >
                  <Bell className={`w-5 h-5 ${textColor}`} />
                  {notificationCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#D93025] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </motion.button>
              )}

              {/* Backoffice button — always visible, redirects to login if not admin */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(isLoggedIn && isAdmin ? '/admin' : '/auth/login')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  isLoggedIn && isAdmin
                    ? 'bg-[#003087] text-white border border-[#003087]/30 hover:bg-[#002060] shadow-md'
                    : scrolled
                      ? 'text-[#003087] hover:bg-blue-50 border border-[#003087]/20'
                      : 'text-white hover:bg-white/10 border border-white/20'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                {isLoggedIn && isAdmin ? 'Backoffice' : t('nav.admin', 'Admin')}
              </motion.button>
              {/* Dashboard button for non-admin logged-in users */}
              {isLoggedIn && !isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/dashboard')}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    scrolled
                      ? 'text-[#003087] hover:bg-blue-50'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  {t('nav.dashboard', 'Dashboard')}
                </motion.button>
              )}

              {/* Login / Logout + Profile Avatar with dropdown */}
              {!isLoggedIn ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/auth/login')}
                  className={`hidden sm:flex px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    scrolled ? 'text-[#003087] hover:bg-blue-50' : 'text-white hover:bg-white/10'
                  }`}
                >
                  {t('nav.login', 'Connexion')}
                </motion.button>
              ) : (
                <div className="flex items-center gap-2">
                  {/* Profile Avatar with dropdown */}
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                      aria-haspopup="true"
                      aria-expanded={profileMenuOpen}
                      aria-label="Menu du profil"
                      className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#D4AF37]"
                    >
                      <ImageWithFallback
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"
                        alt="Profile"
                        className="w-full h-full"
                        fallbackType="avatar"
                      />
                    </motion.button>

                  {/* Profile Dropdown */}
                  <AnimatePresence>
                    {profileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-12 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                      >
                        {/* User info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-[#0a2a5e]">{session?.user?.name || 'Utilisateur'}</p>
                          <p className="text-xs text-gray-400 truncate">{session?.user?.email || ''}</p>
                          {/* Multi-role badges (CDC V4 §3.1.1) */}
                          {userRoles.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {userRoles.map((r) => (
                                <span
                                  key={r}
                                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                    r === userRole
                                      ? 'bg-[#003087] text-white'
                                      : 'bg-[#003087]/10 text-[#003087]'
                                  }`}
                                >
                                  {r.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                          {isMultiRole && (
                            <button
                              onClick={() => navigate('/settings/roles')}
                              className="mt-2 text-[10px] text-[#D4AF37] hover:underline font-medium"
                            >
                              ⚙ Gérer mes rôles
                            </button>
                          )}
                        </div>

                        {/* Menu items */}
                        <div className="py-1 max-h-[340px] overflow-y-auto">
                          {PROFILE_MENU_ITEMS.filter(item => {
                            // Show notary-dashboard only for notaries
                            if (item.href === '/notary-dashboard' && !isNotary && !isAdmin) return false;
                            return true;
                          }).map((item) => {
                            const IconComp = item.icon;
                            return (
                              <button
                                key={item.href}
                                onClick={() => navigate(item.href)}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                              >
                                <IconComp className="w-4 h-4 text-gray-400" />
                                {item.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Admin section */}
                        {isAdmin && (
                          <div className="border-t border-gray-100 py-1">
                            <div className="px-4 py-1.5">
                              <span className="text-[10px] uppercase tracking-wider font-bold text-[#003087]">Administration</span>
                            </div>
                            {[
                              { label: 'Backoffice Admin', href: '/admin', icon: LayoutDashboard },
                              { label: 'Gestion utilisateurs', href: '/admin/users', icon: Users },
                              { label: 'Transactions & Escrow', href: '/admin/escrow', icon: Shield },
                              { label: 'Propriétés', href: '/admin/properties', icon: Building2 },
                              { label: 'Hôtels & Guesthouses', href: '/admin/hotels', icon: Hotel },
                              { label: 'KYC & Accréditations', href: '/admin/kyc', icon: FileCheck },
                              { label: 'Revenus & Analytics', href: '/admin/revenue', icon: BarChart3 },
                              { label: 'OTA & Channel Mgr', href: '/admin/ota', icon: Settings },
                            ].map((item) => {
                              const IconComp = item.icon;
                              return (
                                <button
                                  key={item.href}
                                  onClick={() => navigate(item.href)}
                                  className="w-full text-left px-4 py-2.5 text-sm text-[#003087] hover:bg-blue-50 flex items-center gap-2.5 transition-colors font-medium"
                                >
                                  <IconComp className="w-4 h-4 text-[#003087]" />
                                  {item.label}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        <div className="border-t border-gray-100 py-1">
                          <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            {t('nav.logout', 'Déconnexion')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                  {/* Visible Déconnexion button in top nav */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className={`hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      scrolled ? 'text-[#D93025] hover:bg-red-50' : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    {t('nav.logout', 'Déconnexion')}
                  </motion.button>
                </div>
              )}

              {/* Dashboard Switcher — only shown for multi-role users */}
              {isLoggedIn && <DashboardSwitcher />}

              {/* CTA - Publier (visible uniquement si connecté) */}
              {isLoggedIn && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-[#003087] hover:bg-[#001f5c] text-white rounded-lg text-sm font-semibold shadow-lg transition-colors"
                  onClick={() => navigate('/publish')}
                >
                  <Plus className="w-4 h-4" />
                  {t('nav.publish', 'Publier')}
                </motion.button>
              )}

              {/* Mobile Menu Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-haspopup="true"
                aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                className={`lg:hidden p-2 rounded-lg ${scrolled ? 'text-[#0a2a5e]' : 'text-white'}`}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ──────────── Mobile Slide-in Menu ──────────── */}
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
              className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <Image src="/logo.png" alt="AfriBayit" width={160} height={40} className="h-10 w-auto object-contain" priority />
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Nav Groups */}
              <div className="p-4 space-y-2">
                {NAV_GROUPS.map((group) => {
                  const GroupIcon = group.icon;
                  const isGroupOpen = openGroup === group.key;

                  return (
                    <div key={group.key}>
                      <button
                        onClick={() => setOpenGroup(isGroupOpen ? null : group.key)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-[#0a2a5e] hover:bg-gray-50 transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <GroupIcon className="w-4 h-4 text-[#003087]" />
                          {group.label}
                        </span>
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isGroupOpen ? 'rotate-90' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isGroupOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="pl-6 pb-2 space-y-0.5">
                              {group.items.map((item) => {
                                const ItemIcon = item.icon;
                                const isGold = 'gold' in item && item.gold;
                                const isActive = activeKey === item.key;

                                return (
                                  <button
                                    key={item.key}
                                    onClick={() => navigate(item.href)}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm flex items-center gap-2.5 transition-all ${
                                      isActive
                                        ? 'bg-[#003087] text-white font-medium'
                                        : isGold
                                          ? 'text-[#D4AF37] hover:bg-[#D4AF37]/5 font-medium'
                                          : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    <ItemIcon className={`w-4 h-4 ${isGold && !isActive ? 'text-[#D4AF37]' : ''}`} />
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* User section */}
              <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                {isLoggedIn ? (
                  <>
                    {/* User info card */}
                    <div className="flex items-center gap-3 px-4 py-3 mb-3 rounded-xl bg-gray-50">
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#D4AF37]">
                        <ImageWithFallback
                          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"
                          alt="Profile"
                          className="w-full h-full"
                          fallbackType="avatar"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0a2a5e]">{session?.user?.name || 'Utilisateur'}</p>
                        <p className="text-xs text-gray-400">{session?.user?.email || ''}</p>
                        {/* Multi-role badges (CDC V4 §3.1.1) */}
                        {userRoles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {userRoles.map((r) => (
                              <span
                                key={r}
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  r === userRole
                                    ? 'bg-[#003087] text-white'
                                    : 'bg-[#003087]/10 text-[#003087]'
                                }`}
                              >
                                {r.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                        {isMultiRole && (
                          <button
                            onClick={() => navigate('/settings/roles')}
                            className="mt-1.5 text-[10px] text-[#D4AF37] hover:underline font-medium block"
                          >
                            ⚙ Gérer mes rôles
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick links */}
                    <div className="space-y-0.5">
                      {PROFILE_MENU_ITEMS.filter(item => {
                        if (item.href === '/notary-dashboard' && !isNotary && !isAdmin) return false;
                        return true;
                      }).map((item) => {
                        const IconComp = item.icon;
                        return (
                          <button
                            key={item.href}
                            onClick={() => navigate(item.href)}
                            className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2.5 transition-colors"
                          >
                            <IconComp className="w-4 h-4 text-gray-400" />
                            {item.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Admin Backoffice Button — prominent */}
                    {isAdmin && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => navigate('/admin')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#003087] text-white rounded-xl text-sm font-semibold hover:bg-[#002060] transition-colors shadow-md"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Accéder au Backoffice
                        </button>
                      </div>
                    )}

                    {/* Admin section */}
                    {isAdmin && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="px-4 py-1 text-[10px] uppercase tracking-wider font-bold text-[#003087]">Administration</p>
                        {[
                          { label: 'Backoffice Admin', href: '/admin', icon: LayoutDashboard },
                          { label: 'Utilisateurs', href: '/admin/users', icon: Users },
                          { label: 'Propriétés', href: '/admin/properties', icon: Building2 },
                          { label: 'Transactions', href: '/admin/escrow', icon: Shield },
                          { label: 'Hôtels', href: '/admin/hotels', icon: Hotel },
                          { label: 'KYC', href: '/admin/kyc', icon: FileCheck },
                          { label: 'Revenus', href: '/admin/revenue', icon: BarChart3 },
                        ].map((item) => {
                          const IconComp = item.icon;
                          return (
                            <button
                              key={item.href}
                              onClick={() => navigate(item.href)}
                              className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-[#003087] hover:bg-blue-50 flex items-center gap-2.5 transition-colors font-medium"
                            >
                              <IconComp className="w-4 h-4 text-[#003087]" />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <button
                        onClick={() => navigate('/publish')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#001f5c] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        {t('dashboard.publishAd', 'Publier une annonce')}
                      </button>
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('nav.logout', 'Déconnexion')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => navigate('/auth/login')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#003087] text-white rounded-lg text-sm font-semibold hover:bg-[#002060] transition-colors"
                    >
                      {t('nav.login', 'Connexion')}
                    </button>
                    <button
                      onClick={() => navigate('/admin')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#003087]/10 text-[#003087] rounded-lg text-sm font-semibold hover:bg-[#003087]/20 transition-colors border border-[#003087]/20"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Accès Backoffice
                    </button>
                    <button
                      onClick={() => navigate('/auth/register')}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#D4AF37] text-white rounded-lg text-sm font-semibold hover:bg-[#b8961f] transition-colors"
                    >
                      {t('nav.register', 'Créer un compte')}
                    </button>
                  </div>
                )}
              </div>

              {/* Country & Language */}
              <div className="px-4 pb-6 border-t border-gray-100 pt-4 space-y-3">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value as CountryCode)}
                  className="w-full appearance-none text-sm font-medium px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-[#0a2a5e]"
                >
                  {COUNTRIES_CONFIG.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-[#0a2a5e] hover:bg-gray-50"
                >
                  <Languages className="w-4 h-4" />
                  {locale === 'fr' ? 'Français' : 'English'}
                  <span className="text-xs text-gray-400">→ {locale === 'fr' ? 'English' : 'Français'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──────────── Mobile Bottom Navigation ──────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden glass border-t border-white/20 safe-area-bottom" aria-label="Navigation mobile">
        <div className="flex items-center justify-around py-2 px-2">
          {MOBILE_BOTTOM_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const labelMap: Record<string, string> = {
              home: t('nav.home', 'Accueil'),
              search: t('nav.search', 'Rechercher'),
              artisans: t('nav.artisans', 'Artisans'),
              academy: t('nav.academy', 'Académie'),
              dashboard: t('nav.profile', 'Profil'),
            };
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.href)}
                aria-label={labelMap[item.key] || item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${
                  isActive ? 'text-[#003087]' : 'text-gray-400'
                }`}
              >
                <item.Icon className={`w-5 h-5 ${isActive ? 'text-[#003087]' : ''}`} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {labelMap[item.key] || item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
