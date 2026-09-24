'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Phone,
  MapPin,
  ArrowUpRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaTiktok,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { useTranslation } from '@/lib/i18n/use-translate';

/**
 * Pied de page AfriBayit — portage fidèle du design Win-Agro
 * (components/ui/footer-column.tsx) sur la palette AfriBayit :
 *   - Fond navy-noir #0A1226, coins supérieurs arrondis 2.5rem,
 *     liseré supérieur bleu innovation 4px
 *   - Grain de texture premium en surimpression
 *   - Logo en cercle « light-beam » rotatif + wordmark serif + tagline or
 *   - Colonnes de liens aux en-têtes serif soulignés
 *   - Barre légale en pied avec crédits et liens juridiques
 */

const socialLinks = [
  { icon: FaFacebookF, label: 'Facebook', href: 'https://facebook.com/afribayit', hoverClass: 'hover:bg-[#1877F2]' },
  { icon: FaInstagram, label: 'Instagram', href: 'https://instagram.com/afribayit', hoverClass: 'hover:bg-[#E4405F]' },
  { icon: FaXTwitter, label: 'X (Twitter)', href: 'https://x.com/afribayit', hoverClass: 'hover:bg-[#0f1117]' },
  { icon: FaLinkedinIn, label: 'LinkedIn', href: 'https://linkedin.com/company/afribayit', hoverClass: 'hover:bg-[#0A66C2]' },
  { icon: FaYoutube, label: 'YouTube', href: 'https://youtube.com/@afribayit', hoverClass: 'hover:bg-[#FF0000]' },
  { icon: FaTiktok, label: 'TikTok', href: 'https://tiktok.com/@afribayit', hoverClass: 'hover:bg-[#0f1117]' },
];

const countries = [
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'CI', name: 'Côte d\u2019Ivoire', flag: '🇨🇮' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
];

export default function Footer() {
  const router = useRouter();
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const navigateTo = (href: string) => {
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('http')) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    router.push(href);
  };

  // ─── Groupes de liens (contenu AfriBayit, structure Win-Agro) ───
  const immobilierLinks = [
    { text: 'Acheter des villas', href: '/acheter?type=villa' },
    { text: 'Appartements', href: '/acheter?type=appartement' },
    { text: 'Terrains', href: '/acheter?type=terrain' },
    { text: 'Investir', href: '/investir' },
  ];

  const servicesLinks = [
    { text: 'Artisans BTP', href: '/artisans' },
    { text: 'Notaires', href: '/notary' },
    { text: 'GeoTrust', href: '/geotrust' },
    { text: 'Académie', href: '/academy' },
    { text: 'Publier une annonce', href: '/publish' },
  ];

  const sejoursLinks = [
    { text: 'Hôtels', href: '/sejours' },
    { text: 'Guesthouses', href: '/sejours' },
    { text: 'Locations courte durée', href: '/sejours' },
    { text: 'Réservations', href: '/sejours' },
  ];

  const helpfulLinks = [
    { text: 'Communauté', href: '/community', hasIndicator: true },
    { text: 'Abonnements & Tarifs', href: '/subscriptions' },
    { text: 'Centre d\u2019aide', href: '/help' },
    { text: 'Blog', href: '/blog' },
  ];

  const contactInfo = [
    { icon: Mail, text: 'contact@afribayit.com', href: 'mailto:contact@afribayit.com' },
    { icon: Phone, text: '+229 97 00 00 00', href: 'tel:+22997000000' },
    { icon: MapPin, text: 'Cotonou · Abidjan · Ouagadougou · Lomé', href: null },
  ];

  return (
    <footer className="bg-noir-vert text-gray-300 mt-24 w-full place-self-end rounded-t-[2.5rem] border-t-4 border-primary-green relative overflow-hidden">
      {/* Grain premium en surimpression pour des textures riches */}
      <div className="absolute inset-0 bg-grain opacity-[0.03] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 pt-20 pb-8 sm:px-8 lg:px-12 lg:pt-24 relative z-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Colonne 1 : profil de l'entreprise */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border border-primary-green/30 bg-noir-vert logo-light-beam shadow-md flex items-center justify-center p-0.5">
                <img src="/logo.png" alt="AfriBayit" className="h-14 w-14 object-contain rounded-full" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-bold leading-tight text-white tracking-wide">AfriBayit</span>
                <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-accent-yellow">
                  La Plateforme Immobilière Africaine
                </span>
              </div>
            </div>

            <p className="text-gray-400 mt-6 max-w-md text-sm leading-relaxed text-left">
              {t(
                'footer.description',
                'Où l\u2019Afrique trouve sa maison. Nous sécurisons chaque transaction immobilière — achat, location, séjours — avec séquestre digitalisé, notaires accrédités et vérification GeoTrust.'
              )}
            </p>

            {/* Pays couverts */}
            <div className="flex flex-wrap gap-2">
              {countries.map((country) => (
                <span
                  key={country.code}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-green/10 border border-primary-green/20 text-xs font-sans font-semibold text-gray-300"
                >
                  <span>{country.flag}</span> {country.name}
                </span>
              ))}
            </div>

            {/* Réseaux sociaux */}
            <ul className="mt-8 flex gap-3 justify-start flex-wrap">
              {socialLinks.map(({ icon: Icon, label, href, hoverClass }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-full bg-primary-green/15 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 shadow-md ${hoverClass}`}
                    aria-label={label}
                  >
                    <Icon size={17} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonnes 2-5 : liens dynamiques */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-2">
            {/* Immobilier */}
            <div className="text-left">
              <p className="text-white font-serif text-base font-bold tracking-wider mb-6 border-b border-primary-green/20 pb-2">
                Immobilier
              </p>
              <ul className="mt-2 space-y-4 text-sm font-sans">
                {immobilierLinks.map(({ text, href }) => (
                  <li key={text}>
                    <a
                      className="text-gray-400 hover:text-accent-yellow transition-colors duration-200 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo(href);
                      }}
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Séjours */}
            <div className="text-left">
              <p className="text-white font-serif text-base font-bold tracking-wider mb-6 border-b border-primary-green/20 pb-2">
                Séjours
              </p>
              <ul className="mt-2 space-y-4 text-sm font-sans">
                {sejoursLinks.map(({ text, href }) => (
                  <li key={text}>
                    <a
                      className="text-gray-400 hover:text-accent-yellow transition-colors duration-200 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo(href);
                      }}
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Services */}
            <div className="text-left">
              <p className="text-white font-serif text-base font-bold tracking-wider mb-6 border-b border-primary-green/20 pb-2">
                Services
              </p>
              <ul className="mt-2 space-y-4 text-sm font-sans">
                {servicesLinks.map(({ text, href }) => (
                  <li key={text}>
                    <a
                      className="text-gray-400 hover:text-accent-yellow transition-colors duration-200 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo(href);
                      }}
                    >
                      {text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Utiles + Contact */}
            <div className="text-left">
              <p className="text-white font-serif text-base font-bold tracking-wider mb-6 border-b border-primary-green/20 pb-2">
                Utiles
              </p>
              <ul className="mt-2 space-y-4 text-sm font-sans">
                {helpfulLinks.map(({ text, href, hasIndicator }) => (
                  <li key={text}>
                    <a
                      className={`${
                        hasIndicator
                          ? 'group flex items-center gap-1.5 justify-start hover:text-accent-yellow transition-colors cursor-pointer'
                          : 'text-gray-400 hover:text-accent-yellow transition-colors cursor-pointer'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigateTo(href);
                      }}
                    >
                      <span className={`${hasIndicator ? 'text-gray-400 group-hover:text-accent-yellow' : ''} transition-colors`}>
                        {text}
                      </span>
                      {hasIndicator && (
                        <span className="relative flex size-2">
                          <span className="bg-primary-green absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                          <span className="bg-primary-green relative inline-flex size-2 rounded-full" />
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>

              {/* Coordonnées */}
              <ul className="mt-6 space-y-3 text-sm font-sans">
                {contactInfo.map(({ icon: Icon, text, href }, idx) => (
                  <li key={idx}>
                    <a
                      className="flex items-start gap-2 justify-start group hover:text-accent-yellow transition-colors duration-200"
                      href={href ?? '#'}
                      onClick={(e) => {
                        if (!href) {
                          e.preventDefault();
                          return;
                        }
                        if (!href.startsWith('mailto:') && !href.startsWith('tel:')) {
                          e.preventDefault();
                          navigateTo(href);
                        }
                      }}
                    >
                      <Icon className="text-primary-green size-4 shrink-0 mt-0.5 transition-colors group-hover:text-accent-yellow" />
                      <span className="text-gray-400 group-hover:text-accent-yellow transition-colors">{text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Barre légale & crédits */}
        <div className="mt-16 border-t border-primary-green/10 pt-8 relative z-10">
          <div className="text-center sm:flex sm:justify-between sm:text-left flex-row-reverse items-center justify-between gap-4">
            {/* Crédits */}
            <p className="text-xs text-gray-500 mt-4 sm:mt-0 font-sans flex gap-1 flex-wrap justify-center sm:justify-end">
              <span>Conçu pour l&apos;Afrique — </span>
              <a
                href="/about"
                className="text-accent-yellow hover:underline font-bold flex items-center gap-0.5"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo('/about');
                }}
              >
                l&apos;équipe AfriBayit <ArrowUpRight className="w-3 h-3" />
              </a>
            </p>

            {/* Copyright & liens juridiques */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-center sm:justify-start text-xs text-gray-400 font-sans">
              <p>&copy; {currentYear} AfriBayit. Tous droits réservés.</p>
              <div className="hidden sm:inline text-primary-green/30">|</div>
              <div className="flex gap-3">
                <a
                  href="/privacy"
                  className="hover:text-accent-yellow transition-colors flex items-center gap-1 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/privacy');
                  }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Confidentialité
                </a>
                <span className="text-primary-green/30">·</span>
                <a
                  href="/terms"
                  className="hover:text-accent-yellow transition-colors flex items-center gap-1 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    navigateTo('/terms');
                  }}
                >
                  <FileText className="w-3.5 h-3.5" /> Mentions Légales
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
