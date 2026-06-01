import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import AppShell from "@/components/providers/AppShell";
import { LocaleProvider } from "@/lib/i18n/context";
import PWAInstallPrompt from "@/components/afribayit/PWAInstallPrompt";
import PWARegistration from "@/components/afribayit/PWARegistration";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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
  themeColor: "#003087",
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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AfriBayit",
  },
  icons: {
    icon: "/logo.png",
    apple: "/icons/icon-192x192.svg",
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
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AfriBayit" />
      </head>
      <body
        className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable} font-body antialiased bg-background text-foreground`}
      >
        <NextAuthProvider>
          <ReactQueryProvider>
            <LocaleProvider>
              <AppShell>
                {children}
              </AppShell>
              <Toaster />
              <PWAInstallPrompt />
              <PWARegistration />
            </LocaleProvider>
          </ReactQueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
