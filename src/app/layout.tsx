import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import NextAuthProvider from "@/components/providers/NextAuthProvider";
import ReactQueryProvider from "@/components/providers/ReactQueryProvider";
import AppShell from "@/components/providers/AppShell";
import { LocaleProvider } from "@/lib/i18n/context";

const cormorant = Cormorant_Garamond({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      <head />
      <body
        className={`${inter.variable} ${cormorant.variable} ${spaceGrotesk.variable} font-sans antialiased bg-background text-foreground`}
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
                <Toaster />
              </LocaleProvider>
            </ReactQueryProvider>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
