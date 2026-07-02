import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Tableau de bord — AfriBayit",
  description: "Votre tableau de bord AfriBayit.",
  keywords: ["dashboard", "tableau bord"],
  openGraph: {
    title: "Tableau de bord — AfriBayit",
    description: "Votre tableau de bord AfriBayit.",
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
