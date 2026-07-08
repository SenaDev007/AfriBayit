import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Tableau de bord agent — AfriBayit",
  description: "Dashboard agent immobilier.",
  keywords: ["agent", "dashboard"],
  openGraph: {
    title: "Tableau de bord agent — AfriBayit",
    description: "Dashboard agent immobilier.",
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
