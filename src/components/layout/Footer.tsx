'use client'

import Link from 'next/link'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Landmark
} from 'lucide-react'

export function Footer() {
  const quickLinks = [
    { href: '/properties', label: 'Immobilier' },
    { href: '/hotels', label: 'Hôtellerie' },
    { href: '/artisans', label: 'Marketplace artisans' },
    { href: '/learning', label: 'Académie' },
    { href: '/community', label: 'Communauté' }
  ]

  const legalLinks = [
    { href: '/privacy', label: 'Politique de confidentialité' },
    { href: '/terms', label: "Conditions d'utilisation" }
  ]

  return (
    <footer className="bg-[#001F5B] text-white">
      <div className="container-custom">
        <div className="py-14 grid lg:grid-cols-[1.2fr_1fr_1fr] gap-10">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/25 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-xl leading-none">AfriBayit</p>
                <p className="text-xs text-white/70 mt-1">Plateforme immobilière africaine nouvelle génération</p>
              </div>
            </Link>
            <p className="text-white/80 mt-5 max-w-md leading-relaxed text-sm">
              Écosystème premium: annonces immobilières, locations courte durée, escrow sécurisé,
              KYC et conformité légale pour bâtir la confiance sur tout le parcours.
            </p>
            <div className="space-y-2 mt-6 text-sm">
              <div className="inline-flex items-center gap-2 text-white/85">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <span>Bénin · Côte d’Ivoire · Burkina Faso · Togo</span>
              </div>
              <div className="inline-flex items-center gap-2 text-white/85">
                <Mail className="w-4 h-4 text-[#D4AF37]" />
                <span>contact@afribayit.com</span>
              </div>
              <div className="inline-flex items-center gap-2 text-white/85">
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                <span>+225 20 30 40 50</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-2xl text-white mb-4">Navigation</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-2xl text-white mb-4">Confiance & conformité</h3>
            <ul className="space-y-3 text-sm">
              <li className="inline-flex items-center gap-2 text-white/80">
                <ShieldCheck className="w-4 h-4 text-[#00A651]" />
                Vérification KYC multi-niveaux
              </li>
              <li className="inline-flex items-center gap-2 text-white/80">
                <Landmark className="w-4 h-4 text-[#D4AF37]" />
                Escrow transactionnel traçable
              </li>
            </ul>
            <ul className="space-y-2 mt-5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-white/75 hover:text-white transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="py-6 border-t border-white/15 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <p className="text-sm text-white/70">© {new Date().getFullYear()} AfriBayit Technologies. Tous droits réservés.</p>
          <p className="text-xs text-white/60">Version marché pilote · UX conforme CDC M1</p>
        </div>
      </div>
    </footer>
  )
}
