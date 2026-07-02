import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Portefeuille — AfriBayit",
  description: "Gérez votre portefeuille AfriBayit.",
  keywords: ["portefeuille", "wallet"],
  openGraph: {
    title: "Portefeuille — AfriBayit",
    description: "Gérez votre portefeuille AfriBayit.",
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
