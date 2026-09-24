'use client';
import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
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
  Wallet,
  CreditCard,
  MessageCircle,
  Briefcase,
  BarChart3,
  Users,
  Star,
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
  KeyRound,
  Building2,
  ChevronDown,
  Leaf,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { signOutAndClear } from '@/lib/signout';
import ImageWithFallback from '@/components/afribayit/ImageWithFallback';
import { PillNav } from '@/components/landing/PillNav';

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
  { title: 'Acheter', href: '/acheter', description: 'Villas, appartements, terrains à vendre', icon: Home },
  { title: 'Louer', href: '/louer', description: 'Location longue durée dans 5 pays', icon: Key },
  { title: 'Investir', href: '/investir', description: 'Opportunités de rendement immobilier', icon: TrendingUp },
];

const hospitalityLinks: LinkItem[] = [
  {
    title: 'Séjours (Hôtels, Guesthouses & Locations)',
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
];

// Links visible only when logged in
const authOnlyLinks: LinkItem[] = [
  { title: 'Escrow Sécurisé', href: '/escrow', description: 'Transactions protégées par escrow', icon: Shield },
  { title: 'Mes baux', href: '/leases', description: 'Contrats de location, signatures, états des lieux', icon: KeyRound },
  { title: 'Dashboard bailleur', href: '/owner-dashboard', description: 'Revenus locatifs, taux d\u2019occupation, vacancies', icon: Building2 },
  { title: 'Portfolio investisseur', href: '/investor-dashboard', description: 'Plus-value latente, ROI, revenus locatifs', icon: TrendingUp },
  { title: 'Portefeuille', href: '/wallet', description: 'Gérez vos fonds et paiements', icon: Wallet },
];

const servicesLinks2: LinkItem[] = [
  { title: 'Abonnements', href: '/subscriptions', icon: CreditCard },
  { title: 'Communauté', href: '/community', icon: MessageCircle },
];

const authOnlyLinks2: LinkItem[] = [
  { title: 'Profils Pro', href: '/profile', icon: Briefcase },
  { title: 'Analytics', href: '/analytics', icon: BarChart3 },
];

const companyLinks: LinkItem[] = [
  { title: 'À propos', href: '/about', description: 'Découvrez l\u2019équipe AfriBayit', icon: Users },
  { title: 'Nos réalisations', href: '/our-work', description: 'Projets immobiliers et hôteliers', icon: GlobeIcon },
  { title: 'Témoignages', href: '/#témoignages', description: 'Ce que nos clients disent de nous', icon: Star },
  { title: 'Partenariats', href: '/partnership', icon: Handshake, description: 'Collaborez avec AfriBayit' },
];

const companyLinks2: LinkItem[] = [
  { title: 'CGU', href: '/terms', icon: FileText },
  { title: 'Confidentialité', href: '/privacy', icon: Shield },
  { title: 'Remboursement', href: '/refund', icon: RotateCcw },
  { title: 'Blog', href: '/blog', icon: Leaf },
  { title: 'Aide', href: '/help', icon: HelpCircle },
];

// ─── Main Header Component ─────────────────────────────────────

interface HeaderProps {
  onOpenNotifications?: () => void;
  notificationCount?: number;
}

/**
 * Header public AfriBayit — design Win-Agro (Navbar.tsx) appliqué de A à Z :
 *   - Fond blanc permanent, état scrollé = blur + ombre + liseré navy
 *   - Logo en cercle « light-beam » rotatif navy/or + wordmark serif
 *   - Pilule 3D adaptative au centre (composant signature Win-Agro)
 *   - Menu déroulant « Plus » regroupant la navigation secondaire
 *   - CTA « Publier » arrondi avec reflet shimmer + pulsation
 *   - Menu mobile blanc plein écran (design tiroir Win-Agro)
 */
export function Header({ onOpenNotifications, notificationCount = 0 }: HeaderProps) {
  const [open, setOpen] = React.useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = React.useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = React.useState(false);
  const scrolled = useScroll(20);
  const { data: session, status } = useSession();
  const isLoggedIn = !!session?.user;
  const profileMenuRef = React.useRef<HTMLDivElement>(null);
  const plusMenuRef = React.useRef<HTMLDivElement>(null);

  // Close menus on outside click
  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
      if (plusMenuRef.current && !plusMenuRef.current.contains(e.target as Node)) {
        setPlusMenuOpen(false);
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

  const userName = session?.user?.name || 'Utilisateur';

  return (
    <header
      className={cn(
        'sticky top-0 left-0 right-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-primary-green py-2'
          : 'bg-white py-4 border-b border-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo — cercle light-beam + wordmark serif (design Win-Agro) */}
          <Link href="/" className="flex items-center gap-3 focus:outline-none group shrink-0" aria-label="AfriBayit — Retour à l'accueil">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-primary-green/30 bg-noir-vert logo-light-beam shadow-md flex items-center justify-center p-0.5 transition-transform duration-300 group-hover:scale-105">
              <img src="/logo.png" alt="AfriBayit" className="h-11 w-11 object-contain rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold leading-tight text-primary-deep tracking-wide">
                AfriBayit
              </span>
              <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-primary-green">
                La Plateforme Immobilière Africaine
              </span>
            </div>
          </Link>

          {/* Navigation centrale : pilule 3D + menu Plus (desktop) */}
          <div className="hidden lg:flex items-center gap-4">
            <PillNav />

            {/* Menu « Plus » — navigation secondaire */}
            <div ref={plusMenuRef} className="relative">
              <button
                onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                className={cn(
                  'flex items-center gap-1 px-3 py-2 rounded-full text-sm font-sans font-bold transition-colors cursor-pointer',
                  plusMenuOpen
                    ? 'bg-primary-pale text-primary-deep'
                    : 'text-primary-deep hover:bg-primary-pale hover:text-primary-green'
                )}
                aria-expanded={plusMenuOpen}
              >
                Plus
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', plusMenuOpen && 'rotate-180')} />
              </button>

              {plusMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-[560px] bg-white rounded-3xl shadow-2xl border border-primary-pale overflow-hidden z-50"
                >
                  <div className="grid grid-cols-3 gap-0 divide-x divide-primary-pale/60">
                    {/* Colonne 1 — Immobilier & Séjours */}
                    <div className="p-4">
                      <p className="px-2 text-[10px] font-sans font-black uppercase tracking-wider text-primary-green mb-2">
                        Immobilier &amp; Séjours
                      </p>
                      <MegaLink item={immobilierLinks[2]} />
                      {hospitalityLinks.map((item) => (
                        <MegaLink key={item.href} item={item} compact />
                      ))}
                      {isLoggedIn &&
                        authOnlyLinks.slice(0, 3).map((item) => <MegaLink key={item.href} item={item} compact />)}
                    </div>

                    {/* Colonne 2 — Services Pro */}
                    <div className="p-4">
                      <p className="px-2 text-[10px] font-sans font-black uppercase tracking-wider text-primary-green mb-2">
                        Services Pro
                      </p>
                      {servicesLinks.map((item) => (
                        <MegaLink key={item.href} item={item} compact />
                      ))}
                      {isLoggedIn && authOnlyLinks2.map((item) => <MegaLink key={item.href} item={item} compact />)}
                      {isLoggedIn && (
                        <MegaLink item={{ title: 'Portefeuille', href: '/wallet', icon: Wallet }} compact />
                      )}
                    </div>

                    {/* Colonne 3 — Entreprise */}
                    <div className="p-4">
                      <p className="px-2 text-[10px] font-sans font-black uppercase tracking-wider text-primary-green mb-2">
                        Entreprise
                      </p>
                      {companyLinks.map((item) => (
                        <MegaLink key={item.href} item={item} compact />
                      ))}
                      {servicesLinks2.map((item) => (
                        <MegaLink key={item.href} item={item} compact />
                      ))}
                      {companyLinks2.slice(0, 2).map((item) => (
                        <MegaLink key={item.href} item={item} compact />
                      ))}
                    </div>
                  </div>

                  {/* Pied du menu */}
                  <div className="px-4 py-3 bg-primary-pale/50 border-t border-primary-pale flex items-center justify-between">
                    <p className="text-xs text-primary-deep font-sans font-semibold">
                      Une question ? Rebecca IA répond 24h/24
                    </p>
                    <a
                      href="/help"
                      className="text-xs font-sans font-bold text-primary-green hover:text-primary-deep transition-colors"
                    >
                      Centre d&apos;aide →
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-sans font-bold text-primary-deep border border-primary-deep/20 hover:bg-primary-pale transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-primary-green" />
              Admin
            </Link>

            {/* CTA Publier — design Win-Agro (shimmer + pulsation) */}
            <motion.a
              href="/publish"
              whileHover={{ scale: 1.05, boxShadow: '0px 10px 25px rgba(0, 156, 222, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ scale: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } }}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-green hover:bg-primary-deep text-white font-sans font-bold text-sm shadow-md hover:shadow-lg transition-colors duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-green focus:ring-offset-2 btn-shimmer"
            >
              <Plus className="w-4 h-4" />
              Publier
            </motion.a>

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
                  <ChevronDown
                    className={cn('w-3.5 h-3.5 text-primary-deep transition-transform', profileMenuOpen && 'rotate-180')}
                  />
                </button>
                {profileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-60 bg-white rounded-2xl shadow-xl border border-primary-pale overflow-hidden z-50"
                  >
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
                  </motion.div>
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

      {/* Menu mobile — tiroir blanc design Win-Agro */}
      <MobileMenu open={open} className="flex flex-col justify-between gap-2 overflow-y-auto">
        <div className="flex w-full flex-col gap-y-1">
          <span className="text-sm font-serif font-bold text-primary-deep mt-2">Immobilier</span>
          {immobilierLinks.map((link) => (
            <MobileLink key={link.title} {...link} />
          ))}
          <span className="text-sm font-serif font-bold text-primary-deep mt-2">Hôtellerie</span>
          {hospitalityLinks.map((link) => (
            <MobileLink key={link.title} {...link} />
          ))}
          <span className="text-sm font-serif font-bold text-primary-deep mt-2">Services</span>
          {servicesLinks.map((link) => (
            <MobileLink key={link.title} {...link} />
          ))}
          {servicesLinks2.map((link) => (
            <MobileLink key={link.title} {...link} />
          ))}
          {isLoggedIn && (
            <>
              {authOnlyLinks.map((link) => (
                <MobileLink key={link.title} {...link} />
              ))}
              {authOnlyLinks2.map((link) => (
                <MobileLink key={link.title} {...link} />
              ))}
            </>
          )}
          <span className="text-sm font-serif font-bold text-primary-deep mt-2">Entreprise</span>
          {companyLinks.map((link) => (
            <MobileLink key={link.title} {...link} />
          ))}
          {companyLinks2.map((link) => (
            <MobileLink key={link.title} {...link} />
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
              <motion.a
                href="/publish"
                onClick={() => setOpen(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ scale: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full bg-primary-green hover:bg-primary-deep text-white font-sans font-bold text-base shadow-md transition-colors cursor-pointer btn-shimmer"
              >
                <Plus className="w-4 h-4" />
                Publier une annonce
              </motion.a>
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
              <motion.a
                href="/publish"
                onClick={() => setOpen(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ scale: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full bg-primary-green hover:bg-primary-deep text-white font-sans font-bold text-base shadow-md transition-colors cursor-pointer btn-shimmer"
              >
                <Plus className="w-4 h-4" />
                Publier une annonce
              </motion.a>
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
      className="bg-white fixed top-[72px] right-0 bottom-0 left-0 z-40 flex flex-col overflow-y-auto border-t border-primary-pale md:hidden shadow-2xl"
    >
      <div
        data-slot={open ? 'open' : 'closed'}
        className={cn('data-[slot=open]:animate-in data-[slot=open]:zoom-in-97 ease-out', 'size-full p-4', className)}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

// ─── Lien de menu méga (desktop « Plus ») ──────────────────────

function MegaLink({ item, compact = false }: { item: LinkItem; compact?: boolean }) {
  const Icon = item.icon;
  return (
    <a
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 rounded-xl transition-colors',
        compact ? 'px-2 py-2 hover:bg-primary-pale/60' : 'p-2 hover:bg-primary-pale'
      )}
    >
      <span className="flex items-center justify-center rounded-lg bg-primary-pale border border-primary-green/10 shrink-0" style={{ width: 32, height: 32 }}>
        <Icon className="w-4 h-4 text-primary-deep" />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-sans font-bold text-primary-deep truncate">{item.title}</span>
        {item.description && (
          <span className="block text-[10px] text-gray-500 truncate">{item.description}</span>
        )}
      </span>
    </a>
  );
}

// ─── Lien mobile (tiroir) ──────────────────────────────────────

function MobileLink({ title, description, icon: Icon, href, gold }: LinkItem) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-3 py-3 rounded-xl text-primary-deep hover:bg-primary-pale hover:text-primary-green font-sans font-bold text-base transition-colors"
    >
      <span className="flex items-center justify-center rounded-lg bg-primary-pale border border-primary-green/10 w-9 h-9 shrink-0">
        <Icon className="w-4 h-4 text-primary-deep" />
      </span>
      <span className="min-w-0">
        <span className={cn('block truncate', gold && 'text-accent-dark')}>{title}</span>
        {description && <span className="block text-xs font-normal text-gray-500 truncate">{description}</span>}
      </span>
    </a>
  );
}
