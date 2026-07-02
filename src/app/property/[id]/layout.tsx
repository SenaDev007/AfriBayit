import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Détail propriété — AfriBayit",
  description: "Découvrez cette propriété sur AfriBayit.",
  keywords: ["propriété", "détail bien"],
  openGraph: {
    title: "Détail propriété — AfriBayit",
    description: "Découvrez cette propriété sur AfriBayit.",
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
