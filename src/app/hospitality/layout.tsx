import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Hôtellerie — AfriBayit Hospitality",
  description: "Gérez votre hôtel sur AfriBayit.",
  keywords: ["hôtellerie", "hôtel", "PMS"],
  openGraph: {
    title: "Hôtellerie — AfriBayit Hospitality",
    description: "Gérez votre hôtel sur AfriBayit.",
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
