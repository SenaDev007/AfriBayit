import Link from "next/link";

const FOOTER_LINKS = {
  immobilier: [
    { href: "/properties?type=sale", label: "Acheter" },
    { href: "/properties?listingType=LONG_TERM_RENTAL", label: "Louer" },
    { href: "/properties?listingType=SHORT_TERM_RENTAL", label: "Location courte" },
    { href: "/properties/new", label: "Publier une annonce" },
    { href: "/properties?country=BJ", label: "Immobilier Bénin" },
    { href: "/properties?country=CI", label: "Immobilier Côte d'Ivoire" },
  ],
  services: [
    { href: "/guesthouses", label: "Guesthouses" },
    { href: "/artisans", label: "Artisans BTP" },
    { href: "/artisans/emergency", label: "Urgences 24h/7j" },
    { href: "/academy", label: "Formation Academy" },
    { href: "/community", label: "Communauté" },
    { href: "/invest", label: "Investir" },
  ],
  compagnie: [
    { href: "/about", label: "À propos" },
    { href: "/careers", label: "Carrières" },
    { href: "/press", label: "Presse" },
    { href: "/partners", label: "Partenaires" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/terms", label: "CGU" },
    { href: "/privacy", label: "Confidentialité" },
    { href: "/cookies", label: "Cookies" },
    { href: "/security", label: "Sécurité" },
    { href: "/sitemap", label: "Plan du site" },
  ],
};

const PAYMENT_METHODS = [
  { name: "MTN MoMo", color: "#FFB900" },
  { name: "Orange Money", color: "#FF6600" },
  { name: "FedaPay", color: "#003087" },
  { name: "Visa", color: "#1A1F71" },
  { name: "Mastercard", color: "#EB001B" },
];

export default function Footer() {
  return (
    <footer className="bg-[#003087] text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                <span className="text-[#0070BA] font-bold text-xl">A</span>
              </div>
              <span className="font-bold text-xl">
                Afri<span className="text-[#009CDE]">Bayit</span>
              </span>
            </Link>
            <p className="text-blue-200 text-sm leading-relaxed mb-5">
              La première super-app immobilière d&apos;Afrique.
              Où l&apos;Afrique trouve sa maison.
            </p>
            <p className="text-blue-200 text-xs">
              🇧🇯 Bénin · 🇨🇮 Côte d&apos;Ivoire<br />
              🇧🇫 Burkina Faso · 🇹🇬 Togo
            </p>

            {/* Social links */}
            <div className="flex gap-3 mt-5">
              {["facebook", "twitter", "instagram", "linkedin", "youtube"].map((social) => (
                <a
                  key={social}
                  href={`https://${social}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label={social}
                >
                  <span className="text-xs font-bold capitalize">{social[0].toUpperCase()}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4 text-white uppercase tracking-wider">
              Immobilier
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.immobilier.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-200 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white uppercase tracking-wider">
              Services
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.services.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-200 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white uppercase tracking-wider">
              Compagnie
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.compagnie.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-200 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-white uppercase tracking-wider">
              Légal
            </h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-blue-200 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Payment methods */}
            <div className="mt-6">
              <h5 className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-3">
                Paiements acceptés
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {PAYMENT_METHODS.map((method) => (
                  <span
                    key={method.name}
                    className="text-xs bg-white/10 text-white px-2 py-0.5 rounded"
                  >
                    {method.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-blue-200 text-sm">
            © {new Date().getFullYear()} AfriBayit. Tous droits réservés.
          </p>
          <div className="flex items-center gap-6">
            <p className="text-blue-200 text-xs">
              🔒 Transactions sécurisées · KYC vérifié · Escrow intégré
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
