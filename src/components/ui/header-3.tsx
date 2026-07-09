'use client';
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { createPortal } from 'react-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu';
import { LucideIcon } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import {
  Home,
  Key,
  TrendingUp,
  CalendarDays,
  Hotel,
  BedDouble,
  Wrench,
  Landmark,
  ShieldCheck,
  GraduationCap,
  Shield,
  Wallet,
  CreditCard,
  MessageCircle,
  Briefcase,
  BarChart3,
  Users,
  Star,
  FileText,
  RotateCcw,
  Handshake,
  HelpCircle,
  Leaf,
  GlobeIcon,
  LayersIcon,
  UserPlusIcon,
  PlugIcon,
  CodeIcon,
  Bell,
  Plus,
  LayoutDashboard,
  LogOut,
  Languages,
  User,
  Settings,
  ChevronDown,
  KeyRound,
  Building2,
  TrendingUp,
} from 'lucide-react';

type LinkItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  gold?: boolean;
};

function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);

  const onScroll = React.useCallback(() => {
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  React.useEffect(() => {
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  React.useEffect(() => {
    onScroll();
  }, [onScroll]);

  return scrolled;
}

// ─── AfriBayit Navigation Links ────────────────────────────────

const immobilierLinks: LinkItem[] = [
  {
    title: 'Acheter',
    href: '/acheter',
    description: 'Villas, appartements, terrains à vendre',
    icon: Home,
  },
  {
    title: 'Louer',
    href: '/louer',
    description: 'Location longue durée dans 5 pays',
    icon: Key,
  },
  {
    title: 'Investir',
    href: '/investir',
    description: 'Opportunités de rendement immobilier',
    icon: TrendingUp,
  },
  {
    title: 'Location courte durée',
    href: '/short-term',
    description: 'Séjours et locations temporaires',
    icon: CalendarDays,
  },
];

const hospitalityLinks: LinkItem[] = [
  {
    title: 'Séjours (Hôtels & Guesthouses)',
    href: '/sejours',
    description: 'Réservez hôtels, guesthouses et séjours courts en Afrique de l\'Ouest',
    icon: Hotel,
  },
];

const servicesLinks: LinkItem[] = [
  {
    title: 'Artisans BTP',
    href: '/artisans',
    description: 'Trouvez des artisans qualifiés',
    icon: Wrench,
  },
  {
    title: 'Notaires',
    href: '/notary',
    description: 'Services notariaux certifiés',
    icon: Landmark,
  },
  {
    title: 'GeoTrust',
    href: '/geotrust',
    description: 'Vérification géolocalisée des biens',
    icon: ShieldCheck,
  },
  {
    title: 'Académie',
    href: '/academy',
    description: 'Formations immobilières en ligne',
    icon: GraduationCap,
  },
];

// Links visible only when logged in
const authOnlyLinks: LinkItem[] = [
  {
    title: 'Escrow Sécurisé',
    href: '/escrow',
    description: 'Transactions protégées par escrow',
    icon: Shield,
  },
  {
    title: 'Mes baux',
    href: '/leases',
    description: 'Contrats de location, signatures, états des lieux',
    icon: KeyRound,
  },
  {
    title: 'Dashboard bailleur',
    href: '/owner-dashboard',
    description: 'Revenus locatifs, taux d\'occupation, vacancies',
    icon: Building2,
  },
  {
    title: 'Portfolio investisseur',
    href: '/investor-dashboard',
    description: 'Plus-value latente, ROI, revenus locatifs',
    icon: TrendingUp,
  },
  {
    title: 'Portefeuille',
    href: '/wallet',
    description: 'Gérez vos fonds et paiements',
    icon: Wallet,
  },
];

const servicesLinks2: LinkItem[] = [
  {
    title: 'Abonnements',
    href: '/subscriptions',
    icon: CreditCard,
  },
  {
    title: 'Communauté',
    href: '/community',
    icon: MessageCircle,
  },
];

// Auth-only links for second column
const authOnlyLinks2: LinkItem[] = [
  {
    title: 'Profils Pro',
    href: '/profile',
    icon: Briefcase,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
];

const companyLinks: LinkItem[] = [
  {
    title: 'À propos',
    href: '/about',
    description: 'Découvrez l\'équipe AfriBayit',
    icon: Users,
  },
  {
    title: 'Nos réalisations',
    href: '/our-work',
    description: 'Projets immobiliers et hôteliers',
    icon: GlobeIcon,
  },
  {
    title: 'Témoignages',
    href: '/#testimonials',
    description: 'Ce que nos clients disent de nous',
    icon: Star,
  },
  {
    title: 'Partenariats',
    href: '/partnership',
    icon: Handshake,
    description: 'Collaborez avec AfriBayit',
  },
];

const companyLinks2: LinkItem[] = [
  {
    title: 'CGU',
    href: '/terms',
    icon: FileText,
  },
  {
    title: 'Confidentialité',
    href: '/privacy',
    icon: Shield,
  },
  {
    title: 'Remboursement',
    href: '/refund',
    icon: RotateCcw,
  },
  {
    title: 'Blog',
    href: '/blog',
    icon: Leaf,
  },
  {
    title: 'Aide',
    href: '/help',
    icon: HelpCircle,
  },
];

// ─── AfriBayit Wordmark (logo SVG) ─────────────────────────────

const AfriBayitWordmark = (props: React.ComponentProps<'svg'>) => (
  <svg viewBox="0 0 140 24" fill="currentColor" {...props}>
    <text x="0" y="18" fontFamily="Georgia, serif" fontSize="18" fontWeight="bold" fill="currentColor">
      Afri
    </text>
    <text x="42" y="18" fontFamily="Georgia, serif" fontSize="18" fontWeight="bold" fill="#D4AF37">
      Bayit
    </text>
  </svg>
);

// ─── Main Header Component ─────────────────────────────────────

interface HeaderProps {
  onOpenNotifications?: () => void;
  notificationCount?: number;
}

export function Header({ onOpenNotifications, notificationCount = 0 }: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const scrolled = useScroll(10);
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user;
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  // Close profile menu on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Determine text colors based on scroll state and path
  const pathname = usePathname();
  const isHome = pathname === '/';
  // When on home page and not scrolled, the navbar overlays the dark navy hero,
  // so we use white text. Otherwise we use dark text on the light background.
  const onDarkHero = isHome && !scrolled;
  const textColor = onDarkHero ? 'text-white' : 'text-[#2C2E2F]';
  const mutedColor = onDarkHero ? 'text-white/70' : 'text-gray-500';
  // Hover styles that work on both dark hero and white navbar
  const triggerHoverClass = onDarkHero
    ? 'hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white'
    : 'hover:bg-[#003087]/10 hover:text-[#003087] data-[state=open]:bg-[#003087]/10 data-[state=open]:text-[#003087]';

  return (
    <header
      className={cn('sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300', {
        'bg-background/95 supports-[backdrop-filter]:bg-background/50 border-border backdrop-blur-lg shadow-sm':
          scrolled,
        'bg-transparent': !scrolled,
      })}
      style={onDarkHero ? { backgroundColor: '#001440' } : undefined}
    >
      <nav className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-5">
          {/* Logo — enlarged for stronger brand presence */}
          <a href="/" className="hover:bg-accent rounded-md p-1 transition-colors">
            <img
              src="/logo.png"
              alt="AfriBayit"
              className={cn(
                'h-16 w-auto object-contain transition-all duration-300',
                !scrolled && isHome ? 'brightness-0 invert drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]' : '',
              )}
            />
          </a>

          {/* Desktop Navigation Menu */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              {/* Immobilier */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn('bg-transparent', triggerHoverClass, textColor)}>
                  Immobilier
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-1 pr-1.5">
                  <ul className="bg-popover grid w-lg grid-cols-2 gap-2 rounded-md border p-2 shadow">
                    {immobilierLinks.map((item, i) => (
                      <li key={i}>
                        <ListItem {...item} />
                      </li>
                    ))}
                  </ul>
                  <div className="p-2">
                    <p className="text-muted-foreground text-sm">
                      Envie d&apos;investir ?{' '}
                      <a href="/investir" className="text-[#D4AF37] font-medium hover:underline">
                        Voir les opportunités
                      </a>
                    </p>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Hôtellerie */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn('bg-transparent', triggerHoverClass, textColor)}>
                  Hôtellerie
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-2">
                  <ul className="bg-popover space-y-1 rounded-md border p-3 shadow-lg min-w-[320px]">
                    {hospitalityLinks.map((item, i) => (
                      <li key={i}>
                        <ListItem {...item} />
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Services */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn('bg-transparent', triggerHoverClass, textColor)}>
                  Services
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-1 pr-1.5 pb-1.5">
                  <div className="grid w-lg grid-cols-2 gap-2">
                    <ul className="bg-popover space-y-2 rounded-md border p-2 shadow">
                      {servicesLinks.map((item, i) => (
                        <li key={i}>
                          <ListItem {...item} />
                        </li>
                      ))}
                      {isLoggedIn && authOnlyLinks.map((item, i) => (
                        <li key={`auth-${i}`}>
                          <ListItem {...item} />
                        </li>
                      ))}
                    </ul>
                    <ul className="space-y-2 p-3">
                      {servicesLinks2.map((item, i) => (
                        <li key={i}>
                          <NavigationMenuLink
                            href={item.href}
                            className="flex p-2 hover:bg-accent flex-row rounded-md items-center gap-x-2"
                          >
                            <item.icon className="text-[#003087] size-4" />
                            <span className="font-medium text-sm">{item.title}</span>
                          </NavigationMenuLink>
                        </li>
                      ))}
                      {isLoggedIn && authOnlyLinks2.map((item, i) => (
                        <li key={`auth2-${i}`}>
                          <NavigationMenuLink
                            href={item.href}
                            className="flex p-2 hover:bg-accent flex-row rounded-md items-center gap-x-2"
                          >
                            <item.icon className="text-[#003087] size-4" />
                            <span className="font-medium text-sm">{item.title}</span>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Entreprise */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn('bg-transparent', triggerHoverClass, textColor)}>
                  Entreprise
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-1 pr-1.5 pb-1.5">
                  <div className="grid w-lg grid-cols-2 gap-2">
                    <ul className="bg-popover space-y-2 rounded-md border p-2 shadow">
                      {companyLinks.map((item, i) => (
                        <li key={i}>
                          <ListItem {...item} />
                        </li>
                      ))}
                    </ul>
                    <ul className="space-y-2 p-3">
                      {companyLinks2.map((item, i) => (
                        <li key={i}>
                          <NavigationMenuLink
                            href={item.href}
                            className="flex p-2 hover:bg-accent flex-row rounded-md items-center gap-x-2"
                          >
                            <item.icon className="text-foreground size-4" />
                            <span className="font-medium text-sm">{item.title}</span>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Pricing / Tarifs */}
              <NavigationMenuLink className={cn('px-4', textColor)} asChild>
                <a href="/subscriptions" className="hover:bg-accent rounded-md p-2 text-sm font-medium">
                  Tarifs
                </a>
              </NavigationMenuLink>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side actions */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Notifications */}
          {onOpenNotifications && notificationCount > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenNotifications}
              className="relative"
            >
              <Bell className="size-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[#D93025] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Button>
          )}

          {/* Admin / Backoffice */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/admin'}
            className={cn(
              'transition-colors',
              onDarkHero
                ? 'bg-transparent border-white/40 text-white hover:bg-white/15 hover:text-white backdrop-blur-sm'
                : 'bg-background border-[#003087]/20 text-[#003087] hover:bg-[#003087]/5',
            )}
          >
            <LayoutDashboard className="size-3.5 mr-1" />
            Admin
          </Button>

          {/* Publier — Gold CTA */}
          <Button
            size="sm"
            className="bg-[#D4AF37] hover:bg-[#b8961f] text-white"
            onClick={() => window.location.href = '/publish'}
          >
            <Plus className="size-3.5 mr-1" />
            Publier
          </Button>

          {/* Connexion / Profile */}
          {status === 'loading' ? (
            <div className="w-20 h-8 bg-gray-100 rounded-md animate-pulse" />
          ) : !isLoggedIn ? (
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'transition-colors',
                onDarkHero
                  ? 'bg-transparent border-white text-white hover:bg-white hover:text-[#003087] backdrop-blur-sm'
                  : 'bg-background border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white',
              )}
              onClick={() => window.location.href = '/auth/login'}
            >
              Connexion
            </Button>
          ) : (
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-1.5"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#D4AF37]">
                  <ImageWithFallback
                    src={session?.user?.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'}
                    alt="Profile"
                    className="w-full h-full"
                    fallbackType="avatar"
                  />
                </div>
                <ChevronDown className={`w-3 h-3 text-[#003087] transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-[#2C2E2F]">{session?.user?.name || 'Utilisateur'}</p>
                    <p className="text-xs text-gray-400">{session?.user?.email || ''}</p>
                  </div>
                  <div className="py-1">
                    <a href="/dashboard" className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                      <BarChart3 className="w-4 h-4 text-gray-400" /> Dashboard
                    </a>
                    <a href="/profile" className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                      <User className="w-4 h-4 text-gray-400" /> Mon profil
                    </a>
                    <a href="/wallet" className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                      <Wallet className="w-4 h-4 text-gray-400" /> Portefeuille
                    </a>
                    <a href="/settings" className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                      <Settings className="w-4 h-4 text-gray-400" /> Paramètres
                    </a>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen(!open)}
          className={cn(
            'md:hidden',
            !scrolled && isHome
              ? 'border-white/20 text-white hover:bg-white/10'
              : 'border-[#003087]/20 text-[#003087]',
          )}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </Button>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu open={open} className="flex flex-col justify-between gap-2 overflow-y-auto">
        <NavigationMenu className="max-w-full">
          <div className="flex w-full flex-col gap-y-2">
            <span className="text-sm font-semibold text-[#003087]">Immobilier</span>
            {immobilierLinks.map((link) => (
              <ListItem key={link.title} {...link} />
            ))}
            <span className="text-sm font-semibold text-[#003087] mt-2">Hôtellerie</span>
            {hospitalityLinks.map((link) => (
              <ListItem key={link.title} {...link} />
            ))}
            <span className="text-sm font-semibold text-[#003087] mt-2">Services</span>
            {servicesLinks.map((link) => (
              <ListItem key={link.title} {...link} />
            ))}
            {servicesLinks2.map((link) => (
              <ListItem key={link.title} {...link} />
            ))}
            {isLoggedIn && (
              <>
                {authOnlyLinks.map((link) => (
                  <ListItem key={link.title} {...link} />
                ))}
                {authOnlyLinks2.map((link) => (
                  <ListItem key={link.title} {...link} />
                ))}
              </>
            )}
            <span className="text-sm font-semibold text-[#003087] mt-2">Entreprise</span>
            {companyLinks.map((link) => (
              <ListItem key={link.title} {...link} />
            ))}
            {companyLinks2.map((link) => (
              <ListItem key={link.title} {...link} />
            ))}
          </div>
        </NavigationMenu>
        <div className="flex flex-col gap-2">
          {status === 'loading' ? (
            <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
          ) : isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 px-2 py-2 mb-1">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#D4AF37]">
                  <ImageWithFallback
                    src={session?.user?.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'}
                    alt="Profile"
                    className="w-full h-full"
                    fallbackType="avatar"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2C2E2F]">{session?.user?.name || 'Utilisateur'}</p>
                  <p className="text-xs text-gray-400">{session?.user?.email || ''}</p>
                </div>
              </div>
              <a href="/dashboard" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                <BarChart3 className="w-4 h-4 text-gray-400" /> Dashboard
              </a>
              <a href="/profile" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                <User className="w-4 h-4 text-gray-400" /> Mon profil
              </a>
              <a href="/wallet" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                <Wallet className="w-4 h-4 text-gray-400" /> Portefeuille
              </a>
              <a href="/settings" className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                <Settings className="w-4 h-4 text-gray-400" /> Paramètres
              </a>
              <Button
                className="w-full bg-[#D4AF37] hover:bg-[#b8961f] text-white"
                onClick={() => { window.location.href = '/publish'; setOpen(false); }}
              >
                <Plus className="size-4 mr-1" />
                Publier une annonce
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent border-red-200 text-red-500 hover:bg-red-50"
                onClick={() => { signOut({ callbackUrl: '/' }); setOpen(false); }}
              >
                <LogOut className="size-4 mr-1" />
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="w-full bg-transparent border-[#003087] text-[#003087]"
                onClick={() => { window.location.href = '/auth/login'; setOpen(false); }}
              >
                Connexion
              </Button>
              <Button
                className="w-full bg-[#D4AF37] hover:bg-[#b8961f] text-white"
                onClick={() => { window.location.href = '/publish'; setOpen(false); }}
              >
                <Plus className="size-4 mr-1" />
                Publier une annonce
              </Button>
            </>
          )}
        </div>
      </MobileMenu>
    </header>
  );
}

// ─── Mobile Menu Portal ────────────────────────────────────────

type MobileMenuProps = React.ComponentProps<'div'> & {
  open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
  if (!open || typeof window === 'undefined') return null;

  return createPortal(
    <div
      id="mobile-menu"
      className={cn(
        'bg-background/95 supports-[backdrop-filter]:bg-background/50 backdrop-blur-lg',
        'fixed top-16 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y md:hidden',
      )}
    >
      <div
        data-slot={open ? 'open' : 'closed'}
        className={cn(
          'data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out',
          'size-full p-4',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ─── List Item for Navigation ──────────────────────────────────

function ListItem({
  title,
  description,
  icon: Icon,
  className,
  href,
  gold,
  ...props
}: React.ComponentProps<typeof NavigationMenuLink> & LinkItem) {
  return (
    <NavigationMenuLink
      className={cn(
        'w-full flex flex-row gap-x-2',
        'hover:bg-[#003087]/5 focus:bg-[#003087]/5',
        'rounded-md p-2 transition-colors',
        className,
      )}
      {...props}
      asChild
    >
      <a href={href}>
        <div className={cn(
          'flex aspect-square size-12 items-center justify-center rounded-md border shadow-sm',
          'bg-[#003087]/5 border-[#003087]/10',
        )}>
          <Icon className="size-5 text-[#003087]" />
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className="font-medium text-[#2C2E2F]">{title}</span>
          <span className="text-gray-500 text-xs">{description}</span>
        </div>
      </a>
    </NavigationMenuLink>
  );
}
