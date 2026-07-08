import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Analytics — AfriBayit",
  description: "Statistiques et analytics.",
  keywords: ["analytics", "statistiques"],
  openGraph: {
    title: "Analytics — AfriBayit",
    description: "Statistiques et analytics.",
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
