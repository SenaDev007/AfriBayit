"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Button from "@/components/ui/Button";
import NotificationBell from "@/components/layout/NotificationBell";
import { cn } from "@/lib/utils";

// Primary nav links (shown at lg breakpoint)
const NAV_LINKS = [
  { href: "/properties", label: "Immobilier" },
  { href: "/hotels", label: "Hôtels" },
  { href: "/artisans", label: "Artisans" },
  { href: "/geotrust", label: "GeoTrust" },
  { href: "/academy", label: "Formation" },
  { href: "/community", label: "Communauté" },
];

// All links for mobile menu
const ALL_NAV_LINKS = [
  { href: "/properties", label: "Immobilier" },
  { href: "/rentals", label: "Locations" },
  { href: "/guesthouses", label: "Guesthouses" },
  { href: "/hotels", label: "Hôtels" },
  { href: "/artisans", label: "Artisans" },
  { href: "/geotrust", label: "GeoTrust" },
  { href: "/academy", label: "Formation" },
  { href: "/community", label: "Communauté" },
  { href: "/tarifs", label: "Abonnements" },
];

interface NavbarProps {
  transparent?: boolean;
}

export default function Navbar({ transparent = false }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  const solidNav = !transparent || scrolled;

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-[72px] transition-all duration-300 ease-out",
        solidNav
          ? "bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      )}
    >
      <div className="container-app h-full flex items-center">
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[#0070BA] flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span
              className={cn(
                "font-bold text-[28px] tracking-tight leading-none",
                solidNav ? "text-[#003087]" : "text-white"
              )}
            >
              Afri<span className={solidNav ? "text-[#0070BA]" : "text-white/95"}>Bayit</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[15px] font-medium transition-colors duration-200 ease-out py-2",
                  solidNav
                    ? "text-[#374151] hover:text-[#0070BA]"
                    : "text-white/90 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {session?.user && <NotificationBell solidNav={solidNav} />}
            {session?.user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-colors duration-200",
                    solidNav ? "hover:bg-slate-100" : "hover:bg-white/10"
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-[#0070BA] flex items-center justify-center text-white text-xs font-bold">
                    {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span
                    className={cn(
                      "text-[15px] font-medium",
                      solidNav ? "text-[#374151]" : "text-white"
                    )}
                  >
                    {session.user.name?.split(" ")[0] || "Mon compte"}
                  </span>
                  <svg className={cn("w-4 h-4", solidNav ? "text-[#6B7280]" : "text-white/70")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 py-2 z-50">
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#374151] hover:bg-slate-50 hover:text-[#0070BA] transition-colors duration-200" onClick={() => setUserMenuOpen(false)}>
                      <span>📊</span> Tableau de bord
                    </Link>
                    <Link href="/dashboard/properties" className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#374151] hover:bg-slate-50 hover:text-[#0070BA] transition-colors duration-200" onClick={() => setUserMenuOpen(false)}>
                      <span>🏠</span> Mes annonces
                    </Link>
                    <Link href="/dashboard/messages" className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#374151] hover:bg-slate-50 hover:text-[#0070BA] transition-colors duration-200" onClick={() => setUserMenuOpen(false)}>
                      <span>💬</span> Messages
                    </Link>
                    <Link href="/properties/new" className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#374151] hover:bg-slate-50 hover:text-[#0070BA] transition-colors duration-200" onClick={() => setUserMenuOpen(false)}>
                      <span>➕</span> Publier une annonce
                    </Link>
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-[#D93025] hover:bg-red-50 transition-colors duration-200"
                      >
                        <span>🚪</span> Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    "text-[15px] font-medium px-3 py-2 rounded-xl transition-colors duration-200",
                    solidNav
                      ? "text-[#374151] hover:bg-slate-100"
                      : "text-white hover:bg-white/15"
                  )}
                >
                  Connexion
                </Link>
                <Link href="/register">
                  <Button
                    variant={solidNav ? "primary" : "outline"}
                    size="sm"
                    className={
                      !solidNav
                        ? "border-2 border-white text-white hover:bg-white hover:text-[#003087]"
                        : ""
                    }
                  >
                    Publier une annonce
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              "lg:hidden p-2 rounded-xl transition-colors duration-200",
              solidNav
                ? "text-[#374151] hover:bg-slate-100"
                : "text-white hover:bg-white/15"
            )}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100 shadow-xl max-h-[calc(100vh-72px)] overflow-y-auto">
          <div className="container-app py-3 space-y-1">
            {ALL_NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 rounded-xl text-[15px] font-medium text-[#374151] hover:text-[#0070BA] hover:bg-slate-50 transition-colors duration-200"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 pb-1 flex flex-col gap-2 border-t border-slate-100 mt-2">
              {session?.user ? (
                <>
                  <Link href="/dashboard" className="block px-3 py-2.5 rounded-xl text-[15px] font-medium text-[#374151] hover:text-[#0070BA] hover:bg-slate-50" onClick={() => setMobileOpen(false)}>
                    📊 Tableau de bord
                  </Link>
                  <Link href="/properties/new" className="block px-3 py-2.5 rounded-xl text-[15px] font-medium text-[#374151] hover:text-[#0070BA] hover:bg-slate-50" onClick={() => setMobileOpen(false)}>
                    ➕ Publier une annonce
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="block w-full text-left px-3 py-2.5 rounded-xl text-[15px] font-medium text-[#D93025] hover:bg-red-50"
                  >
                    🚪 Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block text-center py-2.5 text-[15px] font-medium text-[#374151] hover:bg-slate-50 rounded-xl" onClick={() => setMobileOpen(false)}>
                    Connexion
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" size="md" fullWidth>
                      Publier une annonce
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
