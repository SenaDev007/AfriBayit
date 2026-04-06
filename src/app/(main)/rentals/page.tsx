import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/property/PropertyCard";
import Button from "@/components/ui/Button";
import type { PropertyCard as PropertyCardType } from "@/types";

export const metadata: Metadata = {
  title: "Location Courte Durée",
  description: "Réservez des logements pour courtes durées en Afrique — paiement Mobile Money, check-in numérique.",
};

const MOCK_RENTALS: PropertyCardType[] = [
  {
    id: "r1",
    title: "Appartement cosy vue mer — Badalabougou, Bamako",
    slug: "appartement-vue-mer-bamako",
    type: "APARTMENT",
    listingType: "SHORT_TERM_RENTAL",
    status: "ACTIVE",
    price: 35000,
    currency: "XOF",
    country: "ML",
    city: "Bamako",
    district: "Badalabougou",
    surface: 65,
    bedrooms: 2,
    bathrooms: 1,
    hasWifi: true,
    hasAC: true,
    images: [],
    viewCount: 1823,
    favoriteCount: 134,
    owner: { id: "u1", name: "Fatoumata K.", isPremium: false },
    createdAt: "2025-01-20",
  },
  {
    id: "r2",
    title: "Suite de luxe avec piscine privée — Cocody",
    slug: "suite-luxe-piscine-cocody",
    type: "APARTMENT",
    listingType: "SHORT_TERM_RENTAL",
    status: "ACTIVE",
    price: 95000,
    currency: "XOF",
    country: "CI",
    city: "Abidjan",
    district: "Cocody",
    surface: 120,
    bedrooms: 3,
    bathrooms: 2,
    hasPool: true,
    hasAC: true,
    hasWifi: true,
    images: [],
    viewCount: 3201,
    favoriteCount: 287,
    owner: { id: "u2", name: "Résidence Excellence", isPremium: true },
    createdAt: "2025-01-15",
  },
  {
    id: "r3",
    title: "Studio moderne proche plage — Lomé",
    slug: "studio-plage-lome",
    type: "STUDIO",
    listingType: "SHORT_TERM_RENTAL",
    status: "ACTIVE",
    price: 20000,
    currency: "XOF",
    country: "TG",
    city: "Lomé",
    district: "Bè Plage",
    surface: 30,
    bedrooms: 1,
    bathrooms: 1,
    hasWifi: true,
    hasAC: false,
    images: [],
    viewCount: 945,
    favoriteCount: 67,
    owner: { id: "u3", name: "Jean-Marc A.", isPremium: false },
    createdAt: "2025-02-01",
  },
];

export default function RentalsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Location Courte Durée
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Séjournez dans des logements authentiques en Afrique —
              paiement Mobile Money, check-in digital
            </p>
            {/* Date search */}
            <div className="bg-white rounded-2xl p-3 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto shadow-2xl">
              <input
                type="text"
                placeholder="Destination..."
                className="flex-1 px-4 py-3 text-sm text-gray-700 focus:outline-none"
              />
              <input
                type="date"
                placeholder="Arrivée"
                className="px-4 py-3 text-sm text-gray-600 border-l border-gray-100 focus:outline-none"
              />
              <input
                type="date"
                placeholder="Départ"
                className="px-4 py-3 text-sm text-gray-600 border-l border-gray-100 focus:outline-none"
              />
              <select className="px-4 py-3 text-sm text-gray-600 border-l border-gray-100 focus:outline-none">
                <option>1 voyageur</option>
                <option>2 voyageurs</option>
                <option>3-4 voyageurs</option>
                <option>5+ voyageurs</option>
              </select>
              <Button variant="primary" size="md" className="rounded-xl">
                Chercher
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { icon: "💳", title: "Mobile Money", desc: "MTN, Orange, Airtel, Moov" },
              { icon: "📱", title: "Check-in digital", desc: "QR code, sans clé" },
              { icon: "🔒", title: "Paiement sécurisé", desc: "Escrow AfriBayit" },
              { icon: "⭐", title: "Avis vérifiés", desc: "Séjours authentiques" },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl p-4 text-center border border-gray-100 shadow-sm">
                <span className="text-3xl block mb-2">{f.icon}</span>
                <p className="font-semibold text-gray-800 text-sm">{f.title}</p>
                <p className="text-xs text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Rentals grid */}
          <h2 className="text-2xl font-bold text-[#003087] mb-5">
            Logements disponibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MOCK_RENTALS.map((rental) => (
              <PropertyCard key={rental.id} property={rental} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
