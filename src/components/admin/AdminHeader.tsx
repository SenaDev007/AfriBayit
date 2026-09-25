'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { signOutAndClear } from '@/lib/signout';
import {
  Search, Bell, ChevronDown, User, LogOut, Settings, ShieldAlert, Globe,
  Menu, Plus, Download, Building2, Users as UsersIcon, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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
}

interface QuickSearchResult {
  users: Array<{ id: string; name?: string; email?: string }>;
  properties: Array<{ id: string; title?: string; city?: string; country?: string }>;
}

/**
 * AdminHeader — barre de contrôle Win-Agro multi-pays.
 *
 * Tous les contrôles sont câblés (bord de contrôle total) :
 *  - Recherche globale : utilisateurs + propriétés, debouncée 300 ms,
 *    résultats cliquables (fiche utilisateur / liste propriétés filtrée).
 *  - Sélecteur pays : bascule VRAIMENT vers le backoffice du pays
 *    (/admin/BJ/dashboard…) ou la console globale (/admin/dashboard).
 *  - Cloche : compteur non-lus réel (polling 30 s) → /admin/notifications.
 *  - Actions rapides + menu utilisateur : liens fonctionnels.
 */
export default function AdminHeader({
  onMobileMenuToggle,
  selectedCountry,
  onCountryChange,
}: AdminHeaderProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);
  const countryMenuRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce de la recherche globale
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(globalSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [globalSearch]);

  // Recherche globale — utilisateurs + propriétés (admin APIs, search param)
  const { data: searchResults, isFetching: isSearching } = useQuery<QuickSearchResult>({
    queryKey: ['admin-quick-search', debouncedSearch],
    queryFn: async () => {
      const q = encodeURIComponent(debouncedSearch);
      const [users, properties] = await Promise.all([
        api.get<{ users: Array<{ id: string; name?: string; email?: string }> }>(
          `/api/admin/users?search=${q}&limit=4`
        ).catch(() => ({ users: [] })),
        api.get<{ properties: Array<{ id: string; title?: string; city?: string; country?: string }> }>(
          `/api/admin/properties?search=${q}&limit=4`
        ).catch(() => ({ properties: [] })),
      ]);
      return {
        users: users?.users ?? [],
        properties: properties?.properties ?? [],
      };
    },
    enabled: debouncedSearch.length >= 2,
    staleTime: 15_000,
  });

  // Compteur de notifications non lues (polling 30 s)
  const { data: notifData } = useQuery<{ summary?: { unread?: number } }>({
    queryKey: ['admin-notifications-unread'],
    queryFn: () => api.get<{ summary?: { unread?: number } }>('/api/admin/notifications?limit=1'),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const notificationCount = notifData?.summary?.unread ?? 0;

  // Sélecteur pays → navigation réelle vers le backoffice du pays
  const handleCountrySelect = useCallback((code: string) => {
    onCountryChange(code);
    setShowCountryMenu(false);
    if (code === 'ALL') {
      router.push('/admin/dashboard');
    } else {
      router.push(`/admin/${code}/dashboard`);
    }
  }, [onCountryChange, router]);

  const goToSearch = () => {
    if (!debouncedSearch) return;
    setShowSearchResults(false);
    router.push(`/admin/users?q=${encodeURIComponent(debouncedSearch)}`);
  };

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
  const hasResults =
    (searchResults?.users?.length ?? 0) + (searchResults?.properties?.length ?? 0) > 0;

  return (
    <header className="sticky top-0 z-30 h-16 bg-admin-panel/40 backdrop-blur-md border-b border-primary-green/10 flex items-center px-4 lg:px-6 gap-3 shrink-0">
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-[#0F1F3C]/60 transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5 text-[#8b9cb8]" />
      </button>

      {/* ── Recherche globale (utilisateurs + propriétés) ── */}
      <div ref={searchRef} className="hidden sm:flex items-center flex-1 max-w-md relative">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b9cb8]/80" />
          <input
            ref={searchInputRef}
            type="text"
            value={globalSearch}
            onChange={(e) => {
              setGlobalSearch(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') goToSearch();
              if (e.key === 'Escape') setShowSearchResults(false);
            }}
            placeholder="Rechercher utilisateurs, propriétés, transactions..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-[#0F1F3C]/40 border border-[#003087]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003087]/20 focus:border-[#003087] transition-all text-[#E6EEF8] placeholder:text-[#8b9cb8]/60"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8b9cb8]/60 animate-spin" />
          )}
        </div>

        {/* Résultats de recherche */}
        {showSearchResults && debouncedSearch.length >= 2 && (
          <div className="absolute top-full mt-2 w-full max-w-md bg-[#0F1F3C] rounded-xl shadow-2xl border border-[#003087]/25 py-2 z-50 max-h-96 overflow-y-auto">
            {!isSearching && !hasResults && (
              <p className="px-4 py-3 text-sm text-[#8b9cb8]">
                Aucun résultat pour « {debouncedSearch} »
              </p>
            )}
            {searchResults?.users && searchResults.users.length > 0 && (
              <>
                <p className="px-4 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-[#8b9cb8]/70 flex items-center gap-1.5">
                  <UsersIcon className="w-3 h-3" /> Utilisateurs
                </p>
                {searchResults.users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setShowSearchResults(false);
                      router.push(`/admin/users/${u.id}`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#13294D] transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-[#8b9cb8]/70 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-[#E6EEF8] font-medium truncate">{u.name || 'Sans nom'}</p>
                      <p className="text-[11px] text-[#8b9cb8] truncate">{u.email}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
            {searchResults?.properties && searchResults.properties.length > 0 && (
              <>
                <p className="px-4 pb-1 pt-2.5 text-[10px] font-bold uppercase tracking-wider text-[#8b9cb8]/70 flex items-center gap-1.5 border-t border-[#003087]/15 mt-1">
                  <Building2 className="w-3 h-3" /> Propriétés
                </p>
                {searchResults.properties.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setShowSearchResults(false);
                      router.push(`/admin/properties?q=${encodeURIComponent(debouncedSearch)}`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#13294D] transition-colors text-left"
                  >
                    <Building2 className="w-4 h-4 text-[#8b9cb8]/70 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-[#E6EEF8] font-medium truncate">{p.title || 'Propriété'}</p>
                      <p className="text-[11px] text-[#8b9cb8] truncate">
                        {[p.city, p.country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </button>
                ))}
              </>
            )}
            {!isSearching && (
              <button
                onClick={goToSearch}
                className="w-full px-4 py-2 mt-1 border-t border-[#003087]/15 text-[11px] text-primary-green hover:text-white transition-colors text-left"
              >
                Voir tous les résultats dans « Utilisateurs » →
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 sm:hidden" />

      {/* ── Sélecteur pays — contrôle multi-pays réel ── */}
      <div ref={countryMenuRef} className="relative">
        <button
          onClick={() => setShowCountryMenu(!showCountryMenu)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#0F1F3C]/60 transition-colors text-sm font-medium text-[#E6EEF8]"
          title="Basculer vers le backoffice du pays"
        >
          <span className="flex items-center gap-1.5">
            {selectedCountryData.flagIcon === 'globe' ? (
              <Globe className="w-4 h-4 text-[#8b9cb8]" />
            ) : (
              <span className="text-xs font-bold text-[#8b9cb8] bg-[#0F1F3C] rounded px-1 py-0.5">{selectedCountryData.flagIcon}</span>
            )}
          </span>
          <span className="hidden md:inline">{selectedCountryData.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#8b9cb8]/80" />
        </button>
        {showCountryMenu && (
          <div className="absolute right-0 mt-1 w-56 bg-[#0F1F3C] rounded-lg shadow-lg border border-[#003087]/20 py-1 z-50">
            <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#8b9cb8]/60">
              Console globale
            </p>
            {COUNTRIES.filter((c) => c.code === 'ALL').map((c) => (
              <button
                key={c.code}
                onClick={() => handleCountrySelect(c.code)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#13294D] transition-colors text-[#E6EEF8]',
                  selectedCountry === c.code && 'bg-[#D4AF37]/15 text-[#D4AF37] font-medium'
                )}
              >
                <Globe className="w-4 h-4 text-[#8b9cb8]" />
                <span>{c.label}</span>
              </button>
            ))}
            <p className="px-3 py-1.5 mt-1 border-t border-[#003087]/15 text-[9px] font-bold uppercase tracking-wider text-[#8b9cb8]/60">
              Backoffices par pays
            </p>
            {COUNTRIES.filter((c) => c.code !== 'ALL').map((c) => (
              <button
                key={c.code}
                onClick={() => handleCountrySelect(c.code)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#13294D] transition-colors text-[#E6EEF8]',
                  selectedCountry === c.code && 'bg-[#D4AF37]/15 text-[#D4AF37] font-medium'
                )}
              >
                <span className="text-xs font-bold text-[#8b9cb8] bg-[#0F1F3C] rounded px-1 py-0.5">{c.flagIcon}</span>
                <span>{c.label}</span>
                <span className="ml-auto text-[9px] text-[#8b9cb8]/50">backoffice →</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Actions rapides (liens réels) ── */}
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
          <div className="absolute right-0 mt-1 w-60 bg-[#0F1F3C] rounded-lg shadow-lg border border-[#003087]/20 py-1 z-50">
            <Link
              href="/admin/users"
              onClick={() => setShowActions(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#E6EEF8] hover:bg-[#13294D] transition-colors"
            >
              <User className="w-4 h-4 text-[#8b9cb8]/80" />
              Gérer les utilisateurs
            </Link>
            <Link
              href="/admin/properties?status=pending"
              onClick={() => setShowActions(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#E6EEF8] hover:bg-[#13294D] transition-colors"
            >
              <Building2 className="w-4 h-4 text-[#8b9cb8]/80" />
              Propriétés à valider
            </Link>
            <Link
              href="/admin/analytics"
              onClick={() => setShowActions(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#E6EEF8] hover:bg-[#13294D] transition-colors"
            >
              <Download className="w-4 h-4 text-[#8b9cb8]/80" />
              Rapports & exports
            </Link>
            <Link
              href="/admin/ota"
              onClick={() => setShowActions(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#E6EEF8] hover:bg-[#13294D] transition-colors"
            >
              <Globe className="w-4 h-4 text-[#8b9cb8]/80" />
              Synchroniser OTA
            </Link>
          </div>
        )}
      </div>

      {/* ── Cloche notifications (compteur réel) ── */}
      <Link
        href="/admin/notifications"
        className="relative p-2 rounded-lg hover:bg-[#0F1F3C]/60 transition-colors"
        title={`${notificationCount} notification(s) non lue(s)`}
      >
        <Bell className="w-5 h-5 text-[#8b9cb8]" />
        {notificationCount > 0 && (
          <Badge className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] bg-[#D4AF37] text-[#003087] font-bold border-0">
            {notificationCount > 99 ? '99+' : notificationCount}
          </Badge>
        )}
      </Link>

      {/* ── Menu utilisateur (liens réels) ── */}
      <div ref={userMenuRef} className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2.5 pl-2 pr-1.5 py-1 rounded-lg hover:bg-[#0F1F3C]/60 transition-colors"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={userAvatar || undefined} />
            <AvatarFallback className="bg-[#003087] text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-[#E6EEF8] leading-tight">{userName}</p>
            <p className="text-[11px] text-[#8b9cb8] leading-tight capitalize">{userRole}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#8b9cb8]/80 hidden md:block" />
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-1 w-56 bg-[#0F1F3C] rounded-lg shadow-lg border border-[#003087]/20 py-1 z-50">
            <div className="px-3 py-2 border-b border-[#003087]/20">
              <p className="text-sm font-medium text-[#E6EEF8]">{userName}</p>
              <p className="text-xs text-[#8b9cb8] capitalize">{userRole}</p>
            </div>
            <Link
              href="/profile"
              onClick={() => setShowUserMenu(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#E6EEF8] hover:bg-[#13294D] transition-colors"
            >
              <User className="w-4 h-4 text-[#8b9cb8]/80" />
              Mon profil
            </Link>
            <Link
              href="/admin/settings"
              onClick={() => setShowUserMenu(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#E6EEF8] hover:bg-[#13294D] transition-colors"
            >
              <Settings className="w-4 h-4 text-[#8b9cb8]/80" />
              Paramètres
            </Link>
            <Link
              href="/admin/audit-logs"
              onClick={() => setShowUserMenu(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#E6EEF8] hover:bg-[#13294D] transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-[#8b9cb8]/80" />
              Journal d&apos;audit
            </Link>
            <div className="border-t border-[#003087]/20 mt-1 pt-1">
              <button
                onClick={() => signOutAndClear({ callbackUrl: '/auth/login' })}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
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
