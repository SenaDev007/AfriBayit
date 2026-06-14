'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const COUNTRIES = [
  { code: 'ALL', label: 'Tous les pays', flagIcon: 'globe' },
  { code: 'BJ', label: 'Bénin', flagIcon: 'BJ' },
  { code: 'CI', label: "Côte d'Ivoire", flagIcon: 'CI' },
  { code: 'BF', label: 'Burkina Faso', flagIcon: 'BF' },
  { code: 'TG', label: 'Togo', flagIcon: 'TG' },
];

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

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 flex items-center px-4 lg:px-6 gap-3 shrink-0">
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Search bar */}
      <div className="hidden sm:flex items-center flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher utilisateurs, propriétés, transactions..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] transition-all"
          />
        </div>
      </div>

      <div className="flex-1 sm:hidden" />

      {/* Country filter */}
      <div ref={countryMenuRef} className="relative">
        <button
          onClick={() => setShowCountryMenu(!showCountryMenu)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
        >
          <span className="flex items-center gap-1.5">
            {selectedCountryData.flagIcon === 'globe' ? (
              <Globe className="w-4 h-4 text-gray-500" />
            ) : (
              <span className="text-xs font-bold text-gray-500 bg-gray-100 rounded px-1 py-0.5">{selectedCountryData.flagIcon}</span>
            )}
          </span>
          <span className="hidden md:inline">{selectedCountryData.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>
        {showCountryMenu && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  onCountryChange(c.code);
                  setShowCountryMenu(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors',
                  selectedCountry === c.code && 'bg-[#003087]/5 text-[#003087] font-medium'
                )}
              >
                <span className="flex items-center gap-1.5">
                  {c.flagIcon === 'globe' ? (
                    <Globe className="w-4 h-4 text-gray-500" />
                  ) : (
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 rounded px-1 py-0.5">{c.flagIcon}</span>
                  )}
                </span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div ref={actionsRef} className="relative hidden md:block">
        <button
          onClick={() => setShowActions(!showActions)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#003087] text-white text-sm font-medium hover:bg-[#002a70] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Actions</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {showActions && (
          <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Plus className="w-4 h-4 text-gray-400" />
              Nouvel utilisateur
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Download className="w-4 h-4 text-gray-400" />
              Exporter les données
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <RefreshCw className="w-4 h-4 text-gray-400" />
              Synchroniser OTA
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
          <Avatar className="w-8 h-8">
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
          <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <User className="w-4 h-4 text-gray-400" />
              Mon profil
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Settings className="w-4 h-4 text-gray-400" />
              Paramètres
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <ShieldAlert className="w-4 h-4 text-gray-400" />
              Journal d&apos;audit
            </button>
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
