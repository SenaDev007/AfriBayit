'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Menu, X, Building2, MapPin, User, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import { cn } from '@/lib/utils'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [country, setCountry] = useState('CI')
  const { user, logout, isLoading } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const countries = useMemo(
    () => [
      { code: 'BJ', label: 'Bénin' },
      { code: 'CI', label: "Côte d'Ivoire" },
      { code: 'BF', label: 'Burkina Faso' },
      { code: 'TG', label: 'Togo' }
    ],
    []
  )

  const navLinks = [
    { href: '/properties', label: 'Immobilier' },
    { href: '/hotels', label: 'Hôtellerie' },
    { href: '/artisans', label: 'Artisans BTP' },
    { href: '/learning', label: 'Académie' },
    { href: '/community', label: 'Communauté' }
  ]

  const handleLogout = async () => {
    await logout()
  }


  return (
    <nav className={cn(
      'navbar fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled
        ? 'bg-[#003087]/85 backdrop-blur-[20px] border-b border-white/20 shadow-xl'
        : 'bg-[#003087]/70 backdrop-blur-[20px] border-b border-white/10'
    )}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-20 gap-6">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="whitespace-nowrap">
              <p className="text-white text-lg font-semibold leading-none">AfriBayit</p>
              <p className="text-white/70 text-[11px] mt-1">Super-app immobilière panafricaine</p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 border border-white/20">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-transparent text-white text-sm outline-none cursor-pointer whitespace-nowrap"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code} className="text-neutral-900">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/dashboard" className="px-4 py-2 rounded-full text-white hover:bg-white/10 transition-all whitespace-nowrap">
                  Tableau de bord
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-full border border-white/30 text-white hover:bg-white/10 inline-flex items-center gap-2 whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4" />
                  Sortir
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/auth/login" className="px-4 py-2 rounded-full text-white hover:bg-white/10 transition-all whitespace-nowrap">
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="px-5 py-2 rounded-full bg-[#D4AF37] text-[#001F5B] font-semibold hover:brightness-95 transition-all whitespace-nowrap"
                >
                  Créer un compte
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-white/20 py-4 space-y-2"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 rounded-lg text-white hover:bg-white/10 whitespace-nowrap"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 pt-2">
              <label className="text-white/75 text-xs">Pays pilote</label>
              <div className="mt-1 rounded-full bg-white/10 border border-white/20 px-3 py-2 inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="bg-transparent text-white text-sm outline-none whitespace-nowrap"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code} className="text-neutral-900">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!isLoading && !user && (
              <div className="px-4 pt-3 flex gap-2">
                <Link href="/auth/login" className="px-4 py-2 rounded-full text-white border border-white/30 whitespace-nowrap">
                  Connexion
                </Link>
                <Link href="/auth/register" className="px-4 py-2 rounded-full bg-[#D4AF37] text-[#001F5B] font-semibold whitespace-nowrap">
                  Inscription
                </Link>
              </div>
            )}
            {!isLoading && user && (
              <div className="px-4 pt-3 flex items-center gap-3">
                <User className="w-4 h-4 text-white" />
                <span className="text-white text-sm whitespace-nowrap">{user.firstName || 'Compte'}</span>
                <button onClick={handleLogout} className="ml-auto text-white/85 hover:text-white text-sm whitespace-nowrap">
                  Déconnexion
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  )
}
