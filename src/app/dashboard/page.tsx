import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "success",
  RENTED: "gold",
  SOLD: "gray",
  DRAFT: "gray",
};

const TRANSACTION_COLORS: Record<string, string> = {
  RELEASED: "success",
  ESCROW: "primary",
  PENDING: "gray",
  DISPUTED: "danger",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;

  const [user, properties, transactions, messages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
        isPremium: true,
        kycStatus: true,
        loyaltyPoints: true,
        reputationScore: true,
        country: true,
      },
    }),
    prisma.property.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { favorites: true } },
      },
    }),
    prisma.transaction.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.message.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    }),
  ]);

  if (!user) redirect("/login");

  // Computed stats
  const activeProperties = properties.filter((p) => p.status === "ACTIVE").length;
  const totalViews = properties.reduce((sum, p) => sum + p.viewCount, 0);
  const unreadMessages = messages.filter((m) => !m.isRead).length;

  const STATS = [
    { label: "Annonces actives", value: String(activeProperties), icon: "🏠", trend: `${properties.length} au total`, color: "#0070BA" },
    { label: "Vues totales", value: totalViews.toLocaleString("fr-FR"), icon: "👁️", trend: "Toutes annonces confondues", color: "#003087" },
    { label: "Transactions", value: String(transactions.length), icon: "💰", trend: "Récentes", color: "#00A651" },
    { label: "Messages non lus", value: String(unreadMessages), icon: "💬", trend: `${messages.length} reçus au total`, color: "#FFB900" },
  ];

  return (
    <>
      <Navbar />

      <main className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-[#003087]">
                Bonjour, {user.name?.split(" ")[0] ?? "Utilisateur"} 👋
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {user.isPremium && (
                  <span className="badge-premium">Premium</span>
                )}
                {user.kycStatus === "VERIFIED" && (
                  <span className="badge-certified">✓ KYC Vérifié</span>
                )}
                <span className="text-sm text-gray-400">
                  {formatCompactCurrency(user.loyaltyPoints)} points fidélité
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/properties/new">
                <Button variant="primary" icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }>
                  Nouvelle annonce
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STATS.map((stat) => (
              <Card key={stat.label} className="border border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{stat.trend}</p>
                  </div>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My properties */}
            <div className="lg:col-span-2 space-y-5">
              {/* Properties list */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Mes annonces</h2>
                  <Link href="/dashboard/properties" className="text-sm text-[#0070BA] hover:underline">
                    Voir tout
                  </Link>
                </div>
                <div className="space-y-3">
                  {properties.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Aucune annonce pour l&apos;instant.</p>
                  )}
                  {properties.map((prop) => (
                    <div
                      key={prop.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      {/* Property thumbnail placeholder */}
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex-shrink-0 flex items-center justify-center">
                        <span className="text-xl">🏠</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">
                          {prop.title}
                        </p>
                        <p className="text-xs text-[#0070BA] font-semibold mt-0.5">
                          {formatCurrency(Number(prop.price), prop.currency as string)}
                          {prop.listingType === "LONG_TERM_RENTAL" && "/mois"}
                          {prop.listingType === "SHORT_TERM_RENTAL" && "/nuit"}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400">
                            👁️ {prop.viewCount.toLocaleString("fr-FR")}
                          </span>
                          <span className="text-xs text-gray-400">
                            ❤️ {prop._count.favorites}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(prop.updatedAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={STATUS_COLORS[prop.status as string] as any} size="sm">
                          {prop.status === "ACTIVE" ? "Active" : prop.status === "RENTED" ? "Louée" : prop.status as string}
                        </Badge>
                        <div className="flex gap-1">
                          <Link href={`/properties/${prop.slug}/edit`}>
                            <button className="p-1 text-gray-400 hover:text-[#0070BA] transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          </Link>
                          <button className="p-1 text-gray-400 hover:text-[#D93025] transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" fullWidth className="mt-4">
                  + Publier une nouvelle annonce
                </Button>
              </Card>

              {/* Transactions */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Transactions récentes</h2>
                  <Link href="/dashboard/transactions" className="text-sm text-[#0070BA] hover:underline">
                    Voir tout
                  </Link>
                </div>
                <div className="space-y-3">
                  {transactions.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Aucune transaction pour l&apos;instant.</p>
                  )}
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0070BA]/10 flex items-center justify-center">
                          <span className="text-lg">💰</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 text-sm">{tx.type}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(tx.createdAt).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#003087]">
                          +{formatCurrency(Number(tx.amount), tx.currency as string)}
                        </p>
                        <Badge variant={TRANSACTION_COLORS[tx.status as string] as any} size="sm">
                          {tx.status === "RELEASED" ? "Reçu" : tx.status === "ESCROW" ? "En séquestre" : tx.status as string}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right sidebar */}
            <div className="space-y-5">
              {/* Messages */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    Messages
                    {unreadMessages > 0 && (
                      <span className="w-5 h-5 rounded-full bg-[#D93025] text-white text-xs flex items-center justify-center">
                        {unreadMessages}
                      </span>
                    )}
                  </h2>
                  <Link href="/dashboard/messages" className="text-sm text-[#0070BA] hover:underline">
                    Voir tout
                  </Link>
                </div>
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Aucun message pour l&apos;instant.</p>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                        !msg.isRead ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-[#0070BA] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {msg.sender.name?.slice(0, 2).toUpperCase() ?? "??"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium truncate ${!msg.isRead ? "text-[#003087]" : "text-gray-700"}`}>
                            {msg.sender.name ?? "Inconnu"}
                          </p>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
                            {new Date(msg.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Performance chart placeholder */}
              <Card>
                <h2 className="text-lg font-bold text-gray-800 mb-4">Performance</h2>
                <div className="space-y-3">
                  {[
                    { label: "Taux de réponse", value: 96, color: "#00A651" },
                    { label: "Taux d'occupation", value: 78, color: "#0070BA" },
                    { label: "Satisfaction client", value: 92, color: "#FFB900" },
                  ].map((metric) => (
                    <div key={metric.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">{metric.label}</span>
                        <span className="font-semibold text-gray-700">{metric.value}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ width: `${metric.value}%`, backgroundColor: metric.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* KYC/Verification status */}
              <Card className="bg-gradient-to-br from-[#003087] to-[#0070BA] text-white">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <p className="font-bold">
                      {user.kycStatus === "VERIFIED" ? "Compte vérifié" : "Vérification requise"}
                    </p>
                    <p className="text-white/70 text-xs">
                      {user.isPremium ? "KYC · AML · Premium" : "KYC · AML"}
                    </p>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  {[
                    "✓ Identité vérifiée",
                    "✓ Numéro confirmé",
                    "✓ Adresse validée",
                    "✓ Documents légaux",
                  ].map((item) => (
                    <p key={item} className="text-white/80">{item}</p>
                  ))}
                </div>
              </Card>

              {/* Quick actions */}
              <Card>
                <h3 className="font-bold text-gray-800 mb-3">Actions rapides</h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: "📸", label: "Photos pro", href: "/services/photos" },
                    { icon: "🥽", label: "Visite VR", href: "/services/vr" },
                    { icon: "📊", label: "Estimation IA", href: "/tools/estimate" },
                    { icon: "🎓", label: "Formation", href: "/academy" },
                  ].map((action) => (
                    <Link key={action.label} href={action.href}>
                      <div className="p-3 rounded-xl bg-gray-50 hover:bg-blue-50 text-center cursor-pointer transition-colors">
                        <span className="text-xl block mb-1">{action.icon}</span>
                        <span className="text-xs text-gray-600 font-medium">{action.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
