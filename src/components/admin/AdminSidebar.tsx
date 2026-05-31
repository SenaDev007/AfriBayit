'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  ShieldCheck,
  ScrollText,
  Ruler,
  Hammer,
  FileCheck,
  Building2,
  FileText,
  Flag,
  Lock,
  ArrowLeftRight,
  Wallet,
  CreditCard,
  Hotel,
  Home,
  CalendarCheck,
  MessageSquare,
  UsersRound,
  CalendarDays,
  Star,
  GraduationCap,
  BookOpen,
  UserPlus,
  Bell,
  Settings,
  ChevronDown,
  ChevronRight,
  Globe,
  ArrowLeft,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'TABLEAU DE BORD',
    items: [
      { label: "Vue d'ensemble", href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'GESTION DES UTILISATEURS',
    items: [
      { label: 'Utilisateurs', href: '/admin/users', icon: Users },
      { label: 'Agents certifiés', href: '/admin/users?role=agent', icon: ShieldCheck },
      { label: 'Notaires', href: '/admin/users?role=notary', icon: ScrollText },
      { label: 'Géomètres', href: '/admin/users?role=geometer', icon: Ruler },
      { label: 'Artisans', href: '/admin/users?role=artisan', icon: Hammer },
      { label: 'Vérifications KYC', href: '/admin/kyc', icon: FileCheck },
    ],
  },
  {
    label: 'IMMOBILIER',
    items: [
      { label: 'Propriétés', href: '/admin/properties', icon: Building2 },
      { label: 'Documents légaux', href: '/admin/properties?tab=legal', icon: FileText },
      { label: 'Signalements', href: '/admin/properties?tab=flags', icon: Flag },
    ],
  },
  {
    label: 'TRANSACTIONS & FINANCE',
    items: [
      { label: 'Escrow', href: '/admin/escrow', icon: Lock },
      { label: 'Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
      { label: 'Portefeuilles', href: '/admin/wallets', icon: Wallet },
      { label: 'Abonnements', href: '/admin/subscriptions', icon: CreditCard },
    ],
  },
  {
    label: 'HÔTELLERIE & SÉJOUR',
    items: [
      { label: 'Hôtels', href: '/admin/hotels', icon: Hotel },
      { label: 'Guesthouses', href: '/admin/guesthouses', icon: Home },
      { label: 'Réservations', href: '/admin/hotels?tab=bookings', icon: CalendarCheck },
    ],
  },
  {
    label: 'CONTENU & COMMUNAUTÉ',
    items: [
      { label: 'Communauté', href: '/admin/community', icon: MessageSquare },
      { label: 'Groupes', href: '/admin/community?tab=groups', icon: UsersRound },
      { label: 'Événements', href: '/admin/community?tab=events', icon: CalendarDays },
      { label: 'Avis', href: '/admin/community?tab=reviews', icon: Star },
    ],
  },
  {
    label: 'ACADÉMIE',
    items: [
      { label: 'Cours', href: '/admin/courses', icon: GraduationCap },
      { label: 'Inscriptions', href: '/admin/courses?tab=enrollments', icon: UserPlus },
    ],
  },
  {
    label: 'SYSTÈME',
    items: [
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Paramètres', href: '/admin/settings', icon: Settings },
    ],
  },
];

const COUNTRIES = [
  { code: 'ALL', label: 'Tous les pays', flag: '🌍' },
  { code: 'BJ', label: 'Bénin', flag: '🇧🇯' },
  { code: 'CI', label: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'BF', label: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', label: 'Togo', flag: '🇹🇬' },
];

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  selectedCountry: string;
  onCountryChange: (code: string) => void;
}

export default function AdminSidebar({
  collapsed,
  onToggle,
  selectedCountry,
  onCountryChange,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    // Expand the group that contains the active route
    const initial = new Set<string>();
    NAV_GROUPS.forEach((group) => {
      if (group.items.some((item) => pathname.startsWith(item.href.split('?')[0]))) {
        initial.add(group.label);
      }
    });
    // Always expand first group
    initial.add(NAV_GROUPS[0].label);
    return initial;
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  // Filter nav items by search
  const filteredGroups = searchQuery
    ? NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((group) => group.items.length > 0)
    : NAV_GROUPS;

  const isActive = (href: string) => {
    const basePath = href.split('?')[0];
    return pathname === basePath || pathname.startsWith(basePath + '/');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-in-out',
        'bg-[#003087] text-white',
        collapsed ? 'w-[72px]' : 'w-[280px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#D4AF37] flex items-center justify-center shrink-0">
            <span className="font-bold text-[#003087] text-sm">AB</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-bold tracking-tight truncate">AfriBayit</h1>
              <p className="text-[10px] text-white/60 uppercase tracking-widest">Admin Console</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className={cn(
            'ml-auto p-1.5 rounded-md hover:bg-white/10 transition-colors shrink-0',
            collapsed && 'ml-0'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight
            className={cn('w-4 h-4 transition-transform', !collapsed && 'rotate-180')}
          />
        </button>
      </div>

      {/* Search */}
      {!collapsed && (
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
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.label)}
                className={cn(
                  'w-full flex items-center gap-1 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider',
                  'text-white/50 hover:text-white/80 transition-colors rounded',
                  collapsed && 'justify-center'
                )}
              >
                {!collapsed && <span className="truncate">{group.label}</span>}
                {!collapsed && (
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 ml-auto transition-transform shrink-0',
                      !isExpanded && '-rotate-90'
                    )}
                  />
                )}
              </button>

              {/* Group items */}
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
                          collapsed && 'justify-center px-2'
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={cn('w-4 h-4 shrink-0', active && 'text-[#003087]')} />
                        {!collapsed && (
                          <>
                            <span className="truncate">{item.label}</span>
                            {item.badge !== undefined && (
                              <span
                                className={cn(
                                  'ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                                  active
                                    ? 'bg-[#003087]/20 text-[#003087]'
                                    : 'bg-white/15 text-white'
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Country Filter */}
      <div className="border-t border-white/10 px-3 py-3 shrink-0">
        {!collapsed ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-white/50 uppercase tracking-wider font-semibold">
              <Globe className="w-3 h-3" />
              <span>Pays</span>
            </div>
            <select
              value={selectedCountry}
              onChange={(e) => onCountryChange(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-md px-2.5 py-1.5 text-xs text-white focus:border-[#D4AF37] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/20"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code} className="bg-[#003087] text-white">
                  {c.flag} {c.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <button
            onClick={onToggle}
            className="w-full flex justify-center py-1"
            title="Expand to select country"
          >
            <Globe className="w-4 h-4 text-white/50" />
          </button>
        )}
      </div>

      {/* Back to site */}
      <div className="border-t border-white/10 px-3 py-3 shrink-0">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors',
            collapsed && 'justify-center px-2'
          )}
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Retour au site</span>}
        </Link>
      </div>
    </aside>
  );
}
