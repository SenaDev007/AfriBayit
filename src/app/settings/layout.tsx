import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Paramètres — AfriBayit",
  description: "Paramètres de votre compte.",
  keywords: ["paramètres", "configuration"],
  openGraph: {
    title: "Paramètres — AfriBayit",
    description: "Paramètres de votre compte.",
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
