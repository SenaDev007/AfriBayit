import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StarRating from "@/components/ui/StarRating";
import ContactForm from "@/components/property/ContactForm";
import CreditCalculator from "@/components/property/CreditCalculator";
import { formatCurrency, PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS, COUNTRY_LABELS } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Détail du bien",
};

const FEATURES = [
  { key: "hasPool", label: "Piscine", icon: "🏊" },
  { key: "hasGarage", label: "Garage", icon: "🚗" },
  { key: "hasGarden", label: "Jardin", icon: "🌿" },
  { key: "hasBalcony", label: "Balcon/Terrasse", icon: "🏖️" },
  { key: "hasSecurity", label: "Sécurité 24h/7j", icon: "🔒" },
  { key: "hasGenerator", label: "Groupe électrogène", icon: "⚡" },
  { key: "hasWifi", label: "Wi-Fi haut débit", icon: "📶" },
  { key: "hasAC", label: "Climatisation", icon: "❄️" },
];

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { id } = await params;

  const property = await prisma.property.findFirst({
    where: { OR: [{ id: id }, { slug: id }], status: "ACTIVE" },
    include: {
      images: true,
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          isPremium: true,
          _count: { select: { properties: true } },
        },
      },
      reviews: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { favorites: true } },
    },
  });

  if (!property) return notFound();

  // Increment view count (fire-and-forget, don't block render)
  prisma.property.update({
    where: { id: property.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  const similarProperties = await prisma.property.findMany({
    where: {
      city: property.city,
      listingType: property.listingType,
      status: "ACTIVE",
      NOT: { id: property.id },
    },
    take: 3,
    include: { images: { where: { isPrimary: true }, take: 1 } },
    orderBy: { viewCount: "desc" },
  });

  const price = Number(property.price);
  const currency = property.currency as string;

  return (
    <>
      <Navbar />

      <main className="pt-[72px] min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="container-app py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-[#0070BA]">Accueil</Link>
              <span>›</span>
              <Link href="/properties" className="hover:text-[#0070BA]">Immobilier</Link>
              <span>›</span>
              <Link href={`/properties?country=${property.country as string}`} className="hover:text-[#0070BA]">
                {COUNTRY_LABELS[property.country as string]}
              </Link>
              <span>›</span>
              <span className="text-gray-700 font-medium line-clamp-1">{property.title}</span>
            </nav>
          </div>
        </div>

        <div className="container-app py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Photo gallery */}
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <div className="gallery-grid">
                  {/* Main image */}
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-24 h-24 text-[#0070BA] opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                      Photo principale
                    </span>
                  </div>
                  {/* Secondary images */}
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-gradient-to-br from-gray-100 to-gray-200 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      {i === 4 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            +{property.images.length - 4} photos
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Gallery actions */}
                <div className="p-4 flex gap-2">
                  <Button variant="outline" size="sm" icon={<span>📸</span>}>
                    Voir toutes les photos ({property.images.length})
                  </Button>
                  {property.virtualTourUrl && (
                    <Button variant="outline" size="sm" icon={<span>🥽</span>}>
                      Visite virtuelle 360°
                    </Button>
                  )}
                </div>
              </div>

              {/* Property info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                {/* Header */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="primary">
                    {LISTING_TYPE_LABELS[property.listingType as string]}
                  </Badge>
                  <Badge variant="gray">
                    {PROPERTY_TYPE_LABELS[property.type as string]}
                  </Badge>
                  {property.owner.isPremium && (
                    <span className="badge-premium">Annonce Premium</span>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-[#003087] mb-3">
                  {property.title}
                </h1>

                {/* Location */}
                <div className="flex items-center gap-2 text-gray-500 mb-4">
                  <svg className="w-4 h-4 text-[#0070BA]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {property.address} · {property.district}, {property.city}
                    {" · "}{COUNTRY_LABELS[property.country as string]}
                  </span>
                </div>

                {/* Key specs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-gray-100 mb-6">
                  {property.surface && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-[#003087]">{property.surface}</p>
                      <p className="text-xs text-gray-500">m² Surface</p>
                    </div>
                  )}
                  {property.bedrooms && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-[#003087]">{property.bedrooms}</p>
                      <p className="text-xs text-gray-500">Chambres</p>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-[#003087]">{property.bathrooms}</p>
                      <p className="text-xs text-gray-500">Salles de bain</p>
                    </div>
                  )}
                  {property.yearBuilt && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-[#003087]">{property.yearBuilt}</p>
                      <p className="text-xs text-gray-500">Année const.</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-3">Description</h2>
                  <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {property.description}
                  </div>
                </div>
              </div>

              {/* Features / Équipements */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Équipements & Caractéristiques</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {FEATURES.map((feat) => {
                    const has = property[feat.key as keyof typeof property] as boolean;
                    return (
                      <div
                        key={feat.key}
                        className={`flex items-center gap-2 p-3 rounded-xl border ${
                          has
                            ? "border-[#0070BA]/20 bg-blue-50"
                            : "border-gray-100 bg-gray-50 opacity-50"
                        }`}
                      >
                        <span className="text-xl">{feat.icon}</span>
                        <span className={`text-xs font-medium ${has ? "text-[#003087]" : "text-gray-400"}`}>
                          {feat.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Investment Score */}
              {property.investmentScore && (
                <div className="bg-gradient-to-r from-[#003087] to-[#0070BA] rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Score d&apos;Investissement AfriBayit</h2>
                    <div className="text-4xl font-bold text-[#FFB900]">
                      {property.investmentScore}/100
                    </div>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-3">
                    <div
                      className="bg-[#FFB900] h-3 rounded-full transition-all"
                      style={{ width: `${property.investmentScore}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-5 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-[#FFB900]">Excellent</p>
                      <p className="text-white/70 text-xs">Emplacement</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-[#FFB900]">Bon</p>
                      <p className="text-white/70 text-xs">Rentabilité estimée</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-[#FFB900]">+12%</p>
                      <p className="text-white/70 text-xs">Valorisation prévue</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Avis ({property.reviews.length})
                </h2>
                <div className="space-y-4">
                  {property.reviews.map((review) => (
                    <div key={review.id} className="flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0070BA] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {review.author.name?.slice(0, 2).toUpperCase() || "??"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-800 text-sm">{review.author.name}</p>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <StarRating rating={review.rating} size="sm" className="mb-1" />
                        <p className="text-gray-600 text-sm">{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-5">
              {/* Price card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 sticky top-20">
                {/* Price */}
                <div className="mb-5">
                  <p className="text-3xl font-bold text-[#003087]">
                    {formatCurrency(price, currency)}
                  </p>
                  {property.listingType !== "SALE" && (
                    <p className="text-gray-400 text-sm">
                      {property.listingType === "LONG_TERM_RENTAL" ? "/ mois" : "/ nuit"}
                    </p>
                  )}
                  {property.surface && (
                    <p className="text-sm text-gray-500 mt-1">
                      ≈ {formatCurrency(Math.round(price / property.surface), currency)} / m²
                    </p>
                  )}
                </div>

                {/* Owner */}
                <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                  <div className="w-12 h-12 rounded-full bg-[#0070BA] flex items-center justify-center text-white font-bold">
                    {property.owner.name?.[0] || "A"}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm flex items-center gap-1">
                      {property.owner.name}
                      {property.owner.isPremium && (
                        <span className="badge-premium">Pro</span>
                      )}
                    </p>
                    <StarRating
                      rating={0}
                      size="sm"
                      showValue
                      showCount
                      count={0}
                    />
                    <p className="text-xs text-gray-400">
                      {property.owner._count.properties} annonces
                    </p>
                  </div>
                </div>

                {/* Contact form */}
                <ContactForm ownerId={property.owner.id} propertyId={property.id} />

                <div className="flex flex-col gap-2">
                  <Button variant="outline" fullWidth size="md">
                    📞 Appeler le vendeur
                  </Button>
                  <Button variant="ghost" fullWidth size="sm">
                    🥽 Visite virtuelle
                  </Button>
                </div>

                {/* Trust badges */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  {[
                    "✅ Propriété vérifiée",
                    "🔒 Paiement sécurisé Escrow",
                    "📋 Documents juridiques validés",
                  ].map((item) => (
                    <p key={item} className="text-xs text-gray-500">{item}</p>
                  ))}
                </div>
              </div>

              {/* Loan calculator */}
              <CreditCalculator price={price} currency={currency} />

              {/* Neighborhood info */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  🗺️ Analyse du quartier
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Walkability", score: 72, color: "#0070BA" },
                    { label: "Sécurité", score: 85, color: "#00A651" },
                    { label: "Transports", score: 65, color: "#FFB900" },
                    { label: "Écoles", score: 90, color: "#003087" },
                    { label: "Commerces", score: 80, color: "#009CDE" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{item.label}</span>
                        <span className="font-medium text-gray-700">{item.score}/100</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${item.score}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Similar properties */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-[#003087] mb-6">
              Biens similaires à {property.city}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {similarProperties.map((sim) => (
                <Link key={sim.id} href={`/properties/${sim.slug}`}>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 card-hover">
                    <div className="h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl mb-3 flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#0070BA] opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-1">{sim.title}</h3>
                    <p className="text-xs text-gray-400 mb-2">{sim.district}, {sim.city}</p>
                    <p className="font-bold text-[#003087]">{formatCurrency(Number(sim.price), sim.currency as string)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
