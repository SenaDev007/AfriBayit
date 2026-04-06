import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/property/SearchBar";
import Button from "@/components/ui/Button";

const STATS = [
  { value: "10K+", label: "Annonces actives" },
  { value: "4", label: "Pays couverts" },
  { value: "50K+", label: "Utilisateurs" },
  { value: "100%", label: "Transactions sécurisées" },
];

const SERVICES = [
  {
    icon: "🏠",
    title: "Immobilier",
    desc: "Achetez, vendez ou louez en toute sécurité avec vérification KYC et escrow intégré.",
    href: "/properties",
    iconBg: "bg-blue-100",
  },
  {
    icon: "🏡",
    title: "Location Courte",
    desc: "Séjours de courte durée avec paiement Mobile Money et check-in numérique.",
    href: "/rentals",
    iconBg: "bg-amber-100",
  },
  {
    icon: "🛏️",
    title: "Guesthouses",
    desc: "Hébergements certifiés AfriBayit — réservation chambre par chambre.",
    href: "/guesthouses",
    iconBg: "bg-emerald-100",
  },
  {
    icon: "🔧",
    title: "Artisans BTP",
    desc: "ProMatch : trouvez l'artisan certifié idéal pour vos projets de construction.",
    href: "/artisans",
    iconBg: "bg-violet-100",
  },
  {
    icon: "🎓",
    title: "Formation",
    desc: "AfriBayit Academy : 500h+ de formations certifiées en immobilier africain.",
    href: "/academy",
    iconBg: "bg-rose-100",
  },
  {
    icon: "👥",
    title: "Communauté",
    desc: "Rejoignez les investisseurs et propriétaires africains — forums, événements, mentoring.",
    href: "/community",
    iconBg: "bg-cyan-100",
  },
];

const CITIES = [
  { name: "Cotonou", country: "BJ", flag: "🇧🇯", count: "1.2K annonces" },
  { name: "Abidjan", country: "CI", flag: "🇨🇮", count: "2.8K annonces" },
  { name: "Ouagadougou", country: "BF", flag: "🇧🇫", count: "650 annonces" },
  { name: "Lomé", country: "TG", flag: "🇹🇬", count: "480 annonces" },
  { name: "Dakar", country: "SN", flag: "🇸🇳", count: "1.5K annonces" },
  { name: "Accra", country: "GH", flag: "🇬🇭", count: "900 annonces" },
];

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

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center bg-hero overflow-hidden pt-[72px]">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#FFB900] rounded-full blur-3xl" />
        </div>

        <div className="relative container-app flex flex-col items-center justify-center flex-1 py-20 md:py-28 text-center gap-12 md:gap-14">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-5 py-2.5 rounded-full border border-white/25">
            <span className="w-2 h-2 bg-[#00A651] rounded-full animate-pulse shrink-0" />
            Plateforme active dans 4 pays africains
          </div>

          <h1 className="text-white font-extrabold tracking-tight max-w-4xl mx-auto text-[clamp(2.5rem,5vw+1rem,4.5rem)] leading-[1.12] flex flex-col gap-3 sm:gap-4">
            <span className="block">Où l&apos;Afrique</span>
            <span className="block text-[#FFB900]">trouve sa maison</span>
          </h1>

          <p className="text-xl text-white/85 max-w-[700px] mx-auto leading-[1.75] px-2">
            La première super-app immobilière africaine — annonces, locations,
            guesthouses, artisans BTP, formation et communauté d&apos;investisseurs.
          </p>

          <div className="w-full max-w-4xl">
            <SearchBar variant="hero" />
          </div>

          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 justify-center items-center pt-2">
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
                className="border-2 border-white text-white hover:bg-white hover:text-[#003087]"
              >
                Publier une annonce
              </Button>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path
              d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z"
              fill="#F8FAFC"
            />
          </svg>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-[#003087] py-12">
        <div className="container-app">
          <div className="flex flex-wrap justify-center gap-y-10 gap-x-8 md:gap-x-20 lg:gap-x-[80px]">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center min-w-[140px]">
                <p className="text-5xl font-extrabold text-[#FFB900] leading-none mb-2">
                  {stat.value}
                </p>
                <p className="text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES — fond #F8FAFC */}
      <section className="bg-[#F8FAFC] section-y">
        <div className="container-app">
          <div className="text-center mb-14 md:mb-16">
            <span className="text-[#0070BA] text-sm font-semibold uppercase tracking-widest">
              Notre Écosystème
            </span>
            <h2 className="text-4xl font-bold text-[#003087] mt-3 mb-4 leading-[1.2]">
              Tout l&apos;immobilier africain
              <br />
              en une seule plateforme
            </h2>
            <p className="text-base text-[#374151] leading-[1.7] max-w-2xl mx-auto">
              AfriBayit fusionne les meilleures fonctionnalités d&apos;Immoweb et
              d&apos;Airbnb, adaptées aux réalités du continent africain.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service) => (
              <Link key={service.href} href={service.href} className="block h-full">
                <div className="group bg-white rounded-2xl p-8 h-full border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.08)] card-hover">
                  <div
                    className={`w-12 h-12 rounded-xl ${service.iconBg} flex items-center justify-center text-2xl mb-6`}
                  >
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-[#003087] mb-3 group-hover:text-[#0070BA] transition-colors duration-200">
                    {service.title}
                  </h3>
                  <p className="text-base text-[#374151] leading-[1.7]">
                    {service.desc}
                  </p>
                  <div className="mt-6 flex items-center text-[#0070BA] text-sm font-semibold group-hover:gap-2 gap-1 transition-all duration-200">
                    Explorer
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* VILLES — fond blanc */}
      <section className="bg-white section-y">
        <div className="container-app">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12 md:mb-16">
            <div>
              <span className="text-[#0070BA] text-sm font-semibold uppercase tracking-widest">
                Villes Populaires
              </span>
              <h2 className="text-4xl font-bold text-[#003087] mt-3 leading-[1.2]">
                Explorez par ville
              </h2>
            </div>
            <Link href="/properties">
              <Button variant="outline" size="md">
                Voir tout
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {CITIES.map((city) => (
              <Link
                key={city.name}
                href={`/properties?country=${city.country}&city=${city.name}`}
              >
                <div className="group bg-[#F8FAFC] rounded-2xl p-8 text-center border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)] card-hover">
                  <span className="text-4xl mb-3 block">{city.flag}</span>
                  <h3 className="text-xl font-semibold text-[#111827] group-hover:text-[#0070BA] transition-colors duration-200">
                    {city.name}
                  </h3>
                  <p className="text-sm text-[#6B7280] mt-2">{city.count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* PAIEMENTS — fond #F8FAFC */}
      <section className="bg-[#F8FAFC] section-y">
        <div className="container-app">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-4xl font-bold text-[#003087] mb-3 leading-[1.2]">
              Paiements adaptés à l&apos;Afrique
            </h2>
            <p className="text-base text-[#374151] leading-[1.7]">
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
                className="flex items-center gap-2 bg-white rounded-2xl px-5 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-slate-100"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: payment.bg }}
                />
                <span className="text-sm font-medium text-[#374151]">
                  {payment.name}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-12 md:mt-16 bg-gradient-to-r from-[#003087] to-[#0070BA] rounded-2xl p-8 md:p-10 text-white text-center shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="text-2xl font-bold mb-3">Système d&apos;Escrow Intégré</h3>
            <p className="text-base text-white/85 max-w-xl mx-auto leading-[1.7]">
              Toutes les transactions immobilières sont sécurisées par un compte séquestre
              automatique — les fonds sont libérés uniquement après confirmation des deux parties.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {[
                "KYC/AML automatisé",
                "Signature électronique",
                "Assurance transaction",
                "Smart contracts",
              ].map((feature) => (
                <span
                  key={feature}
                  className="bg-white/15 text-white text-sm px-4 py-2 rounded-full border border-white/25"
                >
                  ✓ {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES — fond blanc */}
      <section className="bg-white section-y">
        <div className="container-app">
          <div className="text-center mb-14 md:mb-16">
            <span className="text-[#0070BA] text-sm font-semibold uppercase tracking-widest">
              Témoignages
            </span>
            <h2 className="text-4xl font-bold text-[#003087] mt-3 leading-[1.2]">
              Ils font confiance à AfriBayit
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-[#F8FAFC] rounded-2xl p-8 border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-[#FFB900] fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-base text-[#374151] leading-[1.7] mb-6 italic">
                  &quot;{t.text}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0070BA] flex items-center justify-center text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-[#111827] text-sm">{t.name}</p>
                    <p className="text-sm text-[#6B7280]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-africa section-y">
        <div className="container-app">
          <div className="max-w-4xl mx-auto w-full text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-[1.2]">
            Prêt à trouver
            <br />
            <span className="text-[#FFB900]">votre maison africaine ?</span>
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-[1.7]">
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
                className="border-2 border-white text-white hover:bg-white hover:text-[#003087]"
              >
                Voir les annonces
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-white/70 text-sm">
            <span>✓ Gratuit pour les acheteurs</span>
            <span>✓ KYC sécurisé</span>
            <span>✓ Support 24/7</span>
          </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
