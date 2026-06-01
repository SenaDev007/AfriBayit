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
    href: '/search?tab=achat',
    description: 'Villas, appartements, terrains à vendre',
    icon: Home,
  },
  {
    title: 'Louer',
    href: '/search?tab=location',
    description: 'Location longue durée dans 5 pays',
    icon: Key,
  },
  {
    title: 'Investir',
    href: '/search?tab=investissement',
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
    title: 'Hôtels',
    href: '/hospitality',
    description: 'Réservez des hôtels vérifiés',
    icon: Hotel,
  },
  {
    title: 'Guesthouses',
    href: '/guesthouse',
    description: 'Séjournez chez l\'habitant',
    icon: BedDouble,
  },
  {
    title: 'Réservation',
    href: '/booking',
    description: 'Réservez votre séjour en ligne',
    icon: CalendarDays,
    gold: true,
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
    title: 'Escrow Sécurisé',
    href: '/escrow',
    description: 'Transactions protégées par escrow',
    icon: Shield,
  },
  {
    title: 'Académie',
    href: '/academy',
    description: 'Formations immobilières en ligne',
    icon: GraduationCap,
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
    href: '#',
    description: 'Découvrez l\'équipe AfriBayit',
    icon: Users,
  },
  {
    title: 'Témoignages',
    href: '#',
    description: 'Ce que nos clients disent de nous',
    icon: Star,
  },
  {
    title: 'Partenariats',
    href: '#',
    icon: Handshake,
    description: 'Collaborez avec AfriBayit',
  },
];

const companyLinks2: LinkItem[] = [
  {
    title: 'CGU',
    href: '#',
    icon: FileText,
  },
  {
    title: 'Confidentialité',
    href: '#',
    icon: Shield,
  },
  {
    title: 'Remboursement',
    href: '#',
    icon: RotateCcw,
  },
  {
    title: 'Blog',
    href: '#',
    icon: Leaf,
  },
  {
    title: 'Aide',
    href: '#',
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
  const scrolled = useScroll(10);

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
  const isHome = typeof window !== 'undefined' && window.location.pathname === '/';
  const textColor = scrolled ? 'text-[#2C2E2F]' : (isHome ? 'text-white' : 'text-[#2C2E2F]');
  const mutedColor = scrolled ? 'text-gray-500' : (isHome ? 'text-white/70' : 'text-gray-500');

  return (
    <header
      className={cn('sticky top-0 z-50 w-full border-b border-transparent transition-all duration-300', {
        'bg-background/95 supports-[backdrop-filter]:bg-background/50 border-border backdrop-blur-lg shadow-sm':
          scrolled,
        'bg-transparent': !scrolled,
      })}
    >
      <nav className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-5">
          {/* Logo */}
          <a href="/" className="hover:bg-accent rounded-md p-2 transition-colors">
            <img
              src="/logo.png"
              alt="AfriBayit"
              className={cn(
                'h-10 w-auto object-contain transition-all duration-300',
                !scrolled && isHome ? 'brightness-0 invert drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]' : '',
              )}
            />
          </a>

          {/* Desktop Navigation Menu */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              {/* Immobilier */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn('bg-transparent', textColor)}>
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
                      <a href="/search?tab=investissement" className="text-[#D4AF37] font-medium hover:underline">
                        Voir les opportunités
                      </a>
                    </p>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Hôtellerie */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn('bg-transparent', textColor)}>
                  Hôtellerie
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-background p-1 pr-1.5">
                  <ul className="bg-popover space-y-2 rounded-md border p-2 shadow">
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
                <NavigationMenuTrigger className={cn('bg-transparent', textColor)}>
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
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Entreprise */}
              <NavigationMenuItem>
                <NavigationMenuTrigger className={cn('bg-transparent', textColor)}>
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
            className="border-[#003087]/20 text-[#003087] hover:bg-[#003087]/5"
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

          {/* Connexion */}
          <Button
            variant="outline"
            size="sm"
            className="border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white"
            onClick={() => window.location.href = '/auth/login'}
          >
            Connexion
          </Button>
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
        'data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground',
        'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
        'rounded-sm p-2',
        gold && 'text-[#D4AF37]',
        className,
      )}
      {...props}
      asChild
    >
      <a href={href}>
        <div className={cn(
          'flex aspect-square size-12 items-center justify-center rounded-md border shadow-sm',
          gold ? 'bg-[#D4AF37]/10 border-[#D4AF37]/20' : 'bg-background/40',
        )}>
          <Icon className={cn('size-5', gold ? 'text-[#D4AF37]' : 'text-[#003087]')} />
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className={cn('font-medium', gold && 'text-[#D4AF37]')}>{title}</span>
          <span className="text-muted-foreground text-xs">{description}</span>
        </div>
      </a>
    </NavigationMenuLink>
  );
}
