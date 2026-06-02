import { Metadata } from 'next';
import PublicProfilePage from './PublicProfilePage';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    title: `${name} — Profil professionnel | AfriBayit`,
    description: `Profil professionnel de ${name} sur AfriBayit, la plateforme immobilière pan-africaine. Découvrez ses compétences, expérience et projets.`,
    openGraph: {
      title: `${name} — AfriBayit Pro`,
      description: `Profil professionnel de ${name} sur AfriBayit`,
      type: 'profile',
      siteName: 'AfriBayit',
    },
  };
}

export default function ProProfilePage({ params }: PageProps) {
  return <PublicProfilePage params={params} />;
}
