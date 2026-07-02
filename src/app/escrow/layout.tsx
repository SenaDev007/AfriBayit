import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Escrow — AfriBayit",
  description: "Transactions sécurisées via escrow AfriBayit.",
  keywords: ["escrow", "sécurité transaction"],
  openGraph: {
    title: "Escrow — AfriBayit",
    description: "Transactions sécurisées via escrow AfriBayit.",
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
