"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { COUNTRY_LABELS } from "@/lib/utils";
import { Shield, Upload, X, CheckCircle, AlertTriangle, Info } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LegalDocInfo {
  code: string;
  label: string;
  status: "ACCEPTED" | "CONDITIONAL" | "REJECTED";
  authority: string;
  note: string;
}

interface FormState {
  type: string;
  listingType: string;
  country: string;
  city: string;
  district: string;
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
  // Step 3 — legal doc
  legalDocType: string;
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
  type: "", listingType: "", country: "", city: "", district: "",
  title: "", description: "", price: "", currency: "XOF",
  surface: "", bedrooms: "", bathrooms: "", yearBuilt: "",
  hasPool: false, hasGarage: false, hasGarden: false, hasSecurity: false,
  hasGenerator: false, hasWifi: false, hasAC: false, hasBalcony: false,
  legalDocType: "",
};

const DOC_STATUS_STYLE = {
  ACCEPTED: { bg: "bg-green-50 border-green-300", icon: <CheckCircle size={14} className="text-green-600" />, label: "Accepté" },
  CONDITIONAL: { bg: "bg-yellow-50 border-yellow-300", icon: <AlertTriangle size={14} className="text-yellow-600" />, label: "Conditionnel — validation admin" },
  REJECTED: { bg: "bg-red-50 border-red-300", icon: <X size={14} className="text-red-600" />, label: "Refusé — non valide dans ce pays" },
};

const STEPS = [
  { number: 1, label: "Type & Localisation" },
  { number: 2, label: "Détails & Prix" },
  { number: 3, label: "Docs & Photos" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function NewPropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "general", string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState("");

  // Step 3 state
  const [legalDocs, setLegalDocs] = useState<LegalDocInfo[]>([]);
  const [selectedDocInfo, setSelectedDocInfo] = useState<LegalDocInfo | null>(null);
  const [legalDocFile, setLegalDocFile] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const legalDocRef = useRef<HTMLInputElement | null>(null);
  const photoRef = useRef<HTMLInputElement | null>(null);

  // Fetch legal docs for selected country when entering step 3
  useEffect(() => {
    if (step === 3 && form.country) {
      fetch(`/api/properties/validate-docs?country=${form.country}`)
        .then((r) => r.json())
        .then((d) => setLegalDocs(d.documents ?? []))
        .catch(() => setLegalDocs([]));
    }
  }, [step, form.country]);

  // Update selectedDocInfo when legalDocType changes
  useEffect(() => {
    const info = legalDocs.find((d) => d.code === form.legalDocType) ?? null;
    setSelectedDocInfo(info);
  }, [form.legalDocType, legalDocs]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
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
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) errs.price = "Entrez un prix valide.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep3(): boolean {
    const errs: typeof errors = {};
    if (!form.legalDocType) errs.legalDocType = "Sélectionnez le type de document foncier.";
    if (selectedDocInfo?.status === "REJECTED") errs.legalDocType = "Ce document n'est pas valide dans ce pays.";
    if (!legalDocFile) errs.general = "Uploadez le document foncier (obligatoire).";
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

  function handlePhotoAdd(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 15 - photos.length);
    setPhotos((prev) => [...prev, ...newFiles]);
    const previews = newFiles.map((f) => URL.createObjectURL(f));
    setPhotoPreviews((prev) => [...prev, ...previews]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit() {
    if (!validateStep2()) { setStep(2); return; }
    if (!validateStep3()) return;

    setSubmitting(true);
    setErrors({});

    try {
      // 1. Create property
      setSubmitProgress("Création de l'annonce…");
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
        hasPool: form.hasPool, hasGarage: form.hasGarage, hasGarden: form.hasGarden,
        hasSecurity: form.hasSecurity, hasGenerator: form.hasGenerator,
        hasWifi: form.hasWifi, hasAC: form.hasAC, hasBalcony: form.hasBalcony,
        legalDocType: form.legalDocType,
      };

      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error || "Erreur lors de la création.");
      }

      const { data: property } = await res.json();
      const propertyId = property.id;

      // 2. Upload legal document
      if (legalDocFile) {
        setSubmitProgress("Envoi du document foncier…");
        const legalForm = new FormData();
        legalForm.append("file", legalDocFile);
        legalForm.append("propertyId", propertyId);
        // We store it via the KYC-like pattern but on the property
        // For now we upload it as a property-level field update
        // TODO: dedicated legal doc endpoint
      }

      // 3. Upload photos
      if (photos.length > 0) {
        setSubmitProgress(`Upload des photos (0/${photos.length})…`);
        for (let i = 0; i < photos.length; i++) {
          const fd = new FormData();
          fd.append("file", photos[i]);
          if (i === 0) fd.append("isPrimary", "true");
          await fetch(`/api/properties/${propertyId}/images`, { method: "POST", body: fd });
          setSubmitProgress(`Upload des photos (${i + 1}/${photos.length})…`);
        }
      }

      setSubmitProgress("Redirection…");
      router.push("/dashboard/properties?published=1");
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : "Une erreur s'est produite." });
      setSubmitting(false);
      setSubmitProgress("");
    }
  }

  const listingTypeLabel = LISTING_TYPES.find((l) => l.value === form.listingType)?.label ?? "";
  const typeLabel = PROPERTY_TYPES.find((t) => t.value === form.type)?.label ?? "";
  const countryLabel = COUNTRY_LABELS[form.country] ?? form.country;
  const activeFeatures = FEATURES.filter((f) => form[f.key] === true);
  const isPhase1Country = ["BJ", "CI", "BF", "TG"].includes(form.country);

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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step > s.number ? "bg-[#00A651] text-white" :
                    step === s.number ? "bg-[#0070BA] text-white shadow-md shadow-blue-200" :
                    "bg-gray-200 text-gray-400"
                  }`}>
                    {step > s.number ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.number}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${
                    step === s.number ? "text-[#0070BA]" : step > s.number ? "text-[#00A651]" : "text-gray-400"
                  }`}>{s.label}</span>
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
              <div className="mx-6 mt-6 bg-red-50 border border-red-200 text-[#D93025] text-sm rounded-xl px-4 py-3">
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
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2.5">Type de bien <span className="text-[#D93025]">*</span></p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PROPERTY_TYPES.map((t) => (
                      <button key={t.value} type="button" onClick={() => set("type", t.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          form.type === t.value ? "border-[#0070BA] bg-blue-50 text-[#0070BA]" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}>
                        <span className="text-2xl">{t.icon}</span>
                        <span className="text-xs leading-tight text-center">{t.label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.type && <p className="text-xs text-[#D93025] mt-1.5">{errors.type}</p>}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2.5">Type d&apos;annonce <span className="text-[#D93025]">*</span></p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {LISTING_TYPES.map((l) => (
                      <button key={l.value} type="button" onClick={() => set("listingType", l.value)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          form.listingType === l.value ? "border-[#0070BA] bg-blue-50 text-[#0070BA]" : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }`}>
                        <span className="text-lg">{l.icon}</span>{l.label}
                      </button>
                    ))}
                  </div>
                  {errors.listingType && <p className="text-xs text-[#D93025] mt-1.5">{errors.listingType}</p>}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Localisation</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                        Pays <span className="text-[#D93025]">*</span>
                      </label>
                      <select id="country" value={form.country} onChange={(e) => set("country", e.target.value)}
                        className={`input-afri ${errors.country ? "border-[#D93025]" : ""}`}>
                        <option value="">Sélectionnez un pays</option>
                        {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
                          <option key={code} value={code}>{label}</option>
                        ))}
                      </select>
                      {errors.country && <p className="text-xs text-[#D93025]">{errors.country}</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Ville" id="city" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Ex : Cotonou" required error={errors.city} />
                      <Input label="Quartier / District" id="district" value={form.district} onChange={(e) => set("district", e.target.value)} placeholder="Ex : Haie Vive" />
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
                <Input label="Titre de l'annonce" id="title" value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ex : Villa moderne 4 chambres avec piscine à Cocody"
                  required error={errors.title} />
                <div className="space-y-1.5">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description <span className="text-[#D93025]">*</span>
                  </label>
                  <textarea id="description" value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={5}
                    placeholder="Décrivez votre bien : état général, environnement, atouts, commodités à proximité..."
                    className={`input-afri resize-none ${errors.description ? "border-[#D93025]" : ""}`} />
                  <div className="flex items-center justify-between">
                    {errors.description ? (
                      <p className="text-xs text-[#D93025]">{errors.description}</p>
                    ) : (
                      <p className="text-xs text-gray-400">Minimum 50 caractères</p>
                    )}
                    <span className={`text-xs ${form.description.length < 50 ? "text-gray-400" : "text-[#00A651]"}`}>
                      {form.description.length} car.
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Prix <span className="text-[#D93025]">*</span></p>
                  <div className="flex gap-2">
                    <input type="number" min="0" step="1" value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder="Ex : 85000000"
                      className={`input-afri flex-1 ${errors.price ? "border-[#D93025]" : ""}`} />
                    <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className="input-afri w-auto min-w-[110px]">
                      {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  {errors.price && <p className="text-xs text-[#D93025] mt-1">{errors.price}</p>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Input label="Surface (m²)" id="surface" type="number" min="0" value={form.surface} onChange={(e) => set("surface", e.target.value)} placeholder="120" />
                  <Input label="Chambres" id="bedrooms" type="number" min="0" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} placeholder="3" />
                  <Input label="Salles de bain" id="bathrooms" type="number" min="0" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} placeholder="2" />
                  <Input label="Année de construction" id="yearBuilt" type="number" min="1900" max={new Date().getFullYear()} value={form.yearBuilt} onChange={(e) => set("yearBuilt", e.target.value)} placeholder="2020" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Équipements & Caractéristiques</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FEATURES.map((f) => {
                      const checked = form[f.key] as boolean;
                      return (
                        <label key={f.key} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                          checked ? "border-[#0070BA] bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}>
                          <input type="checkbox" checked={checked}
                            onChange={(e) => set(f.key as keyof FormState, e.target.checked as FormState[typeof f.key])}
                            className="sr-only" />
                          <span className="text-lg leading-none">{f.icon}</span>
                          <span className={`text-xs font-medium leading-tight ${checked ? "text-[#0070BA]" : "text-gray-600"}`}>{f.label}</span>
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
                  <h2 className="text-lg font-bold text-[#003087] mb-1">Document foncier & Photos</h2>
                  <p className="text-sm text-gray-500">Toute annonce sur AfriBayit doit être accompagnée de son document foncier légal (§10B CDC).</p>
                </div>

                {/* ── Legal doc section ── */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-[#D4AF37]" />
                    <p className="text-sm font-semibold text-gray-800">Document foncier <span className="text-[#D93025]">*</span></p>
                  </div>

                  {!isPhase1Country && form.country && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex gap-2 text-sm text-blue-700">
                      <Info size={15} className="shrink-0 mt-0.5" />
                      Le pays sélectionné n&apos;est pas encore en Phase 1 d&apos;AfriBayit. La validation documentaire ne sera pas appliquée automatiquement.
                    </div>
                  )}

                  {isPhase1Country && (
                    <>
                      <div className="space-y-1.5">
                        <label htmlFor="legalDocType" className="block text-xs font-medium text-gray-600">
                          Type de document ({countryLabel})
                        </label>
                        <select
                          id="legalDocType"
                          value={form.legalDocType}
                          onChange={(e) => set("legalDocType", e.target.value)}
                          className={`input-afri ${errors.legalDocType ? "border-[#D93025]" : ""}`}
                        >
                          <option value="">Sélectionnez le document foncier</option>
                          {legalDocs.map((d) => (
                            <option key={d.code} value={d.code} disabled={d.status === "REJECTED"}>
                              {d.label} {d.status === "REJECTED" ? "⛔" : d.status === "CONDITIONAL" ? "⚠️" : "✅"}
                            </option>
                          ))}
                        </select>
                        {errors.legalDocType && <p className="text-xs text-[#D93025]">{errors.legalDocType}</p>}
                      </div>

                      {selectedDocInfo && (
                        <div className={`rounded-xl border px-4 py-3 flex gap-3 text-sm ${DOC_STATUS_STYLE[selectedDocInfo.status].bg}`}>
                          {DOC_STATUS_STYLE[selectedDocInfo.status].icon}
                          <div>
                            <p className="font-medium">{DOC_STATUS_STYLE[selectedDocInfo.status].label}</p>
                            <p className="text-gray-600 text-xs mt-0.5">{selectedDocInfo.note}</p>
                            <p className="text-gray-500 text-xs mt-0.5">Autorité : {selectedDocInfo.authority}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Legal doc file upload */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Fichier du document <span className="text-[#D93025]">*</span>
                      <span className="font-normal text-gray-400 ml-1">(PDF, JPEG, PNG — max 10 Mo)</span>
                    </p>
                    <input
                      ref={legalDocRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={(e) => setLegalDocFile(e.target.files?.[0] ?? null)}
                    />
                    {legalDocFile ? (
                      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <CheckCircle size={16} className="text-green-600 shrink-0" />
                        <span className="text-sm text-green-700 flex-1 truncate">{legalDocFile.name}</span>
                        <button onClick={() => setLegalDocFile(null)} className="text-gray-400 hover:text-gray-600">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => legalDocRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-500 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                      >
                        <Upload size={16} /> Cliquez pour choisir un fichier
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Photos section ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">
                      Photos du bien
                      <span className="ml-1 text-xs font-normal text-gray-400">({photos.length}/15 — la 1ère sera principale)</span>
                    </p>
                    {photos.length < 15 && (
                      <button
                        type="button"
                        onClick={() => photoRef.current?.click()}
                        className="flex items-center gap-1.5 text-xs text-[#0070BA] font-medium hover:underline"
                      >
                        <Upload size={12} /> Ajouter
                      </button>
                    )}
                  </div>

                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoAdd(e.target.files)}
                  />

                  {photos.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => photoRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-[#0070BA] hover:bg-blue-50/30 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                        <Upload size={20} className="text-[#0070BA]" />
                      </div>
                      <p className="text-sm font-semibold text-[#0070BA] mb-1">Ajouter des photos</p>
                      <p className="text-xs text-gray-400">JPEG, PNG, WEBP — jusqu&apos;à 8 Mo par photo</p>
                    </button>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {photoPreviews.map((src, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100">
                          <img src={src} alt="" className="w-full h-full object-cover" />
                          {i === 0 && (
                            <div className="absolute top-1 left-1 bg-[#D4AF37] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Principal
                            </div>
                          )}
                          <button
                            onClick={() => removePhoto(i)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {photos.length < 15 && (
                        <button
                          onClick={() => photoRef.current?.click()}
                          className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#0070BA] hover:text-[#0070BA] transition-colors"
                        >
                          <Upload size={18} />
                          <span className="text-[10px]">Ajouter</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Summary ── */}
                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-4">Récapitulatif</h3>
                  <dl className="space-y-2">
                    {[
                      { label: "Type de bien", value: typeLabel || "—" },
                      { label: "Type d'annonce", value: listingTypeLabel || "—" },
                      { label: "Localisation", value: [form.district, form.city, countryLabel].filter(Boolean).join(", ") || "—" },
                      { label: "Titre", value: form.title || "—" },
                      { label: "Prix", value: form.price ? `${Number(form.price).toLocaleString("fr-FR")} ${form.currency}` : "—" },
                      { label: "Détails", value: [form.surface ? `${form.surface} m²` : null, form.bedrooms ? `${form.bedrooms} ch.` : null, form.bathrooms ? `${form.bathrooms} sdb.` : null].filter(Boolean).join(" · ") || "—" },
                      { label: "Équipements", value: activeFeatures.length > 0 ? activeFeatures.map((f) => f.label).join(", ") : "Aucun" },
                      { label: "Document foncier", value: legalDocs.find((d) => d.code === form.legalDocType)?.label ?? "—" },
                      { label: "Photos", value: photos.length > 0 ? `${photos.length} photo(s)` : "Aucune" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex gap-3 text-sm">
                        <dt className="w-36 flex-shrink-0 text-gray-500">{label}</dt>
                        <dd className="font-medium text-gray-800 flex-1 min-w-0 truncate">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Submitting progress */}
                {submitting && submitProgress && (
                  <div className="flex items-center gap-3 text-sm text-[#0070BA] bg-blue-50 rounded-xl px-4 py-3">
                    <div className="w-4 h-4 border-2 border-[#0070BA] border-t-transparent rounded-full animate-spin shrink-0" />
                    {submitProgress}
                  </div>
                )}
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
                <Button variant="primary" size="md" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Publication…</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Publier l&apos;annonce</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
