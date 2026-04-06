import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StarRating from "@/components/ui/StarRating";
import BookingWidget from "@/components/guesthouse/BookingWidget";
import { formatCurrency, COUNTRY_LABELS } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

interface GuesthouseDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GuesthouseDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const guesthouse = await prisma.guesthouse.findFirst({
    where: { OR: [{ id: slug }, { slug: slug }], isActive: true },
    select: { name: true, city: true, country: true, description: true },
  });

  if (!guesthouse) {
    return { title: "Guesthouse introuvable — AfriBayit" };
  }

  return {
    title: `${guesthouse.name} — ${guesthouse.city} | AfriBayit`,
    description: guesthouse.description.slice(0, 160),
  };
}

const ROOM_TYPE_LABELS: Record<string, string> = {
  SINGLE: "Chambre Simple",
  DOUBLE: "Chambre Double",
  SUITE: "Suite",
  TWIN: "Chambre Twin",
  FAMILY: "Chambre Familiale",
  DELUXE: "Chambre Deluxe",
};

const AMENITY_ICONS: Record<string, { icon: string; label: string }> = {
  hasWifi:      { icon: "📶", label: "Wi-Fi inclus" },
  hasBreakfast: { icon: "🍳", label: "Petit-déjeuner" },
  hasParking:   { icon: "🚗", label: "Parking" },
  hasPool:      { icon: "🏊", label: "Piscine" },
  hasAC:        { icon: "❄️",  label: "Climatisation" },
};

export default async function GuesthouseDetailPage({ params }: GuesthouseDetailPageProps) {
  const { slug } = await params;

  const guesthouse = await prisma.guesthouse.findFirst({
    where: { OR: [{ id: slug }, { slug: slug }], isActive: true },
    include: {
      images: true,
      rooms: {
        where: { isAvailable: true },
        include: { images: { take: 1 } },
      },
      owner: { select: { id: true, name: true, image: true } },
    },
  });

  if (!guesthouse) return notFound();

  const minPrice =
    guesthouse.rooms.length > 0
      ? Math.min(...guesthouse.rooms.map((r) => r.basePrice))
      : null;

  const countryLabel = COUNTRY_LABELS[guesthouse.country] ?? guesthouse.country;

  // Amenities present on the guesthouse
  const amenityKeys = [
    "hasWifi",
    "hasBreakfast",
    "hasParking",
    "hasPool",
    "hasAC",
  ] as const;

  type AmenityKey = (typeof amenityKeys)[number];

  const activeAmenities = amenityKeys.filter(
    (key) => (guesthouse as Record<string, unknown>)[key] === true
  );

  // Rooms for the booking widget (minimal shape)
  const widgetRooms = guesthouse.rooms.map((r) => ({
    id: r.id,
    name: r.name,
    basePrice: r.basePrice,
    currency: String(r.currency),
  }));

  // Gradient palette for placeholder images (cycles)
  const gradients = [
    "from-emerald-100 to-teal-200",
    "from-blue-100 to-indigo-200",
    "from-amber-100 to-orange-200",
    "from-rose-100 to-pink-200",
    "from-violet-100 to-purple-200",
  ];

  return (
    <>
      <Navbar />

      <main className="pt-16 min-h-screen bg-gray-50">
        {/* ── Breadcrumb ── */}
        <div className="bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#0070BA] transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/guesthouses" className="hover:text-[#0070BA] transition-colors">Guesthouses</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium truncate">{guesthouse.name}</span>
          </div>
        </div>

        {/* ── Photo Gallery ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {guesthouse.images.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 h-72 sm:h-96 rounded-2xl overflow-hidden">
              {/* Main large image */}
              <div className="col-span-2 row-span-2 relative">
                <img
                  src={guesthouse.images[0].url}
                  alt={guesthouse.images[0].alt ?? guesthouse.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Secondary images */}
              {guesthouse.images.slice(1, 5).map((img, i) => (
                <div key={img.id} className="relative overflow-hidden">
                  <img
                    src={img.url}
                    alt={img.alt ?? `${guesthouse.name} - photo ${i + 2}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
              {/* Fill blanks if fewer than 5 images */}
              {Array.from({ length: Math.max(0, 4 - (guesthouse.images.length - 1)) }).map((_, i) => (
                <div
                  key={`placeholder-${i}`}
                  className={`bg-gradient-to-br ${gradients[(i + 1) % gradients.length]} flex items-center justify-center`}
                >
                  <span className="text-4xl opacity-30">🏡</span>
                </div>
              ))}
            </div>
          ) : (
            /* Full placeholder gallery */
            <div className="grid grid-cols-4 gap-2 h-72 sm:h-96 rounded-2xl overflow-hidden">
              <div className="col-span-2 row-span-2 bg-gradient-to-br from-emerald-100 to-teal-300 flex items-center justify-center">
                <span className="text-8xl opacity-30">🏡</span>
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`bg-gradient-to-br ${gradients[i % gradients.length]} flex items-center justify-center`}
                >
                  <span className="text-3xl opacity-20">🏡</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Main Content ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ── LEFT COLUMN (2/3) ── */}
            <div className="flex-1 min-w-0">

              {/* Title block */}
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {guesthouse.isCertified && (
                    <Badge variant="success">✓ Certifiée AfriBayit</Badge>
                  )}
                  <Badge variant="gray">{countryLabel.split(" ")[1] ?? guesthouse.country}</Badge>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{guesthouse.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-[#0070BA]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {guesthouse.district ? `${guesthouse.district}, ` : ""}{guesthouse.city} · {countryLabel}
                  </span>
                  {guesthouse.totalReviews > 0 && (
                    <StarRating
                      rating={guesthouse.avgRating}
                      size="sm"
                      showValue
                      showCount
                      count={guesthouse.totalReviews}
                    />
                  )}
                  {minPrice !== null && (
                    <span className="font-semibold text-[#003087]">
                      À partir de {formatCurrency(minPrice, widgetRooms[0]?.currency ?? "XOF")}/nuit
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-3">À propos</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {guesthouse.description}
                </p>
                {guesthouse.address && (
                  <p className="mt-3 text-sm text-gray-400 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    {guesthouse.address}
                  </p>
                )}
              </section>

              {/* Équipements */}
              {activeAmenities.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Équipements</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeAmenities.map((key) => {
                      const amenity = AMENITY_ICONS[key as AmenityKey];
                      if (!amenity) return null;
                      return (
                        <div
                          key={key}
                          className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3"
                        >
                          <span className="text-xl">{amenity.icon}</span>
                          <span className="text-sm font-medium text-gray-700">{amenity.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Chambres disponibles */}
              <section className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Chambres disponibles
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({guesthouse.rooms.length})
                  </span>
                </h2>

                {guesthouse.rooms.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                    <p className="text-amber-700 font-medium">Aucune chambre disponible pour le moment.</p>
                    <p className="text-amber-600 text-sm mt-1">Revenez prochainement ou contactez l&apos;établissement.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {guesthouse.rooms.map((room, idx) => {
                      const roomImage = room.images[0];
                      const gradient = gradients[idx % gradients.length];

                      return (
                        <div
                          key={room.id}
                          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col sm:flex-row"
                        >
                          {/* Room image / placeholder */}
                          <div className={`sm:w-44 h-36 sm:h-auto flex-shrink-0 ${roomImage ? "" : `bg-gradient-to-br ${gradient}`} flex items-center justify-center overflow-hidden`}>
                            {roomImage ? (
                              <img
                                src={roomImage.url}
                                alt={roomImage.alt ?? room.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-4xl opacity-30">🛏️</span>
                            )}
                          </div>

                          {/* Room info */}
                          <div className="flex-1 p-5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-bold text-gray-800">{room.name}</h3>
                                {room.bedType && (
                                  <Badge variant="gray" size="sm">{room.bedType}</Badge>
                                )}
                              </div>
                              {room.description && (
                                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{room.description}</p>
                              )}
                              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                  </svg>
                                  {room.capacity} pers. max
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                              <div>
                                <span className="text-lg font-bold text-[#003087]">
                                  {formatCurrency(room.basePrice, String(room.currency))}
                                </span>
                                <span className="text-sm text-gray-400">/nuit</span>
                              </div>
                              <Link href={`/guesthouses/${guesthouse.slug}?room=${room.id}`}>
                                <Button variant="primary" size="sm">
                                  Réserver
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Owner info */}
              {guesthouse.owner && (
                <section className="mb-8">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Géré par</h2>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    {guesthouse.owner.image ? (
                      <img
                        src={guesthouse.owner.image}
                        alt={guesthouse.owner.name ?? "Propriétaire"}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#0070BA] to-[#003087] flex items-center justify-center text-white text-xl font-bold">
                        {(guesthouse.owner.name ?? "P")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">{guesthouse.owner.name ?? "Propriétaire"}</p>
                      <p className="text-sm text-gray-400">Propriétaire AfriBayit</p>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* ── RIGHT COLUMN (1/3) — Booking widget ── */}
            <div className="lg:w-80 xl:w-96 flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                {widgetRooms.length > 0 ? (
                  <BookingWidget
                    guesthouseId={guesthouse.id}
                    rooms={widgetRooms}
                  />
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 text-center">
                    <p className="text-gray-500 text-sm">
                      Aucune chambre disponible actuellement.
                    </p>
                  </div>
                )}

                {/* Trust badges */}
                <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pourquoi AfriBayit ?</h4>
                  <ul className="space-y-2.5 text-sm text-gray-600">
                    {[
                      { icon: "🔒", text: "Paiement sécurisé en escrow" },
                      { icon: "💳", text: "Mobile Money (MTN, Orange, Moov...)" },
                      { icon: "✅", text: "Établissement inspecté et certifié" },
                      { icon: "💬", text: "Support client 7j/7" },
                    ].map((item) => (
                      <li key={item.text} className="flex items-center gap-2">
                        <span className="text-base">{item.icon}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
