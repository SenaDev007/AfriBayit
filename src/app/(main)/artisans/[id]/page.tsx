import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StarRating from "@/components/ui/StarRating";
import ArtisanContactForm from "@/components/artisan/ArtisanContactForm";
import { formatCurrency, ARTISAN_CATEGORY_LABELS, COUNTRY_LABELS } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

interface ArtisanDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ArtisanDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const artisan = await prisma.artisan.findFirst({
    where: { OR: [{ id }, { userId: id }] },
    select: { businessName: true, category: true, user: { select: { name: true } } },
  });
  if (!artisan) return { title: "Artisan introuvable" };
  const name = artisan.businessName || artisan.user.name || "Artisan";
  return {
    title: `${name} — ${ARTISAN_CATEGORY_LABELS[artisan.category] ?? artisan.category} | AfriBayit`,
    description: `Profil de l'artisan ${name}, spécialiste en ${ARTISAN_CATEGORY_LABELS[artisan.category] ?? artisan.category}.`,
  };
}

const CATEGORY_ICONS: Record<string, string> = {
  GROS_OEUVRE: "🏗️",
  SECOND_OEUVRE: "🔧",
  FINITION_DECORATION: "🎨",
  GENIE_TECHNIQUE: "⚡",
  EXTERIEURS: "🌿",
  RENOVATION_MAINTENANCE: "🔩",
  NUMERIQUE_INNOVATION: "💻",
};

export default async function ArtisanDetailPage({ params }: ArtisanDetailPageProps) {
  const { id } = await params;

  const artisan = await prisma.artisan.findFirst({
    where: { OR: [{ id: id }, { userId: id }] },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          country: true,
          city: true,
          reputationScore: true,
          totalReviews: true,
          createdAt: true,
        },
      },
      images: true,
      services: true,
    },
  });

  if (!artisan) return notFound();

  const displayName = artisan.businessName || artisan.user.name || "Artisan";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase() ?? "")
    .join("");
  const categoryLabel = ARTISAN_CATEGORY_LABELS[artisan.category] ?? artisan.category;
  const categoryIcon = CATEGORY_ICONS[artisan.category] ?? "🔨";
  const countryLabel = COUNTRY_LABELS[artisan.country as string] ?? artisan.country;
  const memberSince = new Date(artisan.user.createdAt).getFullYear();

  return (
    <>
      <Navbar />

      <main className="pt-16 min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <nav className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-[#0070BA] transition-colors">Accueil</Link>
              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <Link href="/artisans" className="hover:text-[#0070BA] transition-colors">Artisans</Link>
              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-700 font-medium truncate max-w-[180px]">{displayName}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-[#003087] via-[#0070BA] to-blue-400 h-28 sm:h-36" />
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
                {/* Avatar */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-[#0070BA] to-[#003087] flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg flex-shrink-0">
                  {initials || "A"}
                </div>

                <div className="flex-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-800">{displayName}</h1>
                    {artisan.isCertified && (
                      <span className="badge-certified">✓ Certifié</span>
                    )}
                    {artisan.emergencyService && (
                      <Badge variant="danger" size="sm">🚨 Urgence 24h/7j</Badge>
                    )}
                  </div>

                  {artisan.businessName && artisan.user.name && (
                    <p className="text-sm text-gray-500 mb-1">par {artisan.user.name}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      {categoryIcon}
                      <span className="font-medium text-[#0070BA]">{categoryLabel}</span>
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      {artisan.city}, {countryLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
                <div className="text-center">
                  <StarRating
                    rating={artisan.avgRating}
                    size="md"
                    showValue
                    showCount
                    count={artisan.totalReviews}
                    className="justify-center"
                  />
                  <p className="text-xs text-gray-400 mt-0.5">Note moyenne</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[#003087]">{artisan.completedJobs}</p>
                  <p className="text-xs text-gray-400">Missions réalisées</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[#003087]">{artisan.yearsExp} ans</p>
                  <p className="text-xs text-gray-400">d&apos;expérience</p>
                </div>
                <div className="text-center">
                  {artisan.dailyRate ? (
                    <>
                      <p className="text-xl font-bold text-[#003087]">
                        {formatCurrency(artisan.dailyRate, artisan.currency)}
                      </p>
                      <p className="text-xs text-gray-400">Tarif / jour</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-gray-500">Sur devis</p>
                      <p className="text-xs text-gray-400">Tarif</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left — 2/3 */}
            <div className="flex-1 min-w-0 space-y-6">

              {/* À propos */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-[#003087] mb-3">À propos</h2>
                {artisan.description ? (
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {artisan.description}
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm italic">Aucune description fournie.</p>
                )}
              </section>

              {/* Spécialités */}
              {artisan.specialty.length > 0 && (
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-[#003087] mb-4">Spécialités</h2>
                  <div className="flex flex-wrap gap-2">
                    {artisan.specialty.map((spec: string) => (
                      <span
                        key={spec}
                        className="inline-flex items-center gap-1.5 bg-blue-50 text-[#0070BA] border border-blue-100 text-sm font-medium px-3 py-1.5 rounded-full"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0070BA] flex-shrink-0" />
                        {spec}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Services proposés */}
              {artisan.services.length > 0 && (
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="text-lg font-bold text-[#003087] mb-4">Services proposés</h2>
                  <div className="space-y-4">
                    {artisan.services.map((service) => (
                      <div
                        key={service.id}
                        className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-[#0070BA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800 text-sm">{service.name}</h3>
                            <div className="flex items-center gap-2">
                              {service.basePrice != null && (
                                <span className="text-sm font-bold text-[#003087]">
                                  {formatCurrency(service.basePrice, service.currency)}
                                </span>
                              )}
                              {service.duration && (
                                <Badge variant="gray" size="sm">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {service.duration}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {service.description && (
                            <p className="text-xs text-gray-500 leading-relaxed">{service.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Avis clients */}
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#003087]">Avis clients</h2>
                  <Badge variant="primary">
                    {artisan.totalReviews} avis
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center p-4 bg-gray-50 rounded-xl mb-4">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-[#003087]">{artisan.avgRating.toFixed(1)}</p>
                    <StarRating rating={artisan.avgRating} size="md" className="justify-center mt-1" />
                    <p className="text-xs text-gray-500 mt-1">{artisan.totalReviews} évaluation{artisan.totalReviews !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    {[5, 4, 3, 2, 1].map((star) => (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-3">{star}</span>
                        <svg className="w-3 h-3 text-[#FFB900] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#FFB900] rounded-full"
                            style={{ width: artisan.totalReviews > 0 ? `${(star / 5) * artisan.avgRating * 20}%` : "0%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {artisan.totalReviews === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4 italic">
                    Aucun avis pour le moment. Soyez le premier à laisser un avis !
                  </p>
                ) : (
                  <div className="text-center">
                    <Button variant="outline" size="sm">
                      Voir tous les {artisan.totalReviews} avis
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Button>
                  </div>
                )}
              </section>
            </div>

            {/* Right — 1/3 sticky sidebar */}
            <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-4">
              <div className="lg:sticky lg:top-24 space-y-4">

                {/* Tarif + contact form */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Rate header */}
                  <div className="bg-gradient-to-r from-[#003087] to-[#0070BA] px-5 py-4 text-white">
                    <p className="text-xs font-medium text-white/70 mb-0.5">Tarif journalier</p>
                    {artisan.dailyRate ? (
                      <p className="text-2xl font-bold">
                        {formatCurrency(artisan.dailyRate, artisan.currency)}
                        <span className="text-sm font-normal text-white/70 ml-1">/ jour</span>
                      </p>
                    ) : (
                      <p className="text-lg font-semibold">Sur devis</p>
                    )}
                    {artisan.hourlyRate && (
                      <p className="text-xs text-white/60 mt-0.5">
                        ou {formatCurrency(artisan.hourlyRate, artisan.currency)} / heure
                      </p>
                    )}
                  </div>

                  {/* Contact form */}
                  <div className="p-5">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Contacter l&apos;artisan</h3>
                    <ArtisanContactForm artisanUserId={artisan.userId} />
                  </div>
                </div>

                {/* Disponibilité */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#0070BA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Disponibilité
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        artisan.isAvailable ? "bg-[#00A651]" : "bg-gray-400"
                      }`}
                    />
                    <span className={`text-sm font-medium ${artisan.isAvailable ? "text-[#00A651]" : "text-gray-500"}`}>
                      {artisan.isAvailable ? "Disponible actuellement" : "Indisponible pour le moment"}
                    </span>
                  </div>
                  {artisan.serviceArea.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-1.5">Zones desservies :</p>
                      <div className="flex flex-wrap gap-1.5">
                        {artisan.serviceArea.map((area: string) => (
                          <span key={area} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Trust badges */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Garanties</h3>
                  <ul className="space-y-2.5">
                    <li className="flex items-center gap-2.5">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${artisan.isCertified ? "bg-green-100" : "bg-gray-100"}`}>
                        <svg className={`w-4 h-4 ${artisan.isCertified ? "text-[#00A651]" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">Certification AfriBayit</p>
                        <p className="text-xs text-gray-400">
                          {artisan.isCertified ? "Profil vérifié et certifié" : "Certification en attente"}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-[#0070BA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">Assurance RC</p>
                        <p className="text-xs text-gray-400">Responsabilité civile professionnelle</p>
                      </div>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-gray-700">
                          {artisan.yearsExp > 0 ? `${artisan.yearsExp} ans d'expérience` : "Expérience vérifiée"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {artisan.completedJobs} missions réalisées · Membre depuis {memberSince}
                        </p>
                      </div>
                    </li>
                    {artisan.emergencyService && (
                      <li className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-[#D93025]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-gray-700">Service urgence 24h/7j</p>
                          <p className="text-xs text-gray-400">Disponible pour interventions d&apos;urgence</p>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
