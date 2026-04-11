import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import RebeccaWidget from "@/components/ai/RebeccaWidget";
import { Toaster } from "react-hot-toast";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "AfriBayit — La Plateforme Immobilière Africaine",
    template: "%s | AfriBayit",
  },
  description:
    "AfriBayit révolutionne l'immobilier africain — annonces immobilières, locations courtes durées, réservations hôtelières, marketplace artisans BTP. Bénin, Côte d'Ivoire, Burkina Faso, Togo.",
  keywords: [
    "immobilier Afrique",
    "location Bénin",
    "appartement Abidjan",
    "villa Cotonou",
    "AfriBayit",
    "immobilier africain",
    "artisans BTP",
  ],
  authors: [{ name: "AfriBayit" }],
  openGraph: {
    title: "AfriBayit — La Plateforme Immobilière Africaine",
    description: "Où l'Afrique trouve sa maison. Où les rêves deviennent adresses.",
    type: "website",
    locale: "fr_FR",
    siteName: "AfriBayit",
  },
  twitter: {
    card: "summary_large_image",
    title: "AfriBayit",
    description: "La première super-app immobilière africaine",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#374151]">
        <SessionProvider>
          {children}
          <RebeccaWidget />
        </SessionProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "12px",
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
