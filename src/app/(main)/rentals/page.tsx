import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/property/PropertyCard";
import Button from "@/components/ui/Button";
import type { PropertyCard as PropertyCardType } from "@/types";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Location Courte Durée",
  description: "Réservez des logements pour courtes durées en Afrique — paiement Mobile Money, check-in numérique.",
};

export default async function RentalsPage() {
  const properties = await prisma.property.findMany({
    where: { listingType: "SHORT_TERM_RENTAL", status: "ACTIVE" },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      owner: { select: { id: true, name: true, isPremium: true } },
      _count: { select: { favorites: true } },
    },
    orderBy: { viewCount: "desc" },
    take: 12,
  });

  const rentals: PropertyCardType[] = properties.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    type: p.type as string,
    listingType: p.listingType as string,
    status: p.status as string,
    price: p.price,
    currency: p.currency as string,
    country: p.country as string,
    city: p.city,
    district: p.district ?? undefined,
    surface: p.surface ?? undefined,
    bedrooms: p.bedrooms ?? undefined,
    bathrooms: p.bathrooms ?? undefined,
    hasAC: p.hasAC,
    hasPool: p.hasPool,
    hasGarage: p.hasGarage,
    hasGarden: p.hasGarden,
    hasBalcony: p.hasBalcony,
    hasSecurity: p.hasSecurity,
    hasGenerator: p.hasGenerator,
    hasWifi: p.hasWifi,
    images: p.images.map((img) => ({ url: img.url, alt: img.alt ?? undefined })),
    viewCount: p.viewCount,
    favoriteCount: p._count.favorites,
    investmentScore: p.investmentScore ?? undefined,
    owner: {
      id: p.owner.id,
      name: p.owner.name ?? undefined,
      isPremium: p.owner.isPremium,
    },
    createdAt: p.createdAt.toISOString(),
    publishedAt: p.publishedAt?.toISOString() ?? undefined,
  }));
  return (
    <>
      <Navbar />
      <main className="pt-[72px] min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 py-14">
          <div className="container-app text-center text-white">
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

        <div className="container-app py-8">
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
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold text-[#003087]">
              Logements disponibles
            </h2>
            <span className="text-sm text-gray-400">
              {rentals.length} logement{rentals.length !== 1 ? "s" : ""}
            </span>
          </div>

          {rentals.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <span className="text-5xl block mb-4">🏘️</span>
              <p className="text-lg font-medium">Aucun logement disponible pour le moment.</p>
              <p className="text-sm mt-1">De nouvelles offres arrivent prochainement !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rentals.map((rental) => (
                <PropertyCard key={rental.id} property={rental} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
