import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Réservation — AfriBayit",
  description: "Réservez votre séjour.",
  keywords: ["réservation", "booking"],
  openGraph: {
    title: "Réservation — AfriBayit",
    description: "Réservez votre séjour.",
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
