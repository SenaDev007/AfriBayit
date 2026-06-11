'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { SessionProvider } from 'next-auth/react';
import { ArrowLeft, ArrowLeftRight, BarChart3, Bell, Building2, ChevronDown, ChevronRight, Globe, Home, Hotel, LayoutDashboard, LogOut, Menu, Plus, RefreshCw, Search, Settings, ShieldCheck, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const COUNTRY_CONFIG: Record<string, { name: string; flag: string }> = {
  BJ: { name: 'Bénin', flag: '🇧🇯' },
  CI: { name: "Côte d'Ivoire", flag: '🇨🇮' },
  BF: { name: 'Burkina Faso', flag: '🇧🇫' },
  TG: { name: 'Togo', flag: '🇹🇬' },
};

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

function getNavGroups(country: string): NavGroup[] {
  const base = `/admin/${country}`;
  return [
    {
      label: 'TABLEAU DE BORD',
      items: [
        { label: "Vue d'ensemble", href: `${base}/dashboard`, icon: LayoutDashboard },
        { label: 'Analytics', href: `${base}/dashboard?tab=analytics`, icon: BarChart3 },
      ],
    },
    {
      label: 'GESTION',
      items: [
        { label: 'Utilisateurs', href: `${base}/users`, icon: Users },
        { label: 'Propriétés', href: `${base}/properties`, icon: Building2 },
        { label: 'Transactions', href: `${base}/transactions`, icon: ArrowLeftRight },
      ],
    },
    {
      label: 'HÔTELLERIE',
      items: [
        { label: 'Hôtels & Séjours', href: `${base}/hospitality`, icon: Hotel },
        { label: 'Guesthouses', href: `${base}/hospitality?tab=guesthouses`, icon: Home },
      ],
    },
    {
      label: 'ADMINISTRATION',
      items: [
        { label: 'Accréditations', href: `${base}/accreditations`, icon: ShieldCheck },
        { label: 'Paramètres', href: `${base}/dashboard?tab=settings`, icon: Settings },
      ],
    },
  ];
}

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  users: 'Utilisateurs',
  properties: 'Propriétés',
  transactions: 'Transactions',
  hospitality: 'Hôtellerie',
  accreditations: 'Accréditations',
  analytics: 'Analytics',
  settings: 'Paramètres',
};

function CountryHeader({
  country,
  config,
  onMobileMenuToggle,
}: {
  country: string;
  config: { name: string; flag: string };
  onMobileMenuToggle: () => void;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
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

  // Build breadcrumb segments
  const segments = pathname.split('/').filter(Boolean).slice(2); // Remove 'admin' and country code

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shrink-0">
      {/* Branding accent */}
      <div className="h-1 bg-gradient-to-r from-[#003087] via-[#D4AF37] to-[#009CDE]" />

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
          <Link href={`/admin/${country}/dashboard`} className="text-gray-400 hover:text-[#003087] transition-colors shrink-0">
            <Home className="w-3.5 h-3.5" />
          </Link>
          <span className="text-gray-300 shrink-0">/</span>
          <span className="text-[#003087] font-semibold">{config.flag} {config.name}</span>
          {segments.map((segment, idx) => {
            const isLast = idx === segments.length - 1;
            const label = BREADCRUMB_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
            return (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
                {isLast ? (
                  <span className="text-gray-900 font-medium truncate">{label}</span>
                ) : (
                  <span className="text-gray-400 truncate">{label}</span>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Mobile: country name */}
        <div className="sm:hidden flex items-center gap-2 flex-1">
          <span className="text-lg">{config.flag}</span>
          <span className="text-sm font-bold text-[#003087]">{config.name}</span>
          <Badge className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] font-bold border-0">
            {country}
          </Badge>
        </div>

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

        {/* Quick actions */}
        <div className="hidden lg:flex items-center gap-1.5">
          <Link
            href={`/admin/${country}/accreditations`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#003087] text-white text-sm font-medium hover:bg-[#002a70] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Accréditer</span>
          </Link>
        </div>

        {/* Notification bell */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
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

interface CountryLayoutProps {
  children: React.ReactNode;
}

function CountryLayoutInner({ children }: CountryLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const country = (params.country as string) || 'BJ';
  const config = COUNTRY_CONFIG[country] || { name: country, flag: '🌐' };
  const navGroups = getNavGroups(country);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    navGroups.forEach((group) => {
      if (group.items.some((item) => pathname.startsWith(item.href.split('?')[0]))) {
        initial.add(group.label);
      }
    });
    initial.add(navGroups[0].label);
    return initial;
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const filteredGroups = searchQuery
    ? navGroups.map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((group) => group.items.length > 0)
    : navGroups;

  const isActive = (href: string) => {
    const basePath = href.split('?')[0];
    return pathname === basePath || pathname.startsWith(basePath + '/');
  };

  const sidebar = (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out',
        'bg-[#003087] text-white',
        sidebarCollapsed ? 'w-[72px]' : 'w-[280px]'
      )}
    >
      {/* Header with country flag */}
      <div className="flex items-center h-16 px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#D4AF37] flex items-center justify-center shrink-0 text-lg">
            {config.flag}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight truncate">{config.name}</h1>
              <p className="text-[10px] text-white/60 uppercase tracking-widest">
                Backoffice {country}
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'ml-auto p-1.5 rounded-md hover:bg-white/10 transition-colors shrink-0',
            sidebarCollapsed && 'ml-0'
          )}
        >
          <ChevronRight
            className={cn('w-4 h-4 transition-transform', !sidebarCollapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Back to global admin */}
      <div className="border-b border-white/10 px-3 py-2 shrink-0">
        <Link
          href="/admin/dashboard"
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors',
            sidebarCollapsed && 'justify-center px-2'
          )}
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && <span>Retour au backoffice global</span>}
        </Link>
      </div>

      {/* Search */}
      {!sidebarCollapsed && (
        <div className="px-3 py-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-white/10 border-white/10 text-white placeholder:text-white/40 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar-thin">
        {filteredGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.label);
          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  'w-full flex items-center gap-1 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider',
                  'text-white/50 hover:text-white/80 transition-colors rounded',
                  sidebarCollapsed && 'justify-center'
                )}
              >
                {!sidebarCollapsed && <span className="truncate">{group.label}</span>}
                {!sidebarCollapsed && (
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 ml-auto transition-transform shrink-0',
                      !isExpanded && '-rotate-90'
                    )}
                  />
                )}
              </button>
              {isExpanded && (
                <div className="space-y-0.5 mt-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all',
                          active
                            ? 'bg-[#D4AF37] text-[#003087] shadow-sm'
                            : 'text-white/75 hover:bg-white/10 hover:text-white',
                          sidebarCollapsed && 'justify-center px-2'
                        )}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <Icon className={cn('w-4 h-4 shrink-0', active && 'text-[#003087]')} />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Country badge — locked */}
      <div className="border-t border-white/10 px-3 py-3 shrink-0">
        {!sidebarCollapsed ? (
          <div className="flex items-center gap-2 px-2.5 py-2 bg-white/5 rounded-lg">
            <Globe className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {config.flag} {config.name}
              </p>
              <p className="text-[10px] text-white/50">Pays verrouillé</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center text-lg">{config.flag}</div>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10">
            <aside
              className="fixed left-0 top-0 h-screen flex flex-col w-[280px] bg-[#003087] text-white"
            >
              {/* Simplified mobile sidebar */}
              <div className="flex items-center h-16 px-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#D4AF37] flex items-center justify-center text-lg">
                    {config.flag}
                  </div>
                  <div>
                    <h1 className="text-base font-bold">{config.name}</h1>
                    <p className="text-[10px] text-white/60 uppercase tracking-widest">Backoffice {country}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="ml-auto p-1.5 rounded-md hover:bg-white/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="border-b border-white/10 px-3 py-2">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-white/60 hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour au backoffice global
                </Link>
              </div>
              <nav className="flex-1 overflow-y-auto py-2 px-2">
                {navGroups.map((group) => (
                  <div key={group.label} className="mb-1">
                    <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50">{group.label}</p>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all',
                              active ? 'bg-[#D4AF37] text-[#003087]' : 'text-white/75 hover:bg-white/10 hover:text-white'
                            )}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </aside>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[280px]'
        )}
      >
        {/* Country header bar */}
        <CountryHeader
          country={country}
          config={config}
          onMobileMenuToggle={() => setMobileMenuOpen(true)}
        />
        <main className="p-4 sm:p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export default function CountryLayout({ children }: CountryLayoutProps) {
  return (
    <SessionProvider>
      <CountryLayoutInner>{children}</CountryLayoutInner>
    </SessionProvider>
  );
}
