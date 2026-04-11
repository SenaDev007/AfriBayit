"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const stats = [
  { value: "500+", label: "Apprenants" },
  { value: "12", label: "Formations" },
  { value: "4", label: "Pays" },
  { value: "95%", label: "Satisfaction" },
];

const categories = [
  "Tous",
  "Investissement",
  "Vente",
  "Location",
  "Gestion",
  "Juridique",
];

type Level = "DÉBUTANT" | "INTERMÉDIAIRE" | "AVANCÉ" | "PROFESSIONNEL";

const levelConfig: Record<Level, { bg: string; text: string }> = {
  DÉBUTANT: { bg: "bg-green-100", text: "text-green-700" },
  INTERMÉDIAIRE: { bg: "bg-blue-100", text: "text-[#0070BA]" },
  AVANCÉ: { bg: "bg-orange-100", text: "text-orange-700" },
  PROFESSIONNEL: { bg: "bg-purple-100", text: "text-purple-700" },
};

interface Course {
  title: string;
  category: string;
  level: Level;
  modules: number;
  rating: number;
  reviews: number;
  price: string;
  enrolled: number;
  description: string;
}

const courses: Course[] = [
  {
    title: "Investir en immobilier africain",
    category: "Investissement",
    level: "DÉBUTANT",
    modules: 8,
    rating: 4.9,
    reviews: 142,
    price: "12 000 FCFA",
    enrolled: 245,
    description:
      "Apprenez les bases de l'investissement immobilier en Afrique subsaharienne, les marchés porteurs et les stratégies gagnantes.",
  },
  {
    title: "Maîtriser la vente immobilière",
    category: "Vente",
    level: "INTERMÉDIAIRE",
    modules: 10,
    rating: 4.7,
    reviews: 98,
    price: "18 000 FCFA",
    enrolled: 178,
    description:
      "Techniques de prospection, négociation et closing adaptées au marché immobilier africain pour les agents et mandataires.",
  },
  {
    title: "Location courte durée & Airbnb Africa",
    category: "Location",
    level: "DÉBUTANT",
    modules: 6,
    rating: 4.8,
    reviews: 207,
    price: "9 500 FCFA",
    enrolled: 312,
    description:
      "Optimisez vos revenus locatifs avec les plateformes de location courte durée : stratégies de prix, décoration et gestion des hôtes.",
  },
  {
    title: "Droit immobilier OHADA",
    category: "Juridique",
    level: "AVANCÉ",
    modules: 14,
    rating: 4.6,
    reviews: 54,
    price: "25 000 FCFA",
    enrolled: 89,
    description:
      "Maîtrisez le cadre juridique OHADA appliqué à l'immobilier : contrats, titres fonciers, copropriété et résolution de litiges.",
  },
  {
    title: "Gestion de portefeuille immobilier",
    category: "Gestion",
    level: "PROFESSIONNEL",
    modules: 12,
    rating: 5.0,
    reviews: 31,
    price: "35 000 FCFA",
    enrolled: 56,
    description:
      "Pour les investisseurs avancés : structuration, optimisation fiscale et pilotage d'un portefeuille multi-actifs en Afrique.",
  },
  {
    title: "BIM & Maquette numérique",
    category: "Gestion",
    level: "INTERMÉDIAIRE",
    modules: 8,
    rating: 4.5,
    reviews: 76,
    price: "22 000 FCFA",
    enrolled: 134,
    description:
      "Introduction au Building Information Modeling (BIM) pour les professionnels de la construction et de la promotion immobilière.",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.floor(rating)
              ? "text-yellow-400"
              : star - 0.5 <= rating
              ? "text-yellow-300"
              : "text-gray-200"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs font-semibold text-gray-700 ml-0.5">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function AcademyPage() {
  const [activeCategory, setActiveCategory] = useState("Tous");

  const filtered =
    activeCategory === "Tous"
      ? courses
      : courses.filter((c) => c.category === activeCategory);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#003087] to-[#0070BA] pt-[88px] pb-20">
        <div className="container-app text-center">
          <span className="inline-block bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            Plateforme de Formation
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            AfriBayit <span className="text-blue-200">Academy</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Développez vos compétences immobilières avec des formations
            professionnelles adaptées aux réalités des marchés africains.
            Apprenez à votre rythme, certifiez-vous, progressez.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#courses"
              className="bg-white text-[#003087] font-semibold px-7 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm"
            >
              Voir les formations
            </a>
            <a
              href="#enterprise"
              className="border border-white/40 text-white font-semibold px-7 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
            >
              Formations entreprise
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="container-app">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
            {stats.map((stat) => (
              <div key={stat.label} className="py-8 text-center">
                <div className="text-3xl font-extrabold text-[#003087] mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Courses */}
      <section id="courses" className="py-16 scroll-mt-20">
        <div className="container-app">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[#003087]">
                Nos formations
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Choisissez parmi nos formations certifiantes
              </p>
            </div>
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    activeCategory === cat
                      ? "bg-[#003087] text-white border-[#003087]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#003087] hover:text-[#003087]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => {
              const lvl = levelConfig[course.level];
              return (
                <div
                  key={course.title}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
                >
                  {/* Card image placeholder */}
                  <div className="h-36 bg-gradient-to-br from-[#003087]/10 to-[#0070BA]/20 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-[#003087]/30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    {/* Level + Category */}
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${lvl.bg} ${lvl.text}`}
                      >
                        {course.level}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {course.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-gray-900 mb-2 leading-snug text-[15px]">
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">
                      {course.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
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
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                        {course.modules} modules
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
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        {course.enrolled} inscrits
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="mb-4">
                      <StarRating rating={course.rating} />
                      <span className="text-[11px] text-gray-400 mt-0.5 block">
                        {course.reviews} avis
                      </span>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="font-bold text-[#003087] text-base">
                        {course.price}
                      </span>
                      <Link
                        href="/register"
                        className="bg-[#0070BA] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#005a9a] transition-colors"
                      >
                        Commencer
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">Aucune formation dans cette catégorie pour le moment.</p>
              <button
                onClick={() => setActiveCategory("Tous")}
                className="mt-4 text-[#0070BA] hover:underline text-sm"
              >
                Voir toutes les formations
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Enterprise CTA */}
      <section
        id="enterprise"
        className="bg-gray-50 border-t border-gray-100 py-16 scroll-mt-20"
      >
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-gradient-to-br from-[#003087] to-[#0070BA] rounded-2xl p-10 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Formez votre équipe
            </h2>
            <p className="text-blue-100 max-w-xl mx-auto mb-8 leading-relaxed">
              Vous êtes une agence immobilière, une banque ou un promoteur ?
              Accédez à des formations personnalisées, un tableau de bord de
              suivi des apprenants et des tarifs dégressifs pour vos équipes.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href="mailto:academy@afribayit.com"
                className="bg-white text-[#003087] font-semibold px-8 py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm"
              >
                Demander un devis
              </a>
              <Link
                href="/contact"
                className="border border-white/40 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors text-sm"
              >
                Nous contacter
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-6 max-w-sm mx-auto">
              {[
                { v: "Tarifs", sub: "dégressifs" },
                { v: "Suivi", sub: "personnalisé" },
                { v: "Certif.", sub: "AfriBayit" },
              ].map((item) => (
                <div key={item.v} className="text-center">
                  <div className="font-bold text-white text-lg">{item.v}</div>
                  <div className="text-blue-200 text-xs">{item.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
