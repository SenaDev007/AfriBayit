import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Transactions — AfriBayit" };

const STATUS_BADGE: Record<string, "success" | "primary" | "gray" | "danger"> = {
  RELEASED: "success",
  ESCROW: "primary",
  PENDING: "gray",
  DISPUTED: "danger",
  REFUNDED: "gray",
};

const STATUS_LABELS: Record<string, string> = {
  RELEASED: "Libéré",
  ESCROW: "En séquestre",
  PENDING: "En attente",
  DISPUTED: "Litigieux",
  REFUNDED: "Remboursé",
};

export default async function DashboardTransactionsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;

  const transactions = await prisma.transaction.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Compute balance stats
  const totalReceived = transactions
    .filter((tx) => tx.receiverId === userId && tx.status === "RELEASED")
    .reduce((sum, tx) => sum + Number(tx.netAmount), 0);

  const totalSent = transactions
    .filter((tx) => tx.senderId === userId && tx.status === "RELEASED")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const pendingAmount = transactions
    .filter((tx) => tx.status === "ESCROW" || tx.status === "PENDING")
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const defaultCurrency =
    transactions.length > 0 ? (transactions[0].currency as string) : "XOF";

  return (
    <>
      <Navbar />

      <main className="pt-16 min-h-screen bg-gray-50">
        <div className="container-app py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#003087]">Transactions</h1>
              <p className="text-sm text-gray-500 mt-1">
                {transactions.length} transaction{transactions.length !== 1 ? "s" : ""} au total
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-[#0070BA] hover:underline flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour au tableau de bord
            </Link>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Total reçu
              </p>
              <p className="text-2xl font-bold text-[#00A651]">
                {formatCurrency(totalReceived, defaultCurrency)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Transactions libérées</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Total envoyé
              </p>
              <p className="text-2xl font-bold text-[#003087]">
                {formatCurrency(totalSent, defaultCurrency)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Paiements effectués</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                En attente
              </p>
              <p className="text-2xl font-bold text-[#FFB900]">
                {formatCurrency(pendingAmount, defaultCurrency)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Séquestre / Pending</p>
            </div>
          </div>

          {/* Transaction list */}
          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#0070BA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Aucune transaction</h2>
              <p className="text-sm text-gray-400">
                Vos transactions apparaîtront ici une fois que vous aurez effectué ou reçu un paiement.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Direction
                      </th>
                      <th className="text-left px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-right px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="text-right px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Commission
                      </th>
                      <th className="text-right px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Net
                      </th>
                      <th className="text-left px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="text-left px-4 py-4 font-semibold text-gray-500 text-xs uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.map((tx) => {
                      const isSender = tx.senderId === userId;
                      const currency = tx.currency as string;
                      const statusVariant = STATUS_BADGE[tx.status as string] ?? "gray";
                      const statusLabel = STATUS_LABELS[tx.status as string] ?? (tx.status as string);

                      return (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                          {/* Direction */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  isSender
                                    ? "bg-red-50 text-[#D93025]"
                                    : "bg-green-50 text-[#00A651]"
                                }`}
                              >
                                {isSender ? (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                )}
                              </div>
                              <span
                                className={`font-semibold text-sm ${
                                  isSender ? "text-[#D93025]" : "text-[#00A651]"
                                }`}
                              >
                                {isSender ? "Envoyé" : "Reçu"}
                              </span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-4">
                            <span className="text-gray-700 font-medium">{tx.type}</span>
                            {tx.inEscrow && (
                              <span className="ml-2 text-xs text-[#0070BA] bg-blue-50 px-1.5 py-0.5 rounded-full">
                                Séquestre
                              </span>
                            )}
                          </td>

                          {/* Amount */}
                          <td className="px-4 py-4 text-right">
                            <span
                              className={`font-bold ${
                                isSender ? "text-[#D93025]" : "text-[#00A651]"
                              }`}
                            >
                              {isSender ? "−" : "+"}
                              {formatCurrency(Number(tx.amount), currency)}
                            </span>
                          </td>

                          {/* Commission */}
                          <td className="px-4 py-4 text-right">
                            <span className="text-gray-400 text-xs">
                              {formatCurrency(Number(tx.commission), currency)}
                            </span>
                          </td>

                          {/* Net */}
                          <td className="px-4 py-4 text-right">
                            <span className="font-semibold text-[#003087]">
                              {formatCurrency(Number(tx.netAmount), currency)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            <Badge variant={statusVariant} size="sm">
                              {statusLabel}
                            </Badge>
                          </td>

                          {/* Date */}
                          <td className="px-4 py-4">
                            <span className="text-gray-400 text-xs">
                              {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-gray-100">
                {transactions.map((tx) => {
                  const isSender = tx.senderId === userId;
                  const currency = tx.currency as string;
                  const statusVariant = STATUS_BADGE[tx.status as string] ?? "gray";
                  const statusLabel = STATUS_LABELS[tx.status as string] ?? (tx.status as string);

                  return (
                    <div key={tx.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isSender ? "bg-red-50 text-[#D93025]" : "bg-green-50 text-[#00A651]"
                            }`}
                          >
                            {isSender ? (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${isSender ? "text-[#D93025]" : "text-[#00A651]"}`}>
                              {isSender ? "Envoyé" : "Reçu"}
                            </p>
                            <p className="text-xs text-gray-400">{tx.type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${isSender ? "text-[#D93025]" : "text-[#00A651]"}`}>
                            {isSender ? "−" : "+"}
                            {formatCurrency(Number(tx.amount), currency)}
                          </p>
                          <p className="text-xs text-gray-400">
                            Net: {formatCurrency(Number(tx.netAmount), currency)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={statusVariant} size="sm">{statusLabel}</Badge>
                        <span className="text-xs text-gray-400">
                          {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
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
