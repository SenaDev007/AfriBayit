"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { COUNTRY_LABELS } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  // Step 1
  type: string;
  listingType: string;
  country: string;
  city: string;
  district: string;
  // Step 2
  title: string;
  description: string;
  price: string;
  currency: string;
  surface: string;
  bedrooms: string;
  bathrooms: string;
  yearBuilt: string;
  hasPool: boolean;
  hasGarage: boolean;
  hasGarden: boolean;
  hasSecurity: boolean;
  hasGenerator: boolean;
  hasWifi: boolean;
  hasAC: boolean;
  hasBalcony: boolean;
  // Step 3
  isPremium: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Appartement", icon: "🏢" },
  { value: "HOUSE", label: "Maison", icon: "🏠" },
  { value: "VILLA", label: "Villa", icon: "🏡" },
  { value: "STUDIO", label: "Studio", icon: "🛏️" },
  { value: "OFFICE", label: "Bureau", icon: "🏛️" },
  { value: "LAND", label: "Terrain", icon: "🌍" },
  { value: "COMMERCIAL", label: "Commercial", icon: "🏪" },
  { value: "WAREHOUSE", label: "Entrepôt", icon: "🏭" },
];

const LISTING_TYPES = [
  { value: "SALE", label: "À Vendre", icon: "💰" },
  { value: "LONG_TERM_RENTAL", label: "Location Longue Durée", icon: "📅" },
  { value: "SHORT_TERM_RENTAL", label: "Location Courte Durée", icon: "⚡" },
];

const CURRENCIES = [
  { value: "XOF", label: "XOF (FCFA)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
];

const FEATURES: { key: keyof FormState; label: string; icon: string }[] = [
  { key: "hasPool", label: "Piscine", icon: "🏊" },
  { key: "hasGarage", label: "Garage", icon: "🚗" },
  { key: "hasGarden", label: "Jardin", icon: "🌿" },
  { key: "hasSecurity", label: "Sécurité 24h/7j", icon: "🔒" },
  { key: "hasGenerator", label: "Groupe électrogène", icon: "⚡" },
  { key: "hasWifi", label: "Wi-Fi", icon: "📶" },
  { key: "hasAC", label: "Climatisation", icon: "❄️" },
  { key: "hasBalcony", label: "Balcon / Terrasse", icon: "🏖️" },
];

const INITIAL_FORM: FormState = {
  type: "",
  listingType: "",
  country: "",
  city: "",
  district: "",
  title: "",
  description: "",
  price: "",
  currency: "XOF",
  surface: "",
  bedrooms: "",
  bathrooms: "",
  yearBuilt: "",
  hasPool: false,
  hasGarage: false,
  hasGarden: false,
  hasSecurity: false,
  hasGenerator: false,
  hasWifi: false,
  hasAC: false,
  hasBalcony: false,
  isPremium: false,
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function NewPropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "general", string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next; });
  }

  function validateStep1(): boolean {
    const errs: typeof errors = {};
    if (!form.type) errs.type = "Choisissez un type de bien.";
    if (!form.listingType) errs.listingType = "Choisissez un type d'annonce.";
    if (!form.country) errs.country = "Sélectionnez un pays.";
    if (!form.city.trim()) errs.city = "Entrez une ville.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: typeof errors = {};
    if (!form.title.trim()) errs.title = "Le titre est requis.";
    if (!form.description.trim()) errs.description = "La description est requise.";
    if (form.description.trim().length < 50) errs.description = "La description doit faire au moins 50 caractères.";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      errs.price = "Entrez un prix valide.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!validateStep2()) { setStep(2); return; }
    setSubmitting(true);
    setErrors({});
    try {
      const body = {
        type: form.type,
        listingType: form.listingType,
        country: form.country,
        city: form.city.trim(),
        district: form.district.trim() || undefined,
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        currency: form.currency,
        surface: form.surface ? Number(form.surface) : undefined,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        yearBuilt: form.yearBuilt ? Number(form.yearBuilt) : undefined,
        hasPool: form.hasPool,
        hasGarage: form.hasGarage,
        hasGarden: form.hasGarden,
        hasSecurity: form.hasSecurity,
        hasGenerator: form.hasGenerator,
        hasWifi: form.hasWifi,
        hasAC: form.hasAC,
        hasBalcony: form.hasBalcony,
        isPremium: form.isPremium,
      };

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Erreur lors de la publication.");
      }

      router.push("/dashboard/properties");
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : "Une erreur s'est produite." });
      setSubmitting(false);
    }
  }

  // ─── Step labels ─────────────────────────────────────────────────────────

  const STEPS = [
    { number: 1, label: "Type & Localisation" },
    { number: 2, label: "Détails & Prix" },
    { number: 3, label: "Photos & Publication" },
  ];

  const listingTypeLabel = LISTING_TYPES.find((l) => l.value === form.listingType)?.label ?? "";
  const typeLabel = PROPERTY_TYPES.find((t) => t.value === form.type)?.label ?? "";
  const countryLabel = COUNTRY_LABELS[form.country] ?? form.country;
  const activeFeatures = FEATURES.filter((f) => form[f.key] === true);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <Navbar />

      <main className="pt-[72px] min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-6 lg:px-20 py-8 sm:py-12">

          {/* Header */}
          <div className="mb-6">
            <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0070BA] transition-colors mb-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour aux annonces
            </Link>
            <h1 className="text-2xl font-bold text-[#003087]">Publier une annonce</h1>
            <p className="text-sm text-gray-500 mt-0.5">Remplissez les informations en 3 étapes</p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.number} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step > s.number
                        ? "bg-[#00A651] text-white"
                        : step === s.number
                        ? "bg-[#0070BA] text-white shadow-md shadow-blue-200"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {step > s.number ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      s.number
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      step === s.number ? "text-[#0070BA]" : step > s.number ? "text-[#00A651]" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 ${step > s.number ? "bg-[#00A651]" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Global error */}
            {errors.general && (
              <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-[#D93025] text-sm rounded-xl px-4 py-3 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.general}
              </div>
            )}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#003087] mb-1">Type de bien</h2>
                  <p className="text-sm text-gray-500">Quel type de bien souhaitez-vous publier ?</p>
                </div>

                {/* Property type */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2.5">
                    Type de bien <span className="text-[#D93025]">*</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PROPERTY_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => set("type", t.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          form.type === t.value
                            ? "border-[#0070BA] bg-blue-50 text-[#0070BA]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-2xl">{t.icon}</span>
                        <span className="text-xs leading-tight text-center">{t.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.type && (
                    <p className="text-xs text-[#D93025] mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.type}
                    </p>
                  )}
                </div>

                {/* Listing type */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2.5">
                    Type d&apos;annonce <span className="text-[#D93025]">*</span>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {LISTING_TYPES.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => set("listingType", l.value)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          form.listingType === l.value
                            ? "border-[#0070BA] bg-blue-50 text-[#0070BA]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-lg">{l.icon}</span>
                        {l.label}
                      </button>
                    ))}
                  </div>
                  {errors.listingType && (
                    <p className="text-xs text-[#D93025] mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.listingType}
                    </p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Localisation</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                        Pays <span className="text-[#D93025]">*</span>
                      </label>
                      <select
                        id="country"
                        value={form.country}
                        onChange={(e) => set("country", e.target.value)}
                        className={`input-afri ${errors.country ? "border-[#D93025]" : ""}`}
                      >
                        <option value="">Sélectionnez un pays</option>
                        {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
                          <option key={code} value={code}>{label}</option>
                        ))}
                      </select>
                      {errors.country && (
                        <p className="text-xs text-[#D93025] flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {errors.country}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Ville"
                        id="city"
                        value={form.city}
                        onChange={(e) => set("city", e.target.value)}
                        placeholder="Ex : Cotonou"
                        required
                        error={errors.city}
                      />
                      <Input
                        label="Quartier / District"
                        id="district"
                        value={form.district}
                        onChange={(e) => set("district", e.target.value)}
                        placeholder="Ex : Haie Vive"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#003087] mb-1">Détails & Prix</h2>
                  <p className="text-sm text-gray-500">Décrivez votre bien avec précision.</p>
                </div>

                <Input
                  label="Titre de l'annonce"
                  id="title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ex : Villa moderne 4 chambres avec piscine à Cocody"
                  required
                  error={errors.title}
                />

                <div className="space-y-1.5">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description <span className="text-[#D93025]">*</span>
                  </label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={5}
                    placeholder="Décrivez votre bien : état général, environnement, atouts, commodités à proximité..."
                    className={`input-afri resize-none ${errors.description ? "border-[#D93025]" : ""}`}
                  />
                  <div className="flex items-center justify-between">
                    {errors.description ? (
                      <p className="text-xs text-[#D93025] flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.description}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">Minimum 50 caractères pour une annonce complète</p>
                    )}
                    <span className={`text-xs ${form.description.length < 50 ? "text-gray-400" : "text-[#00A651]"}`}>
                      {form.description.length} car.
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Prix <span className="text-[#D93025]">*</span>
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.price}
                        onChange={(e) => set("price", e.target.value)}
                        placeholder="Ex : 85000000"
                        className={`input-afri ${errors.price ? "border-[#D93025]" : ""}`}
                      />
                    </div>
                    <select
                      value={form.currency}
                      onChange={(e) => set("currency", e.target.value)}
                      className="input-afri w-auto min-w-[110px]"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  {errors.price && (
                    <p className="text-xs text-[#D93025] mt-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.price}
                    </p>
                  )}
                </div>

                {/* Surface & rooms */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Input
                    label="Surface (m²)"
                    id="surface"
                    type="number"
                    min="0"
                    value={form.surface}
                    onChange={(e) => set("surface", e.target.value)}
                    placeholder="120"
                  />
                  <Input
                    label="Chambres"
                    id="bedrooms"
                    type="number"
                    min="0"
                    value={form.bedrooms}
                    onChange={(e) => set("bedrooms", e.target.value)}
                    placeholder="3"
                  />
                  <Input
                    label="Salles de bain"
                    id="bathrooms"
                    type="number"
                    min="0"
                    value={form.bathrooms}
                    onChange={(e) => set("bathrooms", e.target.value)}
                    placeholder="2"
                  />
                  <Input
                    label="Année de construction"
                    id="yearBuilt"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={form.yearBuilt}
                    onChange={(e) => set("yearBuilt", e.target.value)}
                    placeholder="2020"
                  />
                </div>

                {/* Features checkboxes */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Équipements & Caractéristiques</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FEATURES.map((f) => {
                      const checked = form[f.key] as boolean;
                      return (
                        <label
                          key={f.key}
                          className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                            checked
                              ? "border-[#0070BA] bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => set(f.key as keyof FormState, e.target.checked as FormState[typeof f.key])}
                            className="sr-only"
                          />
                          <span className="text-lg leading-none">{f.icon}</span>
                          <span className={`text-xs font-medium leading-tight ${checked ? "text-[#0070BA]" : "text-gray-600"}`}>
                            {f.label}
                          </span>
                          {checked && (
                            <svg className="w-3.5 h-3.5 text-[#0070BA] ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#003087] mb-1">Photos & Publication</h2>
                  <p className="text-sm text-gray-500">Ajoutez des photos et publiez votre annonce.</p>
                </div>

                {/* Photo upload area */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2.5">Photos du bien</p>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[#0070BA] hover:bg-blue-50/30 transition-colors cursor-pointer group">
                    <label htmlFor="photo-upload" className="cursor-pointer">
                      <div className="w-14 h-14 rounded-2xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center mx-auto mb-3 transition-colors">
                        <svg className="w-7 h-7 text-[#0070BA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-[#0070BA] mb-1">Cliquez pour ajouter des photos</p>
                      <p className="text-xs text-gray-400">PNG, JPG jusqu&apos;à 10 MB · Max 15 photos</p>
                      <p className="text-xs text-gray-400 mt-1">La première photo sera la photo principale</p>
                      <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>

                {/* Premium option */}
                <div>
                  <label
                    className={`flex gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      form.isPremium
                        ? "border-[#FFB900] bg-amber-50"
                        : "border-gray-200 hover:border-amber-200 hover:bg-amber-50/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.isPremium}
                      onChange={(e) => set("isPremium", e.target.checked)}
                      className="sr-only"
                    />
                    <div className="flex-shrink-0 mt-0.5">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        form.isPremium ? "bg-[#FFB900] border-[#FFB900]" : "border-gray-300"
                      }`}>
                        {form.isPremium && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <span className="badge-premium">⭐ PREMIUM</span>
                        Mettre en avant l&apos;annonce
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Votre annonce apparaît en tête des résultats et reçoit jusqu&apos;à 5× plus de vues.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#0070BA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Récapitulatif
                  </h3>
                  <dl className="space-y-2">
                    {[
                      { label: "Type de bien", value: typeLabel || "—" },
                      { label: "Type d'annonce", value: listingTypeLabel || "—" },
                      { label: "Localisation", value: [form.district, form.city, countryLabel].filter(Boolean).join(", ") || "—" },
                      { label: "Titre", value: form.title || "—" },
                      {
                        label: "Prix",
                        value: form.price
                          ? `${Number(form.price).toLocaleString("fr-FR")} ${form.currency}`
                          : "—",
                      },
                      {
                        label: "Détails",
                        value: [
                          form.surface ? `${form.surface} m²` : null,
                          form.bedrooms ? `${form.bedrooms} ch.` : null,
                          form.bathrooms ? `${form.bathrooms} sdb.` : null,
                        ].filter(Boolean).join(" · ") || "—",
                      },
                      {
                        label: "Équipements",
                        value: activeFeatures.length > 0
                          ? activeFeatures.map((f) => f.label).join(", ")
                          : "Aucun",
                      },
                      { label: "Annonce Premium", value: form.isPremium ? "Oui ⭐" : "Non" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex gap-3 text-sm">
                        <dt className="w-36 flex-shrink-0 text-gray-500">{label}</dt>
                        <dd className="font-medium text-gray-800 flex-1 min-w-0 truncate">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className={`px-6 py-5 border-t border-gray-100 flex ${step > 1 ? "justify-between" : "justify-end"}`}>
              {step > 1 && (
                <Button variant="ghost" size="md" onClick={handleBack} disabled={submitting}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Précédent
                </Button>
              )}

              {step < 3 ? (
                <Button variant="primary" size="md" onClick={handleNext}>
                  Continuer
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              ) : (
                <Button
                  variant="gold"
                  size="md"
                  loading={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? "Publication en cours…" : "Publier l'annonce"}
                  {!submitting && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Step indicator text for mobile */}
          <p className="text-center text-xs text-gray-400 mt-4 sm:hidden">
            Étape {step} sur {STEPS.length} — {STEPS[step - 1].label}
          </p>
        </div>
      </main>
    </>
  );
}
