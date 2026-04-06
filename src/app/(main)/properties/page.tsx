import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/property/SearchBar";
import PropertyCard from "@/components/property/PropertyCard";
import Button from "@/components/ui/Button";
import type { PropertyCard as PropertyCardType } from "@/types";

export const metadata: Metadata = {
  title: "Annonces Immobilières",
  description: "Trouvez votre bien immobilier idéal en Afrique — vente, location longue durée, location courte durée.",
};

// Mock data pour démonstration (sera remplacé par l'API)
const MOCK_PROPERTIES: PropertyCardType[] = [
  {
    id: "1",
    title: "Villa moderne 4 chambres avec piscine — Cocody",
    slug: "villa-moderne-4-chambres-cocody",
    type: "VILLA",
    listingType: "SALE",
    status: "ACTIVE",
    price: 75000000,
    currency: "XOF",
    country: "CI",
    city: "Abidjan",
    district: "Cocody",
    surface: 320,
    bedrooms: 4,
    bathrooms: 3,
    hasPool: true,
    hasAC: true,
    images: [{ url: "/properties/villa-cocody.jpg", alt: "Villa Cocody" }],
    viewCount: 1247,
    favoriteCount: 89,
    investmentScore: 87,
    owner: { id: "u1", name: "Agence Premium CI", isPremium: true },
    createdAt: "2025-01-15",
    publishedAt: "2025-01-16",
  },
  {
    id: "2",
    title: "Appartement T3 meublé — Quartier Haie Vive, Cotonou",
    slug: "appartement-t3-haie-vive-cotonou",
    type: "APARTMENT",
    listingType: "LONG_TERM_RENTAL",
    status: "ACTIVE",
    price: 350000,
    currency: "XOF",
    country: "BJ",
    city: "Cotonou",
    district: "Haie Vive",
    surface: 90,
    bedrooms: 3,
    bathrooms: 2,
    hasAC: true,
    images: [{ url: "/properties/appt-cotonou.jpg", alt: "Appartement Cotonou" }],
    viewCount: 834,
    favoriteCount: 45,
    investmentScore: 72,
    owner: { id: "u2", name: "M. Kouamé", isPremium: false },
    createdAt: "2025-01-20",
    publishedAt: "2025-01-21",
  },
  {
    id: "3",
    title: "Studio cosy vue mer — Lomé Plage",
    slug: "studio-vue-mer-lome",
    type: "STUDIO",
    listingType: "SHORT_TERM_RENTAL",
    status: "ACTIVE",
    price: 25000,
    currency: "XOF",
    country: "TG",
    city: "Lomé",
    district: "Quartier Plage",
    surface: 35,
    bedrooms: 1,
    bathrooms: 1,
    hasAC: true,
    images: [{ url: "/properties/studio-lome.jpg", alt: "Studio Lomé" }],
    viewCount: 2100,
    favoriteCount: 167,
    owner: { id: "u3", name: "Fatima T.", isPremium: false },
    createdAt: "2025-01-25",
    publishedAt: "2025-01-25",
  },
  {
    id: "4",
    title: "Terrain 600m² viabilisé — Ouagadougou Secteur 27",
    slug: "terrain-600m2-ouagadougou-secteur-27",
    type: "LAND",
    listingType: "SALE",
    status: "ACTIVE",
    price: 12000000,
    currency: "XOF",
    country: "BF",
    city: "Ouagadougou",
    district: "Secteur 27",
    surface: 600,
    images: [],
    viewCount: 320,
    favoriteCount: 28,
    investmentScore: 65,
    owner: { id: "u4", name: "Famille Ouédraogo", isPremium: false },
    createdAt: "2025-02-01",
    publishedAt: "2025-02-02",
  },
  {
    id: "5",
    title: "Maison 5 pièces avec garage — Yopougon",
    slug: "maison-5-pieces-yopougon",
    type: "HOUSE",
    listingType: "SALE",
    status: "ACTIVE",
    price: 45000000,
    currency: "XOF",
    country: "CI",
    city: "Abidjan",
    district: "Yopougon",
    surface: 180,
    bedrooms: 5,
    bathrooms: 2,
    hasGarage: true,
    images: [],
    viewCount: 756,
    favoriteCount: 52,
    investmentScore: 78,
    owner: { id: "u5", name: "Agence Immo Africa", isPremium: true },
    createdAt: "2025-02-05",
    publishedAt: "2025-02-06",
  },
  {
    id: "6",
    title: "Bureau commercial 120m² — Plateau Abidjan",
    slug: "bureau-commercial-plateau-abidjan",
    type: "OFFICE",
    listingType: "LONG_TERM_RENTAL",
    status: "ACTIVE",
    price: 600000,
    currency: "XOF",
    country: "CI",
    city: "Abidjan",
    district: "Plateau",
    surface: 120,
    images: [],
    viewCount: 490,
    favoriteCount: 31,
    owner: { id: "u6", name: "CI Commercial RE", isPremium: true },
    createdAt: "2025-02-08",
    publishedAt: "2025-02-09",
  },
];

const FILTERS = {
  listingTypes: [
    { value: "", label: "Tous" },
    { value: "SALE", label: "Vente" },
    { value: "LONG_TERM_RENTAL", label: "Location" },
    { value: "SHORT_TERM_RENTAL", label: "Court séjour" },
  ],
  types: [
    { value: "", label: "Tous types" },
    { value: "APARTMENT", label: "Appartement" },
    { value: "HOUSE", label: "Maison" },
    { value: "VILLA", label: "Villa" },
    { value: "STUDIO", label: "Studio" },
    { value: "LAND", label: "Terrain" },
    { value: "OFFICE", label: "Bureau" },
  ],
  sortOptions: [
    { value: "recent", label: "Plus récents" },
    { value: "price_asc", label: "Prix croissant" },
    { value: "price_desc", label: "Prix décroissant" },
    { value: "score", label: "Score investissement" },
    { value: "views", label: "Plus consultés" },
  ],
};

interface PropertiesPageProps {
  searchParams: Promise<{
    q?: string;
    country?: string;
    city?: string;
    type?: string;
    listingType?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;

  return (
    <>
      <Navbar />

      <main className="pt-16 min-h-screen bg-gray-50">
        {/* Header with search */}
        <div className="bg-white border-b border-gray-100 py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-[#003087]">
                  Annonces Immobilières
                </h1>
                <p className="text-gray-500 text-sm">
                  {MOCK_PROPERTIES.length} résultats
                  {params.city ? ` à ${params.city}` : ""}
                  {params.country ? ` · ${params.country}` : ""}
                </p>
              </div>
              <Link href="/properties/new">
                <Button variant="primary" size="md" icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }>
                  Publier une annonce
                </Button>
              </Link>
            </div>
            <SearchBar
              variant="compact"
              initialValues={{
                query: params.q,
                country: params.country,
                type: params.type,
                listingType: params.listingType,
              }}
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center justify-between">
                  Filtres
                  <button className="text-xs text-[#0070BA] font-medium">
                    Réinitialiser
                  </button>
                </h3>

                {/* Listing Type */}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Type de transaction
                  </label>
                  <div className="space-y-2">
                    {FILTERS.listingTypes.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="listingType"
                          value={opt.value}
                          defaultChecked={opt.value === (params.listingType || "")}
                          className="text-[#0070BA]"
                        />
                        <span className="text-sm text-gray-600">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Property Type */}
                <div className="mb-5 border-t border-gray-100 pt-5">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Type de bien
                  </label>
                  <select className="input-afri text-sm py-2">
                    {FILTERS.types.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-5 border-t border-gray-100 pt-5">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Budget (FCFA)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="input-afri text-sm py-2 w-1/2"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="input-afri text-sm py-2 w-1/2"
                    />
                  </div>
                </div>

                {/* Bedrooms */}
                <div className="mb-5 border-t border-gray-100 pt-5">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Chambres minimum
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        className="w-9 h-9 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-600 hover:border-[#0070BA] hover:text-[#0070BA] transition-colors"
                      >
                        {n === 5 ? "5+" : n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Features checkboxes */}
                <div className="border-t border-gray-100 pt-5">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Équipements
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: "hasPool", label: "Piscine" },
                      { key: "hasGarage", label: "Garage" },
                      { key: "hasAC", label: "Climatisation" },
                      { key: "hasSecurity", label: "Sécurité 24/7" },
                      { key: "hasGenerator", label: "Groupe électrogène" },
                      { key: "hasGarden", label: "Jardin" },
                    ].map((feat) => (
                      <label key={feat.key} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-[#0070BA]" />
                        <span className="text-sm text-gray-600">{feat.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button variant="primary" fullWidth className="mt-5">
                  Appliquer les filtres
                </Button>
              </div>
            </aside>

            {/* Properties grid */}
            <div className="flex-1">
              {/* Sort bar */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">
                  <strong className="text-gray-700">{MOCK_PROPERTIES.length}</strong> annonces
                </p>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-500">Trier par :</label>
                  <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#0070BA]">
                    {FILTERS.sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {/* View toggle */}
                  <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                    <button className="p-1.5 bg-[#0070BA] text-white">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button className="p-1.5 text-gray-400 hover:bg-gray-50">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {MOCK_PROPERTIES.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center gap-2 mt-10">
                <button className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                  Précédent
                </button>
                {[1, 2, 3, 4, 5].map((page) => (
                  <button
                    key={page}
                    className={`w-9 h-9 rounded-lg text-sm font-medium ${
                      page === 1
                        ? "bg-[#0070BA] text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
