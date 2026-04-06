import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency in FCFA or other African currencies
export function formatCurrency(
  amount: number,
  currency: string = "XOF",
  locale: string = "fr-BJ"
): string {
  const currencyMap: Record<string, { locale: string; currency: string }> = {
    XOF: { locale: "fr-BJ", currency: "XOF" },
    XAF: { locale: "fr-CM", currency: "XAF" },
    GHS: { locale: "en-GH", currency: "GHS" },
    NGN: { locale: "en-NG", currency: "NGN" },
    KES: { locale: "en-KE", currency: "KES" },
    EUR: { locale: "fr-FR", currency: "EUR" },
    USD: { locale: "en-US", currency: "USD" },
  };

  const config = currencyMap[currency] || currencyMap["XOF"];

  try {
    return new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString()} ${currency}`;
  }
}

// Format large numbers with African context (M FCFA, Mrd FCFA)
export function formatCompactCurrency(amount: number, currency: string = "XOF"): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} Mrd ${currency}`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} M ${currency}`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)} K ${currency}`;
  }
  return `${amount} ${currency}`;
}

// Slug generator
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Relative date formatting
export function formatRelativeDate(date: Date, locale: string = "fr"): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const diffDays = Math.round(diff / (1000 * 60 * 60 * 24));
  const diffHours = Math.round(diff / (1000 * 60 * 60));
  const diffMinutes = Math.round(diff / (1000 * 60));

  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, "minute");
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, "hour");
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, "day");
  return date.toLocaleDateString(locale);
}

// Country labels
export const COUNTRY_LABELS: Record<string, string> = {
  BJ: "🇧🇯 Bénin",
  CI: "🇨🇮 Côte d'Ivoire",
  BF: "🇧🇫 Burkina Faso",
  TG: "🇹🇬 Togo",
  SN: "🇸🇳 Sénégal",
  GH: "🇬🇭 Ghana",
  NG: "🇳🇬 Nigeria",
  CM: "🇨🇲 Cameroun",
  ML: "🇲🇱 Mali",
  NE: "🇳🇪 Niger",
};

// Property type labels
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: "Appartement",
  HOUSE: "Maison",
  VILLA: "Villa",
  STUDIO: "Studio",
  OFFICE: "Bureau",
  LAND: "Terrain",
  COMMERCIAL: "Commercial",
  WAREHOUSE: "Entrepôt",
};

// Listing type labels
export const LISTING_TYPE_LABELS: Record<string, string> = {
  SALE: "À Vendre",
  LONG_TERM_RENTAL: "Location Longue Durée",
  SHORT_TERM_RENTAL: "Location Courte Durée",
};

// Artisan category labels
export const ARTISAN_CATEGORY_LABELS: Record<string, string> = {
  GROS_OEUVRE: "Gros Œuvre",
  SECOND_OEUVRE: "Second Œuvre",
  FINITION_DECORATION: "Finition & Décoration",
  GENIE_TECHNIQUE: "Génie Technique",
  EXTERIEURS: "Extérieurs",
  RENOVATION_MAINTENANCE: "Rénovation & Maintenance",
  NUMERIQUE_INNOVATION: "Numérique & Innovation",
};
