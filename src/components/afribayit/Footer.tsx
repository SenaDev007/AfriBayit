'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Globe,
  Home,
  Shield,
  Bot,
  BookOpen,
  Building2,
  Hotel,
  Scale,
  PlusCircle,
  FileText,
  Lock,
  Cookie,
  AlertTriangle,
  LandPlot,
  Building,
  Warehouse,
  ShoppingBag,
  Briefcase,
  HeartHandshake,
  BadgeCheck,
  Wrench,
  GraduationCap,
  Plane,
} from 'lucide-react';
import { FooterBackgroundGradient } from '@/components/ui/hover-footer';
import { TextHoverEffect } from '@/components/ui/hover-footer';

export default function Footer() {
  const router = useRouter();

  const navigateTo = (href: string) => {
    router.push(href);
  };

  // Footer link data — AfriBayit specific
  const footerLinks = [
    {
      title: 'Acheter',
      icon: <Home size={16} className="text-[#D4AF37]" />,
      links: [
        { label: 'Villas', href: '/search?type=villa', icon: <LandPlot size={14} /> },
        { label: 'Appartements', href: '/search?type=appartement', icon: <Building size={14} /> },
        { label: 'Terrains', href: '/search?type=terrain', icon: <Warehouse size={14} /> },
        { label: 'Bureaux', href: '/search?type=bureau', icon: <Briefcase size={14} /> },
        { label: 'Commerces', href: '/search?type=commerce', icon: <ShoppingBag size={14} /> },
      ],
    },
    {
      title: 'Services',
      icon: <Shield size={16} className="text-[#D4AF37]" />,
      links: [
        { label: 'Escrow Sécurisé', href: '/escrow', icon: <Shield size={14} /> },
        { label: 'GeoTrust', href: '/geotrust', icon: <BadgeCheck size={14} /> },
        { label: 'ProMatch Artisans', href: '/artisans', icon: <Wrench size={14} /> },
        { label: 'Rebecca IA', href: '#', icon: <Bot size={14} /> },
        { label: 'Académie', href: '/academy', icon: <GraduationCap size={14} /> },
      ],
    },
    {
      title: 'Entreprise',
      icon: <Building2 size={16} className="text-[#D4AF37]" />,
      links: [
        { label: 'Communauté', href: '/community', icon: <HeartHandshake size={14} /> },
        { label: 'Séjours', href: '/booking', icon: <Plane size={14} /> },
        { label: 'Hôtellerie', href: '/hospitality', icon: <Hotel size={14} /> },
        { label: 'Notaires', href: '/notary', icon: <Scale size={14} /> },
        { label: 'Publier une annonce', href: '/publish', icon: <PlusCircle size={14} /> },
      ],
    },
    {
      title: 'Légal',
      icon: <Scale size={16} className="text-[#D4AF37]" />,
      links: [
        { label: 'CGU', href: '#', icon: <FileText size={14} /> },
        { label: 'Confidentialité', href: '#', icon: <Lock size={14} /> },
        { label: 'Cookies', href: '#', icon: <Cookie size={14} /> },
        { label: 'Mentions légales', href: '#', icon: <FileText size={14} /> },
        { label: 'Signaler', href: '#', icon: <AlertTriangle size={14} /> },
      ],
    },
  ];

  // Contact info
  const contactInfo = [
    {
      icon: <Mail size={18} className="text-[#D4AF37]" />,
      text: 'contact@afribayit.com',
      href: 'mailto:contact@afribayit.com',
    },
    {
      icon: <Phone size={18} className="text-[#D4AF37]" />,
      text: '+229 97 00 00 00',
      href: 'tel:+22997000000',
    },
    {
      icon: <MapPin size={18} className="text-[#D4AF37]" />,
      text: 'Cotonou, Bénin | Abidjan, CI | Dakar, SN',
    },
  ];

  // Social media with official brand colors
  const socialLinks = [
    {
      icon: <Facebook size={20} />,
      label: 'Facebook',
      href: 'https://facebook.com/afribayit',
      hoverColor: 'hover:text-[#1877F2]',
    },
    {
      icon: <Instagram size={20} />,
      label: 'Instagram',
      href: 'https://instagram.com/afribayit',
      hoverColor: 'hover:text-[#E4405F]',
    },
    {
      icon: <Twitter size={20} />,
      label: 'X (Twitter)',
      href: 'https://x.com/afribayit',
      hoverColor: 'hover:text-[#000000]',
    },
    {
      icon: <Globe size={20} />,
      label: 'Site web',
      href: 'https://afribayit.com',
      hoverColor: 'hover:text-[#003087]',
    },
  ];

  // Payment & telecom partners
  const partners = [
    { name: 'MTN', color: 'bg-[#FFCC00]/20 text-[#FFCC00]' },
    { name: 'Orange', color: 'bg-[#FF7900]/20 text-[#FF7900]' },
    { name: 'Moov', color: 'bg-[#009DE0]/20 text-[#009DE0]' },
    { name: 'Visa', color: 'bg-[#1A1F71]/20 text-[#1A1F71]' },
    { name: 'Mastercard', color: 'bg-[#EB001B]/20 text-[#EB001B]' },
    { name: 'FedaPay', color: 'bg-[#00C853]/20 text-[#00C853]' },
  ];

  // Countries covered
  const countries = [
    { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
    { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
    { code: 'TG', name: 'Togo', flag: '🇹🇬' },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  ];

  return (
    <footer className="bg-[#0F0F11]/10 relative h-fit rounded-3xl overflow-hidden m-4 sm:m-8">
      <div className="max-w-7xl mx-auto p-8 sm:p-14 z-40 relative">
        {/* Brand + Contact Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-8 lg:gap-16 pb-10">
          {/* Brand section */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="AfriBayit"
                className="h-12 w-auto object-contain brightness-0 invert"
              />
              <span className="text-white text-2xl font-bold tracking-tight">
                AfriBayit
              </span>
            </div>
            <p className="text-sm leading-relaxed text-gray-400">
              Où l&apos;Afrique trouve sa maison. Où les rêves deviennent adresses.
              Plateforme immobilière de référence en Afrique de l&apos;Ouest, agréée par les autorités immobilières.
            </p>

            {/* Countries */}
            <div className="mt-2">
              <p className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-2">
                Pays couverts
              </p>
              <div className="flex flex-wrap gap-2">
                {countries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => navigateTo(`/search?country=${c.code}`)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-xs text-gray-300 hover:text-white"
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contact section */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-white text-lg font-semibold flex items-center gap-2">
              <Mail size={18} className="text-[#D4AF37]" />
              Contactez-nous
            </h4>
            <ul className="space-y-4">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center space-x-3">
                  {item.icon}
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">
                      {item.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {/* Social icons */}
            <div className="flex space-x-4 pt-2">
              {socialLinks.map(({ icon, label, href, hoverColor }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 ${hoverColor} transition-colors`}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Partners & Payments */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-white text-lg font-semibold">
              Paiement & Partenaires
            </h4>
            <div className="flex flex-wrap gap-2">
              {partners.map((p) => (
                <span
                  key={p.name}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${p.color}`}
                >
                  {p.name}
                </span>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <p className="text-xs text-[#D4AF37] font-medium flex items-center gap-2">
                <Shield size={14} />
                Transactions sécurisées par Escrow & GeoTrust
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 pb-10">
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-white text-sm font-semibold mb-4 flex items-center gap-2">
                {section.icon}
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label} className="relative">
                    <button
                      onClick={() => navigateTo(link.href)}
                      className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors text-sm group"
                    >
                      <span className="opacity-50 group-hover:opacity-100 transition-opacity">
                        {link.icon}
                      </span>
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="border-t border-gray-700/50 my-6" />

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm space-y-4 md:space-y-0">
          <p className="text-gray-500 text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} AfriBayit. Tous droits réservés. Plateforme agréée par les autorités immobilières.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateTo('/auth/login')}
              className="text-xs text-gray-500 hover:text-[#D4AF37] transition-colors"
            >
              Espace Pro
            </button>
            <span className="text-gray-700">|</span>
            <button
              onClick={() => navigateTo('/admin')}
              className="text-xs text-gray-500 hover:text-[#D4AF37] transition-colors"
            >
              Administration
            </button>
          </div>
        </div>
      </div>

      {/* Text hover effect — AfriBayit branding */}
      <div className="lg:flex hidden h-[28rem] -mt-52 -mb-36">
        <TextHoverEffect text="AfriBayit" className="z-50" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}
