import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Academy — AfriBayit",
  description: "Formations immobilières en Afrique de l'Ouest.",
  keywords: ["formation", "academy"],
  openGraph: {
    title: "Academy — AfriBayit",
    description: "Formations immobilières en Afrique de l'Ouest.",
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
