import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StarRating from "@/components/ui/StarRating";
import { formatCurrency, ARTISAN_CATEGORY_LABELS, COUNTRY_LABELS } from "@/lib/utils";
import type { ArtisanCard } from "@/types";

export const metadata: Metadata = {
  title: "Artisans BTP — ProMatch",
  description: "Trouvez l'artisan BTP certifié idéal en Afrique — maçon, plombier, électricien, menuisier, décorateur.",
};

const ARTISAN_CATEGORIES = [
  { value: "", label: "Tous les métiers", icon: "🔨" },
  { value: "GROS_OEUVRE", label: "Gros Œuvre", icon: "🏗️" },
  { value: "SECOND_OEUVRE", label: "Second Œuvre", icon: "🔧" },
  { value: "FINITION_DECORATION", label: "Finition & Déco", icon: "🎨" },
  { value: "GENIE_TECHNIQUE", label: "Génie Technique", icon: "⚡" },
  { value: "EXTERIEURS", label: "Extérieurs", icon: "🌿" },
  { value: "RENOVATION_MAINTENANCE", label: "Rénovation", icon: "🔩" },
  { value: "NUMERIQUE_INNOVATION", label: "Numérique", icon: "💻" },
];

const MOCK_ARTISANS: ArtisanCard[] = [
  {
    id: "a1",
    userId: "u1",
    businessName: "Kouamé Construction",
    category: "GROS_OEUVRE",
    specialty: ["Maçonnerie", "Coffrage", "Béton armé"],
    country: "CI",
    city: "Abidjan",
    avgRating: 4.9,
    totalReviews: 87,
    isCertified: true,
    emergencyService: false,
    completedJobs: 145,
    dailyRate: 45000,
    currency: "XOF",
    user: { name: "Jean-Baptiste Kouamé" },
    images: [],
  },
  {
    id: "a2",
    userId: "u2",
    businessName: "Électro-Pro Bénin",
    category: "GENIE_TECHNIQUE",
    specialty: ["Électricité", "Domotique", "Panneaux solaires"],
    country: "BJ",
    city: "Cotonou",
    avgRating: 4.7,
    totalReviews: 62,
    isCertified: true,
    emergencyService: true,
    completedJobs: 220,
    dailyRate: 35000,
    currency: "XOF",
    user: { name: "Dodji Mensah" },
    images: [],
  },
  {
    id: "a3",
    userId: "u3",
    category: "SECOND_OEUVRE",
    specialty: ["Plomberie", "Sanitaire", "Climatisation"],
    country: "TG",
    city: "Lomé",
    avgRating: 4.5,
    totalReviews: 43,
    isCertified: true,
    emergencyService: true,
    completedJobs: 98,
    dailyRate: 30000,
    currency: "XOF",
    user: { name: "Koffi Agbeko" },
    images: [],
  },
  {
    id: "a4",
    userId: "u4",
    businessName: "Déco & Style Africa",
    category: "FINITION_DECORATION",
    specialty: ["Décoration intérieure", "Peinture", "Revêtement sol"],
    country: "CI",
    city: "Abidjan",
    avgRating: 4.8,
    totalReviews: 125,
    isCertified: true,
    emergencyService: false,
    completedJobs: 89,
    dailyRate: 55000,
    currency: "XOF",
    user: { name: "Fatoumata Coulibaly" },
    images: [],
  },
  {
    id: "a5",
    userId: "u5",
    businessName: "Menuiserie Ouédraogo",
    category: "SECOND_OEUVRE",
    specialty: ["Menuiserie bois", "Menuiserie aluminium", "Portes et fenêtres"],
    country: "BF",
    city: "Ouagadougou",
    avgRating: 4.6,
    totalReviews: 51,
    isCertified: false,
    emergencyService: false,
    completedJobs: 67,
    dailyRate: 28000,
    currency: "XOF",
    user: { name: "Ibrahim Ouédraogo" },
    images: [],
  },
  {
    id: "a6",
    userId: "u6",
    businessName: "ModèlBIM Studio",
    category: "NUMERIQUE_INNOVATION",
    specialty: ["Modélisation 3D", "BIM", "Plans architecturaux"],
    country: "SN",
    city: "Dakar",
    avgRating: 5.0,
    totalReviews: 28,
    isCertified: true,
    emergencyService: false,
    completedJobs: 34,
    dailyRate: 80000,
    currency: "XOF",
    user: { name: "Mariama Diallo" },
    images: [],
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  GROS_OEUVRE: "🏗️",
  SECOND_OEUVRE: "🔧",
  FINITION_DECORATION: "🎨",
  GENIE_TECHNIQUE: "⚡",
  EXTERIEURS: "🌿",
  RENOVATION_MAINTENANCE: "🔩",
  NUMERIQUE_INNOVATION: "💻",
};

export default function ArtisansPage() {
  return (
    <>
      <Navbar />

      <main className="pt-16 min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-[#003087] via-[#0070BA] to-purple-600 py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center text-white mb-8">
              <Badge variant="gold" className="mb-3">🔧 AfriBayit ProMatch</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Artisans BTP Certifiés
              </h1>
              <p className="text-xl text-white/80 max-w-2xl mx-auto">
                Trouvez l&apos;expert idéal pour vos projets de construction, rénovation
                et maintenance — matching IA automatique
              </p>
            </div>

            {/* Search artisans */}
            <div className="bg-white rounded-2xl p-3 flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto shadow-2xl">
              <input
                type="text"
                placeholder="Ex: Électricien, maçon, décorateur..."
                className="flex-1 px-4 py-3 text-sm focus:outline-none text-gray-700 placeholder-gray-400"
              />
              <select className="px-4 py-3 text-sm text-gray-600 border-l border-gray-100 focus:outline-none min-w-[140px]">
                <option value="">Tous pays</option>
                {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
              <Button variant="primary" size="lg" className="rounded-xl">
                Trouver un artisan
              </Button>
            </div>

            {/* Emergency CTA */}
            <div className="text-center mt-5">
              <Link href="/artisans/emergency">
                <button className="inline-flex items-center gap-2 bg-[#D93025] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-red-700 transition-colors shadow-lg">
                  🚨 Urgence 24h/7j — Plomberie, Électricité, Serrurerie
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white border-b border-gray-100 py-4 px-4 overflow-x-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex gap-2 min-w-max">
              {ARTISAN_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    cat.value === ""
                      ? "bg-[#0070BA] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats bar */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500">
                <strong className="text-gray-700">{MOCK_ARTISANS.length}</strong> artisans disponibles
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none">
                <option>Mieux notés</option>
                <option>Plus proches</option>
                <option>Tarif croissant</option>
                <option>Plus expérimentés</option>
              </select>
            </div>
          </div>

          {/* Artisans grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MOCK_ARTISANS.map((artisan) => (
              <div key={artisan.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm card-hover overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-5 pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0070BA] to-[#003087] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {artisan.businessName
                        ? artisan.businessName[0]
                        : artisan.user.name?.[0] || "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-gray-800 text-sm">
                          {artisan.businessName || artisan.user.name}
                        </h3>
                        {artisan.isCertified && (
                          <span className="badge-certified">✓ Certifié</span>
                        )}
                        {artisan.emergencyService && (
                          <Badge variant="danger" size="sm">🚨 24h/7j</Badge>
                        )}
                      </div>
                      <p className="text-xs text-[#0070BA] font-medium mt-0.5">
                        {CATEGORY_ICONS[artisan.category]} {ARTISAN_CATEGORY_LABELS[artisan.category]}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                        {artisan.city} · {COUNTRY_LABELS[artisan.country]?.split(" ")[1] || artisan.country}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4">
                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {artisan.specialty.slice(0, 3).map((spec) => (
                      <span key={spec} className="text-xs bg-blue-50 text-[#0070BA] px-2 py-0.5 rounded-full border border-blue-100">
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <StarRating
                        rating={artisan.avgRating}
                        size="sm"
                        showValue
                        showCount
                        count={artisan.totalReviews}
                      />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{artisan.completedJobs} missions</p>
                    </div>
                  </div>

                  {/* Rate */}
                  {artisan.dailyRate && (
                    <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs text-gray-500">Tarif journalier</span>
                      <span className="font-bold text-[#003087] text-sm">
                        {formatCurrency(artisan.dailyRate, artisan.currency)} / jour
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/artisans/${artisan.id}`} className="flex-1">
                      <Button variant="outline" size="sm" fullWidth>
                        Voir le profil
                      </Button>
                    </Link>
                    <Link href={`/artisans/${artisan.id}/contact`} className="flex-1">
                      <Button variant="primary" size="sm" fullWidth>
                        Contacter
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ProMatch AI CTA */}
          <div className="mt-10 bg-gradient-to-r from-purple-600 to-[#003087] rounded-2xl p-8 text-white text-center">
            <span className="text-4xl block mb-3">🤖</span>
            <h2 className="text-2xl font-bold mb-2">ProMatch IA</h2>
            <p className="text-white/80 mb-6 max-w-lg mx-auto">
              Décrivez votre projet et notre IA vous connecte automatiquement
              aux artisans certifiés les plus adaptés dans votre zone.
            </p>
            <Button variant="gold" size="lg">
              Lancer le matching IA
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
