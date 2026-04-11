import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

export type Locale = "fr" | "en";
export const locales: Locale[] = ["fr", "en"];
export const defaultLocale: Locale = "fr";

/**
 * Locale detection priority:
 * 1. Cookie: afribayit-locale
 * 2. Accept-Language header
 * 3. Default: fr
 */
async function detectLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("afribayit-locale")?.value;
    if (cookieLocale && locales.includes(cookieLocale as Locale)) {
      return cookieLocale as Locale;
    }

    const hdrs = await headers();
    const acceptLang = hdrs.get("accept-language") ?? "";
    if (acceptLang.toLowerCase().startsWith("en")) return "en";
  } catch {
    // In static context — use default
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await detectLocale();
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});
