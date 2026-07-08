import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Artisans BTP — AfriBayit ProMatch",
  description: "Artisans certifiés BTP en Afrique de l'Ouest.",
  keywords: ["artisan BTP", "ProMatch"],
  openGraph: {
    title: "Artisans BTP — AfriBayit ProMatch",
    description: "Artisans certifiés BTP en Afrique de l'Ouest.",
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
