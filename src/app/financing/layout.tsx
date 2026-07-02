import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Financement — AfriBayit",
  description: "Simulez votre financement immobilier.",
  keywords: ["financement", "prêt immobilier"],
  openGraph: {
    title: "Financement — AfriBayit",
    description: "Simulez votre financement immobilier.",
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
