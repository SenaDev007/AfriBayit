"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";

/**
 * Sets locale preference via cookie and reloads the page.
 * next-intl reads the 'afribayit-locale' cookie in src/i18n/request.ts.
 */
export default function LocaleSwitcher({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();

  function setLocale(locale: "fr" | "en") {
    document.cookie = `afribayit-locale=${locale};path=/;max-age=31536000;SameSite=Lax`;
    startTransition(() => {
      window.location.reload();
    });
  }

  return (
    <div className={cn("flex items-center gap-1 text-xs font-medium", className)}>
      <button
        onClick={() => setLocale("fr")}
        disabled={isPending}
        className="px-2 py-1 rounded hover:bg-white/10 transition-colors"
        aria-label="Français"
      >
        FR
      </button>
      <span className="opacity-40">|</span>
      <button
        onClick={() => setLocale("en")}
        disabled={isPending}
        className="px-2 py-1 rounded hover:bg-white/10 transition-colors"
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
