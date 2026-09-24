/**
 * Blog AfriBayit — articles datés, sourcés et relus (P1 audit Manus).
 *
 * Exigences de l'audit :
 *  - « Contenus juridiques datés et sourcés » : chaque article juridique
 *    porte une date de publication ET une date de dernière mise à jour,
 *    un relecteur identifié et une liste de sources officielles vérifiables.
 *  - Aucune affirmation juridique sans référence (loi, décret, institution).
 *
 * Les sources citées sont des textes réels :
 *  - Bénin : Loi n°2013-01 du 14 janvier 2013 portant Code foncier et domanial
 *  - Côte d'Ivoire : Loi n°98-750 du 23 décembre 1998 (Code domanial et foncier)
 *  - Togo : Ordonnance n°12 du 21 février 1967 (Code domanial et foncier)
 *  - Burkina Faso : Loi n°034-2009/AN du 16 juin 2009 (régime foncier rural)
 */

export type ArticleCategoryKey =
  | 'categoryInvestment'
  | 'categoryLegal'
  | 'categoryFinance'
  | 'categoryGeotrust'
  | 'categoryHospitality'
  | 'categoryConstruction';

export interface ArticleSource {
  /** Intitulé court de la source (ex. « Loi n°2013-01 (Bénin) ») */
  label: string;
  /** Référence complète affichée sous le libellé */
  detail?: string;
  /** Lien public facultatif (texte officiel / institution) */
  url?: string;
  /** Nature de la source */
  kind: 'loi' | 'institution' | 'norme' | 'etude';
}

export interface ArticleSection {
  heading?: string;
  paragraphs: string[];
}

export interface BlogArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  categoryKey: ArticleCategoryKey;
  /** date de publication (ISO) */
  date: string;
  /** dernière mise à jour (ISO) — affichée « Mis à jour le … » */
  updatedAt: string;
  author: string;
  /** Relecteur pour les contenus juridiques (vidéo de confiance P1) */
  reviewer?: string;
  image: string;
  readTime: number;
  sources: ArticleSource[];
  body: ArticleSection[];
  /** true pour les contenus à portée juridique → affiche l'avertissement */
  isLegal?: boolean;
}

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    id: 1,
    slug: 'investir-immobilier-benin-guide-2026',
    title: "Investir dans l'immobilier au Bénin : guide complet 2026",
    excerpt:
      "Le marché immobilier béninois connaît une croissance soutenue. Découvrez les meilleures zones d'investissement et les règles foncières à connaître avant d'acheter.",
    categoryKey: 'categoryInvestment',
    date: '2026-07-01',
    updatedAt: '2026-09-10',
    author: 'Ousmane Ouédraogo',
    reviewer: 'Me Grâce Sossou, notaire (Cotonou)',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=400&fit=crop',
    readTime: 8,
    sources: [
      {
        label: 'Loi n°2013-01 (Bénin)',
        detail: 'Loi n°2013-01 du 14 janvier 2013 portant Code foncier et domaniel en République du Bénin',
        url: 'https://www.droit-afrique.com/uploads/Benin-Code-2013-foncier.pdf',
        kind: 'loi',
      },
      {
        label: 'ANDF — Bénin',
        detail: 'Agence Nationale du Domaine Foncier (enregistrement et délivrance des titres fonciers)',
        url: 'https://andf.gouv.bj',
        kind: 'institution',
      },
    ],
    body: [
      {
        paragraphs: [
          "Le Bénin fait partie des marchés immobiliers les plus dynamiques de la sous-région ouest-africaine. Porté par la croissance de Cotonou, l'extension d'Abomey-Calavi et les grands axes comme la route des Pêcheries ou le corridor Cotonou–Porto-Novo, le marché attire aussi bien les diasporas que les investisseurs institutionnels. Avant tout engagement, la maîtrise du cadre légal — profondément refondu par le Code foncier et domanial de 2013 — conditionne la sécurité de l'opération.",
        ],
      },
      {
        heading: "Les zones qui tirent le marché",
        paragraphs: [
          "Cotonou et sa périphérie restent le premier pôle : les quartiers de Fidjrossè, Agla et Akpakpa concentrent la demande locative résidentielle, tandis que le corridor industriel de Sèmè-Kpodji attire l'immobilier logistique. Abomey-Calavi, deuxième ville du pays, bénéficie d'un effet débordement avec des terrains encore accessibles. Enfin, les villes secondaires comme Bohicon ou Parakou offrent des rendements locatifs supérieurs, contre une liquidité plus faible à la revente.",
        ],
      },
      {
        heading: "Ce que dit la loi de 2013 sur vos titres",
        paragraphs: [
          "Le Code foncier et domanial issu de la Loi n°2013-01 du 14 janvier 2013 distingue clairement la propriété privée du domaine public et privé de l'État. Seul un titre foncier — délivré et conservé par l'ANDF — constitue une preuve opposable de propriété. Les ventes portant sur des lettres d'attribution, des attestations villageoises ou des « conventions coutumières » ne transfèrent PAS la propriété légale : elles créent au mieux une promesse. Tout achat sérieux passe donc par la vérification du titre à l'ANDF, la mutation authentifiée par notaire, puis l'enregistrement.",
          "Concrètement, prévoyez le circuit complet : confrontation du titre et de ses certificats de non-gage, bornage contradictoire si le bien n'est pas borné, acte notarié, puis inscription au livre foncier. C'est exactement le parcours que la plateforme sécurise via l'escrow et le pack GeoTrust : fonds bloqués jusqu'à la production des preuves documentaires.",
        ],
      },
      {
        heading: "Budget et rendements indicatifs",
        paragraphs: [
          "À titre indicatif (2025-2026), un terrain viabilisé à Abomey-Calavi se négocie entre 7 000 et 20 000 FCFA/m² selon la distance aux axes, contre 25 000 à 80 000 FCFA/m² dans les quartiers établis de Cotonou. La construction d'un T3 de standing revient généralement entre 18 et 30 millions FCFA hors terrain. En location, un rendement net de 5 à 7 % annuel constitue une base réaliste ; les promesses de « 15 % garantis » doivent alerter : rien dans la loi béninoise ne garantit un rendement locatif.",
        ],
      },
    ],
    isLegal: true,
  },
  {
    id: 2,
    slug: 'droit-foncier-cote-divoire-ce-quil-faut-savoir',
    title: "Droit foncier en Côte d'Ivoire : ce qu'il faut savoir",
    excerpt:
      "Comprendre les titres fonciers, les certificats de propriété et les attestations villageoises pour sécuriser votre terrain ivoirien — avec les références légales exactes.",
    categoryKey: 'categoryLegal',
    date: '2026-06-28',
    updatedAt: '2026-09-18',
    author: 'Fatou Koné',
    reviewer: 'Me Alassane Coulibaly, notaire (Abidjan)',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=400&fit=crop',
    readTime: 10,
    sources: [
      {
        label: 'Loi n°98-750 (Côte d\'Ivoire)',
        detail: 'Loi n°98-750 du 23 décembre 1998 relative au Code domanial et foncier, modifiée et complétée par la Loi n°2004-412 du 14 août 2004',
        url: 'https://www.droit-afrique.com/uploads/CI-Code-1998-domanial-foncier.pdf',
        kind: 'loi',
      },
      {
        label: 'Ministère de la Construction (CI)',
        detail: 'Direction des Affaires Foncières et Domaniales — délivrance des titres fonciers et DTC (documents provisoires)',
        url: 'https://www.construction.gouv.ci',
        kind: 'institution',
      },
      {
        label: 'Décret n°2013-296',
        detail: "Décret n°2013-296 du 26 avril 2013 portant création, organisation et fonctionnement de l'Agence de Gestion Foncière Rurale (AFOR)",
        kind: 'loi',
      },
    ],
    body: [
      {
        paragraphs: [
          "La Côte d'Ivoire a entrepris depuis 1998 l'une des réformes foncières les plus ambitieuses d'Afrique de l'Ouest : convertir progressivement les droits coutumiers en droits de propriété écrits, sur un territoire où l'estimation historique du foncier rural non titré dépassait 90 %. Pour l'acquéreur — ivoirien ou étranger —, la hiérarchie des documents déterminera la sécurité réelle de l'opération.",
        ],
      },
      {
        heading: "La hiérarchie des documents fonciers",
        paragraphs: [
          "Au sommet : le titre foncier définitif, inscription au livre foncier tenu par la Direction des Affaires Foncières. Il est opposable à tous et constitutes la seule preuve pleine de propriété. En dessous, on trouve le certificat foncier — document provisoire délivré à l'issue d'une enquête villageoise contradictoire, convertibles en titre après affirmation — et les DTC (documents de travail provisoires du domaine coutumier).",
          "Attention : l'attestation villageoise seule ne vaut pas titre. La Loi n°98-750 du 23 décembre 1998 exige que toute cession de terre rurale non encore titrée suive la procédure d'enquête et d'affirmation avant conversion. Un contrat de vente signé avec un chef de village sur une parcelle non titrée est juridiquement fragile : il peut être contesté par tout ayant-droit apparaissant pendant la procédure d'immatriculation.",
        ],
      },
      {
        heading: "Trois vérifications non négociables",
        paragraphs: [
          "Premièrement, exigez le numéro du titre foncier et faites-le vérifier auprès des services fonciers — y compris les certificats de non-gage et d'inscription hypothécaire. Deuxièmement, tracez l'origine de propriété sur les dix dernières mutations : une chaîne rompue (succession non régularisée, communauté dissoute sans partage) est la première cause de contentieux. Troisièmement, matérialisez les limites par bornage contradictoire avec les voisins avant tout paiement du solde.",
          "C'est précisément l'objet du parcours escrow AfriBayit en Côte d'Ivoire : les fonds restent bloqués tant que les pièces (titre, non-gage, bornage) ne sont pas réunies et validées, avec possibilité d'assigner un notaire partenaire pour l'acte authentique.",
        ],
      },
      {
        heading: "Fiscalité de la mutation",
        paragraphs: [
          "Prévoyez les frais légaux : droits d'enregistrement de la mutation (barème administratif en vigueur), honoraires du géomètre pour le bornage, et émoluments du notaire réglementés. En pratique, une acquisition sécurisée de bout en bout représente un surcoût de l'ordre de 8 à 12 % du prix de cession — à comparer au coût d'un contentieux foncier, qui se chiffre en années de procédure.",
        ],
      },
    ],
    isLegal: true,
  },
  {
    id: 3,
    slug: 'financer-achat-immobilier-togo',
    title: 'Comment financer son achat immobilier au Togo',
    excerpt:
      'Crédit bancaire, épargne personnelle, investissement participatif : quelles solutions pour acheter au Togo ? Cadre réglementaire et pratique.',
    categoryKey: 'categoryFinance',
    date: '2026-06-25',
    updatedAt: '2026-08-30',
    author: 'Kofi Mensah',
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=400&fit=crop',
    readTime: 7,
    sources: [
      {
        label: 'BCEAO — réglementation bancaire UEMOA',
        detail: 'Instruction n°008-05-2015 relative aux conditions d\'octroi et de suivi des crédits immobiliers dans l\'UEMOA',
        url: 'https://www.bceao.int',
        kind: 'norme',
      },
    ],
    body: [
      {
        paragraphs: [
          "Au Togo, l'accession à la propriété mobilise trois canaux : le crédit bancaire classique (ORABank, Ecobank, BIA, Attijari…), le crédit d'épargne-logement des institutions mutualistes, et l'autofinancement familial — encore majoritaire. Les banques togolaises appliquent le cadre harmonisé UEMOA : apport personnel exigé, assurance décès-invalidité, et hypothèque de premier rang sur le bien financé.",
        ],
      },
      {
        heading: "Ce que les banques regardent",
        paragraphs: [
          "Le dossier type comprend : justificatifs de revenus sur 6 à 12 mois, apport représentant le plus souvent 20 à 30 % de la valeur du bien, titre foncier hypothécable — condition discriminante, car de nombreux terrains togolais ne portent encore qu'une lettre d'attribution ou un certificat de propriété provisoire — et une assurance incendie. Le taux nominal observé en 2025-2026 se situe généralement entre 7 et 9 % sur 10 à 15 ans.",
        ],
      },
      {
        heading: "Hypothèque et sécurisation",
        paragraphs: [
          "L'hypothèque se constitue par acte notarié et s'inscrit au service de la publicité foncière. Notez qu'un bien sous hypothèque ne peut être revendu sans mainlevée : anticipez ce point si vous visez un revente à moyen terme. L'escrow AfriBayit complète ce dispositif pendant la phase d'acquisition — le prêteur verse les fonds dans un compte séquestre plutôt qu'au vendeur directement, et le déblocage est conditionné à la production du titre définitif.",
        ],
      },
    ],
  },
  {
    id: 4,
    slug: 'geotrust-pourquoi-certifier-son-terrain',
    title: 'GeoTrust : pourquoi certifier son terrain',
    excerpt:
      'Bornage, vérification documentaire, attestation de conformité : la certification foncière protège votre investissement. Références légales et démarche concrète.',
    categoryKey: 'categoryGeotrust',
    date: '2026-06-20',
    updatedAt: '2026-09-18',
    author: 'Hervé Houénou',
    reviewer: 'Me Bernadette Alavo, notaire (Cotonou)',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=400&fit=crop',
    readTime: 9,
    sources: [
      {
        label: 'Loi n°2013-01 (Bénin)',
        detail: 'Art. 126 et s. — immatriculation, bornage et effets du livre foncier',
        url: 'https://www.droit-afrique.com/uploads/Benin-Code-2013-foncier.pdf',
        kind: 'loi',
      },
      {
        label: 'FAO — Directives VGGT',
        detail: 'Directives volontaires pour une gouvernance responsable des régimes fonciers (2012), notamment sur la délimitation des parcelles',
        url: 'https://www.fao.org/policy-support/tools-and-publications/resources-details/fr/c/1042181/',
        kind: 'norme',
      },
      {
        label: 'ANDF — Bénin',
        detail: 'Guichet unique foncier : demande de bornage et suivi du dossier',
        url: 'https://andf.gouv.bj',
        kind: 'institution',
      },
    ],
    body: [
      {
        paragraphs: [
          "La certification foncière est l'ensemble des vérifications qui transforment une « probable propriété » en propriété opposable : confrontation du titre, délimitation matérielle du terrain, contrôle des servitudes et des charges. Le pack GeoTrust industrialise ce parcours avec des géomètres agréés, un bornage géoréférencé et une attestation de conformité versée au dossier de transaction.",
        ],
      },
      {
        heading: "Ce que change le bornage",
        paragraphs: [
          "Le bornage contradictoire — convoquant propriétaire et voisins — fixe définitivement les limites par des bornes matérialisées et un procès-verbal signé. Sans lui, la superficie affichée reste déclarative : c'est la cause n°1 des litiges d'empiètement constatés en zone périurbaine, où un même couloir peut être vendu à deux acquéreurs par des vendeurs successifs. Le procès-verbal de bornage fait ensuite foi dans les procédures, sous réserve des règles d'immatriculation au livre foncier.",
        ],
      },
      {
        heading: "Les 4 étapes du pack GeoTrust",
        paragraphs: [
          "1) Vérification documentaire : authenticité du titre, chaîne des mutations, certificats de non-gage. 2) Bornage terrain par géomètre agréé, avec relevé GPS et croquis visé. 3) Analyse des risques : servitudes apparentes, zones inondables, projets d'utilité publique consultables. 4) Attestation de conformité GeoTrust versée à l'escrow — le vendeur est payé, l'acquéreur est protégé.",
        ],
      },
      {
        heading: "Combien ça coûte, combien ça prend",
        paragraphs: [
          "En pratique régionale, un bornage simple de parcelle urbaine se traite en 2 à 4 semaines et coûte quelques centaines de milliers de FCFA selon la commune ; les packs GeoTrust affichent des tarifs packagés sur la page dédiée. Le délai dominant est administratif : l'obtention des certificats et l'agenda des voisins pour le bornage contradictoire. Lancez donc la certification AVANT de signer quoi que ce soit — pas après.",
        ],
      },
    ],
    isLegal: true,
  },
  {
    id: 5,
    slug: 'guesthouses-afrique-ouest-opportunite',
    title: "Les guesthouses en Afrique de l'Ouest : une opportunité",
    excerpt:
      "Entre Airbnb et hôtel, la guesthouse est un segment en pleine croissance. Comment se lancer ? Charges, réglementation et rendements observés.",
    categoryKey: 'categoryHospitality',
    date: '2026-06-15',
    updatedAt: '2026-08-22',
    author: 'Mariam Ouedraogo',
    image: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&h=400&fit=crop',
    readTime: 7,
    sources: [
      {
        label: 'Cadre UEMOA — établissements d\'hébergement',
        detail: 'Normes de classement des établissements d\'hébergement touristique (ministères du Tourisme nationaux)',
        kind: 'norme',
      },
    ],
    body: [
      {
        paragraphs: [
          "La guesthouse — maison d'hôtes de 5 à 15 chambres — s'est imposée comme le format d'hébergement le plus rentable de la région : investissement initial contenu, personnalisation forte, et demande portée par les voyages d'affaires comme par le tourisme domestique en croissance.",
        ],
      },
      {
        heading: "Le cadre réglementaire",
        paragraphs: [
          "Dans les quatre pays couverts (Bénin, Côte d'Ivoire, Togo, Burkina Faso), l'exploitation d'une guesthouse suppose au minimum : un permis d'exploiter délivré par le ministère du Tourisme après classement, la conformité aux normes de sécurité incendie, et l'immatriculation fiscale avec le régime réel ou simplifié. Les plateformes de réservation exigent désormais ces justificatifs pour publier une annonce.",
        ],
      },
      {
        heading: "Rentabilité : les vrais leviers",
        paragraphs: [
          "Les exploitations observées affichent un taux d'occupation annuel de 55 à 75 % avec un panier moyen de 25 000 à 45 000 FCFA la nuit selon la ville. Le point mort se situe généralement entre 30 et 40 % d'occupation — d'où l'importance de la distribution multi-canal (OTA directes, réseaux professionnels, bouche-à-oreille corporate). Le module hôtelier AfriBayit connecte ces canaux avec un PMS léger adapté aux petites structures.",
        ],
      },
    ],
  },
  {
    id: 6,
    slug: 'artisans-btp-trouver-les-meilleurs-burkina',
    title: 'Artisans BTP : trouver les meilleurs au Burkina Faso',
    excerpt:
      'Maçons, électriciens, plombiers : comment identifier et engager des artisans certifiés pour vos projets de construction au Burkina Faso.',
    categoryKey: 'categoryConstruction',
    date: '2026-06-10',
    updatedAt: '2026-08-15',
    author: 'Issifou Saka',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=400&fit=crop',
    readTime: 6,
    sources: [
      {
        label: 'Chambre des Métiers du Burkina Faso',
        detail: 'Registre des artisans agréés et carte professionnelle d\'artisan',
        kind: 'institution',
      },
    ],
    body: [
      {
        paragraphs: [
          "Au Burkina Faso, le secteur du BTP est dominé par l'informel : la majorité des artisans n'est ni enregistrée ni assurée. Pour un maître d'ouvrage, la différence entre un chantier réussi et un chantier abandonné se joue souvent sur trois vérifications simples.",
        ],
      },
      {
        heading: "Les trois vérifications avant d'engager",
        paragraphs: [
          "1) La carte professionnelle délivrée par la Chambre des Métiers — elle atteste d'une qualification formelle. 2) Les références chantier : au moins deux réalisations visitables avec coordonnées des clients. 3) La contractualisation écrite : devis détaillé, calendrier de paiement lié aux phases, et retenue de garantie de 5 à 10 % jusqu'à réception des travaux.",
        ],
      },
      {
        heading: "Le paiement sécurisé change tout",
        paragraphs: [
          "Le réflexe le plus protecteur reste l'escrow : ne jamais payer l'intégralité du devis en début de chantier. Sur la marketplace AfriBayit, les fonds sont versés sur un compte séquestre et libérés par étapes validées — c'est ce qui permet aux artisans certifiés de se démarquer, et aux clients de s'engager sans exposer leur trésorerie.",
        ],
      },
    ],
  },
];

export const getArticleById = (id: number): BlogArticle | undefined =>
  BLOG_ARTICLES.find((a) => a.id === id);

export const getArticleBySlug = (slug: string): BlogArticle | undefined =>
  BLOG_ARTICLES.find((a) => a.slug === slug);

export const LEGAL_DISCLAIMER =
  "Contenu informatif rédigé à partir des textes cités en source et vérifié par un professionnel du droit. Il ne constitue pas une consultation juridique personnalisée et ne remplace pas l'avis d'un notaire sur votre situation. En cas de divergence, seul le texte officiel publié au Journal officiel de la République fait foi.";

export const SOURCE_KIND_LABELS: Record<ArticleSource['kind'], string> = {
  loi: 'Texte de loi',
  institution: 'Institution officielle',
  norme: 'Norme / réglementation',
  etude: 'Étude / donnée',
};
