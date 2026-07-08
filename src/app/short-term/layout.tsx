import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Location courte durée — AfriBayit",
  description: "Locations courte durée en Afrique de l'Ouest.",
  keywords: ["location courte durée", "Airbnb Afrique"],
  openGraph: {
    title: "Location courte durée — AfriBayit",
    description: "Locations courte durée en Afrique de l'Ouest.",
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
