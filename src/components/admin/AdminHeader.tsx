'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Settings,
  ShieldAlert,
  Globe,
  Menu,
  Plus,
  Download,
  RefreshCw,
  ChevronRight,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const COUNTRIES = [
  { code: 'ALL', label: 'Tous les pays', flag: '🌍' },
  { code: 'BJ', label: 'Bénin', flag: '🇧🇯' },
  { code: 'CI', label: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'BF', label: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', label: 'Togo', flag: '🇹🇬' },
];

// Breadcrumb label map
const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  analytics: 'Analytics',
  users: 'Utilisateurs',
  properties: 'Propriétés',
  transactions: 'Transactions',
  kyc: 'KYC',
  escrow: 'Escrow',
  wallets: 'Portefeuilles',
  revenue: 'Revenus',
  hotels: 'Hôtels',
  guesthouses: 'Guesthouses',
  subscriptions: 'Abonnements',
  courses: 'Cours',
  community: 'Communauté',
  accreditations: 'Accréditations',
  'audit-logs': "Journaux d'audit",
  ota: 'OTA',
  countries: 'Pays',
  hospitality: 'Hôtellerie',
};

interface AdminHeaderProps {
  onMobileMenuToggle: () => void;
  selectedCountry: string;
  onCountryChange: (code: string) => void;
  notificationCount?: number;
}

export default function AdminHeader({
  onMobileMenuToggle,
  selectedCountry,
  onCountryChange,
  notificationCount = 0,
}: AdminHeaderProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const countryMenuRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (countryMenuRef.current && !countryMenuRef.current.contains(e.target as Node)) {
        setShowCountryMenu(false);
      }
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = session?.user?.name || 'Admin';
  const userRole = (session?.user as Record<string, unknown>)?.role as string || 'admin';
  const userAvatar = (session?.user as Record<string, unknown>)?.image as string || null;
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const selectedCountryData = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];

  // Build breadcrumb segments
  const breadcrumbSegments = pathname
    .split('/')
    .filter(Boolean)
    .slice(1); // Remove 'admin'

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shrink-0">
      {/* Top bar with branding accent */}
      <div className="h-1 bg-gradient-to-r from-[#003087] via-[#009CDE] to-[#D4AF37]" />

      <div className="flex items-center px-4 lg:px-6 h-14 gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center gap-1.5 text-xs min-w-0 flex-1">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-[#003087] transition-colors shrink-0">
            <Home className="w-3.5 h-3.5" />
          </Link>
          {breadcrumbSegments.map((segment, idx) => {
            const isLast = idx === breadcrumbSegments.length - 1;
            const href = '/admin/' + breadcrumbSegments.slice(0, idx + 1).join('/');
            const isCountryCode = /^[A-Z]{2}$/.test(segment);
            const label = isCountryCode
              ? segment
              : BREADCRUMB_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
            return (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
                {isLast ? (
                  <span className="text-gray-900 font-medium truncate">{label}</span>
                ) : (
                  <Link href={href} className="text-gray-400 hover:text-[#003087] transition-colors truncate">
                    {label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Search bar — desktop only */}
        <div className="hidden md:flex items-center max-w-xs flex-1">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] transition-all"
            />
          </div>
        </div>

        <div className="flex-1 sm:hidden" />

        {/* Country filter with emoji flags */}
        <div ref={countryMenuRef} className="relative">
          <button
            onClick={() => setShowCountryMenu(!showCountryMenu)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-sm font-medium',
              selectedCountry !== 'ALL'
                ? 'bg-[#003087]/5 text-[#003087] border border-[#003087]/15'
                : 'hover:bg-gray-100 text-gray-700'
            )}
          >
            <span className="text-base">{selectedCountryData.flag}</span>
            <span className="hidden md:inline">{selectedCountryData.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {showCountryMenu && (
            <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 overflow-hidden">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    onCountryChange(c.code);
                    setShowCountryMenu(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                    selectedCountry === c.code && 'bg-[#003087]/5 text-[#003087] font-medium'
                  )}
                >
                  <span className="text-base">{c.flag}</span>
                  <span>{c.label}</span>
                  {selectedCountry === c.code && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div ref={actionsRef} className="relative hidden lg:block">
          <button
            onClick={() => setShowActions(!showActions)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#003087] text-white text-sm font-medium hover:bg-[#002a70] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Actions</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-70" />
          </button>
          {showActions && (
            <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 overflow-hidden">
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 rounded-md bg-[#009CDE]/10 flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5 text-[#009CDE]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Nouvel utilisateur</p>
                  <p className="text-[11px] text-gray-400">Créer un compte</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 rounded-md bg-[#00A651]/10 flex items-center justify-center shrink-0">
                  <Download className="w-3.5 h-3.5 text-[#00A651]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Exporter les données</p>
                  <p className="text-[11px] text-gray-400">CSV, Excel</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <div className="w-7 h-7 rounded-md bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Synchroniser OTA</p>
                  <p className="text-[11px] text-gray-400">Booking, Expedia</p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Notification bell */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          {notificationCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] bg-[#D4AF37] text-[#003087] font-bold border-0">
              {notificationCount > 99 ? '99+' : notificationCount}
            </Badge>
          )}
        </button>

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 pl-2 pr-1.5 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Avatar className="w-8 h-8 ring-2 ring-[#003087]/10">
              <AvatarImage src={userAvatar || undefined} />
              <AvatarFallback className="bg-[#003087] text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-tight">{userName}</p>
              <p className="text-[11px] text-gray-500 leading-tight capitalize">{userRole}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <User className="w-4 h-4 text-gray-400" />
                Mon profil
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Settings className="w-4 h-4 text-gray-400" />
                Paramètres
              </button>
              <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <ShieldAlert className="w-4 h-4 text-gray-400" />
                Journal d&apos;audit
              </button>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
