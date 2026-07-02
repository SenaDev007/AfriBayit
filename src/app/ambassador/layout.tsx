import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Ambassadeurs — AfriBayit",
  description: "Programme ambassadeurs AfriBayit.",
  keywords: ["ambassadeur", "parrainage"],
  openGraph: {
    title: "Ambassadeurs — AfriBayit",
    description: "Programme ambassadeurs AfriBayit.",
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
