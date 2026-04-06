import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Politique de Confidentialité — AfriBayit",
  description:
    "Découvrez comment AfriBayit collecte, utilise et protège vos données personnelles, en conformité avec le RGPD et les législations africaines applicables.",
};

const sections = [
  {
    id: "collecte",
    title: "1. Collecte des données",
    paragraphs: [
      "AfriBayit collecte des données personnelles vous concernant lorsque vous créez un compte, publiez une annonce, effectuez une transaction ou interagissez avec nos services. Les données collectées comprennent notamment : vos nom, prénom et coordonnées (adresse e-mail, numéro de téléphone), votre adresse postale, vos informations de paiement (de manière sécurisée et partielle), ainsi que les données relatives à votre activité sur la Plateforme (annonces publiées, messages envoyés, transactions réalisées).",
      "Des données sont également collectées automatiquement lors de votre navigation sur la Plateforme, notamment via des cookies et technologies similaires : adresse IP, type de navigateur, pages visitées, durée des sessions, référent. Ces données nous permettent d'améliorer la performance de la Plateforme et de personnaliser votre expérience. Vous pouvez gérer vos préférences en matière de cookies via notre bandeau de consentement ou les paramètres de votre navigateur.",
      "Lorsque vous utilisez nos fonctionnalités de vérification d'identité (KYC — Know Your Customer), nous collectons des copies de documents d'identité officiels ainsi que, le cas échéant, des données biométriques dans le strict respect des réglementations applicables. Ces données sont traitées par un prestataire agréé et ne sont conservées que le temps nécessaire à la finalité pour laquelle elles ont été collectées.",
    ],
  },
  {
    id: "utilisation",
    title: "2. Utilisation des données",
    paragraphs: [
      "Les données personnelles collectées sont utilisées pour les finalités suivantes : la gestion de votre compte et la fourniture des services AfriBayit, le traitement des transactions et la gestion du service Escrow, la vérification de l'identité des utilisateurs professionnels, la personnalisation de votre expérience sur la Plateforme, l'envoi de communications liées à vos activités (confirmations, alertes, notifications de messagerie) et, avec votre consentement, des communications marketing.",
      "Nous utilisons vos données pour améliorer nos algorithmes de recommandation afin de vous proposer des annonces pertinentes selon vos critères de recherche et votre historique. Ces traitements reposent sur des intérêts légitimes d'AfriBayit à améliorer ses services. Vous pouvez à tout moment vous opposer à ce type de traitement en modifiant vos préférences dans les paramètres de votre compte.",
      "AfriBayit ne prend aucune décision automatisée ayant un impact juridique significatif sur les utilisateurs sans intervention humaine. Dans le cas de systèmes de scoring ou de détection de fraude qui pourraient conduire à la suspension d'un compte, un examen humain est systématiquement prévu avant toute mesure définitive.",
    ],
  },
  {
    id: "partage",
    title: "3. Partage des données",
    paragraphs: [
      "AfriBayit ne vend jamais vos données personnelles à des tiers. Vos données peuvent être partagées avec des prestataires de services soigneusement sélectionnés qui agissent en qualité de sous-traitants pour notre compte : hébergeurs de données, prestataires de paiement, services d'envoi d'e-mails et de SMS, outils d'analyse d'audience. Ces prestataires n'utilisent vos données qu'aux fins qui leur sont assignées et sont liés par des obligations contractuelles strictes en matière de confidentialité.",
      "Dans le cadre des transactions immobilières, certaines de vos coordonnées (nom, prénom, numéro de téléphone) peuvent être communiquées à la contrepartie de la transaction (acheteur ou vendeur) après acceptation mutuelle d'une mise en relation. Ces échanges sont régis par les CGU et se font dans le but exclusif de faciliter la réalisation de la transaction.",
      "AfriBayit peut être amenée à communiquer vos données aux autorités compétentes (judiciaires, fiscales, réglementaires) sur réquisition légale, dans le cadre de la lutte contre le blanchiment d'argent ou sur injonction d'un tribunal. Nous notifierons l'utilisateur concerné de toute demande, sauf interdiction légale de le faire.",
    ],
  },
  {
    id: "securite",
    title: "4. Sécurité des données",
    paragraphs: [
      "AfriBayit met en œuvre des mesures techniques et organisationnelles de sécurité conformes aux standards de l'industrie pour protéger vos données contre tout accès non autorisé, perte, destruction ou altération. Ces mesures incluent notamment le chiffrement des données en transit (TLS/HTTPS) et au repos, des contrôles d'accès stricts basés sur le principe du moindre privilège, des audits de sécurité réguliers réalisés par des experts indépendants, et des plans de réponse aux incidents.",
      "Vos mots de passe ne sont jamais stockés en clair dans nos bases de données. Ils font l'objet d'un hachage cryptographique avec sel (algorithme bcrypt ou équivalent). Nous recommandons vivement à tous les utilisateurs d'utiliser des mots de passe uniques et complexes et d'activer l'authentification à deux facteurs (2FA) disponible dans les paramètres de sécurité de votre compte.",
      "En cas de violation de données susceptible d'engendrer un risque élevé pour vos droits et libertés, AfriBayit s'engage à vous en notifier dans les soixante-douze (72) heures suivant la découverte de l'incident, conformément aux obligations du RGPD. Nous informerons également l'autorité de contrôle compétente dans les délais légaux requis.",
    ],
  },
  {
    id: "cookies",
    title: "5. Cookies et technologies de traçage",
    paragraphs: [
      "La Plateforme AfriBayit utilise des cookies et technologies similaires (pixels de tracking, stockage local) pour assurer son fonctionnement technique, mémoriser vos préférences, mesurer l'audience et améliorer nos services. Les cookies strictement nécessaires au fonctionnement du site sont déposés sans consentement préalable. Les cookies analytiques, fonctionnels et marketing sont déposés uniquement après recueil de votre consentement via notre bannière de cookies.",
      "Vous pouvez à tout moment modifier ou retirer votre consentement aux cookies non essentiels en cliquant sur le lien « Gérer mes cookies » présent en bas de chaque page de la Plateforme. Le retrait du consentement ne remet pas en cause la licéité des traitements effectués avant ce retrait. Notez que la désactivation de certains cookies peut affecter le bon fonctionnement de certaines fonctionnalités de la Plateforme.",
      "Nous utilisons Google Analytics pour l'analyse d'audience dans sa configuration respectueuse de la vie privée (anonymisation des IP, durée de conservation des données limitée à 14 mois). Nous n'utilisons pas de cookies de réseaux sociaux tiers sans votre consentement explicite. La liste exhaustive des cookies déposés par AfriBayit et ses partenaires est disponible dans notre politique de gestion des cookies.",
    ],
  },
  {
    id: "droits",
    title: "6. Vos droits (accès, rectification, suppression)",
    paragraphs: [
      "Conformément au RGPD (pour les résidents de l'Union Européenne) et aux législations africaines applicables en matière de protection des données, vous disposez des droits suivants sur vos données personnelles : droit d'accès (obtenir une copie de vos données), droit de rectification (corriger des données inexactes), droit à l'effacement (demander la suppression de vos données dans certains cas), droit à la limitation du traitement, droit à la portabilité des données, et droit d'opposition.",
      "Pour exercer l'un de ces droits, vous pouvez : accéder directement aux paramètres de votre compte pour consulter et modifier vos données personnelles, ou adresser une demande écrite à notre Délégué à la Protection des Données (DPO) à l'adresse privacy@afribayit.com en joignant une copie d'un justificatif d'identité. Nous nous engageons à répondre à votre demande dans un délai maximum d'un (1) mois.",
      "Si vous estimez que vos droits en matière de données personnelles ne sont pas respectés, vous avez le droit d'introduire une réclamation auprès de l'autorité de contrôle compétente dans votre pays de résidence. Pour les résidents de l'UE, il s'agit de la CNIL (France) ou de l'autorité équivalente dans votre État membre. AfriBayit s'engage à coopérer pleinement avec ces autorités.",
    ],
  },
  {
    id: "conservation",
    title: "7. Conservation des données",
    paragraphs: [
      "Vos données personnelles sont conservées pour la durée strictement nécessaire aux finalités pour lesquelles elles ont été collectées. Les données de compte actif sont conservées pendant toute la durée de la relation contractuelle. Après la clôture de votre compte, vos données sont généralement supprimées dans un délai de trente (30) jours, à l'exception des données devant être conservées pour des obligations légales ou la gestion de litiges éventuels.",
      "Les données relatives aux transactions financières sont conservées pendant une durée de dix (10) ans conformément aux obligations comptables et fiscales applicables. Les données de vérification d'identité (KYC) sont conservées pendant cinq (5) ans après la fin de la relation commerciale conformément aux réglementations anti-blanchiment. Les données de navigation sont conservées treize (13) mois maximum.",
      "À l'expiration des durées de conservation, vos données sont soit définitivement supprimées de nos systèmes, soit anonymisées de manière irréversible à des fins statistiques. AfriBayit maintient un registre de ses activités de traitement et des durées de conservation associées, mis à jour régulièrement et disponible sur demande adressée à notre DPO.",
    ],
  },
  {
    id: "transferts",
    title: "8. Transferts internationaux de données",
    paragraphs: [
      "Dans le cadre de ses activités couvrant plusieurs pays africains et pouvant concerner des utilisateurs de l'Union Européenne, AfriBayit peut être amenée à transférer vos données personnelles en dehors de votre pays de résidence. Ces transferts sont encadrés par des garanties appropriées : clauses contractuelles types de la Commission Européenne, règles d'entreprise contraignantes, ou décisions d'adéquation lorsqu'elles existent.",
      "Nos principaux sous-traitants hébergent les données sur des serveurs situés en Europe (Union Européenne) et en Afrique de l'Ouest. La liste des pays de destination des transferts de données ainsi que les garanties associées sont disponibles sur demande adressée à notre DPO. AfriBayit veille à ce que ses partenaires offrent un niveau de protection équivalent à celui exigé par le RGPD.",
      "En cas de transfert vers un pays ne bénéficiant pas d'une décision d'adéquation de la Commission Européenne, AfriBayit met en place des clauses contractuelles types (CCT) approuvées par la Commission, assurant ainsi un niveau de protection suffisant pour vos données personnelles. Ces mesures font l'objet d'un réexamen régulier à la lumière des évolutions législatives et jurisprudentielles.",
    ],
  },
  {
    id: "contact-dpo",
    title: "9. Contact — Délégué à la Protection des Données",
    paragraphs: [
      "AfriBayit a désigné un Délégué à la Protection des Données (DPO) chargé de veiller au respect de la réglementation en matière de protection des données au sein de l'entreprise et de répondre aux demandes des utilisateurs concernant leurs données personnelles. Le DPO est votre interlocuteur privilégié pour toute question relative à la présente Politique de Confidentialité.",
      "Vous pouvez contacter notre DPO aux coordonnées suivantes : par e-mail à privacy@afribayit.com (délai de réponse : 5 jours ouvrés), par courrier postal à l'attention du DPO, AfriBayit SAS, BP 1234, Cotonou, République du Bénin. Pour les demandes urgentes concernant une violation de données ou une situation nécessitant une action immédiate, nous vous invitons à utiliser l'adresse e-mail dédiée.",
      "La présente Politique de Confidentialité est susceptible d'être mise à jour périodiquement afin de refléter les évolutions de nos pratiques ou des réglementations applicables. Nous vous informerons de toute modification substantielle par e-mail ou via une notification sur la Plateforme au moins trente (30) jours avant l'entrée en vigueur des nouvelles dispositions. Nous vous encourageons également à consulter régulièrement cette page.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Page Header */}
      <div className="bg-[#003087] py-14">
        <div className="container-app">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-blue-800 text-blue-100 text-xs font-semibold px-3 py-1 rounded-full">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                  clipRule="evenodd"
                />
              </svg>
              Conforme RGPD
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Politique de Confidentialité
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
              <div className="mt-5 pt-5 border-t border-gray-200">
                <a
                  href="mailto:privacy@afribayit.com"
                  className="block w-full text-center text-sm bg-[#003087] text-white rounded-lg px-3 py-2.5 hover:bg-[#002070] transition-colors font-medium"
                >
                  Contacter le DPO
                </a>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <article className="flex-1 min-w-0">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-10">
              <h2 className="text-sm font-semibold text-[#003087] mb-2">
                Votre vie privée nous tient à cœur
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                AfriBayit s&apos;engage à protéger vos données personnelles et
                à respecter votre vie privée. Cette politique explique quelles
                données nous collectons, comment nous les utilisons et vos
                droits. Pour toute question :{" "}
                <a
                  href="mailto:privacy@afribayit.com"
                  className="text-[#0070BA] hover:underline font-medium"
                >
                  privacy@afribayit.com
                </a>
              </p>
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

            {/* Rights summary box */}
            <div className="mt-12 bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-bold text-[#003087] mb-4">
                Résumé de vos droits RGPD
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  "Droit d'accès",
                  "Droit de rectification",
                  "Droit à l'effacement",
                  "Droit à la portabilité",
                  "Droit d'opposition",
                  "Droit à la limitation",
                ].map((right) => (
                  <div
                    key={right}
                    className="flex items-center gap-2 text-sm text-gray-700"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#0070BA] shrink-0" />
                    {right}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Exercez vos droits à tout moment :{" "}
                <a
                  href="mailto:privacy@afribayit.com"
                  className="text-[#0070BA] hover:underline"
                >
                  privacy@afribayit.com
                </a>
              </p>
            </div>

            {/* Footer note */}
            <div className="mt-10 pt-8 border-t border-gray-200 text-sm text-gray-500 space-y-2">
              <p>
                Voir aussi nos{" "}
                <Link
                  href="/terms"
                  className="text-[#0070BA] hover:underline"
                >
                  Conditions Générales d&apos;Utilisation
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
