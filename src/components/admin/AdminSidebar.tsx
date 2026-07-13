import Image from 'next/image';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  ShieldCheck,
  Globe,
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronRight,
  Users,
  Building2,
  ArrowLeftRight,
  Hotel,
  Home,
  KeyRound,
  Settings,
  DollarSign,
  Cable,
  ScrollText,
  Hammer,
  Scale,
  Star,
  AlertTriangle,
  FileText,
  CalendarDays,
  Wallet,
  Banknote,
  Lock,
  Award,
  Bell,
  CreditCard,
  GraduationCap,
  Bot,
  TrendingUp,
  FileSignature,
  Layers,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const PILOT_COUNTRIES = [
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
];

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

/**
 * Admin sidebar navigation — aligned with CDC V4 modules
 *
 * The sidebar is organized in 7 top-level groups that mirror the CDC's
 * module structure (§5 — Modules métier, §6 — Escrow, §7 — Payments,
 * §8 — IA Rebecca, §10 — Sécurité, §11 — Revenus):
 *
 *   1. Vue d'ensemble        — global KPIs, analytics, revenue
 *   2. Immobilier             — properties, transactions, leases, escrow
 *   3. Hôtellerie             — hotels, guesthouses, short-term, bookings
 *   4. Services Pro           — artisans, notaries, geotrust, courses
 *   5. Communauté             — community, ambassadors, reviews, disputes
 *   6. Finances               — payouts, wallets, subscriptions, revenue
 *   7. Intelligence & Système — Rebecca IA, KYC, multi-roles, settings,
 *                              notifications, audit-logs, OTA, content
 *
 * Each country also has its own sub-backoffice accessible via the
 * 'BACKOFFICES PAR PAYS' section at the bottom.
 */
const GLOBAL_NAV_GROUPS: NavGroup[] = [
  {
    label: 'VUE D\'ENSEMBLE',
    items: [
      { label: 'Tableau de bord', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Revenus', href: '/admin/revenue', icon: DollarSign },
    ],
  },
  {
    label: 'IMMOBILIER (§5.1)',
    items: [
      { label: 'Propriétés', href: '/admin/properties', icon: Building2 },
      { label: 'Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
      { label: 'Baux & Loyers', href: '/admin/leases', icon: KeyRound },
      { label: 'Escrow', href: '/admin/escrow', icon: Lock },
      { label: 'Investissements', href: '/admin/investments', icon: TrendingUp },
    ],
  },
  {
    label: 'HÔTELLERIE (§5.2-5.4)',
    items: [
      { label: 'Hôtels', href: '/admin/hotels', icon: Hotel },
      { label: 'Guesthouses', href: '/admin/guesthouses', icon: Home },
      { label: 'Locations courte durée', href: '/admin/short-term-rentals', icon: KeyRound },
      { label: 'Réservations', href: '/admin/bookings', icon: CalendarDays },
    ],
  },
  {
    label: 'SERVICES PRO (§5.5-5.6)',
    items: [
      { label: 'Artisans BTP', href: '/admin/artisans', icon: Hammer },
      { label: 'Notaires', href: '/admin/notaries', icon: Scale },
      { label: 'GeoTrust', href: '/admin/geotrust', icon: ShieldCheck },
      { label: 'Académie', href: '/admin/courses', icon: GraduationCap },
    ],
  },
  {
    label: 'COMMUNAUTÉ (§5.7)',
    items: [
      { label: 'Communauté', href: '/admin/community', icon: MessageCircle },
      { label: 'Ambassadeurs', href: '/admin/ambassadors', icon: Award },
      { label: 'Avis', href: '/admin/reviews', icon: Star },
      { label: 'Litiges', href: '/admin/disputes', icon: AlertTriangle },
      { label: 'Contenu', href: '/admin/content', icon: FileText },
    ],
  },
  {
    label: 'FINANCES (§6-7-11)',
    items: [
      { label: 'Transactions', href: '/admin/transactions', icon: ArrowLeftRight },
      { label: 'Portefeuilles', href: '/admin/wallets', icon: Wallet },
      { label: 'Paiements', href: '/admin/payouts', icon: Banknote },
      { label: 'Abonnements', href: '/admin/subscriptions', icon: CreditCard },
    ],
  },
  {
    label: 'INTELLIGENCE & SYSTÈME (§8-10)',
    items: [
      { label: 'Rebecca IA', href: '/admin/rebecca', icon: Bot },
      { label: 'KYC & Vérification', href: '/admin/kyc', icon: ShieldCheck },
      { label: 'Utilisateurs & Rôles', href: '/admin/users', icon: Users },
      { label: 'Multi-rôles (gestion)', href: '/admin/multi-roles', icon: Users },
      { label: 'Notifications', href: '/admin/notifications', icon: Bell },
      { label: 'Pays & Backoffices', href: '/admin/countries', icon: Globe },
      { label: 'Accréditations', href: '/admin/accreditations', icon: KeyRound },
      { label: 'OTA Config', href: '/admin/ota', icon: Cable },
      { label: 'Paramètres plateforme', href: '/admin/settings', icon: Settings },
      { label: "Journaux d'audit", href: '/admin/audit-logs', icon: ScrollText },
    ],
  },
];

function getCountryNavGroups(country: string): NavGroup[] {
  const base = `/admin/${country}`;
  return [
    {
      label: `${country} — VUE D'ENSEMBLE`,
      items: [
        { label: "Vue d'ensemble", href: `${base}/dashboard`, icon: LayoutDashboard },
      ],
    },
    {
      label: `${country} — IMMOBILIER`,
      items: [
        { label: 'Utilisateurs', href: `${base}/users`, icon: Users },
        { label: 'Propriétés', href: `${base}/properties`, icon: Building2 },
        { label: 'Transactions', href: `${base}/transactions`, icon: ArrowLeftRight },
      ],
    },
    {
      label: `${country} — HÔTELLERIE`,
      items: [
        { label: 'Hôtels & Guesthouses', href: `${base}/hospitality`, icon: Hotel },
        { label: 'Réservations', href: `${base}/bookings`, icon: CalendarDays },
        { label: 'Avis', href: `${base}/reviews`, icon: Star },
      ],
    },
    {
      label: `${country} — SERVICES PRO`,
      items: [
        { label: 'Artisans', href: `${base}/artisans`, icon: Hammer },
        { label: 'Notaires', href: `${base}/notaries`, icon: Scale },
        { label: 'GeoTrust', href: `${base}/geotrust`, icon: ShieldCheck },
        { label: 'Ambassadeurs', href: `${base}/ambassadors`, icon: Award },
      ],
    },
    {
      label: `${country} — ADMINISTRATION`,
      items: [
        { label: 'Accréditations', href: `${base}/accreditations`, icon: ShieldCheck },
        { label: 'Notifications', href: `${base}/notifications`, icon: Bell },
        { label: 'Contenu', href: `${base}/content`, icon: FileText },
        { label: 'Locations courte durée', href: `${base}/short-term-rentals`, icon: KeyRound },
      ],
    },
  ];
}

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
    const initial = new Set<string>();
    GLOBAL_NAV_GROUPS.forEach((group) => {
      if (group.items.some((item) => pathname.startsWith(item.href.split('?')[0]))) {
        initial.add(group.label);
      }
    });
    // Always expand first group
    initial.add(GLOBAL_NAV_GROUPS[0].label);
    return initial;
  });
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Auto-expand country that matches current path
    const countryMatch = pathname.match(/^\/admin\/([A-Z]{2})\//);
    if (countryMatch) {
      initial.add(countryMatch[1]);
    }
    return initial;
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const toggleCountry = (code: string) => {
    setExpandedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const isActive = (href: string) => {
    const basePath = href.split('?')[0];
    return pathname === basePath || pathname.startsWith(basePath + '/');
  };

  // Filter nav items by search
  const filteredGlobalGroups = searchQuery
    ? GLOBAL_NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter((group) => group.items.length > 0)
    : GLOBAL_NAV_GROUPS;

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
          <Image src="/logo.png" alt="AfriBayit" width={160} height={48} className="h-12 w-auto object-contain shrink-0" priority />
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
        {/* Global nav groups */}
        {filteredGlobalGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.label);
          return (
            <div key={group.label} className="mb-1">
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
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Country sections */}
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            {!collapsed ? 'BACKOFFICES PAR PAYS' : ''}
          </div>
          {PILOT_COUNTRIES.map((country) => {
            const isCountryExpanded = expandedCountries.has(country.code);
            const isCountryActive = pathname.startsWith(`/admin/${country.code}`);
            const countryGroups = getCountryNavGroups(country.code);

            return (
              <div key={country.code} className="mb-0.5">
                {/* Country header */}
                <button
                  onClick={() => toggleCountry(country.code)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all',
                    isCountryActive
                      ? 'bg-white/15 text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white/90',
                    collapsed && 'justify-center px-2'
                  )}
                  title={collapsed ? country.name : undefined}
                >
                  <span className="text-base shrink-0">{country.flag}</span>
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 text-left">{country.name}</span>
                      <ChevronDown
                        className={cn(
                          'w-3 h-3 transition-transform shrink-0',
                          !isCountryExpanded && '-rotate-90'
                        )}
                      />
                    </>
                  )}
                </button>

                {/* Country sub-items */}
                {isCountryExpanded && !collapsed && (
                  <div className="ml-3 border-l border-white/10 pl-2 space-y-0.5 mt-0.5">
                    {countryGroups.flatMap((group) =>
                      group.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                              'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                              active
                                ? 'bg-[#D4AF37] text-[#003087] shadow-sm'
                                : 'text-white/60 hover:bg-white/10 hover:text-white/90'
                            )}
                          >
                            <Icon className={cn('w-3.5 h-3.5 shrink-0', active && 'text-[#003087]')} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

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
