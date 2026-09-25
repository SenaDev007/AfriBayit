'use client';
import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import {
  Home,
  Key,
  TrendingUp,
  Hotel,
  Wrench,
  Landmark,
  ShieldCheck,
  GraduationCap,
  Shield,
  CreditCard,
  MessageCircle,
  Users,
  RotateCcw,
  Handshake,
  HelpCircle,
  GlobeIcon,
  FileText,
  Bell,
  Plus,
  LayoutDashboard,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Leaf,
  Wallet,
  CalendarDays,
  BarChart3,
  Briefcase,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { signOutAndClear } from '@/lib/signout';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { usePathname } from 'next/navigation';

type LinkItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  /** Visible uniquement pour les utilisateurs connectés */
  authOnly?: boolean;
};

// ─── AfriBayit Navigation Links ────────────────────────────────

const immobilierLinks: LinkItem[] = [
  { title: 'Acheter', href: '/acheter', description: 'Villas, appartements, terrains à vendre', icon: Home },
  { title: 'Louer', href: '/louer', description: 'Location longue durée dans 5 pays', icon: Key },
  { title: 'Investir', href: '/investir', description: 'Opportunités de rendement immobilier', icon: TrendingUp },
  { title: 'Location courte durée', href: '/short-term', description: 'Appartements et villas à la nuit', icon: CalendarDays },
];

const hospitalityLinks: LinkItem[] = [
  {
    title: 'Séjours — Hôtels & Guesthouses',
    href: '/sejours',
    description: 'Hôtels, guesthouses et locations courte durée en Afrique de l\u2019Ouest',
    icon: Hotel,
  },
];

const servicesLinks: LinkItem[] = [
  { title: 'Artisans BTP', href: '/artisans', description: 'Trouvez des artisans qualifiés', icon: Wrench },
  { title: 'Notaires', href: '/notary', description: 'Services notariaux certifiés', icon: Landmark },
  { title: 'GeoTrust', href: '/geotrust', description: 'Vérification géolocalisée des biens', icon: ShieldCheck },
  { title: 'Académie', href: '/academy', description: 'Formations immobilières en ligne', icon: GraduationCap },
  { title: 'Escrow Sécurisé', href: '/escrow', description: 'Transactions protégées par séquestre', icon: Shield, authOnly: true },
  { title: 'Portefeuille', href: '/wallet', description: 'Gérez vos fonds et paiements', icon: Wallet, authOnly: true },
  { title: 'Abonnements', href: '/subscriptions', description: 'Plans professionnels et tarifs', icon: CreditCard },
];

const communauteLinks: LinkItem[] = [
  { title: 'Forum & Groupes', href: '/community', description: 'Communauté d\u2019investisseurs et d\u2019acteurs', icon: MessageCircle },
  { title: 'Profils Pro', href: '/profile', description: 'Profils professionnels vérifiés', icon: Briefcase },
  { title: 'Analytics', href: '/analytics', description: 'Statistiques et performances', icon: BarChart3 },
];

const entrepriseLinks: LinkItem[] = [
  { title: 'À propos', href: '/about', description: 'Découvrez l\u2019équipe AfriBayit', icon: Users },
  { title: 'Nos réalisations', href: '/our-work', description: 'Projets immobiliers et hôteliers', icon: GlobeIcon },
  { title: 'Partenariats', href: '/partnership', description: 'Collaborez avec AfriBayit', icon: Handshake },
  { title: 'Blog', href: '/blog', icon: Leaf },
  { title: 'Centre d\u2019aide', href: '/help', icon: HelpCircle },
  { title: 'CGU', href: '/terms', icon: FileText },
  { title: 'Confidentialité', href: '/privacy', icon: Shield },
  { title: 'Remboursement', href: '/refund', icon: RotateCcw },
];

/** Groupes de navigation desktop — menu déroulant simple (sans animation). */
const NAV_GROUPS: { key: string; label: string; items: LinkItem[] }[] = [
  { key: 'immobilier', label: 'Immobilier', items: immobilierLinks },
  { key: 'hospitality', label: 'Hôtellerie', items: hospitalityLinks },
  { key: 'services', label: 'Services', items: servicesLinks },
  { key: 'communaute', label: 'Communauté', items: communauteLinks },
  { key: 'entreprise', label: 'Entreprise', items: entrepriseLinks },
];

// ─── Main Header Component ─────────────────────────────────────

interface HeaderProps {
  onOpenNotifications?: () => void;
  notificationCount?: number;
}

/**
 * Header public AfriBayit — navbar SIMPLE ET PROFESSIONNELLE :
 *   - Logo seul (agrandi), sans wordmark
 *   - Navigation texte horizontale avec menus déroulants au survol
 *   - Aucun effet 3D, aucune animation (apparition instantanée)
 *   - Fond blanc, ombre discrète au scroll
 *   - Menu mobile en tiroir plein écran
 */
export function Header({ onOpenNotifications, notificationCount = 0 }: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);
  const [scrolled, setScrolled] = React.useState(false);
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isLoggedIn = !!session?.user;
  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const navRef = React.useRef<HTMLDivElement>(null);

  // Scroll → fond légèrement ombré (transition CSS sobre, pas d'animation d'éléments)
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fermer les menus au clic extérieur
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Verrouiller le scroll quand le menu mobile est ouvert
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const userName = session?.user?.name || 'Utilisateur';

  // Groupe actif = l'un de ses liens correspond à la route courante
  const isGroupActive = (items: LinkItem[]) =>
    items.some((i) => (i.href === '/' ? pathname === '/' : pathname.startsWith(i.href)));
  const isHomeActive = pathname === '/';

  const visibleItems = (items: LinkItem[]) => items.filter((i) => !i.authOnly || isLoggedIn);

  return (
    <header
      className={cn(
        'sticky top-0 left-0 right-0 z-50 w-full transition-colors duration-200',
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-primary-pale'
          : 'bg-white border-b border-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo — agrandi, sans texte */}
          <Link href="/" className="flex items-center focus:outline-none shrink-0" aria-label="AfriBayit — Retour à l'accueil">
            <img src="/logo.png" alt="AfriBayit" className="h-14 w-14 object-contain" />
          </Link>

          {/* Navigation centrale — menus déroulants simples (desktop) */}
          <div className="hidden lg:flex items-center gap-1" ref={navRef}>
            <Link
              href="/"
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
                isHomeActive ? 'text-primary-green' : 'text-primary-deep hover:bg-primary-pale'
              )}
            >
              Accueil
            </Link>

            {NAV_GROUPS.map((group) => {
              const isOpen = openMenu === group.key;
              const isActive = isGroupActive(group.items);

              return (
                <div
                  key={group.key}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(group.key)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    onClick={() => setOpenMenu(isOpen ? null : group.key)}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer',
                      isActive ? 'text-primary-green' : 'text-primary-deep hover:bg-primary-pale'
                    )}
                  >
                    {group.label}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {isOpen && (
                    <div className="absolute left-0 top-full pt-2 z-50">
                      <div className="w-72 bg-white rounded-xl border border-primary-pale shadow-lg py-1.5">
                        {visibleItems(group.items).map((item) => (
                          <NavDropdownLink key={item.href} item={item} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions à droite */}
          <div className="hidden md:flex items-center gap-3">
            {/* Notifications */}
            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="relative p-2 rounded-xl hover:bg-primary-pale transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-primary-deep" />
                {notificationCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-accent-yellow text-primary-deep text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
            )}

            {/* Admin / Backoffice */}
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-sans font-bold text-primary-deep border border-primary-deep/20 hover:bg-primary-pale transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-primary-green" />
              Admin
            </Link>

            {/* CTA Publier */}
            <a
              href="/publish"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-green hover:bg-primary-deep text-white font-sans font-bold text-sm shadow-md transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-offset-2"
            >
              <Plus className="w-4 h-4" />
              Publier
            </a>

            {/* Connexion / Profil */}
            {status === 'loading' ? (
              <div className="w-20 h-9 bg-primary-pale rounded-full animate-pulse" />
            ) : !isLoggedIn ? (
              <a
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-sans font-bold text-primary-deep hover:bg-primary-pale transition-colors"
              >
                Connexion
              </a>
            ) : (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-primary-pale transition-colors cursor-pointer"
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                  aria-label="Menu du profil"
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-accent-yellow">
                    <ImageWithFallback
                      src={
                        session?.user?.image ||
                        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
                      }
                      alt="Profile"
                      className="w-full h-full"
                      fallbackType="avatar"
                    />
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-primary-deep" />
                </button>
                {profileMenuOpen && (
                  <div className="absolute right-0 top-12 w-60 bg-white rounded-2xl shadow-xl border border-primary-pale overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-primary-pale/60">
                      <p className="text-sm font-semibold text-primary-deep">{userName}</p>
                      <p className="text-xs text-gray-400 truncate">{session?.user?.email || ''}</p>
                    </div>
                    <div className="py-1">
                      <a href="/dashboard" className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-pale/50 flex items-center gap-2.5 transition-colors">
                        <BarChart3 className="w-4 h-4 text-primary-green" /> Dashboard
                      </a>
                      <a href="/profile" className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-pale/50 flex items-center gap-2.5 transition-colors">
                        <User className="w-4 h-4 text-primary-green" /> Mon profil
                      </a>
                      <a href="/wallet" className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-pale/50 flex items-center gap-2.5 transition-colors">
                        <Wallet className="w-4 h-4 text-primary-green" /> Portefeuille
                      </a>
                      <a href="/settings" className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-pale/50 flex items-center gap-2.5 transition-colors">
                        <Settings className="w-4 h-4 text-primary-green" /> Paramètres
                      </a>
                    </div>
                    <div className="border-t border-primary-pale/60 py-1">
                      <button
                        onClick={() => signOutAndClear({ callbackUrl: '/' })}
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

          {/* Bouton menu mobile */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-primary-deep hover:text-primary-green focus:outline-none"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu mobile — tiroir blanc simple */}
      <MobileMenu open={open} className="flex flex-col justify-between gap-2 overflow-y-auto">
        <div className="flex w-full flex-col gap-y-1">
          <MobileLink title="Accueil" href="/" icon={Home} />
          {NAV_GROUPS.map((group) => (
            <React.Fragment key={group.key}>
              <span className="text-sm font-serif font-bold text-primary-deep mt-2">{group.label}</span>
              {visibleItems(group.items).map((link) => (
                <MobileLink key={link.href} {...link} />
              ))}
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-4 border-t border-primary-pale/60">
          {status === 'loading' ? (
            <div className="h-10 bg-primary-pale rounded-full animate-pulse" />
          ) : isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 px-2 py-2 mb-1">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-accent-yellow">
                  <ImageWithFallback
                    src={
                      session?.user?.image ||
                      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face'
                    }
                    alt="Profile"
                    className="w-full h-full"
                    fallbackType="avatar"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-deep">{userName}</p>
                  <p className="text-xs text-gray-400">{session?.user?.email || ''}</p>
                </div>
              </div>
              <a
                href="/publish"
                onClick={() => setOpen(false)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full bg-primary-green hover:bg-primary-deep text-white font-sans font-bold text-base shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Publier une annonce
              </a>
              <button
                onClick={() => signOutAndClear({ callbackUrl: '/' })}
                className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full bg-transparent border border-red-200 text-red-500 hover:bg-red-50 font-sans font-bold text-sm transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <a
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="w-full inline-flex items-center justify-center px-5 py-3 rounded-full bg-transparent border border-primary-deep text-primary-deep font-sans font-bold text-base transition-colors"
              >
                Connexion
              </a>
              <a
                href="/publish"
                onClick={() => setOpen(false)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full bg-primary-green hover:bg-primary-deep text-white font-sans font-bold text-base shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Publier une annonce
              </a>
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
      className="bg-white fixed top-[64px] right-0 bottom-0 left-0 z-40 flex flex-col overflow-y-auto border-t border-primary-pale md:hidden shadow-2xl"
    >
      <div className="size-full p-4" {...props}>
        {children}
      </div>
    </div>,
    document.body
  );
}

// ─── Lien de menu déroulant (desktop) ──────────────────────────

function NavDropdownLink({ item }: { item: LinkItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-pale/50 hover:text-primary-deep transition-colors"
    >
      <span className="flex items-center justify-center rounded-lg bg-primary-pale border border-primary-green/10 shrink-0 w-8 h-8">
        <Icon className="w-4 h-4 text-primary-deep" />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-sans font-bold text-primary-deep truncate">{item.title}</span>
        {item.description && (
          <span className="block text-[10px] text-gray-500 truncate">{item.description}</span>
        )}
      </span>
    </Link>
  );
}

// ─── Lien mobile (tiroir) ──────────────────────────────────────

function MobileLink({ title, description, icon: Icon, href }: LinkItem) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-3 rounded-xl text-primary-deep hover:bg-primary-pale hover:text-primary-green font-sans font-bold text-base transition-colors"
    >
      <span className="flex items-center justify-center rounded-lg bg-primary-pale border border-primary-green/10 w-9 h-9 shrink-0">
        <Icon className="w-4 h-4 text-primary-deep" />
      </span>
      <span className="min-w-0">
        <span className="block truncate">{title}</span>
        {description && <span className="block text-xs font-normal text-gray-500 truncate">{description}</span>}
      </span>
    </a>
  );
}
