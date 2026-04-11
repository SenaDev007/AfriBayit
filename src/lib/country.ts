/**
 * AfriBayit — Multitenancy country detection (CDC §5)
 *
 * Reads the x-afribayit-country header injected by proxy.ts
 * when the user visits a country subdomain (bj.afribayit.com etc.)
 */
import { headers } from "next/headers";

export type SupportedCountry = "BJ" | "CI" | "BF" | "TG";

export const COUNTRY_LABELS: Record<SupportedCountry, string> = {
  BJ: "Bénin",
  CI: "Côte d'Ivoire",
  BF: "Burkina Faso",
  TG: "Togo",
};

export const COUNTRY_FLAGS: Record<SupportedCountry, string> = {
  BJ: "🇧🇯",
  CI: "🇨🇮",
  BF: "🇧🇫",
  TG: "🇹🇬",
};

export const COUNTRY_CURRENCIES: Record<SupportedCountry, string> = {
  BJ: "XOF",
  CI: "XOF",
  BF: "XOF",
  TG: "XOF",
};

/**
 * Returns the active country from the subdomain header (server only).
 * Returns null if on the root domain or in a client context.
 */
export async function getActiveCountry(): Promise<SupportedCountry | null> {
  try {
    const hdrs = await headers();
    const country = hdrs.get("x-afribayit-country");
    if (country && country in COUNTRY_LABELS) return country as SupportedCountry;
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns country info for display.
 */
export function getCountryInfo(code: SupportedCountry) {
  return {
    code,
    label: COUNTRY_LABELS[code],
    flag: COUNTRY_FLAGS[code],
    currency: COUNTRY_CURRENCIES[code],
  };
}
