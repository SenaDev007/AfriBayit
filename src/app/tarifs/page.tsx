"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SubscribeButton from "@/components/ui/SubscribeButton";

// ─── Types ────────────────────────────────────────
type Tab = "agents" | "hotels" | "artisans";

// ─── HELM Agent plans per CDC Section 11.2.2 ──────
const AGENT_PLANS = [
  {
    id: "seed",
    plan: "HELM_SEED",
    name: "HELM SEED",
    target: "Agent indépendant débutant",
    priceXof: 15000,
    priceEur: 23,
    period: "mois",
    color: "border-gray-200",
    headerBg: "bg-gray-50",
    badge: null,
    features: [
      "10 annonces boostées / mois",
      "Statistiques basiques (vues, contacts)",
      "Badge 'Agent Certifié AfriBayit'",
      "Accès messagerie prioritaire",
      "Support email 24-48h",
    ],
    cta: "Démarrer gratuitement 30j",
    ctaStyle: "border border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white",
  },
  {
    id: "grow",
    plan: "HELM_GROW",
    name: "HELM GROW",
    target: "Agent établi · 1-3 ans d'expérience",
    priceXof: 35000,
    priceEur: 53,
    period: "mois",
    color: "border-[#0070BA]",
    headerBg: "bg-[#003087]",
    badge: "Le plus populaire",
    features: [
      "30 annonces boostées / mois",
      "CRM basique intégré",
      "Rebecca Pro (IA avancée)",
      "Analytics avancés (marché, concurrence)",
      "Accès ProMatch prioritaire",
      "Support chat réponse < 4h",
    ],
    cta: "Choisir HELM GROW",
    ctaStyle: "bg-[#003087] text-white hover:bg-[#002070]",
  },
  {
    id: "lead",
    plan: "HELM_LEAD",
    name: "HELM LEAD",
    target: "Top agent / Chef d'agence",
    priceXof: 75000,
    priceEur: 114,
    period: "mois",
    color: "border-purple-200",
    headerBg: "bg-gradient-to-br from-purple-900 to-[#003087]",
    badge: "Premium",
    features: [
      "Boosts illimités",
      "API annonces complète",
      "CRM complet + pipeline deals",
      "Co-branding sur les annonces",
      "Support dédié < 2h",
      "Rapport mensuel de performance",
      "Accès beta fonctionnalités",
    ],
    cta: "Choisir HELM LEAD",
    ctaStyle: "bg-gradient-to-r from-purple-700 to-[#003087] text-white hover:opacity-90",
  },
  {
    id: "network",
    plan: "HELM_NETWORK",
    name: "HELM NETWORK",
    target: "Agence multi-agents",
    priceXof: null,
    priceEur: null,
    period: null,
    color: "border-amber-200",
    headerBg: "bg-gradient-to-br from-amber-700 to-orange-700",
    badge: "Entreprise",
    features: [
      "Multi-utilisateurs illimités",
      "Tableau de bord agence centralisé",
      "Intégration ERP / CRM externe",
      "API full-access + webhook",
      "Account manager dédié",
      "SLA garanti 99.9%",
      "Formation équipe incluse",
    ],
    cta: "Demander un devis",
    ctaStyle: "bg-amber-600 text-white hover:bg-amber-700",
  },
];

// ─── Hotel PMS plans per CDC Section 7D / 11.2.2 ──
const HOTEL_PLANS = [
  {
    id: "starter",
    plan: "PMS_STARTER",
    name: "PMS STARTER",
    target: "Petits hôtels • jusqu'à 10 chambres",
    priceXof: 9900,
    priceEur: 15,
    badge: null,
    color: "border-gray-200",
    headerBg: "bg-gray-50",
    features: [
      "PMS complet (calendrier, réservations)",
      "1 canal OTA connecté (Booking.com)",
      "Facturation automatique PDF",
      "Check-in QR code",
      "Support WhatsApp 7j/7",
      "QR code réception offert",
    ],
    cta: "Essai gratuit 2 mois",
    ctaStyle: "border border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white",
  },
  {
    id: "pro",
    plan: "PMS_PRO",
    name: "PMS PRO",
    target: "Hôtels 10-50 chambres",
    priceXof: 24900,
    priceEur: 38,
    badge: "Recommandé",
    color: "border-teal-400",
    headerBg: "bg-gradient-to-br from-teal-700 to-[#003087]",
    features: [
      "Tout STARTER inclus",
      "3 canaux OTA (Booking + Expedia + 1 au choix)",
      "Channel Manager automatique",
      "Analytics yield management (RevPAR, ADR)",
      "Recommandations tarifaires IA",
      "Last-minute pricing automatique",
      "Support prioritaire < 4h",
    ],
    cta: "Choisir PMS PRO",
    ctaStyle: "bg-teal-700 text-white hover:bg-teal-800",
  },
  {
    id: "enterprise",
    plan: "PMS_ENTERPRISE",
    name: "PMS ENTERPRISE",
    target: "Groupes hôteliers & chaînes",
    priceXof: null,
    priceEur: null,
    badge: "Sur devis",
    color: "border-amber-200",
    headerBg: "bg-gradient-to-br from-amber-700 to-orange-700",
    features: [
      "Multi-établissements illimités",
      "Tous les canaux OTA + GDS Amadeus",
      "API & webhooks full-access",
      "Intégration ERP / comptabilité",
      "Account manager dédié",
      "SLA contractualisé 99.99%",
      "Formation équipe complète",
    ],
    cta: "Demander un devis",
    ctaStyle: "bg-amber-600 text-white hover:bg-amber-700",
  },
];

// ─── Artisan plan per CDC Section 11.2.2 ──────────
const ARTISAN_PLAN = {
  priceXof: 8900,
  priceEur: 14,
  features: [
    "Profil premium vérifié AfriBayit",
    "5 devis boostés / mois",
    "Badge 'Artisan Pro Certifié'",
    "Accès ProMatch prioritaire",
    "Assurance professionnelle partenaire",
    "Analytics missions & revenus",
    "Support dédié < 4h",
  ],
};

function PriceDisplay({ xof, eur, period }: { xof: number | null; eur: number | null; period: string | null }) {
  if (xof === null) {
    return <p className="text-2xl font-bold text-white mt-2">Sur devis</p>;
  }
  return (
    <div className="mt-2">
      <p className="text-3xl font-extrabold text-white leading-none">
        {xof.toLocaleString("fr-FR")} FCFA
      </p>
      <p className="text-white/70 text-sm mt-0.5">≈ {eur}€ / {period}</p>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

export default function TarifsPage() {
  const [tab, setTab] = useState<Tab>("agents");

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "agents", label: "Agents Immobiliers", icon: "🏡" },
    { id: "hotels", label: "Hôteliers", icon: "🏨" },
    { id: "artisans", label: "Artisans BTP", icon: "🔧" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#003087] to-[#0070BA] pt-[88px] pb-16">
        <div className="container-app text-center">
          <span className="inline-block bg-white/15 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-5 tracking-wide uppercase">
            Abonnements & Tarifs
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Développez votre activité<br />
            <span className="text-blue-200">avec AfriBayit Pro</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed mb-8">
            Des offres adaptées à chaque professionnel — agents, hôteliers, artisans.
            Premiers 3 mois à tarif réduit. Sans engagement minimum.
          </p>

          {/* Founder offer banner */}
          <div className="inline-flex items-center gap-2 bg-amber-400 text-[#003087] text-sm font-semibold px-5 py-2 rounded-full shadow-lg">
            <span>🎁</span>
            Offre Fondateurs : 0% commission pendant 3 mois pour les 500 premiers agents
          </div>
        </div>
      </section>

      {/* Tab selector */}
      <section className="bg-white border-b border-gray-100 sticky top-[72px] z-40">
        <div className="container-app">
          <div className="flex gap-1 py-3 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? "bg-[#003087] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── AGENTS TAB ─────────────────────────────────── */}
      {tab === "agents" && (
        <section id="agents" className="py-14">
          <div className="container-app">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-[#003087] mb-2">Plans HELM — Pour les Agents</h2>
              <p className="text-gray-500 text-sm">
                Choisissez le plan adapté à votre stade de carrière. Évoluez à tout moment.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {AGENT_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`border-2 ${plan.color} rounded-2xl overflow-hidden flex flex-col ${
                    plan.badge === "Le plus populaire" ? "ring-2 ring-[#0070BA] shadow-xl scale-105" : ""
                  }`}
                >
                  <div className={`${plan.headerBg} px-5 py-6`}>
                    {plan.badge && (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 inline-block ${
                        plan.badge === "Le plus populaire"
                          ? "bg-amber-400 text-[#003087]"
                          : "bg-white/20 text-white"
                      }`}>
                        {plan.badge}
                      </span>
                    )}
                    <h3 className={`text-lg font-bold mb-1 ${plan.headerBg === "bg-gray-50" ? "text-gray-800" : "text-white"}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs mb-3 leading-snug ${plan.headerBg === "bg-gray-50" ? "text-gray-500" : "text-white/70"}`}>
                      {plan.target}
                    </p>
                    {plan.priceXof ? (
                      <div>
                        <p className={`text-2xl font-extrabold leading-none ${plan.headerBg === "bg-gray-50" ? "text-[#003087]" : "text-white"}`}>
                          {plan.priceXof.toLocaleString("fr-FR")} FCFA
                        </p>
                        <p className={`text-xs mt-0.5 ${plan.headerBg === "bg-gray-50" ? "text-gray-400" : "text-white/60"}`}>
                          ≈ {plan.priceEur}€ / {plan.period}
                        </p>
                      </div>
                    ) : (
                      <p className={`text-2xl font-bold ${plan.headerBg === "bg-gray-50" ? "text-[#003087]" : "text-white"}`}>
                        Sur devis
                      </p>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[13px] text-gray-700">
                          <CheckIcon />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <SubscribeButton
                      plan={plan.plan}
                      label={plan.cta}
                      className={`block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${plan.ctaStyle}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Commission table */}
            <div className="mt-14">
              <h3 className="text-lg font-bold text-[#003087] mb-4 text-center">
                Grille de Commissions — Agents Certifiés AfriBayit
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Type de transaction</th>
                      <th className="text-center px-4 py-3 font-semibold">Commission vendeur</th>
                      <th className="text-center px-4 py-3 font-semibold">Commission acheteur</th>
                      <th className="text-left px-4 py-3 font-semibold">Déclenchement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                      { type: "Vente immobilière (< 50M FCFA)", vendeur: "3% du prix", acheteur: "Aucune", trigger: "Libération escrow automatique" },
                      { type: "Vente immobilière (> 50M FCFA)", vendeur: "2% du prix", acheteur: "Aucune", trigger: "Libération escrow automatique" },
                      { type: "Location longue durée", vendeur: "1 mois de loyer", acheteur: "0,5 mois (optionnel)", trigger: "Signature du bail numérique" },
                      { type: "Location courte durée (hôte)", vendeur: "3% de la réservation", acheteur: "10-12% frais service", trigger: "Post check-in confirmé" },
                      { type: "Mission artisan", vendeur: "8-12% de la mission", acheteur: "Aucune", trigger: "Libération escrow mission" },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{row.type}</td>
                        <td className="px-4 py-3 text-center text-[#003087] font-semibold">{row.vendeur}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{row.acheteur}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{row.trigger}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Toutes les commissions sont prélevées automatiquement via le système Escrow AfriBayit — aucune transaction hors plateforme.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── HOTELS TAB ─────────────────────────────────── */}
      {tab === "hotels" && (
        <section id="hotel" className="py-14">
          <div className="container-app">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-[#003087] mb-2">Plans PMS Hôtelier</h2>
              <p className="text-gray-500 text-sm max-w-lg mx-auto">
                Digitalisez votre hôtel en 48h. Distribution automatique sur Booking.com & Expedia. Paiement Mobile Money intégré.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {HOTEL_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`border-2 ${plan.color} rounded-2xl overflow-hidden flex flex-col ${
                    plan.badge === "Recommandé" ? "ring-2 ring-teal-500 shadow-xl" : ""
                  }`}
                >
                  <div className={`${plan.headerBg} px-5 py-6`}>
                    {plan.badge && (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 inline-block ${
                        plan.badge === "Recommandé"
                          ? "bg-amber-400 text-[#003087]"
                          : "bg-white/20 text-white"
                      }`}>
                        {plan.badge}
                      </span>
                    )}
                    <h3 className={`text-lg font-bold mb-1 ${plan.headerBg === "bg-gray-50" ? "text-gray-800" : "text-white"}`}>
                      {plan.name}
                    </h3>
                    <p className={`text-xs mb-3 leading-snug ${plan.headerBg === "bg-gray-50" ? "text-gray-500" : "text-white/70"}`}>
                      {plan.target}
                    </p>
                    <PriceDisplay xof={plan.priceXof} eur={plan.priceEur} period="mois" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[13px] text-gray-700">
                          <CheckIcon />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <SubscribeButton
                      plan={plan.plan}
                      label={plan.cta}
                      className={`block w-full text-center py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${plan.ctaStyle}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── ARTISANS TAB ───────────────────────────────── */}
      {tab === "artisans" && (
        <section className="py-14">
          <div className="container-app max-w-2xl">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-[#003087] mb-2">Plan Artisan Pro</h2>
              <p className="text-gray-500 text-sm">
                Un plan unique pour accélérer votre activité BTP. Missions garanties via escrow.
              </p>
            </div>

            <div className="bg-white border-2 border-[#003087] rounded-2xl overflow-hidden shadow-lg">
              <div className="bg-gradient-to-br from-[#003087] to-[#0070BA] px-8 py-8 text-center">
                <span className="bg-amber-400 text-[#003087] text-[11px] font-bold px-3 py-1 rounded-full mb-4 inline-block">
                  Plan unique · Tous corps de métier
                </span>
                <h3 className="text-2xl font-bold text-white mb-1">Artisan Pro</h3>
                <p className="text-3xl font-extrabold text-white mt-3">
                  {ARTISAN_PLAN.priceXof.toLocaleString("fr-FR")} FCFA
                </p>
                <p className="text-white/70 text-sm">≈ {ARTISAN_PLAN.priceEur}€ / mois</p>
              </div>
              <div className="p-8">
                <ul className="space-y-3 mb-8">
                  {ARTISAN_PLAN.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[14px] text-gray-700">
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm text-[#003087]">
                  <strong>Avantage ProMatch IA :</strong> Votre profil Pro est prioritaire dans notre algorithme de matching — recevez 3x plus de demandes de devis qu'un profil standard.
                </div>
                <Link
                  href="/register"
                  className="block w-full text-center py-3 bg-[#003087] text-white rounded-xl font-semibold hover:bg-[#002070] transition-colors"
                >
                  Devenir Artisan Pro — Essai 30j gratuit
                </Link>
                <p className="text-center text-xs text-gray-400 mt-3">
                  Sans engagement · Résiliable à tout moment
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trust signals */}
      <section className="bg-gray-50 border-t border-gray-100 py-12">
        <div className="container-app">
          <div className="grid sm:grid-cols-4 gap-6 text-center">
            {[
              { icon: "🔒", title: "Escrow sécurisé", desc: "100% des transactions via système escrow AfriBayit. Aucun paiement direct entre parties." },
              { icon: "✅", title: "KYC vérifié", desc: "Tous les professionnels sont vérifiés : identité, diplômes et agréments selon le pays." },
              { icon: "📊", title: "Analytics en temps réel", desc: "Tableau de bord complet avec métriques de performance et recommandations IA." },
              { icon: "🌍", title: "4 pays couverts", desc: "Bénin, Côte d'Ivoire, Burkina Faso, Togo. Expansion continue vers 12 pays en 2026." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h4 className="font-bold text-gray-900 mb-2 text-[14px]">{item.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14">
        <div className="container-app text-center max-w-xl">
          <h2 className="text-2xl font-bold text-[#003087] mb-3">Prêt à rejoindre AfriBayit Pro ?</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            Inscrivez-vous en moins de 5 minutes. Nos équipes terrain vous accompagnent pour
            l'onboarding et la certification dans votre pays.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="bg-[#003087] text-white font-semibold px-8 py-3 rounded-xl hover:bg-[#002070] transition-colors"
            >
              Créer mon compte Pro
            </Link>
            <Link
              href="/contact"
              className="border border-gray-300 text-gray-700 font-semibold px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Parler à un conseiller
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
