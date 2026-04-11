"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Per CDC Section 4: 7-step onboarding ──────────

type ProfileType =
  | "BUYER"
  | "INVESTOR"
  | "TOURIST"
  | "AGENT"
  | "ARTISAN"
  | "GUESTHOUSE"
  | "TRAINER";

type Country = "BJ" | "CI" | "BF" | "TG" | "SN" | "GH" | "NG" | "OTHER";

interface OnboardingState {
  profileType: ProfileType | null;
  firstName: string;
  lastName: string;
  phone: string;
  country: Country | null;
  city: string;
  budget: string;
  interests: string[];
  notifications: { email: boolean; sms: boolean; whatsapp: boolean };
}

const PROFILE_TYPES: {
  id: ProfileType;
  icon: string;
  title: string;
  desc: string;
  color: string;
}[] = [
  { id: "BUYER", icon: "🏠", title: "Acheteur / Locataire", desc: "Je cherche à acheter ou louer un bien immobilier", color: "border-blue-300 hover:bg-blue-50" },
  { id: "INVESTOR", icon: "📈", title: "Investisseur", desc: "Je veux investir dans l'immobilier africain", color: "border-green-300 hover:bg-green-50" },
  { id: "TOURIST", icon: "✈️", title: "Voyageur / Touriste", desc: "Je cherche un hébergement temporaire ou un hôtel", color: "border-teal-300 hover:bg-teal-50" },
  { id: "AGENT", icon: "🤝", title: "Agent Immobilier", desc: "Je publie et gère des annonces immobilières", color: "border-purple-300 hover:bg-purple-50" },
  { id: "ARTISAN", icon: "🔨", title: "Artisan BTP", desc: "Je propose des services de construction et rénovation", color: "border-orange-300 hover:bg-orange-50" },
  { id: "GUESTHOUSE", icon: "🏡", title: "Propriétaire Guesthouse", desc: "Je loue des chambres ou un appartement à la nuitée", color: "border-pink-300 hover:bg-pink-50" },
  { id: "TRAINER", icon: "🎓", title: "Formateur / Expert", desc: "Je partage mon expertise via l'Academy AfriBayit", color: "border-amber-300 hover:bg-amber-50" },
];

const COUNTRIES: { code: Country; flag: string; name: string }[] = [
  { code: "BJ", flag: "🇧🇯", name: "Bénin" },
  { code: "CI", flag: "🇨🇮", name: "Côte d'Ivoire" },
  { code: "BF", flag: "🇧🇫", name: "Burkina Faso" },
  { code: "TG", flag: "🇹🇬", name: "Togo" },
  { code: "SN", flag: "🇸🇳", name: "Sénégal" },
  { code: "GH", flag: "🇬🇭", name: "Ghana" },
  { code: "NG", flag: "🇳🇬", name: "Nigeria" },
  { code: "OTHER", flag: "🌍", name: "Autre pays" },
];

const INTERESTS_BY_PROFILE: Partial<Record<ProfileType, { id: string; label: string }[]>> = {
  BUYER: [
    { id: "apartment", label: "Appartement" },
    { id: "house", label: "Maison / Villa" },
    { id: "land", label: "Terrain" },
    { id: "rental", label: "Location meublée" },
    { id: "short_term", label: "Location courte durée" },
  ],
  INVESTOR: [
    { id: "residential", label: "Résidentiel" },
    { id: "commercial", label: "Commercial / Bureau" },
    { id: "land", label: "Terrain nu" },
    { id: "short_term", label: "Location courte durée (Airbnb)" },
    { id: "hotel", label: "Hôtellerie" },
    { id: "fractional", label: "Investissement fractionné" },
  ],
  TOURIST: [
    { id: "hotel", label: "Hôtel classé" },
    { id: "guesthouse", label: "Guesthouse / B&B" },
    { id: "apartment", label: "Appartement meublé" },
    { id: "villa", label: "Villa privée" },
  ],
  AGENT: [
    { id: "sale", label: "Vente" },
    { id: "rental", label: "Location longue durée" },
    { id: "short_term", label: "Location courte durée" },
    { id: "land", label: "Terrains" },
    { id: "commercial", label: "Commercial" },
  ],
};

const BUDGETS = [
  "< 5 000 000 FCFA",
  "5 000 000 – 20 000 000 FCFA",
  "20 000 000 – 50 000 000 FCFA",
  "50 000 000 – 100 000 000 FCFA",
  "> 100 000 000 FCFA",
  "Je préfère ne pas préciser",
];

const TOTAL_STEPS = 6;

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-300",
            i < current
              ? "w-6 h-2 bg-[#003087]"
              : i === current
              ? "w-6 h-2 bg-[#0070BA]"
              : "w-2 h-2 bg-gray-200"
          )}
        />
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<OnboardingState>({
    profileType: null,
    firstName: "",
    lastName: "",
    phone: "",
    country: null,
    city: "",
    budget: "",
    interests: [],
    notifications: { email: true, sms: true, whatsapp: true },
  });

  function next() { setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)); }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  function toggleInterest(id: string) {
    setState((prev) => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter((i) => i !== id)
        : [...prev.interests, id],
    }));
  }

  async function finish() {
    try {
      await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileType: state.profileType ?? "buyer",
          country: state.country ?? undefined,
          city: state.city || undefined,
          interests: state.interests,
          budget: state.budget || undefined,
          notifEmail: state.notifications.email,
          notifSMS: state.notifications.sms,
          notifPush: state.notifications.whatsapp,
          notifNews: false,
        }),
      });
    } catch {
      // Non-blocking — redirect anyway
    }
    router.push("/dashboard");
  }

  const interests = state.profileType ? (INTERESTS_BY_PROFILE[state.profileType] ?? []) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-blue-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#0070BA] flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-[#003087] text-lg">AfriBayit</span>
        </Link>
        <div className="text-sm text-gray-400">
          Étape {step + 1} / {TOTAL_STEPS}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <StepIndicator current={step} />

          {/* ── STEP 0: Welcome ─────────────────────────── */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl bg-[#003087] flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-4xl">👋</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#003087] mb-3">
                Bienvenue sur AfriBayit !
              </h1>
              <p className="text-gray-600 max-w-md mx-auto leading-relaxed mb-8">
                En quelques étapes, personnalisons votre expérience pour vous offrir
                les annonces, formations et services les plus pertinents pour vous.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {["🔒 Compte sécurisé KYC", "🌍 4 pays couverts", "🤖 IA Rebecca disponible", "💳 Escrow intégré"].map((f) => (
                  <span key={f} className="text-sm bg-white border border-gray-200 px-4 py-2 rounded-xl text-gray-700 shadow-sm">
                    {f}
                  </span>
                ))}
              </div>
              <button
                onClick={next}
                className="bg-[#003087] text-white font-bold px-10 py-3.5 rounded-2xl text-[16px] hover:bg-[#002070] transition-colors shadow-lg"
              >
                Commencer la configuration →
              </button>
            </div>
          )}

          {/* ── STEP 1: Profile type ─────────────────────── */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-[#003087] mb-2 text-center">
                Vous êtes…
              </h2>
              <p className="text-gray-500 text-sm text-center mb-6">
                Choisissez votre profil principal. Vous pourrez le modifier plus tard.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {PROFILE_TYPES.map((pt) => (
                  <button
                    key={pt.id}
                    onClick={() => setState((s) => ({ ...s, profileType: pt.id }))}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all",
                      pt.color,
                      state.profileType === pt.id
                        ? "border-[#003087] bg-blue-50 shadow-md"
                        : "border-gray-200 bg-white"
                    )}
                  >
                    <span className="text-2xl shrink-0">{pt.icon}</span>
                    <div>
                      <p className="font-bold text-gray-900 text-[14px]">{pt.title}</p>
                      <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">{pt.desc}</p>
                    </div>
                    {state.profileType === pt.id && (
                      <svg className="w-5 h-5 text-[#003087] shrink-0 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={back} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  Retour
                </button>
                <button
                  onClick={next}
                  disabled={!state.profileType}
                  className="flex-[2] bg-[#003087] text-white font-bold py-3 rounded-2xl hover:bg-[#002070] disabled:opacity-40 transition-colors"
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Identity ─────────────────────────── */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-[#003087] mb-2 text-center">
                Votre identité
              </h2>
              <p className="text-gray-500 text-sm text-center mb-6">
                Ces informations seront affichées sur votre profil public.
              </p>
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Prénom</label>
                    <input
                      type="text"
                      value={state.firstName}
                      onChange={(e) => setState((s) => ({ ...s, firstName: e.target.value }))}
                      placeholder="Kofi"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0070BA]/30 focus:border-[#0070BA]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                    <input
                      type="text"
                      value={state.lastName}
                      onChange={(e) => setState((s) => ({ ...s, lastName: e.target.value }))}
                      placeholder="Mensah"
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0070BA]/30 focus:border-[#0070BA]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Numéro WhatsApp / téléphone
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-xl text-gray-600 text-sm">
                      +
                    </span>
                    <input
                      type="tel"
                      value={state.phone}
                      onChange={(e) => setState((s) => ({ ...s, phone: e.target.value }))}
                      placeholder="229 97 00 00 00"
                      className="flex-1 border border-gray-300 rounded-r-xl px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0070BA]/30 focus:border-[#0070BA]"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Utilisé pour les alertes WhatsApp et la confirmation OTP</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={back} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  Retour
                </button>
                <button
                  onClick={next}
                  disabled={!state.firstName || !state.lastName}
                  className="flex-[2] bg-[#003087] text-white font-bold py-3 rounded-2xl hover:bg-[#002070] disabled:opacity-40 transition-colors"
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Country & City ───────────────────── */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-[#003087] mb-2 text-center">
                Votre localisation
              </h2>
              <p className="text-gray-500 text-sm text-center mb-6">
                Pour vous afficher les annonces et services disponibles dans votre zone.
              </p>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {COUNTRIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => setState((s) => ({ ...s, country: c.code }))}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all text-sm",
                          state.country === c.code
                            ? "border-[#003087] bg-blue-50 font-semibold"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <span>{c.flag}</span>
                        <span className="text-[13px]">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville</label>
                  <input
                    type="text"
                    value={state.city}
                    onChange={(e) => setState((s) => ({ ...s, city: e.target.value }))}
                    placeholder="Ex : Cotonou, Abidjan, Lomé…"
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0070BA]/30 focus:border-[#0070BA]"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={back} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  Retour
                </button>
                <button
                  onClick={next}
                  disabled={!state.country}
                  className="flex-[2] bg-[#003087] text-white font-bold py-3 rounded-2xl hover:bg-[#002070] disabled:opacity-40 transition-colors"
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Interests & Budget ──────────────── */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-[#003087] mb-2 text-center">
                Vos centres d'intérêt
              </h2>
              <p className="text-gray-500 text-sm text-center mb-6">
                Pour personnaliser votre feed et les alertes Rebecca.
              </p>

              {interests.length > 0 && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Types de biens / services (sélectionnez tout ce qui vous intéresse)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleInterest(item.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all",
                          state.interests.includes(item.id)
                            ? "border-[#003087] bg-[#003087] text-white"
                            : "border-gray-200 text-gray-700 hover:border-[#003087]/40"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(state.profileType === "BUYER" || state.profileType === "INVESTOR") && (
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget approximatif
                  </label>
                  <div className="space-y-2">
                    {BUDGETS.map((b) => (
                      <button
                        key={b}
                        onClick={() => setState((s) => ({ ...s, budget: b }))}
                        className={cn(
                          "w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm transition-all",
                          state.budget === b
                            ? "border-[#003087] bg-blue-50 font-semibold text-[#003087]"
                            : "border-gray-200 text-gray-700 hover:border-gray-300"
                        )}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={back} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  Retour
                </button>
                <button
                  onClick={next}
                  className="flex-[2] bg-[#003087] text-white font-bold py-3 rounded-2xl hover:bg-[#002070] transition-colors"
                >
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 5: Notifications ─────────────────────── */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-bold text-[#003087] mb-2 text-center">
                Préférences de notification
              </h2>
              <p className="text-gray-500 text-sm text-center mb-8">
                Comment souhaitez-vous être informé des nouvelles annonces, messages et transactions ?
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { key: "email" as const, icon: "📧", label: "Email", desc: "Résumé quotidien des nouvelles annonces et alertes importantes" },
                  { key: "sms" as const, icon: "📱", label: "SMS", desc: "Alertes critiques (escrow, transactions) via Africa's Talking" },
                  { key: "whatsapp" as const, icon: "💬", label: "WhatsApp", desc: "Notifications en temps réel et messages de Rebecca IA" },
                ].map((notif) => (
                  <div key={notif.key} className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-2xl">
                    <span className="text-2xl shrink-0">{notif.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-[14px]">{notif.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{notif.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setState((s) => ({
                          ...s,
                          notifications: { ...s.notifications, [notif.key]: !s.notifications[notif.key] },
                        }))
                      }
                      className={cn(
                        "relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0",
                        state.notifications[notif.key] ? "bg-[#003087]" : "bg-gray-300"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200",
                          state.notifications[notif.key] ? "left-[22px]" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>

              {/* KYC prompt */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <span className="text-xl shrink-0">🪪</span>
                <div>
                  <p className="font-semibold text-amber-900 text-sm">Vérifiez votre identité (KYC)</p>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    Pour accéder aux transactions escrow, contactez des agents et publiez des annonces,
                    vous devrez vérifier votre identité (CNI + selfie IA). Vous pourrez le faire depuis votre tableau de bord.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={back} className="flex-1 border border-gray-300 text-gray-600 font-semibold py-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  Retour
                </button>
                <button
                  onClick={finish}
                  className="flex-[2] bg-[#003087] text-white font-bold py-3 rounded-2xl hover:bg-[#002070] transition-colors"
                >
                  Terminer la configuration ✓
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-[#003087] transition-all duration-500"
          style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}
