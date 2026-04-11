import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  formatCurrency,
  LISTING_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
} from "@/lib/utils";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Mes annonces — AfriBayit" };

const STATUS_BADGE: Record<string, "success" | "gray" | "gold"> = {
  ACTIVE: "success",
  DRAFT: "gray",
  RENTED: "gold",
  SOLD: "gray",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  DRAFT: "Brouillon",
  RENTED: "Louée",
  SOLD: "Vendue",
};

export default async function DashboardPropertiesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;

  const properties = await prisma.property.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      _count: { select: { favorites: true, reviews: true } },
    },
  });

  return (
    <>
      <Navbar />

      <main className="pt-[72px] min-h-screen bg-gray-50">
        <div className="container-app py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#003087]">Mes annonces</h1>
              <p className="text-sm text-gray-500 mt-1">
                {properties.length} annonce{properties.length !== 1 ? "s" : ""} au total
              </p>
            </div>
            <Link href="/properties/new">
              <Button
                variant="primary"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Publier une annonce
              </Button>
            </Link>
          </div>

          {/* Empty state */}
          {properties.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#0070BA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Aucune annonce pour l&apos;instant</h2>
              <p className="text-sm text-gray-400 mb-6">
                Publiez votre première annonce pour commencer à attirer des locataires ou acheteurs.
              </p>
              <Link href="/properties/new">
                <Button variant="primary">+ Publier une annonce</Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Annonce
                      </th>
                      <th className="text-left px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Prix
                      </th>
                      <th className="text-left px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="text-left px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Vues
                      </th>
                      <th className="text-left px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Favoris
                      </th>
                      <th className="text-left px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-right px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {properties.map((p) => {
                      const thumb = p.images[0];
                      const statusVariant = STATUS_BADGE[p.status as string] ?? "gray";
                      const statusLabel = STATUS_LABELS[p.status as string] ?? (p.status as string);
                      const listingLabel =
                        LISTING_TYPE_LABELS[p.listingType as string] ?? (p.listingType as string);
                      const typeLabel =
                        PROPERTY_TYPE_LABELS[p.type as string] ?? (p.type as string);
                      const suffix =
                        p.listingType === "LONG_TERM_RENTAL"
                          ? "/mois"
                          : p.listingType === "SHORT_TERM_RENTAL"
                          ? "/nuit"
                          : "";

                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          {/* Thumbnail + title */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                {thumb?.url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={thumb.url}
                                    alt={p.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <svg className="w-6 h-6 text-[#0070BA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                  </svg>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 truncate max-w-[200px]">
                                  {p.title}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {p.city}{p.country ? `, ${p.country}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium text-gray-700">{typeLabel}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{listingLabel}</p>
                            </div>
                          </td>

                          {/* Price */}
                          <td className="px-4 py-4">
                            <span className="font-bold text-[#0070BA]">
                              {formatCurrency(Number(p.price), p.currency as string)}
                              {suffix && (
                                <span className="font-normal text-gray-400">{suffix}</span>
                              )}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            <Badge variant={statusVariant} size="sm">
                              {statusLabel}
                            </Badge>
                          </td>

                          {/* Views */}
                          <td className="px-4 py-4">
                            <span className="text-gray-600">
                              {p.viewCount.toLocaleString("fr-FR")}
                            </span>
                          </td>

                          {/* Favorites */}
                          <td className="px-4 py-4">
                            <span className="text-gray-600">{p._count.favorites}</span>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-4">
                            <span className="text-gray-400 text-xs">
                              {new Date(p.createdAt).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/properties/${p.slug}/edit`}>
                                <button
                                  className="p-2 rounded-lg text-gray-400 hover:text-[#0070BA] hover:bg-blue-50 transition-colors"
                                  title="Modifier"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              </Link>
                              <Link href={`/properties/${p.slug}`}>
                                <button
                                  className="p-2 rounded-lg text-gray-400 hover:text-[#00A651] hover:bg-green-50 transition-colors"
                                  title="Voir l'annonce"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                              </Link>
                              <button
                                className="p-2 rounded-lg text-gray-400 hover:text-[#D93025] hover:bg-red-50 transition-colors"
                                title="Supprimer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-gray-100">
                {properties.map((p) => {
                  const thumb = p.images[0];
                  const statusVariant = STATUS_BADGE[p.status as string] ?? "gray";
                  const statusLabel = STATUS_LABELS[p.status as string] ?? (p.status as string);
                  const listingLabel =
                    LISTING_TYPE_LABELS[p.listingType as string] ?? (p.listingType as string);
                  const suffix =
                    p.listingType === "LONG_TERM_RENTAL"
                      ? "/mois"
                      : p.listingType === "SHORT_TERM_RENTAL"
                      ? "/nuit"
                      : "";

                  return (
                    <div key={p.id} className="p-4 flex gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        {thumb?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb.url} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-6 h-6 text-[#0070BA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-800 truncate text-sm">{p.title}</p>
                          <Badge variant={statusVariant} size="sm">{statusLabel}</Badge>
                        </div>
                        <p className="text-xs text-[#0070BA] font-bold mt-1">
                          {formatCurrency(Number(p.price), p.currency as string)}{suffix}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{listingLabel}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">👁️ {p.viewCount}</span>
                          <span className="text-xs text-gray-400">❤️ {p._count.favorites}</span>
                          <div className="ml-auto flex gap-1">
                            <Link href={`/properties/${p.slug}/edit`}>
                              <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#0070BA] hover:bg-blue-50 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            </Link>
                            <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#D93025] hover:bg-red-50 transition-colors">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
