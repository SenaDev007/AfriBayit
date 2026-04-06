import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Communauté AfriBayit — Réseau Immobilier Africain",
  description:
    "Rejoignez la communauté AfriBayit : échangez avec des investisseurs, agents et professionnels de l'immobilier africain. Discussions, conseils, témoignages.",
};

const communityStats = [
  { value: "12 500", label: "Membres" },
  { value: "4 300", label: "Discussions" },
  { value: "98%", label: "Questions répondues" },
];

const categoryColors: Record<string, string> = {
  Investissement: "bg-blue-100 text-[#003087]",
  Témoignages: "bg-green-100 text-green-700",
  Juridique: "bg-orange-100 text-orange-700",
  Conseils: "bg-purple-100 text-purple-700",
  Travaux: "bg-yellow-100 text-yellow-700",
  Finance: "bg-red-100 text-red-700",
};

const discussions = [
  {
    id: 1,
    author: "Kofi A.",
    initials: "KA",
    avatarColor: "bg-[#003087]",
    title: "Prix immobilier à Abidjan : tendances 2025",
    category: "Investissement",
    likes: 47,
    replies: 23,
    timeAgo: "il y a 2 h",
    excerpt:
      "Les prix dans le plateau continuent de grimper. Qui a des données récentes sur les quartiers périphériques ?",
  },
  {
    id: 2,
    author: "Aminata S.",
    initials: "AS",
    avatarColor: "bg-emerald-600",
    title: "Retour d'expérience : achat villa Cocody",
    category: "Témoignages",
    likes: 38,
    replies: 15,
    timeAgo: "il y a 5 h",
    excerpt:
      "Après 18 mois de recherche j'ai finalement signé. Je partage mes conseils et les pièges à éviter.",
  },
  {
    id: 3,
    author: "Jean-Paul N.",
    initials: "JP",
    avatarColor: "bg-orange-600",
    title: "Documents nécessaires pour acheter au Bénin",
    category: "Juridique",
    likes: 55,
    replies: 31,
    timeAgo: "il y a 8 h",
    excerpt:
      "Je prépare un achat à Cotonou. Quelqu'un peut partager la liste complète des documents requis pour le titre foncier ?",
  },
  {
    id: 4,
    author: "Fatou D.",
    initials: "FD",
    avatarColor: "bg-pink-600",
    title: "Meilleur quartier pour investir à Ouagadougou ?",
    category: "Investissement",
    likes: 29,
    replies: 18,
    timeAgo: "il y a 12 h",
    excerpt:
      "Avec un budget de 15 millions FCFA, quels sont les quartiers avec le meilleur potentiel de valorisation ?",
  },
  {
    id: 5,
    author: "Musa T.",
    initials: "MT",
    avatarColor: "bg-violet-600",
    title: "Comment négocier un bien immobilier ?",
    category: "Conseils",
    likes: 62,
    replies: 45,
    timeAgo: "il y a 1 j",
    excerpt:
      "Techniques de négociation qui fonctionnent vraiment en Afrique de l'Ouest. Thread collaboratif.",
  },
  {
    id: 6,
    author: "Grace O.",
    initials: "GO",
    avatarColor: "bg-yellow-600",
    title: "Projet de construction : choisir son artisan",
    category: "Travaux",
    likes: 24,
    replies: 12,
    timeAgo: "il y a 1 j",
    excerpt:
      "Maçon, carreleur, électricien… Comment trouver des artisans fiables pour un chantier au Ghana ?",
  },
  {
    id: 7,
    author: "Ibrahim K.",
    initials: "IK",
    avatarColor: "bg-teal-600",
    title: "Fiscalité location meublée en Côte d'Ivoire",
    category: "Juridique",
    likes: 41,
    replies: 27,
    timeAgo: "il y a 2 j",
    excerpt:
      "Comment déclarer ses revenus Airbnb en CI ? Régime micro ou réel simplifié — quelqu'un a de l'expérience ?",
  },
  {
    id: 8,
    author: "Chidi E.",
    initials: "CE",
    avatarColor: "bg-red-700",
    title: "Financement immobilier sans banque en Afrique",
    category: "Finance",
    likes: 88,
    replies: 67,
    timeAgo: "il y a 3 j",
    excerpt:
      "Tontines, crowdfunding, fonds d'investissement diaspora… Tour d'horizon des alternatives au crédit bancaire classique.",
  },
];

const groups = [
  {
    name: "Investisseurs Bénin",
    members: 1240,
    description: "Opportunités, projets et réseau d'investissement au Bénin",
    color: "bg-[#003087]",
  },
  {
    name: "Agents CI",
    members: 890,
    description: "Communauté des agents immobiliers de Côte d'Ivoire",
    color: "bg-emerald-600",
  },
  {
    name: "Constructeurs BF",
    members: 445,
    description: "Promoteurs et constructeurs du Burkina Faso",
    color: "bg-orange-600",
  },
  {
    name: "Tourisme & Hôtellerie Togo",
    members: 672,
    description: "Hébergements touristiques et immobilier hôtelier au Togo",
    color: "bg-violet-600",
  },
];

const topContributors = [
  { name: "Kofi Asante", posts: 312, country: "CI" },
  { name: "Musa Traoré", posts: 287, country: "BF" },
  { name: "Jean-Paul Nkosi", posts: 241, country: "BJ" },
  { name: "Aminata Sy", posts: 198, country: "SN" },
  { name: "Chidi Emeka", posts: 176, country: "NG" },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#003087] to-[#0070BA] py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            Réseau Immobilier Africain
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            Communauté <span className="text-blue-200">AfriBayit</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Connectez-vous avec des investisseurs, agents immobiliers,
            promoteurs et acheteurs à travers toute l&apos;Afrique. Partagez
            vos expériences, posez vos questions, développez votre réseau.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-[#003087] font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-colors text-sm"
          >
            Rejoindre la discussion
          </Link>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            {communityStats.map((s) => (
              <div key={s.label} className="py-7 text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#003087] mb-0.5">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column: Discussions */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#003087]">
                Discussions récentes
              </h2>
              <Link
                href="/register"
                className="text-sm font-semibold text-[#0070BA] hover:underline"
              >
                + Nouvelle discussion
              </Link>
            </div>

            <div className="space-y-4">
              {discussions.map((post) => (
                <article
                  key={post.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md hover:border-[#0070BA]/30 transition-all duration-200"
                >
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full ${post.avatarColor} text-white text-sm font-bold flex items-center justify-center shrink-0`}
                    >
                      {post.initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Author + time */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-gray-900">
                          {post.author}
                        </span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-400">
                          {post.timeAgo}
                        </span>
                        <span
                          className={`ml-auto text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            categoryColors[post.category] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {post.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-[15px] font-bold text-gray-900 mb-1.5 leading-snug">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>

                      {/* Likes + replies */}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          {post.likes} j&apos;aime
                        </span>
                        <span className="flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          {post.replies} réponses
                        </span>
                        <Link
                          href="/register"
                          className="ml-auto text-[#0070BA] hover:underline font-medium"
                        >
                          Répondre →
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Load more */}
            <div className="mt-8 text-center">
              <Link
                href="/register"
                className="inline-block border border-[#003087] text-[#003087] font-semibold px-8 py-3 rounded-xl hover:bg-[#003087] hover:text-white transition-colors text-sm"
              >
                Voir toutes les discussions
              </Link>
            </div>
          </div>

          {/* Right column: Groups + Contributors */}
          <div className="lg:w-72 space-y-6">
            {/* Popular Groups */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-base font-bold text-[#003087] mb-4">
                Groupes populaires
              </h3>
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.name}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg ${group.color} flex items-center justify-center shrink-0`}
                    >
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 leading-snug">
                        {group.name}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-snug">
                        {group.description}
                      </div>
                      <div className="text-xs font-medium text-[#0070BA] mt-1">
                        {group.members.toLocaleString("fr-FR")} membres
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="block mt-4 w-full text-center text-sm font-semibold bg-[#003087] text-white py-2.5 rounded-xl hover:bg-[#002070] transition-colors"
              >
                Voir tous les groupes
              </Link>
            </div>

            {/* Top contributors */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-base font-bold text-[#003087] mb-4">
                Top contributeurs
              </h3>
              <div className="space-y-3">
                {topContributors.map((contrib, i) => (
                  <div key={contrib.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-300 w-4 text-center">
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#003087] to-[#0070BA] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {contrib.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {contrib.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {contrib.posts} contributions
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {contrib.country}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA card */}
            <div className="bg-gradient-to-br from-[#003087] to-[#0070BA] rounded-2xl p-5 text-white">
              <h3 className="font-bold text-base mb-2">
                Rejoignez la communauté
              </h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-4">
                Créez votre profil gratuitement et accédez à toutes les
                discussions, groupes et ressources.
              </p>
              <Link
                href="/register"
                className="block w-full text-center bg-white text-[#003087] font-semibold text-sm py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
              >
                Rejoindre gratuitement
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
