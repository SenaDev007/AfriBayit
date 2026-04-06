import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SearchBar from "@/components/property/SearchBar";
import PropertyCard from "@/components/property/PropertyCard";
import Button from "@/components/ui/Button";
import PropertyFilters from "@/components/property/PropertyFilters";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Annonces Immobilières | AfriBayit",
  description:
    "Trouvez votre bien immobilier idéal en Afrique — vente, location longue durée, location courte durée.",
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
    hasPool?: string;
    hasAC?: string;
    hasGarage?: string;
    hasSecurity?: string;
    hasGenerator?: string;
    hasGarden?: string;
  }>;
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const pageSize = 12;
  const sort = params.sort || "recent";

  // Build where clause
  const where: any = { status: "ACTIVE" };

  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: "insensitive" } },
      { city: { contains: params.q, mode: "insensitive" } },
      { district: { contains: params.q, mode: "insensitive" } },
    ];
  }
  if (params.country) where.country = params.country;
  if (params.city) where.city = { contains: params.city, mode: "insensitive" };
  if (params.type) where.type = params.type;
  if (params.listingType) where.listingType = params.listingType;
  if (params.minPrice || params.maxPrice) {
    where.price = {};
    if (params.minPrice) where.price.gte = parseInt(params.minPrice);
    if (params.maxPrice) where.price.lte = parseInt(params.maxPrice);
  }
  if (params.bedrooms) where.bedrooms = { gte: parseInt(params.bedrooms) };
  if (params.hasPool === "true") where.hasPool = true;
  if (params.hasAC === "true") where.hasAC = true;
  if (params.hasGarage === "true") where.hasGarage = true;
  if (params.hasSecurity === "true") where.hasSecurity = true;
  if (params.hasGenerator === "true") where.hasGenerator = true;
  if (params.hasGarden === "true") where.hasGarden = true;

  // Build orderBy
  const orderBy: any =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
      ? { price: "desc" }
      : sort === "score"
      ? { investmentScore: "desc" }
      : sort === "views"
      ? { viewCount: "desc" }
      : { publishedAt: "desc" };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        owner: { select: { id: true, name: true, image: true, isPremium: true } },
        _count: { select: { favorites: true } },
      },
    }),
    prisma.property.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Transform to PropertyCard type
  const propertyCards = properties.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    type: p.type as string,
    listingType: p.listingType as string,
    status: p.status as string,
    price: Number(p.price),
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
      image: p.owner.image ?? undefined,
      isPremium: p.owner.isPremium,
    },
    createdAt: p.createdAt.toISOString(),
    publishedAt: p.publishedAt?.toISOString(),
  }));

  // Serialise params for client components (remove undefined values)
  const serialisedParams: Record<string, string | undefined> = {
    q: params.q,
    country: params.country,
    city: params.city,
    type: params.type,
    listingType: params.listingType,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    bedrooms: params.bedrooms,
    sort: params.sort,
    page: params.page,
    hasPool: params.hasPool,
    hasAC: params.hasAC,
    hasGarage: params.hasGarage,
    hasSecurity: params.hasSecurity,
    hasGenerator: params.hasGenerator,
    hasGarden: params.hasGarden,
  };

  // Build pagination URL helper — strips undefined values
  function paginationUrl(targetPage: number): string {
    const clean: Record<string, string> = {};
    for (const [k, v] of Object.entries(serialisedParams)) {
      if (v !== undefined && v !== "") clean[k] = v;
    }
    clean.page = String(targetPage);
    return `/properties?${new URLSearchParams(clean).toString()}`;
  }

  const pageNumbers: number[] = [];
  const delta = 2;
  for (
    let i = Math.max(1, page - delta);
    i <= Math.min(totalPages, page + delta);
    i++
  ) {
    pageNumbers.push(i);
  }

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
                  <strong className="text-gray-700">{total.toLocaleString()}</strong>{" "}
                  résultat{total !== 1 ? "s" : ""}
                  {params.city ? ` à ${params.city}` : ""}
                  {params.country ? ` · ${params.country}` : ""}
                </p>
              </div>
              <Link href="/properties/new">
                <Button
                  variant="primary"
                  size="md"
                  icon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  }
                >
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
              <PropertyFilters currentParams={serialisedParams} />
            </aside>

            {/* Properties grid */}
            <div className="flex-1 min-w-0">
              {/* Sort bar */}
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm text-gray-500">
                  Page <strong className="text-gray-700">{page}</strong> sur{" "}
                  <strong className="text-gray-700">
                    {totalPages || 1}
                  </strong>
                </p>
              </div>

              {/* Grid or empty state */}
              {propertyCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <svg
                    className="w-16 h-16 text-gray-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                    <polyline
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      points="9 22 9 12 15 12 15 22"
                    />
                  </svg>
                  <p className="text-gray-500 text-lg font-medium mb-2">
                    Aucune annonce trouvée
                  </p>
                  <p className="text-gray-400 text-sm">
                    Essayez de modifier vos filtres ou votre recherche.
                  </p>
                  <Link href="/properties" className="mt-4">
                    <Button variant="outline" size="sm">
                      Réinitialiser les filtres
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {propertyCards.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                  {page > 1 ? (
                    <Link href={paginationUrl(page - 1)}>
                      <button className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                        Précédent
                      </button>
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-400 cursor-not-allowed opacity-50"
                    >
                      Précédent
                    </button>
                  )}

                  {pageNumbers[0] > 1 && (
                    <>
                      <Link href={paginationUrl(1)}>
                        <button className="w-9 h-9 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                          1
                        </button>
                      </Link>
                      {pageNumbers[0] > 2 && (
                        <span className="text-gray-400 px-1">…</span>
                      )}
                    </>
                  )}

                  {pageNumbers.map((n) => (
                    <Link key={n} href={paginationUrl(n)}>
                      <button
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          n === page
                            ? "bg-[#0070BA] text-white shadow"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {n}
                      </button>
                    </Link>
                  ))}

                  {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                      {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                        <span className="text-gray-400 px-1">…</span>
                      )}
                      <Link href={paginationUrl(totalPages)}>
                        <button className="w-9 h-9 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                          {totalPages}
                        </button>
                      </Link>
                    </>
                  )}

                  {page < totalPages ? (
                    <Link href={paginationUrl(page + 1)}>
                      <button className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                        Suivant
                      </button>
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-400 cursor-not-allowed opacity-50"
                    >
                      Suivant
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
