import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Badge from "@/components/ui/Badge";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Messages — AfriBayit" };

function getInitials(name: string | null | undefined): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatMessageDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardMessagesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;

  const [received, sent] = await Promise.all([
    prisma.message.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: "desc" },
      include: { sender: { select: { id: true, name: true, image: true } } },
    }),
    prisma.message.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
      include: { receiver: { select: { id: true, name: true, image: true } } },
      take: 20,
    }),
  ]);

  const unreadCount = received.filter((m) => !m.isRead).length;

  return (
    <>
      <Navbar />

      <main className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-[#003087]">Messages</h1>
                  {unreadCount > 0 && (
                    <Badge variant="danger" size="md">
                      {unreadCount} non lu{unreadCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {received.length} reçu{received.length !== 1 ? "s" : ""} · {sent.length} envoyé{sent.length !== 1 ? "s" : ""}
                </p>
              </div>
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

          {/* Received messages */}
          <section className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-800">Reçus</h2>
              {unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#D93025] text-white text-xs flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </div>

            {received.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-[#0070BA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Aucun message reçu</p>
                <p className="text-xs text-gray-400">
                  Les messages que vous recevrez apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {received.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-4 p-4 transition-colors ${
                      !msg.isRead ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {msg.sender.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={msg.sender.image}
                          alt={msg.sender.name ?? "Avatar"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#0070BA] flex items-center justify-center text-white text-sm font-bold">
                          {getInitials(msg.sender.name)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p
                          className={`text-sm font-semibold truncate ${
                            !msg.isRead ? "text-[#003087]" : "text-gray-700"
                          }`}
                        >
                          {msg.sender.name ?? "Utilisateur inconnu"}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!msg.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#0070BA] inline-block" title="Non lu" />
                          )}
                          <span className="text-xs text-gray-400">
                            {formatMessageDate(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                        {msg.content.length > 100
                          ? msg.content.slice(0, 100) + "…"
                          : msg.content}
                      </p>
                      {null /* property link removed – Message model has no propertyId */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sent messages */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Envoyés</h2>

            {sent.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Aucun message envoyé</p>
                <p className="text-xs text-gray-400">
                  Les messages que vous envoyez apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {sent.map((msg) => (
                  <div
                    key={msg.id}
                    className="flex gap-4 p-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar of receiver */}
                    <div className="flex-shrink-0">
                      {msg.receiver.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={msg.receiver.image}
                          alt={msg.receiver.name ?? "Avatar"}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-bold">
                          {getInitials(msg.receiver.name)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-700 truncate">
                          A: {msg.receiver.name ?? "Utilisateur inconnu"}
                        </p>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {msg.isRead ? (
                            <span className="text-xs text-[#00A651]" title="Lu">
                              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Lu
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Envoyé</span>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatMessageDate(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                        {msg.content.length > 100
                          ? msg.content.slice(0, 100) + "…"
                          : msg.content}
                      </p>
                      {null /* property link removed – Message model has no propertyId */}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
