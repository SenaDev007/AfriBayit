import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// In-memory content store (simulates database)
// ---------------------------------------------------------------------------

interface ContentItem {
  id: string;
  label: string;
  value: string;
  lastModified: string;
}

interface ContentSection {
  id: string;
  title: string;
  description: string;
  items: ContentItem[];
}

const contentStore: ContentSection[] = [
  {
    id: 'accueil',
    title: "Page d'accueil",
    description: "Gérez le contenu principal de la page d'accueil",
    items: [
      {
        id: 'hero-titre',
        label: 'Hero titre',
        value: "Trouvez votre bien immobilier en Afrique de l'Ouest",
        lastModified: '2025-12-10T14:30:00',
      },
      {
        id: 'hero-sous-titre',
        label: 'Hero sous-titre',
        value:
          "La première plateforme immobilière vérifiée et sécurisée pour l'Afrique de l'Ouest",
        lastModified: '2025-12-10T14:30:00',
      },
      {
        id: 'section-confiance',
        label: 'Section confiance',
        value:
          'Plus de 10\u00a0000 biens vérifiés • 500+ notaires partenaires • Présent dans 8 pays',
        lastModified: '2025-11-28T09:15:00',
      },
      {
        id: 'section-comment-ca-marche',
        label: 'Section comment ça marche',
        value:
          '1. Recherchez • 2. Vérifiez • 3. Visitez • 4. Signez en toute sécurité',
        lastModified: '2025-11-20T16:45:00',
      },
      {
        id: 'section-temoignages',
        label: 'Section témoignages',
        value:
          "Découvrez les témoignages de nos utilisateurs qui ont réalisé leur projet immobilier avec AfriBayit.",
        lastModified: '2025-11-15T11:00:00',
      },
      {
        id: 'cta-banniere',
        label: 'CTA bannière',
        value:
          "Prêt à trouver votre bien\u00a0? Commencez votre recherche dès maintenant.",
        lastModified: '2025-11-05T08:30:00',
      },
    ],
  },
  {
    id: 'legales',
    title: 'Pages légales',
    description: 'Modifiez les documents juridiques et politiques',
    items: [
      {
        id: 'politique-confidentialite',
        label: 'Politique de confidentialité',
        value:
          "AfriBayit s'engage à protéger la vie privée de ses utilisateurs. Cette politique décrit les données collectées, leur utilisation et vos droits...",
        lastModified: '2025-10-22T10:00:00',
      },
      {
        id: 'cgu',
        label: 'CGU',
        value:
          "En utilisant la plateforme AfriBayit, vous acceptez les présentes conditions générales d'utilisation...",
        lastModified: '2025-10-22T10:00:00',
      },
      {
        id: 'remboursement',
        label: 'Remboursement',
        value:
          "Notre politique de remboursement s'applique aux transactions effectuées via le service de sécurisation AfriEscrow...",
        lastModified: '2025-09-15T14:20:00',
      },
      {
        id: 'suppression-donnees',
        label: 'Suppression de données',
        value:
          'Conformément aux réglementations en vigueur, vous pouvez demander la suppression de vos données personnelles...',
        lastModified: '2025-09-15T14:20:00',
      },
    ],
  },
  {
    id: 'realisations',
    title: 'Nos Réalisations',
    description: 'Gérez le contenu de la section réalisations',
    items: [
      {
        id: 'realisations-description',
        label: 'Description',
        value:
          "Découvrez les projets réalisés grâce à AfriBayit. Des milliers de familles ont trouvé leur logement idéal.",
        lastModified: '2025-12-01T16:00:00',
      },
      {
        id: 'realisations-statistiques',
        label: 'Statistiques',
        value:
          '2\u00a0500+ transactions réussies • 98% de satisfaction • 8 pays couverts • 500+ partenaires notariaux',
        lastModified: '2025-12-01T16:00:00',
      },
      {
        id: 'realisations-projets',
        label: 'Projets',
        value:
          'Résidence Les Palmiers – Cotonou • Villa Horizon – Lomé • Appartements Baobab – Dakar',
        lastModified: '2025-11-18T09:45:00',
      },
    ],
  },
  {
    id: 'seo',
    title: 'SEO & Meta',
    description: 'Configurez les balises méta et le référencement',
    items: [
      {
        id: 'seo-title',
        label: 'Title',
        value:
          "AfriBayit – Plateforme immobilière vérifiée en Afrique de l'Ouest",
        lastModified: '2025-11-30T12:00:00',
      },
      {
        id: 'seo-description',
        label: 'Description',
        value:
          "Achetez, vendez et louez des biens immobiliers vérifiés en Afrique de l'Ouest. Transactions sécurisées, notaires partenaires, vérification géolocalisée.",
        lastModified: '2025-11-30T12:00:00',
      },
      {
        id: 'seo-keywords',
        label: 'Keywords',
        value:
          'immobilier afrique, achat maison afrique, location appartement, bien vérifié, notaire, transaction sécurisée',
        lastModified: '2025-11-30T12:00:00',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// GET /api/admin/content — Fetch all content sections
// ---------------------------------------------------------------------------

export async function GET() {
  return NextResponse.json({ sections: contentStore });
}

// ---------------------------------------------------------------------------
// PUT /api/admin/content — Update a specific content item
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionId, itemId, value } = body as {
      sectionId: string;
      itemId: string;
      value: string;
    };

    if (!sectionId || !itemId || value === undefined) {
      return NextResponse.json(
        { error: 'sectionId, itemId et value sont requis' },
        { status: 400 },
      );
    }

    const section = contentStore.find((s) => s.id === sectionId);
    if (!section) {
      return NextResponse.json(
        { error: 'Section non trouvée' },
        { status: 404 },
      );
    }

    const item = section.items.find((it) => it.id === itemId);
    if (!item) {
      return NextResponse.json(
        { error: 'Élément non trouvé' },
        { status: 404 },
      );
    }

    item.value = value;
    item.lastModified = new Date().toISOString();

    return NextResponse.json({
      success: true,
      item,
    });
  } catch {
    return NextResponse.json(
      { error: 'Requête invalide' },
      { status: 400 },
    );
  }
}
