import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
