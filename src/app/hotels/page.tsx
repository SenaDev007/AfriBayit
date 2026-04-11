"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// ─── Types ────────────────────────────────────────
interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  stars: number;
  priceXof: number;
  rating: number;
  reviews: number;
  tags: string[];
  source: "DIRECT" | "OTA";
  otaPartner?: string;
  badge?: string;
}

// ─── Demo data per CDC Section 7D Phase-1 targets ─
const HOTELS: Hotel[] = [
  {
    id: "1",
    name: "Azalaï Hôtel Cotonou",
    city: "Cotonou",
    country: "Bénin",
    stars: 4,
    priceXof: 42000,
    rating: 4.6,
    reviews: 312,
    tags: ["Piscine", "Wifi", "Climatisé", "Petit-déj"],
    source: "DIRECT",
    badge: "AfriBayit Recommended",
  },
  {
    id: "2",
    name: "Novotel Abidjan",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    stars: 4,
    priceXof: 78000,
    rating: 4.4,
    reviews: 890,
    tags: ["Business center", "Gym", "Piscine", "Restaurant"],
    source: "OTA",
    otaPartner: "Booking.com",
  },
  {
    id: "3",
    name: "Hôtel Silmandé",
    city: "Ouagadougou",
    country: "Burkina Faso",
    stars: 3,
    priceXof: 28000,
    rating: 4.2,
    reviews: 145,
    tags: ["Wifi", "Climatisé", "Restauration"],
    source: "DIRECT",
    badge: "AfriBayit Recommended",
  },
  {
    id: "4",
    name: "Hôtel Palm Beach Lomé",
    city: "Lomé",
    country: "Togo",
    stars: 3,
    priceXof: 32000,
    rating: 4.5,
    reviews: 203,
    tags: ["Bord de mer", "Piscine", "Wifi", "Parking"],
    source: "DIRECT",
  },
  {
    id: "5",
    name: "Golden Tulip Cotonou",
    city: "Cotonou",
    country: "Bénin",
    stars: 4,
    priceXof: 55000,
    rating: 4.3,
    reviews: 421,
    tags: ["Spa", "Gym", "Piscine", "Business"],
    source: "OTA",
    otaPartner: "Booking.com",
  },
  {
    id: "6",
    name: "Sofitel Abidjan Hôtel Ivoire",
    city: "Abidjan",
    country: "Côte d'Ivoire",
    stars: 5,
    priceXof: 145000,
    rating: 4.8,
    reviews: 1240,
    tags: ["Luxe", "Golf", "Casino", "Spa", "Lac"],
    source: "OTA",
    otaPartner: "Expedia",
    badge: "Top Établissement",
  },
];

const CITIES = ["Toutes", "Cotonou", "Abidjan", "Ouagadougou", "Lomé"];
const STARS_FILTER = ["Tous", "3 étoiles", "4 étoiles", "5 étoiles"];

const STATS = [
  { value: "630+", label: "Hôtels partenaires" },
  { value: "9 200", label: "Chambres disponibles" },
  { value: "4", label: "Pays couverts" },
  { value: "OTA", label: "Booking.com & Expedia" },
];

function StarRow({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`w-3 h-3 ${s <= count ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

function formatXof(n: number) {
  return n.toLocaleString("fr-FR") + " FCFA";
}

export default function HotelsPage() {
  const [city, setCity] = useState("Toutes");
  const [stars, setStars] = useState("Tous");
  const [search, setSearch] = useState("");

  const filtered = HOTELS.filter((h) => {
    if (city !== "Toutes" && h.city !== city) return false;
    if (stars === "3 étoiles" && h.stars !== 3) return false;
    if (stars === "4 étoiles" && h.stars !== 4) return false;
    if (stars === "5 étoiles" && h.stars !== 5) return false;
    if (search && !h.name.toLowerCase().includes(search.toLowerCase()) && !h.city.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#003087] via-[#0070BA] to-teal-600 pt-[88px] pb-16">
        <div className="container-app text-center">
          <span className="inline-block bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            AfriBayit Hospitality
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Hôtels & Hébergements<br />
            <span className="text-blue-200">en Afrique de l'Ouest</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Réservez dans 630+ hôtels partenaires avec paiement Mobile Money ou carte.
            Hôtels directs et disponibilités Booking.com & Expedia en temps réel.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-2 flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3">
              <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher un hôtel ou une ville…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-[15px] outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
            <button className="bg-[#003087] hover:bg-[#002070] text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
              Rechercher
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="container-app">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
            {STATS.map((s) => (
              <div key={s.label} className="py-7 text-center">
                <div className="text-2xl font-extrabold text-[#003087] mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OTA info banner */}
      <section className="bg-gradient-to-r from-blue-50 to-teal-50 border-b border-blue-100">
        <div className="container-app py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm font-medium text-[#003087]">
              <span className="w-5 h-5 bg-[#003C96] rounded text-white text-[10px] font-bold flex items-center justify-center">B</span>
              Booking.com
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center gap-1.5 text-sm font-medium text-[#003087]">
              <span className="w-5 h-5 bg-[#00355F] rounded text-white text-[10px] font-bold flex items-center justify-center">E</span>
              Expedia
            </div>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-600">Disponibilités synchronisées en temps réel</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Paiement Mobile Money & Carte • Confirmation instantanée
          </div>
        </div>
      </section>

      {/* Filters + Hotels */}
      <section className="py-10">
        <div className="container-app">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="flex flex-wrap gap-2">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    city === c
                      ? "bg-[#003087] text-white border-[#003087]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#003087] hover:text-[#003087]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-4">
              {STARS_FILTER.map((s) => (
                <button
                  key={s}
                  onClick={() => setStars(s)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    stars === s
                      ? "bg-amber-400 text-white border-amber-400"
                      : "bg-white text-gray-600 border-gray-200 hover:border-amber-400 hover:text-amber-600"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mb-5">
            <p className="text-gray-500 text-sm">
              <span className="font-semibold text-gray-800">{filtered.length}</span> établissements trouvés
            </p>
            <span className="text-xs text-gray-400">Tarifs à partir de / nuit</span>
          </div>

          {/* Hotel cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((hotel) => (
              <div
                key={hotel.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
              >
                {/* Placeholder image */}
                <div className="h-40 bg-gradient-to-br from-teal-50 to-blue-100 flex items-center justify-center relative">
                  <svg className="w-12 h-12 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {hotel.badge && (
                      <span className="bg-[#003087] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        ✓ {hotel.badge}
                      </span>
                    )}
                    {hotel.source === "OTA" && hotel.otaPartner && (
                      <span className="bg-white/90 text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200">
                        via {hotel.otaPartner}
                      </span>
                    )}
                    {hotel.source === "DIRECT" && (
                      <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Réservation directe
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 text-[15px] leading-snug">{hotel.name}</h3>
                    <StarRow count={hotel.stars} />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    📍 {hotel.city}, {hotel.country}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {hotel.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                    {hotel.tags.length > 3 && (
                      <span className="text-[11px] text-gray-400">+{hotel.tags.length - 3}</span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-[#003087] text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                      {hotel.rating.toFixed(1)}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <svg key={s} className={`w-3 h-3 ${s <= Math.round(hotel.rating) ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">{hotel.reviews} avis</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div>
                      <p className="text-[11px] text-gray-400">À partir de</p>
                      <p className="font-bold text-[#003087] text-base">{formatXof(hotel.priceXof)}</p>
                      <p className="text-[11px] text-gray-400">/ nuit</p>
                    </div>
                    <Link
                      href={`/hotels/${hotel.id}`}
                      className="bg-[#0070BA] hover:bg-[#005a9a] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                      Réserver
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">Aucun hôtel ne correspond à votre recherche.</p>
              <button onClick={() => { setCity("Toutes"); setStars("Tous"); setSearch(""); }} className="mt-4 text-[#0070BA] hover:underline text-sm">
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Hotel owner CTA — per CDC 7D.3 onboarding */}
      <section className="bg-gray-50 border-t border-gray-100 py-14">
        <div className="container-app max-w-4xl">
          <div className="bg-gradient-to-br from-[#003087] to-teal-700 rounded-2xl p-10 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Vous gérez un hôtel ?
            </h2>
            <p className="text-blue-100 max-w-xl mx-auto mb-8 leading-relaxed">
              Rejoignez AfriBayit Hospitality. Notre PMS léger vous permet de digitaliser
              votre gestion en moins de 48h — sans expérience technique requise.
              Recevez des réservations directes et distribuez sur Booking.com & Expedia.
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
              {[
                { v: "48h", sub: "Onboarding" },
                { v: "0%", sub: "Commission mois 1" },
                { v: "OTA", sub: "Distribution auto" },
              ].map((item) => (
                <div key={item.v} className="text-center">
                  <div className="font-bold text-white text-xl">{item.v}</div>
                  <div className="text-blue-200 text-xs">{item.sub}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/tarifs#hotel"
                className="bg-white text-[#003087] font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm"
              >
                Voir les offres PMS
              </Link>
              <Link
                href="/contact"
                className="border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
              >
                Nous contacter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Investor package — per CDC 7D.9 */}
      <section className="py-14 border-t border-gray-100">
        <div className="container-app">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-[#003087] mb-2">Packages Exclusifs AfriBayit</h2>
            <p className="text-gray-500 text-sm">La synergie unique : hôtellerie + immobilier</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: "🏛️",
                title: "Package Investisseur",
                desc: "Séjour hôtel partenaire + visites de biens immobiliers planifiées + agent certifié dédié. Idéal pour la diaspora.",
                tag: "Depuis 500 000 FCFA",
                href: "/contact",
              },
              {
                icon: "🏠",
                title: "Package Relocation",
                desc: "Hôtel de transition (1-4 semaines) + accès prioritaire aux annonces locales + matching agent AfriBayit. Remise croisée 10%.",
                tag: "Disponible maintenant",
                href: "/contact",
              },
              {
                icon: "🔨",
                title: "Package Artisan",
                desc: "Hébergement hôtel partenaire le plus proche du chantier + gestion de mission artisan. Facturation unifiée AfriBayit.",
                tag: "Pour les pros BTP",
                href: "/artisans",
              },
            ].map((pkg) => (
              <div key={pkg.title} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
                <span className="text-3xl mb-4 block">{pkg.icon}</span>
                <h3 className="font-bold text-gray-900 text-[16px] mb-2">{pkg.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{pkg.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] bg-[#003087]/10 text-[#003087] px-3 py-1 rounded-full font-medium">
                    {pkg.tag}
                  </span>
                  <Link href={pkg.href} className="text-[13px] text-[#0070BA] font-medium hover:underline">
                    En savoir plus →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
