import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StarRating from "@/components/ui/StarRating";
import { formatCurrency, COUNTRY_LABELS } from "@/lib/utils";
import type { GuesthouseCard } from "@/types";

export const metadata: Metadata = {
  title: "Guesthouses Certifiées — Hébergement Afrique",
  description: "Réservez des guesthouses certifiées AfriBayit en Afrique de l'Ouest — chambre par chambre, petit-déjeuner, paiement Mobile Money.",
};

const MOCK_GUESTHOUSES: GuesthouseCard[] = [
  {
    id: "g1",
    name: "La Palmeraie de Cocody",
    slug: "palmeraie-cocody",
    country: "CI",
    city: "Abidjan",
    district: "Cocody",
    avgRating: 4.8,
    totalReviews: 127,
    isCertified: true,
    hasBreakfast: true,
    images: [],
    rooms: [
      { id: "r1", basePrice: 45000, currency: "XOF" },
      { id: "r2", basePrice: 35000, currency: "XOF" },
    ],
  },
  {
    id: "g2",
    name: "Maison de l'Espoir",
    slug: "maison-espoir-cotonou",
    country: "BJ",
    city: "Cotonou",
    district: "Haie Vive",
    avgRating: 4.6,
    totalReviews: 89,
    isCertified: true,
    hasBreakfast: false,
    images: [],
    rooms: [
      { id: "r3", basePrice: 25000, currency: "XOF" },
      { id: "r4", basePrice: 30000, currency: "XOF" },
    ],
  },
  {
    id: "g3",
    name: "Villa Akakpo — Lomé",
    slug: "villa-akakpo-lome",
    country: "TG",
    city: "Lomé",
    district: "Bè",
    avgRating: 4.9,
    totalReviews: 56,
    isCertified: true,
    hasBreakfast: true,
    images: [],
    rooms: [
      { id: "r5", basePrice: 20000, currency: "XOF" },
      { id: "r6", basePrice: 25000, currency: "XOF" },
    ],
  },
  {
    id: "g4",
    name: "Résidence Ouaga Center",
    slug: "residence-ouaga-center",
    country: "BF",
    city: "Ouagadougou",
    district: "Koulouba",
    avgRating: 4.4,
    totalReviews: 34,
    isCertified: false,
    hasBreakfast: false,
    images: [],
    rooms: [
      { id: "r7", basePrice: 18000, currency: "XOF" },
    ],
  },
  {
    id: "g5",
    name: "Chez Aminata — Yopougon",
    slug: "chez-aminata-yopougon",
    country: "CI",
    city: "Abidjan",
    district: "Yopougon",
    avgRating: 4.7,
    totalReviews: 91,
    isCertified: true,
    hasBreakfast: true,
    images: [],
    rooms: [
      { id: "r8", basePrice: 28000, currency: "XOF" },
      { id: "r9", basePrice: 32000, currency: "XOF" },
      { id: "r10", basePrice: 38000, currency: "XOF" },
    ],
  },
  {
    id: "g6",
    name: "Le Havre du Voyageur",
    slug: "havre-voyageur-dakar",
    country: "SN",
    city: "Dakar",
    district: "Plateau",
    avgRating: 4.5,
    totalReviews: 73,
    isCertified: true,
    hasBreakfast: true,
    images: [],
    rooms: [
      { id: "r11", basePrice: 30000, currency: "XOF" },
      { id: "r12", basePrice: 40000, currency: "XOF" },
    ],
  },
];

export default function GuesthousesPage() {
  return (
    <>
      <Navbar />

      <main className="pt-16 min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-emerald-700 to-[#003087] py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center text-white">
            <Badge variant="gold" className="mb-3">🏡 Certification AfriBayit</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Guesthouses Africaines
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Hébergements certifiés, réservation chambre par chambre,
              petit-déjeuner inclus — l&apos;expérience africaine authentique.
            </p>

            {/* Search */}
            <div className="bg-white rounded-2xl p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto shadow-2xl">
              <input
                type="text"
                placeholder="Ville, quartier..."
                className="flex-1 px-4 py-3 text-sm focus:outline-none text-gray-700"
              />
              <input
                type="date"
                className="px-4 py-3 text-sm text-gray-600 border-l border-gray-100 focus:outline-none"
              />
              <input
                type="date"
                className="px-4 py-3 text-sm text-gray-600 border-l border-gray-100 focus:outline-none"
              />
              <Button variant="primary" size="md" className="rounded-xl">
                Rechercher
              </Button>
            </div>
          </div>
        </div>

        {/* Certification badge info */}
        <div className="bg-white border-b border-gray-100 py-4 px-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-6">
            {[
              { icon: "✅", label: "Inspection virtuelle" },
              { icon: "📸", label: "Photos vérifiées" },
              { icon: "⭐", label: "Avis clients contrôlés" },
              { icon: "🧹", label: "Score hygiène certifié" },
              { icon: "💳", label: "Paiement Mobile Money" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm text-gray-600">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <button className="px-4 py-2 bg-[#0070BA] text-white rounded-full text-sm font-medium">
              Toutes
            </button>
            {["Certifiées AfriBayit", "Petit-déjeuner", "< 30 000 FCFA/nuit", "Disponible maintenant"].map((f) => (
              <button
                key={f}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-sm font-medium hover:border-[#0070BA] hover:text-[#0070BA] transition-colors"
              >
                {f}
              </button>
            ))}
            <div className="ml-auto text-sm text-gray-500">
              {MOCK_GUESTHOUSES.length} établissements
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MOCK_GUESTHOUSES.map((gh) => {
              const minPrice = Math.min(...gh.rooms.map((r) => r.basePrice));

              return (
                <Link key={gh.id} href={`/guesthouses/${gh.slug}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm card-hover overflow-hidden">
                    {/* Image */}
                    <div className="h-48 bg-gradient-to-br from-emerald-100 to-teal-200 relative flex items-center justify-center">
                      <span className="text-6xl opacity-40">🏡</span>
                      {gh.isCertified && (
                        <div className="absolute top-3 left-3">
                          <span className="badge-certified">✓ Certifiée AfriBayit</span>
                        </div>
                      )}
                      {gh.hasBreakfast && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="gold" size="sm">🍳 Petit-déj inclus</Badge>
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 bg-white/90 rounded-lg px-3 py-1">
                        <span className="text-sm font-bold text-[#003087]">
                          À partir de {formatCurrency(minPrice, gh.rooms[0].currency)}/nuit
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-800 text-sm">{gh.name}</h3>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <svg className="w-3 h-3 text-[#0070BA]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {gh.district ? `${gh.district}, ` : ""}{gh.city}
                            {" · "}{COUNTRY_LABELS[gh.country]?.split(" ")[1]}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-400">{gh.rooms.length} chambres</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <StarRating
                          rating={gh.avgRating}
                          size="sm"
                          showValue
                          showCount
                          count={gh.totalReviews}
                        />
                        <Button variant="outline" size="sm">
                          Réserver
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Become owner CTA */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-[#003087] to-[#0070BA] rounded-2xl p-7 text-white">
              <span className="text-3xl block mb-3">🏠</span>
              <h2 className="text-xl font-bold mb-2">
                Devenez propriétaire de guesthouse
              </h2>
              <p className="text-white/70 text-sm mb-5">
                Transformez votre logement en source de revenus.
                Obtenez la certification AfriBayit et augmentez votre visibilité.
              </p>
              <Button variant="gold" size="md">
                Commencer gratuitement
              </Button>
            </div>
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-7 text-white">
              <span className="text-3xl block mb-3">⭐</span>
              <h2 className="text-xl font-bold mb-2">
                Programme de fidélité
              </h2>
              <p className="text-white/70 text-sm mb-5">
                Cumulez des AfriBayit Points à chaque séjour.
                Échangez-les sur toute la plateforme — immobilier, formation...
              </p>
              <Button
                variant="outline"
                size="md"
                className="border-white text-white hover:bg-white hover:text-emerald-700"
              >
                Découvrir les avantages
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
