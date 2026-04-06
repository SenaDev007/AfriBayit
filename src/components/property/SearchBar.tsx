"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

const COUNTRIES = [
  { value: "BJ", label: "🇧🇯 Bénin" },
  { value: "CI", label: "🇨🇮 Côte d'Ivoire" },
  { value: "BF", label: "🇧🇫 Burkina Faso" },
  { value: "TG", label: "🇹🇬 Togo" },
  { value: "SN", label: "🇸🇳 Sénégal" },
  { value: "GH", label: "🇬🇭 Ghana" },
  { value: "NG", label: "🇳🇬 Nigeria" },
];

const PROPERTY_TYPES = [
  { value: "", label: "Tous types" },
  { value: "APARTMENT", label: "Appartement" },
  { value: "HOUSE", label: "Maison" },
  { value: "VILLA", label: "Villa" },
  { value: "STUDIO", label: "Studio" },
  { value: "LAND", label: "Terrain" },
  { value: "OFFICE", label: "Bureau" },
  { value: "COMMERCIAL", label: "Commercial" },
];

const LISTING_TYPES = [
  { value: "", label: "Achat & Location" },
  { value: "SALE", label: "À Vendre" },
  { value: "LONG_TERM_RENTAL", label: "Location Longue Durée" },
  { value: "SHORT_TERM_RENTAL", label: "Location Courte Durée" },
];

interface SearchBarProps {
  variant?: "hero" | "compact";
  initialValues?: {
    query?: string;
    country?: string;
    type?: string;
    listingType?: string;
  };
}

export default function SearchBar({ variant = "hero", initialValues }: SearchBarProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"buy" | "rent" | "short">("buy");
  const [query, setQuery] = useState(initialValues?.query || "");
  const [country, setCountry] = useState(initialValues?.country || "");
  const [type, setType] = useState(initialValues?.type || "");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (country) params.set("country", country);
    if (type) params.set("type", type);
    if (activeTab === "buy") params.set("listingType", "SALE");
    else if (activeTab === "rent") params.set("listingType", "LONG_TERM_RENTAL");
    else params.set("listingType", "SHORT_TERM_RENTAL");
    router.push(`/properties?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 bg-white rounded-xl shadow border border-gray-100 p-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-3 py-2 text-sm focus:outline-none"
          />
        </div>
        <Button size="sm" onClick={handleSearch}>Rechercher</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {[
          { key: "buy", label: "Acheter" },
          { key: "rent", label: "Louer" },
          { key: "short", label: "Court séjour" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`px-5 py-2 rounded-t-xl text-sm font-semibold transition-all ${
              activeTab === key
                ? "bg-white text-[#003087] shadow-sm"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search form */}
      <div className="bg-white rounded-2xl rounded-tl-none shadow-2xl p-2 flex flex-col sm:flex-row gap-2">
        {/* Query */}
        <div className="flex-1 relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={
              activeTab === "short"
                ? "Ville, quartier, guesthouse..."
                : "Ville, quartier, adresse..."
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-11 pr-4 py-3.5 text-sm focus:outline-none rounded-xl text-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px bg-gray-100 self-stretch my-2" />

        {/* Country */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
          </svg>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="pl-9 pr-8 py-3.5 text-sm focus:outline-none bg-transparent cursor-pointer text-gray-700 appearance-none w-full sm:w-auto min-w-[150px]"
          >
            <option value="">Tous les pays</option>
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Separator */}
        <div className="hidden sm:block w-px bg-gray-100 self-stretch my-2" />

        {/* Type */}
        {activeTab !== "short" && (
          <>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-4 py-3.5 text-sm focus:outline-none bg-transparent cursor-pointer text-gray-700 appearance-none w-full sm:w-auto min-w-[140px]"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="hidden sm:block w-px bg-gray-100 self-stretch my-2" />
          </>
        )}

        {/* Search button */}
        <Button
          onClick={handleSearch}
          size="lg"
          className="rounded-xl px-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Rechercher
        </Button>
      </div>

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-white/70 text-sm">Populaire :</span>
        {[
          "Villa à Cotonou",
          "Appartement Abidjan",
          "Studio Lomé",
          "Terrain Ouagadougou",
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              setQuery(suggestion);
              setTimeout(handleSearch, 100);
            }}
            className="text-sm text-white/90 hover:text-white bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
