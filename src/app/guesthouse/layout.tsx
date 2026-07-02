import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Guesthouses — AfriBayit",
  description: "Guesthouses AfriBayit en Afrique de l'Ouest.",
  keywords: ["guesthouse", "maison d'hôtes"],
  openGraph: {
    title: "Guesthouses — AfriBayit",
    description: "Guesthouses AfriBayit en Afrique de l'Ouest.",
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
