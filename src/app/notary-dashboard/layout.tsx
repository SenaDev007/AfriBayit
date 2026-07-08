import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Tableau de bord notaire — AfriBayit",
  description: "Gérez vos actes notariales.",
  keywords: ["dashboard notaire", "actes"],
  openGraph: {
    title: "Tableau de bord notaire — AfriBayit",
    description: "Gérez vos actes notariales.",
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
