import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Publier une annonce — AfriBayit",
  description: "Publiez votre bien immobilier sur AfriBayit.",
  keywords: ["publier annonce", "vendre bien"],
  openGraph: {
    title: "Publier une annonce — AfriBayit",
    description: "Publiez votre bien immobilier sur AfriBayit.",
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
