import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import AppShell from "@/components/providers/AppShell";
import ServiceWorkerRegistration from "@/components/providers/ServiceWorkerRegistration";
import { LocaleProvider } from "@/lib/i18n/context";

// Module 4 — Design System:
//   - Cormorant Garamond → `--font-cormorant` (display/headings) — fixed bug
//     where it was aliased to `--font-inter` (clobbered Inter).
//   - DM Sans → `--font-dm-sans` (body, replaces Inter).
//   - DM Mono → `--font-dm-mono` (mono/data, replaces Space Grotesk).
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#003366" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
  ],
};

export const metadata: Metadata = {
  title: "AfriBayit — La Plateforme Immobilière Africaine",
  description:
    "Où l'Afrique trouve sa maison. Où les rêves deviennent adresses. Plateforme immobilière pan-africaine de nouvelle génération.",
  keywords: [
    "AfriBayit",
    "immobilier",
    "Afrique",
    "Bénin",
    "Côte d'Ivoire",
    "Burkina Faso",
    "Togo",
    "villa",
    "appartement",
    "terrain",
  ],
  authors: [{ name: "AfriBayit" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "AfriBayit — La Plateforme Immobilière Africaine",
    description: "Où l'Afrique trouve sa maison. Où les rêves deviennent adresses.",
    type: "website",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "AfriBayit" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head />
      <body
        className={`${dmSans.variable} ${cormorant.variable} ${dmMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <NextAuthProvider>
            <ReactQueryProvider>
              <LocaleProvider>
                <AppShell>
                  {children}
                </AppShell>
                <ServiceWorkerRegistration />
                <Toaster />
              </LocaleProvider>
            </ReactQueryProvider>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
