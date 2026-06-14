'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Phone,
  MapPin,
  Home,
  Shield,
  Bot,
  Building2,
  Hotel,
  Scale,
  PlusCircle,
  FileText,
  Lock,
  Cookie,
  AlertTriangle,
  Trash2,
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
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaTiktok,
  FaCcVisa,
  FaCcMastercard,
  FaCcPaypal,
  FaMobileAlt,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
// FedaPay doesn't exist in react-icons — custom SVG icon
const FedaPayIcon = ({ size = 28 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="24" height="24" rx="4" fill="#00C853" />
    <path
      d="M6 8h5.5c1.4 0 2.5 1.1 2.5 2.5S12.9 13 11.5 13H8v3H6V8zm2 2v1h3.5c.3 0 .5-.2.5-.5s-.2-.5-.5-.5H8zm5 2l3 4h-2.5l-2-2.7L11 16H8.5l3-4 2.5-2z"
      fill="white"
    />
  </svg>
);
import { FooterBackgroundGradient, TextHoverEffect } from '@/components/ui/hover-footer';

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
        { label: 'CGU', href: '/terms', icon: <FileText size={14} /> },
        { label: 'Confidentialité', href: '/privacy', icon: <Lock size={14} /> },
        { label: 'Cookies', href: '/privacy#cookies', icon: <Cookie size={14} /> },
        { label: 'Mentions légales', href: '/terms#droit-applicable', icon: <FileText size={14} /> },
        { label: 'Suppression de données', href: '/delete-data', icon: <Trash2 size={14} /> },
        { label: 'Signaler', href: 'mailto:contact@afribayit.com', icon: <AlertTriangle size={14} /> },
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

  // Social media — official brand icons from react-icons
  const socialLinks = [
    {
      icon: <FaFacebookF size={18} />,
      label: 'Facebook',
      href: 'https://facebook.com/afribayit',
      brandColor: '#1877F2',
    },
    {
      icon: <FaInstagram size={18} />,
      label: 'Instagram',
      href: 'https://instagram.com/afribayit',
      brandColor: '#E4405F',
    },
    {
      icon: <FaXTwitter size={18} />,
      label: 'X (Twitter)',
      href: 'https://x.com/afribayit',
      brandColor: '#FFFFFF',
    },
    {
      icon: <FaLinkedinIn size={18} />,
      label: 'LinkedIn',
      href: 'https://linkedin.com/company/afribayit',
      brandColor: '#0A66C2',
    },
    {
      icon: <FaYoutube size={18} />,
      label: 'YouTube',
      href: 'https://youtube.com/@afribayit',
      brandColor: '#FF0000',
    },
    {
      icon: <FaTiktok size={18} />,
      label: 'TikTok',
      href: 'https://tiktok.com/@afribayit',
      brandColor: '#FFFFFF',
    },
  ];

  // Payment & telecom partners — using official brand icons
  const paymentPartners = [
    {
      icon: <FaCcVisa size={36} />,
      label: 'Visa',
      brandColor: '#1A1F71',
    },
    {
      icon: <FaCcMastercard size={36} />,
      label: 'Mastercard',
      brandColor: '#EB001B',
    },
    {
      icon: <FaCcPaypal size={36} />,
      label: 'PayPal',
      brandColor: '#003087',
    },
    {
      icon: <FedaPayIcon size={32} />,
      label: 'FedaPay',
      brandColor: '#00C853',
    },
  ];

  // Mobile money partners with custom styled badges
  const mobileMoneyPartners = [
    {
      name: 'MTN MoMo',
      bg: 'bg-[#FFCC00]',
      text: 'text-[#1a1a1a]',
      icon: <FaMobileAlt size={14} className="text-[#1a1a1a]" />,
    },
    {
      name: 'Orange Money',
      bg: 'bg-[#FF7900]',
      text: 'text-white',
      icon: <FaMobileAlt size={14} className="text-white" />,
    },
    {
      name: 'Moov Money',
      bg: 'bg-[#009DE0]',
      text: 'text-white',
      icon: <FaMobileAlt size={14} className="text-white" />,
    },
  ];

  // Countries covered
  const countries = [
    { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
    { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
    { code: 'TG', name: 'Togo', flag: '🇹🇬' },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  ];

  return (
    <footer className="bg-[#0a0a0c] relative h-fit overflow-hidden sm:m-4 lg:m-8 rounded-3xl">
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
            <p className="text-sm leading-relaxed text-gray-200">
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
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-xs text-white hover:text-[#D4AF37]"
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
                      className="text-gray-100 hover:text-[#D4AF37] transition-colors text-sm"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-gray-100 text-sm">
                      {item.text}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {/* Social icons — official brand logos */}
            <div className="flex space-x-3 pt-2">
              {socialLinks.map(({ icon, label, href, brandColor }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 transition-all duration-300 hover:scale-110 hover:shadow-lg"
                  style={{
                    // On hover, use the brand color via inline style for the shadow
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = brandColor;
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px ${brandColor}44`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = '';
                    (e.currentTarget as HTMLElement).style.boxShadow = '';
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Partners & Payments — official brand icons */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-white text-lg font-semibold flex items-center gap-2">
              <Shield size={18} className="text-[#D4AF37]" />
              Paiement & Partenaires
            </h4>

            {/* Official payment card icons */}
            <div className="flex items-center gap-3 flex-wrap">
              {paymentPartners.map((p) => (
                <div
                  key={p.label}
                  className="flex items-center justify-center bg-white rounded-md px-2 py-1.5 transition-transform hover:scale-110"
                  title={p.label}
                >
                  <span style={{ color: p.brandColor }}>
                    {p.icon}
                  </span>
                </div>
              ))}
            </div>

            {/* Mobile money badges */}
            <div className="flex flex-wrap gap-2 mt-1">
              {mobileMoneyPartners.map((p) => (
                <span
                  key={p.name}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${p.bg} ${p.text} transition-transform hover:scale-105`}
                >
                  {p.icon}
                  {p.name}
                </span>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30">
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
                      className="flex items-center gap-2 text-gray-100 hover:text-[#D4AF37] transition-colors text-sm group"
                    >
                      <span className="opacity-50 group-hover:opacity-100 transition-opacity text-gray-300">
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

        <hr className="border-t border-white/10 my-6" />

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm space-y-4 md:space-y-0">
          <p className="text-gray-300 text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} AfriBayit. Tous droits réservés. Plateforme agréée par les autorités immobilières.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateTo('/auth/login')}
              className="text-xs text-gray-300 hover:text-[#D4AF37] transition-colors"
            >
              Espace Pro
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={() => navigateTo('/admin')}
              className="text-xs text-gray-300 hover:text-[#D4AF37] transition-colors"
            >
              Administration
            </button>
          </div>
        </div>
      </div>

      {/* Text hover effect — AfriBayit branding (large) */}
      <div className="lg:flex hidden h-[36rem] -mt-40 -mb-28">
        <TextHoverEffect text="AfriBayit" className="z-50" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}
