import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/property/SearchBar";
import Button from "@/components/ui/Button";

// Stats
const STATS = [
  { value: "10K+", label: "Annonces actives" },
  { value: "4", label: "Pays couverts" },
  { value: "50K+", label: "Utilisateurs" },
  { value: "100%", label: "Transactions sécurisées" },
];

// Services principaux
const SERVICES = [
  {
    icon: "🏠",
    title: "Immobilier",
    desc: "Achetez, vendez ou louez en toute sécurité avec vérification KYC et escrow intégré.",
    href: "/properties",
    color: "from-blue-500 to-blue-700",
  },
  {
    icon: "🏡",
    title: "Location Courte",
    desc: "Séjours de courte durée avec paiement Mobile Money et check-in numérique.",
    href: "/rentals",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: "🛏️",
    title: "Guesthouses",
    desc: "Hébergements certifiés AfriBayit — réservation chambre par chambre.",
    href: "/guesthouses",
    color: "from-emerald-500 to-green-600",
  },
  {
    icon: "🔧",
    title: "Artisans BTP",
    desc: "ProMatch : trouvez l'artisan certifié idéal pour vos projets de construction.",
    href: "/artisans",
    color: "from-purple-500 to-violet-700",
  },
  {
    icon: "🎓",
    title: "Formation",
    desc: "AfriBayit Academy : 500h+ de formations certifiées en immobilier africain.",
    href: "/academy",
    color: "from-rose-500 to-pink-600",
  },
  {
    icon: "👥",
    title: "Communauté",
    desc: "Rejoignez les investisseurs et propriétaires africains — forums, événements, mentoring.",
    href: "/community",
    color: "from-cyan-500 to-teal-600",
  },
];

// Popular cities
const CITIES = [
  { name: "Cotonou", country: "BJ", flag: "🇧🇯", count: "1.2K annonces" },
  { name: "Abidjan", country: "CI", flag: "🇨🇮", count: "2.8K annonces" },
  { name: "Ouagadougou", country: "BF", flag: "🇧🇫", count: "650 annonces" },
  { name: "Lomé", country: "TG", flag: "🇹🇬", count: "480 annonces" },
  { name: "Dakar", country: "SN", flag: "🇸🇳", count: "1.5K annonces" },
  { name: "Accra", country: "GH", flag: "🇬🇭", count: "900 annonces" },
];

// Testimonials
const TESTIMONIALS = [
  {
    name: "Moussa Koné",
    role: "Investisseur, Abidjan",
    avatar: "MK",
    rating: 5,
    text: "AfriBayit m'a permis de trouver 3 appartements à Abidjan en moins d'une semaine. Le système d'escrow m'a donné toute la confiance nécessaire.",
  },
  {
    name: "Aminata Diallo",
    role: "Propriétaire Guesthouse, Cotonou",
    avatar: "AD",
    rating: 5,
    text: "Je gère ma guesthouse de 8 chambres facilement depuis l'app. Les réservations Mobile Money arrivent instantanément. Excellent service !",
  },
  {
    name: "Jean-Luc Ouédraogo",
    role: "Artisan maçon, Ouagadougou",
    avatar: "JO",
    rating: 5,
    text: "ProMatch m'a connecté à 15 nouveaux clients ce mois. Le badge certifié AfriBayit a vraiment changé mon activité.",
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar transparent />

      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center bg-hero overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#FFB900] rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#009CDE] rounded-full blur-3xl" />
        </div>

        {/* African map subtle background */}
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 800 600" className="w-full h-full">
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="300" fill="white">
              🌍
            </text>
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          <div className="text-center">
            {/* Tag line */}
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full mb-6 border border-white/25">
              <span className="w-2 h-2 bg-[#00A651] rounded-full animate-pulse" />
              Plateforme active dans 4 pays africains
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Où l&apos;Afrique
              <br />
              <span className="text-[#FFB900]">trouve sa maison</span>
            </h1>

            <p className="text-xl text-white/85 mb-10 max-w-2xl mx-auto leading-relaxed">
              La première super-app immobilière africaine — annonces, locations,
              guesthouses, artisans BTP, formation et communauté d&apos;investisseurs.
            </p>

            {/* Search Bar */}
            <div className="mb-10">
              <SearchBar variant="hero" />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/properties">
                <Button variant="gold" size="xl">
                  Explorer les annonces
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  variant="outline"
                  size="xl"
                  className="border-white text-white hover:bg-white hover:text-[#003087]"
                >
                  Publier une annonce
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
              fill="#FAFAFA"
            />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STATS SECTION
          ═══════════════════════════════════════════ */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-[#003087] mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SERVICES SECTION
          ═══════════════════════════════════════════ */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[#0070BA] text-sm font-semibold uppercase tracking-widest">
              Notre Écosystème
            </span>
            <h2 className="text-4xl font-bold text-[#003087] mt-2 mb-4">
              Tout l&apos;immobilier africain
              <br />
              en une seule plateforme
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              AfriBayit fusionne les meilleures fonctionnalités d&apos;Immoweb et
              d&apos;Airbnb, adaptées aux réalités du continent africain.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <Link key={service.href} href={service.href}>
                <div className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover h-full">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center text-2xl mb-4 shadow-lg`}
                  >
                    {service.icon}
                  </div>
                  <h3 className="font-bold text-lg text-[#003087] mb-2 group-hover:text-[#0070BA] transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{service.desc}</p>
                  <div className="mt-4 flex items-center text-[#0070BA] text-sm font-medium group-hover:gap-2 gap-1 transition-all">
                    Explorer
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          POPULAR CITIES
          ═══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <span className="text-[#0070BA] text-sm font-semibold uppercase tracking-widest">
                Villes Populaires
              </span>
              <h2 className="text-4xl font-bold text-[#003087] mt-2">
                Explorez par ville
              </h2>
            </div>
            <Link href="/properties">
              <Button variant="outline" size="md">Voir tout</Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CITIES.map((city) => (
              <Link
                key={city.name}
                href={`/properties?country=${city.country}&city=${city.name}`}
              >
                <div className="group bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 text-center border border-gray-100 card-hover">
                  <span className="text-4xl mb-2 block">{city.flag}</span>
                  <h3 className="font-bold text-gray-800 group-hover:text-[#0070BA] transition-colors">
                    {city.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{city.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PAYMENT ECOSYSTEM
          ═══════════════════════════════════════════ */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#003087] mb-3">
              Paiements adaptés à l&apos;Afrique
            </h2>
            <p className="text-gray-500">
              Mobile Money, carte bancaire, virement — tous les modes de paiement africains
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { name: "MTN MoMo", bg: "#FFB900", text: "black" },
              { name: "Orange Money", bg: "#FF6600", text: "white" },
              { name: "Airtel Money", bg: "#E40520", text: "white" },
              { name: "Moov Money", bg: "#00A651", text: "white" },
              { name: "FedaPay", bg: "#003087", text: "white" },
              { name: "M-Pesa", bg: "#00A651", text: "white" },
              { name: "Flutterwave", bg: "#F5A623", text: "white" },
              { name: "Visa / Mastercard", bg: "#1A1F71", text: "white" },
            ].map((payment) => (
              <div
                key={payment.name}
                className="flex items-center gap-2 bg-white rounded-xl px-5 py-3 shadow-sm border border-gray-100"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: payment.bg }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {payment.name}
                </span>
              </div>
            ))}
          </div>

          {/* Escrow trust block */}
          <div className="mt-12 bg-gradient-to-r from-[#003087] to-[#0070BA] rounded-2xl p-8 text-white text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="text-2xl font-bold mb-2">Système d&apos;Escrow Intégré</h3>
            <p className="text-blue-200 max-w-xl mx-auto">
              Toutes les transactions immobilières sont sécurisées par un compte séquestre
              automatique — les fonds sont libérés uniquement après confirmation des deux parties.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {[
                "KYC/AML automatisé",
                "Signature électronique",
                "Assurance transaction",
                "Smart contracts",
              ].map((feature) => (
                <span
                  key={feature}
                  className="bg-white/15 text-white text-sm px-4 py-1.5 rounded-full border border-white/25"
                >
                  ✓ {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TESTIMONIALS
          ═══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-[#0070BA] text-sm font-semibold uppercase tracking-widest">
              Témoignages
            </span>
            <h2 className="text-4xl font-bold text-[#003087] mt-2">
              Ils font confiance à AfriBayit
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-[#FFB900] fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">
                  &quot;{t.text}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0070BA] flex items-center justify-center text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════════ */}
      <section className="py-20 bg-africa">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Prêt à trouver
            <br />
            <span className="text-[#FFB900]">votre maison africaine ?</span>
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Rejoignez 50 000+ Africains qui font confiance à AfriBayit
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button variant="gold" size="xl">
                Commencer gratuitement
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Button>
            </Link>
            <Link href="/properties">
              <Button
                variant="outline"
                size="xl"
                className="border-white text-white hover:bg-white hover:text-[#003087]"
              >
                Voir les annonces
              </Button>
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 mt-8 text-white/60 text-sm">
            <span>✓ Gratuit pour les acheteurs</span>
            <span>✓ KYC sécurisé</span>
            <span>✓ Support 24/7</span>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
