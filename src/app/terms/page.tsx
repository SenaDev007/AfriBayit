import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — AfriBayit",
  description:
    "Consultez les conditions générales d'utilisation de la plateforme AfriBayit, le réseau immobilier africain de confiance.",
};

const sections = [
  {
    id: "objet",
    title: "1. Objet et champ d'application",
    paragraphs: [
      "Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») régissent l'accès et l'utilisation de la plateforme AfriBayit (ci-après « la Plateforme »), accessible à l'adresse www.afribayit.com, ainsi que de l'ensemble des services associés proposés par la société AfriBayit SAS, dont le siège social est établi à Cotonou, République du Bénin (ci-après « AfriBayit » ou « la Société »).",
      "En accédant à la Plateforme, en créant un compte ou en utilisant l'un quelconque des services proposés, l'utilisateur reconnaît avoir lu, compris et accepté sans réserve l'intégralité des présentes CGU. Si l'utilisateur n'accepte pas ces conditions, il lui est demandé de cesser immédiatement toute utilisation de la Plateforme.",
      "AfriBayit se réserve le droit de modifier les présentes CGU à tout moment. Les modifications prennent effet dès leur publication sur la Plateforme. Il appartient à chaque utilisateur de consulter régulièrement les CGU afin de prendre connaissance des éventuelles mises à jour. La poursuite de l'utilisation de la Plateforme après publication des modifications vaut acceptation des nouvelles conditions.",
    ],
  },
  {
    id: "inscription",
    title: "2. Inscription et compte utilisateur",
    paragraphs: [
      "L'accès à certaines fonctionnalités de la Plateforme est conditionné à la création d'un compte utilisateur. Pour s'inscrire, l'utilisateur doit être une personne physique majeure capable juridiquement ou une personne morale dûment représentée. L'utilisateur s'engage à fournir des informations exactes, complètes et à jour lors de son inscription et à les maintenir en l'état tout au long de son utilisation.",
      "Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion (adresse e-mail et mot de passe). Il s'engage à ne pas divulguer ces informations à des tiers et à notifier immédiatement AfriBayit de toute utilisation non autorisée de son compte à l'adresse support@afribayit.com. AfriBayit ne saurait être tenu responsable des dommages résultant d'un accès non autorisé au compte d'un utilisateur du fait de la négligence de ce dernier.",
      "AfriBayit se réserve le droit de suspendre ou de supprimer tout compte dont les informations s'avéreraient inexactes, frauduleuses ou contraires aux présentes CGU, sans préavis ni indemnité. Les utilisateurs professionnels (agents immobiliers, promoteurs, gestionnaires) sont soumis à une vérification complémentaire de leur identité et de leurs qualifications avant activation complète de leur compte professionnel.",
    ],
  },
  {
    id: "services",
    title: "3. Services proposés",
    paragraphs: [
      "AfriBayit est une plateforme de mise en relation entre particuliers et professionnels de l'immobilier en Afrique subsaharienne et francophone. La Plateforme propose notamment : la publication et la consultation d'annonces immobilières (vente, location, construction), un système de messagerie sécurisée entre utilisateurs, un service de paiement sécurisé par séquestre (escrow), ainsi qu'une section Academy dédiée à la formation immobilière.",
      "AfriBayit agit en tant qu'intermédiaire technique et ne saurait être considérée comme partie aux transactions conclues entre utilisateurs. La Société ne garantit pas la conclusion des transactions initiées sur la Plateforme et n'est pas responsable des obligations contractuelles nées entre les utilisateurs.",
      "Les services sont accessibles 24h/24 et 7j/7, sous réserve des interruptions nécessaires à la maintenance ou résultant de cas de force majeure. AfriBayit s'efforce de minimiser les interruptions de service et d'en informer les utilisateurs dans les meilleurs délais via les canaux de communication habituels.",
    ],
  },
  {
    id: "obligations",
    title: "4. Obligations des utilisateurs",
    paragraphs: [
      "L'utilisateur s'engage à utiliser la Plateforme dans le strict respect des lois et réglementations en vigueur dans son pays de résidence ainsi que dans les pays concernés par les transactions immobilières. Il s'interdit notamment de publier des annonces frauduleuses, de proposer des biens dont il n'est pas propriétaire ou mandataire légal, et de tromper d'autres utilisateurs sur les caractéristiques essentielles d'un bien.",
      "Il est strictement interdit d'utiliser la Plateforme à des fins de blanchiment d'argent, de financement d'activités illicites ou de fraude fiscale. AfriBayit coopère pleinement avec les autorités compétentes et est susceptible de signaler toute activité suspecte conformément aux réglementations anti-blanchiment applicables dans les juridictions où elle opère.",
      "L'utilisateur s'engage à ne pas perturber le fonctionnement technique de la Plateforme, à ne pas tenter d'accéder à des zones sécurisées sans autorisation et à ne pas introduire de virus, logiciels malveillants ou tout autre code nuisible. Tout manquement à ces obligations peut entraîner la suspension immédiate du compte et des poursuites judiciaires.",
    ],
  },
  {
    id: "commission",
    title: "5. Commission et tarification",
    paragraphs: [
      "L'inscription sur AfriBayit et la consultation des annonces sont gratuites pour les particuliers. La publication d'annonces par des professionnels est soumise à un abonnement mensuel ou annuel dont les tarifs sont détaillés sur la page Tarification de la Plateforme. AfriBayit se réserve le droit de modifier ses tarifs avec un préavis de trente (30) jours communiqué par e-mail à l'adresse enregistrée du compte concerné.",
      "En cas de transaction immobilière finalisée via le service de paiement sécurisé AfriBayit, une commission de service est prélevée sur le montant total de la transaction. Cette commission, dont le taux est précisé lors de la confirmation de chaque transaction, couvre les frais de gestion du séquestre, les vérifications documentaires et l'assistance transactionnelle. Elle est due par le vendeur ou le bailleur, sauf accord contraire expressément mentionné dans le mandat.",
      "Tous les paiements effectués sur la Plateforme sont libellés en Franc CFA (XOF) ou en devise locale selon le pays de la transaction. Les conversions de devises, le cas échéant, sont effectuées selon les taux de change en vigueur au moment de la transaction. AfriBayit ne prend aucune responsabilité quant aux fluctuations de change pouvant affecter le montant final perçu par l'une ou l'autre partie.",
    ],
  },
  {
    id: "escrow",
    title: "6. Escrow et paiements",
    paragraphs: [
      "Le service Escrow AfriBayit est un mécanisme de paiement sécurisé permettant de protéger acheteurs et vendeurs lors des transactions immobilières. Les fonds sont déposés sur un compte séquestre géré par AfriBayit ou par un partenaire financier agréé, et ne sont libérés au vendeur qu'après confirmation de la satisfaction de l'acheteur et vérification du respect des conditions de la transaction.",
      "En cas de litige entre les parties concernant la libération des fonds séquestrés, AfriBayit peut désigner un médiateur indépendant. La procédure de médiation est engagée sur demande écrite de l'une ou l'autre partie. Les frais de médiation sont partagés équitablement entre les parties, sauf décision contraire du médiateur. AfriBayit s'engage à traiter les demandes de médiation dans un délai maximum de quinze (15) jours ouvrés.",
      "Les fonds séquestrés non réclamés à l'issue d'un délai de cent quatre-vingts (180) jours suivant la date prévue de transaction sont remboursés à l'acheteur après déduction des frais administratifs applicables. AfriBayit notifie les parties par e-mail au moins trente (30) jours avant tout remboursement automatique. Le service Escrow est soumis à la réglementation des services financiers en vigueur dans les juridictions opérationnelles d'AfriBayit.",
    ],
  },
  {
    id: "responsabilites",
    title: "7. Responsabilités",
    paragraphs: [
      "AfriBayit met tout en œuvre pour assurer la disponibilité et la fiabilité de la Plateforme, mais ne peut garantir un fonctionnement ininterrompu. La responsabilité d'AfriBayit ne peut être engagée pour les dommages résultant d'une interruption de service, d'une perte de données ou d'une indisponibilité temporaire de la Plateforme, dès lors que ces événements résultent d'un cas de force majeure ou d'une action de tiers.",
      "AfriBayit décline toute responsabilité quant à la véracité des informations publiées par les utilisateurs dans leurs annonces. La Société procède à des vérifications ponctuelles mais ne peut garantir l'exactitude, l'exhaustivité ou la légalité de l'ensemble des contenus publiés. Il appartient à chaque utilisateur de procéder aux vérifications nécessaires avant toute prise de décision d'investissement.",
      "En aucun cas la responsabilité totale d'AfriBayit envers un utilisateur ne pourra excéder le montant des sommes effectivement versées par cet utilisateur à AfriBayit au titre des services souscrits au cours des douze (12) derniers mois précédant le fait générateur du dommage allégué.",
    ],
  },
  {
    id: "donnees",
    title: "8. Protection des données",
    paragraphs: [
      "AfriBayit collecte et traite des données personnelles conformément à sa Politique de Confidentialité, disponible à l'adresse www.afribayit.com/privacy, et dans le respect du Règlement Général sur la Protection des Données (RGPD) pour les résidents de l'Union Européenne, ainsi que des législations nationales applicables en matière de protection des données dans les pays africains où la Plateforme est active.",
      "Les données personnelles collectées sont utilisées exclusivement aux fins décrites dans la Politique de Confidentialité. Elles ne sont jamais vendues à des tiers. L'utilisateur dispose d'un droit d'accès, de rectification, de suppression et de portabilité de ses données, qu'il peut exercer à tout moment en contactant le Délégué à la Protection des Données à l'adresse privacy@afribayit.com.",
      "AfriBayit met en œuvre des mesures techniques et organisationnelles appropriées pour protéger les données personnelles contre tout accès non autorisé, altération, divulgation ou destruction. En cas de violation de données susceptible d'engendrer un risque élevé pour les droits et libertés des utilisateurs, AfriBayit s'engage à notifier les personnes concernées dans les meilleurs délais conformément aux obligations légales applicables.",
    ],
  },
  {
    id: "propriete",
    title: "9. Propriété intellectuelle",
    paragraphs: [
      "L'ensemble des éléments constitutifs de la Plateforme AfriBayit (marque, logo, charte graphique, interface utilisateur, textes, images, vidéos, bases de données, code source, algorithmes) sont la propriété exclusive d'AfriBayit SAS ou de ses partenaires et sont protégés par les lois relatives à la propriété intellectuelle. Toute reproduction, représentation, modification ou exploitation non autorisée de ces éléments est strictement interdite.",
      "Les utilisateurs qui publient des contenus (photos, descriptions, vidéos, avis) sur la Plateforme accordent à AfriBayit une licence non exclusive, mondiale et gratuite d'utilisation, de reproduction et de diffusion de ces contenus aux fins du fonctionnement et de la promotion de la Plateforme. L'utilisateur garantit disposer de tous les droits nécessaires sur les contenus qu'il publie et s'engage à indemniser AfriBayit contre tout recours de tiers.",
      "La marque « AfriBayit » ainsi que les logos associés sont des marques déposées. Toute utilisation de ces marques sans autorisation préalable et écrite d'AfriBayit constitue une contrefaçon susceptible d'engager la responsabilité civile et pénale de son auteur.",
    ],
  },
  {
    id: "resiliation",
    title: "10. Résiliation",
    paragraphs: [
      "L'utilisateur peut à tout moment résilier son compte AfriBayit en accédant aux paramètres de son espace personnel et en suivant la procédure de suppression de compte. La résiliation prend effet immédiatement pour les comptes particuliers. Pour les comptes professionnels disposant d'un abonnement actif, la résiliation prendra effet à l'issue de la période d'abonnement en cours, sans remboursement du prorata.",
      "AfriBayit se réserve le droit de résilier ou de suspendre un compte à tout moment et sans préavis en cas de violation des présentes CGU, de comportement frauduleux, d'atteinte aux droits de tiers ou de non-paiement des sommes dues. Dans les cas de suspension préventive, AfriBayit s'efforcera d'en informer l'utilisateur dans les meilleurs délais et de lui offrir la possibilité de régulariser sa situation.",
      "À la suite de la résiliation d'un compte, les données personnelles de l'utilisateur sont traitées conformément à la Politique de Confidentialité. Certaines données peuvent être conservées pour les durées légalement requises, notamment aux fins de lutte contre la fraude, de respect des obligations fiscales et de règlement de litiges éventuels.",
    ],
  },
  {
    id: "loi",
    title: "11. Loi applicable et juridiction",
    paragraphs: [
      "Les présentes CGU sont régies par le droit béninois et les dispositions applicables du droit OHADA (Organisation pour l'Harmonisation en Afrique du Droit des Affaires). Pour les utilisateurs résidant dans l'Union Européenne, les dispositions impératives du droit de leur pays de résidence s'appliquent également dans la mesure où elles offrent une protection supérieure à celle du droit béninois.",
      "En cas de litige relatif à l'interprétation, à l'exécution ou à la résiliation des présentes CGU, les parties s'engagent à rechercher une solution amiable dans un premier temps. À défaut d'accord amiable dans un délai de trente (30) jours suivant la notification du litige par lettre recommandée avec accusé de réception, le litige sera soumis à la compétence exclusive des tribunaux de Cotonou, République du Bénin.",
      "Si une ou plusieurs dispositions des présentes CGU sont déclarées nulles ou inapplicables par une décision judiciaire, les autres dispositions demeurent pleinement en vigueur. Le fait pour AfriBayit de ne pas se prévaloir d'une disposition des CGU ne saurait constituer une renonciation à s'en prévaloir ultérieurement. Pour toute question relative aux présentes CGU, l'utilisateur peut contacter AfriBayit à l'adresse legal@afribayit.com.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Page Header */}
      <div className="bg-[#003087] py-14">
        <div className="container-app">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="text-blue-200 text-base">
            Dernière mise à jour : 1er janvier 2025
          </p>
        </div>
      </div>

      {/* Body */}
      <main className="flex-1 container-app w-full py-12">
        <div className="flex gap-10">
          {/* Sidebar TOC */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-gray-50 border border-gray-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Table des matières
              </p>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block text-sm text-gray-600 hover:text-[#003087] hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors leading-snug"
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <article className="flex-1 min-w-0">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-10 text-sm text-amber-800">
              <strong>Important :</strong> Veuillez lire attentivement les
              présentes conditions avant d&apos;utiliser AfriBayit. En
              accédant à la Plateforme, vous acceptez d&apos;être lié par
              ces conditions.
            </div>

            <div className="space-y-12">
              {sections.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h2 className="text-xl font-bold text-[#003087] mb-5 pb-3 border-b border-gray-100">
                    {s.title}
                  </h2>
                  <div className="space-y-4">
                    {s.paragraphs.map((p, i) => (
                      <p key={i} className="text-gray-600 leading-relaxed text-[15px]">
                        {p}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Footer note */}
            <div className="mt-14 pt-8 border-t border-gray-200 text-sm text-gray-500 space-y-2">
              <p>
                Pour toute question relative aux présentes CGU, contactez-nous à{" "}
                <a
                  href="mailto:legal@afribayit.com"
                  className="text-[#0070BA] hover:underline"
                >
                  legal@afribayit.com
                </a>
              </p>
              <p>
                Voir aussi notre{" "}
                <Link
                  href="/privacy"
                  className="text-[#0070BA] hover:underline"
                >
                  Politique de Confidentialité
                </Link>
                .
              </p>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
