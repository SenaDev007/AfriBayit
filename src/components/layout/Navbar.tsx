"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/properties", label: "Immobilier" },
  { href: "/rentals", label: "Locations" },
  { href: "/guesthouses", label: "Guesthouses" },
  { href: "/artisans", label: "Artisans" },
  { href: "/academy", label: "Formation" },
  { href: "/community", label: "Communauté" },
];

interface NavbarProps {
  transparent?: boolean;
}

export default function Navbar({ transparent = false }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        transparent && !scrolled
          ? "bg-transparent"
          : "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0070BA] flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span
              className={cn(
                "font-bold text-xl tracking-tight",
                transparent && !scrolled ? "text-white" : "text-[#003087]"
              )}
            >
              Afri<span className="text-[#0070BA]">Bayit</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  transparent && !scrolled
                    ? "text-white/90 hover:text-white hover:bg-white/15"
                    : "text-gray-600 hover:text-[#0070BA] hover:bg-blue-50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-[#0070BA] flex items-center justify-center text-white text-xs font-bold">
                    {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {session.user.name?.split(" ")[0] || "Mon compte"}
                  </span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#0070BA]" onClick={() => setUserMenuOpen(false)}>
                      <span>📊</span> Tableau de bord
                    </Link>
                    <Link href="/dashboard/properties" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#0070BA]" onClick={() => setUserMenuOpen(false)}>
                      <span>🏠</span> Mes annonces
                    </Link>
                    <Link href="/dashboard/messages" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#0070BA]" onClick={() => setUserMenuOpen(false)}>
                      <span>💬</span> Messages
                    </Link>
                    <Link href="/properties/new" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#0070BA]" onClick={() => setUserMenuOpen(false)}>
                      <span>➕</span> Publier une annonce
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-[#D93025] hover:bg-red-50"
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
                    "text-sm font-medium px-4 py-2 rounded-lg transition-colors",
                    transparent && !scrolled
                      ? "text-white hover:bg-white/15"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  Connexion
                </Link>
                <Link href="/register">
                  <Button
                    variant={transparent && !scrolled ? "outline" : "primary"}
                    size="sm"
                    className={
                      transparent && !scrolled
                        ? "border-white text-white hover:bg-white hover:text-[#0070BA]"
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
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              "lg:hidden p-2 rounded-lg",
              transparent && !scrolled
                ? "text-white hover:bg-white/15"
                : "text-gray-600 hover:bg-gray-100"
            )}
            aria-label="Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#0070BA] hover:bg-blue-50 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 pb-1 flex flex-col gap-2 border-t border-gray-100 mt-2">
              {session?.user ? (
                <>
                  <Link href="/dashboard" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#0070BA] hover:bg-blue-50" onClick={() => setMobileOpen(false)}>
                    📊 Tableau de bord
                  </Link>
                  <Link href="/properties/new" className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-[#0070BA] hover:bg-blue-50" onClick={() => setMobileOpen(false)}>
                    ➕ Publier une annonce
                  </Link>
                  <button onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }} className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-[#D93025] hover:bg-red-50">
                    🚪 Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block text-center py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMobileOpen(false)}>
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
