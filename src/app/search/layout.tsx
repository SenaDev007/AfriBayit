import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Recherche immobilière — AfriBayit",
  description: "Trouvez votre bien immobilier en Afrique de l'Ouest.",
  keywords: ["recherche immobilier", "annonce immobilière"],
  openGraph: {
    title: "Recherche immobilière — AfriBayit",
    description: "Trouvez votre bien immobilier en Afrique de l'Ouest.",
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
