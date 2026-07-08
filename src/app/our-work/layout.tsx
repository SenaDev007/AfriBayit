import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Nos réalisations — AfriBayit",
  description: "Projets et réalisations AfriBayit.",
  keywords: ["réalisations", "projets"],
  openGraph: {
    title: "Nos réalisations — AfriBayit",
    description: "Projets et réalisations AfriBayit.",
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
