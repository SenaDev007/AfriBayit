import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "GeoTrust — AfriBayit",
  description: "Vérification terrain géolocalisée GeoTrust.",
  keywords: ["GeoTrust", "vérification terrain"],
  openGraph: {
    title: "GeoTrust — AfriBayit",
    description: "Vérification terrain géolocalisée GeoTrust.",
    type: "website",
  },
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
