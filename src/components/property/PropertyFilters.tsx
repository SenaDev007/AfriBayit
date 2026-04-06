"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

interface PropertyFiltersProps {
  currentParams: Record<string, string | undefined>;
}

const LISTING_TYPES = [
  { value: "", label: "Tous" },
  { value: "SALE", label: "Vente" },
  { value: "LONG_TERM_RENTAL", label: "Location" },
  { value: "SHORT_TERM_RENTAL", label: "Court séjour" },
];

const PROPERTY_TYPES = [
  { value: "", label: "Tous types" },
  { value: "APARTMENT", label: "Appartement" },
  { value: "HOUSE", label: "Maison" },
  { value: "VILLA", label: "Villa" },
  { value: "STUDIO", label: "Studio" },
  { value: "LAND", label: "Terrain" },
  { value: "OFFICE", label: "Bureau" },
  { value: "COMMERCIAL", label: "Local commercial" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récents" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "score", label: "Score investissement" },
  { value: "views", label: "Plus consultés" },
];

const FEATURES = [
  { key: "hasPool", label: "Piscine" },
  { key: "hasGarage", label: "Garage" },
  { key: "hasAC", label: "Climatisation" },
  { key: "hasSecurity", label: "Sécurité 24/7" },
  { key: "hasGenerator", label: "Groupe électrogène" },
  { key: "hasGarden", label: "Jardin" },
] as const;

type FeatureKey = (typeof FEATURES)[number]["key"];

export default function PropertyFilters({ currentParams }: PropertyFiltersProps) {
  const router = useRouter();

  const [listingType, setListingType] = useState(currentParams.listingType ?? "");
  const [type, setType] = useState(currentParams.type ?? "");
  const [minPrice, setMinPrice] = useState(currentParams.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(currentParams.maxPrice ?? "");
  const [bedrooms, setBedrooms] = useState(currentParams.bedrooms ?? "");
  const [sort, setSort] = useState(currentParams.sort ?? "recent");
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>({
    hasPool: currentParams.hasPool === "true",
    hasGarage: currentParams.hasGarage === "true",
    hasAC: currentParams.hasAC === "true",
    hasSecurity: currentParams.hasSecurity === "true",
    hasGenerator: currentParams.hasGenerator === "true",
    hasGarden: currentParams.hasGarden === "true",
  });

  function buildParams(overrides: Record<string, string | undefined> = {}) {
    const merged: Record<string, string> = {};

    // Carry over non-filter params (q, country, city)
    if (currentParams.q) merged.q = currentParams.q;
    if (currentParams.country) merged.country = currentParams.country;
    if (currentParams.city) merged.city = currentParams.city;

    return merged;
  }

  function applyFilters() {
    const p: Record<string, string> = buildParams();

    if (listingType) p.listingType = listingType;
    if (type) p.type = type;
    if (minPrice) p.minPrice = minPrice;
    if (maxPrice) p.maxPrice = maxPrice;
    if (bedrooms) p.bedrooms = bedrooms;
    if (sort && sort !== "recent") p.sort = sort;

    for (const feat of FEATURES) {
      if (features[feat.key]) p[feat.key] = "true";
    }

    // Always reset to page 1 when filters change
    router.push(`/properties?${new URLSearchParams(p).toString()}`);
  }

  function resetFilters() {
    setListingType("");
    setType("");
    setMinPrice("");
    setMaxPrice("");
    setBedrooms("");
    setSort("recent");
    setFeatures({
      hasPool: false,
      hasGarage: false,
      hasAC: false,
      hasSecurity: false,
      hasGenerator: false,
      hasGarden: false,
    });

    const p: Record<string, string> = {};
    if (currentParams.q) p.q = currentParams.q;
    if (currentParams.country) p.country = currentParams.country;
    if (currentParams.city) p.city = currentParams.city;

    router.push(
      `/properties${Object.keys(p).length ? `?${new URLSearchParams(p).toString()}` : ""}`
    );
  }

  function handleSortChange(value: string) {
    setSort(value);

    const p: Record<string, string> = buildParams();
    if (listingType) p.listingType = listingType;
    if (type) p.type = type;
    if (minPrice) p.minPrice = minPrice;
    if (maxPrice) p.maxPrice = maxPrice;
    if (bedrooms) p.bedrooms = bedrooms;
    if (value && value !== "recent") p.sort = value;
    for (const feat of FEATURES) {
      if (features[feat.key]) p[feat.key] = "true";
    }

    router.push(`/properties?${new URLSearchParams(p).toString()}`);
  }

  function toggleFeature(key: FeatureKey) {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
      {/* Sort */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Trier par
        </label>
        <select
          value={sort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="input-afri text-sm py-2"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Filters header */}
      <div className="flex items-center justify-between mb-4 border-t border-gray-100 pt-4">
        <h3 className="font-bold text-gray-800">Filtres</h3>
        <button
          onClick={resetFilters}
          className="text-xs text-[#0070BA] font-medium hover:underline"
        >
          Réinitialiser
        </button>
      </div>

      {/* Listing Type */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Type de transaction
        </label>
        <div className="space-y-2">
          {LISTING_TYPES.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="listingType"
                value={opt.value}
                checked={listingType === opt.value}
                onChange={() => setListingType(opt.value)}
                className="text-[#0070BA] accent-[#0070BA]"
              />
              <span className="text-sm text-gray-600">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Property Type */}
      <div className="mb-5 border-t border-gray-100 pt-5">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Type de bien
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="input-afri text-sm py-2"
        >
          {PROPERTY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div className="mb-5 border-t border-gray-100 pt-5">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Budget (FCFA)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            min={0}
            className="input-afri text-sm py-2 w-1/2"
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            min={0}
            className="input-afri text-sm py-2 w-1/2"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div className="mb-5 border-t border-gray-100 pt-5">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Chambres minimum
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setBedrooms(bedrooms === String(n) ? "" : String(n))}
              className={`w-9 h-9 rounded-lg border-2 text-sm font-medium transition-colors ${
                bedrooms === String(n)
                  ? "border-[#0070BA] bg-[#0070BA] text-white"
                  : "border-gray-200 text-gray-600 hover:border-[#0070BA] hover:text-[#0070BA]"
              }`}
            >
              {n === 5 ? "5+" : n}
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="border-t border-gray-100 pt-5">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Équipements
        </label>
        <div className="space-y-2">
          {FEATURES.map((feat) => (
            <label key={feat.key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={features[feat.key]}
                onChange={() => toggleFeature(feat.key)}
                className="rounded text-[#0070BA] accent-[#0070BA]"
              />
              <span className="text-sm text-gray-600">{feat.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Button
        variant="primary"
        fullWidth
        className="mt-5"
        onClick={applyFilters}
      >
        Appliquer les filtres
      </Button>
    </div>
  );
}
