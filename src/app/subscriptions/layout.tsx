import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Abonnements — AfriBayit",
  description: "Abonnements agents et professionnels.",
  keywords: ["abonnement", "premium", "pro"],
  openGraph: {
    title: "Abonnements — AfriBayit",
    description: "Abonnements agents et professionnels.",
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
