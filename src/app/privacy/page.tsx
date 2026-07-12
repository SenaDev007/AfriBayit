import React from 'react';
import type { Metadata } from 'next';
import { Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — AfriBayit',
  description:
    'Politique de Confidentialité de la plateforme AfriBayit. Découvrez comment nous collectons, utilisons et protégeons vos données personnelles.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#003087] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-[#D4AF37]" />
            <h1 className="text-3xl md:text-4xl font-display font-bold">
              Politique de Confidentialité
            </h1>
          </div>
          <p className="text-white/70 text-sm">
            Dernière mise à jour : 2 juin 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-8">

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mt-0 mb-4">
              1. Introduction
            </h2>
            <p>
              AfriBayit (ci-après &quot;nous&quot;, &quot;notre&quot; ou &quot;la Plateforme&quot;) s&apos;engage à protéger la vie privée et les données personnelles de ses Utilisateurs. La présente Politique de Confidentialité décrit les types de données que nous collectons, les finalités de cette collecte, la manière dont nous les utilisons, les partageons et les protégeons, ainsi que les droits dont vous disposez.
            </p>
            <p>
              Cette politique s&apos;applique à l&apos;ensemble des services proposés par AfriBayit, y compris le site web (<a href="https://afri-bayit.vercel.app" className="text-[#003087] underline">https://afri-bayit.vercel.app</a>), l&apos;application progressive (PWA), les interfaces USSD et les API associées. Elle est conforme aux législations sur la protection des données en vigueur dans les pays couverts : Bénin (Loi n°2009-09), Côte d&apos;Ivoire (Loi n°2013-451), Burkina Faso (Loi n°061-2008/AN), Togo (Loi n°2019-014) et Sénégal (Loi n°2008-12).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              2. Données Collectées
            </h2>
            <p>Nous collectons les catégories de données suivantes :</p>

            <h3 className="text-xl font-display font-semibold text-[#003087] mt-6 mb-3">
              2.1 Données fournies directement
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Données d&apos;identification :</strong> nom, prénom, adresse e-mail, numéro de téléphone, photo de profil</li>
              <li><strong>Données de vérification (KYC) :</strong> pièce d&apos;identité (CNI, passeport, permis de conduire), justificatif de domicile, documents professionnels (registre de commerce, certificat de notaire)</li>
              <li><strong>Données de publication :</strong> descriptions de biens, photos, prix, localisation, documents légaux (titres fonciers, ACD, permis de construire)</li>
              <li><strong>Données financières :</strong> informations de paiement, historique des transactions, numéros de compte Mobile Money</li>
            </ul>

            <h3 className="text-xl font-display font-semibold text-[#003087] mt-6 mb-3">
              2.2 Données collectées automatiquement
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Données de connexion :</strong> adresse IP, type et version de navigateur, système d&apos;exploitation, pages visitées, date et heure d&apos;accès</li>
              <li><strong>Données de localisation :</strong> position géographique (avec votre consentement) pour les recherches de biens à proximité</li>
              <li><strong>Données d&apos;utilisation :</strong> recherches effectuées, annonces consultées, interactions avec Rebecca IA</li>
              <li><strong>Cookies et technologies similaires :</strong> cookies de session, cookies de préférences, cookies analytiques (voir section Cookies)</li>
            </ul>

            <h3 className="text-xl font-display font-semibold text-[#003087] mt-6 mb-3">
              2.3 Données provenant de tiers
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Fournisseurs d&apos;authentification :</strong> lorsque vous vous connectez via Google ou Facebook, nous recevons les informations de profil que vous avez autorisées (nom, e-mail, photo)</li>
              <li><strong>Partenaires de paiement :</strong> FedaPay et Stripe nous communiquent le statut de vos paiements et identifiants de transaction</li>
              <li><strong>Partenaires OTA :</strong> nos plateformes partenaires OTA nous transmettent les données de réservation nécessaires à la synchronisation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              3. Finalités du Traitement
            </h2>
            <p>Vos données personnelles sont traitées pour les finalités suivantes :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Fourniture des services :</strong> création et gestion de compte, publication d&apos;annonces, recherche de biens, transactions et escrow</li>
              <li><strong>Vérification d&apos;identité :</strong> conformité aux obligations KYC/AML, analyse documentaire par IA (OCR, authentification)</li>
              <li><strong>Sécurité :</strong> détection de fraude, vérification GeoTrust, protection contre les usages abusifs, hachage Argon2id des mots de passe</li>
              <li><strong>Communication :</strong> notifications transactionnelles, alertes immobilières, messages de Rebecca IA, notifications push et temps réel</li>
              <li><strong>Amélioration des services :</strong> analyse d&apos;utilisation, scoring AVM, calcul de scores d&apos;investissement, recommandations personnalisées</li>
              <li><strong>Conformité légale :</strong> respect des obligations réglementaires locales et internationales, conservation légale des données de transaction</li>
              <li><strong>Multi-tenant :</strong> isolation des données par pays de résidence pour le respect des juridictions locales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              4. Base Légale du Traitement
            </h2>
            <p>Le traitement de vos données repose sur les bases légales suivantes :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Exécution du contrat :</strong> fourniture des services demandés (compte, escrow, recherche)</li>
              <li><strong>Consentement :</strong> cookies non essentiels, notifications push, partage avec des tiers optionnels</li>
              <li><strong>Obligation légale :</strong> vérification KYC/AML, conservation des données de transaction, signalement obligatoire</li>
              <li><strong>Intérêt légitime :</strong> sécurité de la Plateforme, détection de fraude, amélioration des services, communications commerciales raisonnablement attendues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              5. Partage des Données
            </h2>
            <p>Vos données personnelles peuvent être partagées avec :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Autres Utilisateurs :</strong> informations de profil et de contact dans le cadre de transactions (vendeur/acheteur, client/artisan)</li>
              <li><strong>Partenaires de paiement :</strong> FedaPay (BJ, CI, TG, BF) et Stripe (international) pour le traitement des paiements et virements</li>
              <li><strong>Notaires et professionnels :</strong> documents transactionnels nécessaires à la finalisation des actes</li>
              <li><strong>Partenaires OTA :</strong> nos plateformes partenaires OTA pour la synchronisation des réservations hôtelières</li>
              <li><strong>Fournisseurs de services techniques :</strong> hébergement (Neon, Vercel), cache (Upstash Redis), temps réel (Pusher), cartes (Mapbox)</li>
              <li><strong>Autorités compétentes :</strong> sur réquisition légale, dans le cadre d&apos;enquêtes ou d&apos;obligations réglementaires</li>
            </ul>
            <p>
              Nous ne vendons jamais vos données personnelles à des tiers à des fins publicitaires. Le partage est toujours limité au strict nécessaire pour les finalités décrites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              6. Sécurité des Données
            </h2>
            <p>Nous mettons en oeuvre les mesures de sécurité suivantes :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Chiffrement :</strong> TLS/HTTPS pour toutes les communications, chiffrement AES-256-GCM pour les données sensibles au repos</li>
              <li><strong>Hachage des mots de passe :</strong> Argon2id avec paramètres OWASP (64 Mo mémoire, 3 itérations, 4 parallélismes)</li>
              <li><strong>Isolation multi-tenant :</strong> Row-Level Security (RLS) PostgreSQL avec filtrage automatique par pays</li>
              <li><strong>Authentification :</strong> JWT RS256, sessions sécurisées, authentification à deux facteurs (2FA)</li>
              <li><strong>Limitation d&apos;accès :</strong> contrôle d&apos;accès basé sur les rôles (RBAC), accès minimum nécessaire</li>
              <li><strong>Rate limiting :</strong> protection contre les attaques par force brute et les abus d&apos;API</li>
              <li><strong>Détection de fraude :</strong> système IA avec scoring de risque et révision humaine</li>
              <li><strong>Infrastructure :</strong> hébergement sur des plateformes certifiées (Vercel SOC 2, Neon SOC 2)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              7. Conservation des Données
            </h2>
            <p>Les données personnelles sont conservées pour les durées suivantes :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Données de compte :</strong> durée de l&apos;inscription + 3 ans après la dernière connexion</li>
              <li><strong>Données de transaction :</strong> 10 ans conformément aux obligations comptables et fiscales</li>
              <li><strong>Données KYC :</strong> 5 ans après la fin de la relation commerciale, conformément aux obligations AML</li>
              <li><strong>Logs de connexion :</strong> 1 an</li>
              <li><strong>Cookies de session :</strong> durée de la session</li>
              <li><strong>Cookies de préférences :</strong> 1 an</li>
            </ul>
            <p>
              Au-delà de ces durées, les données sont anonymisées ou supprimées de manière sécurisée.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              8. Cookies et Technologies de Suivi
            </h2>
            <p>La Plateforme utilise les types de cookies suivants :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement de la Plateforme (session, authentification, préférence de pays). Aucun consentement requis.</li>
              <li><strong>Cookies fonctionnels :</strong> préférences d&apos;affichage, langue, devise. Consentement requis.</li>
              <li><strong>Cookies analytiques :</strong> mesure d&apos;audience et d&apos;utilisation. Consentement requis.</li>
              <li><strong>Cookies de tiers :</strong> Google (authentification), Facebook (authentification), Mapbox (cartes). Soumis aux politiques de confidentialité respectives.</li>
            </ul>
            <p>
              Vous pouvez gérer vos préférences de cookies à tout moment via les paramètres de votre navigateur. La désactivation de certains cookies peut affecter le fonctionnement de la Plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              9. Intelligence Artificielle et Rebecca
            </h2>
            <p>
              La Plateforme utilise l&apos;intelligence artificielle pour plusieurs fonctionnalités :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Rebecca IA :</strong> assistant conversationnel qui traite vos messages pour fournir des conseils immobiliers, des simulations financières et de l&apos;accompagnement escrow. Les conversations sont stockées pour améliorer le service et la qualité des réponses.</li>
              <li><strong>Analyse documentaire (OCR) :</strong> vos documents KYC sont analysés par IA pour l&apos;extraction de champs, la vérification d&apos;authenticité et la détection de falsification. Les images sont traitées et non stockées par le fournisseur d&apos;IA.</li>
              <li><strong>Scoring immobilier :</strong> AVM (Automated Valuation Model), score d&apos;investissement et détection de fraude utilisent des algorithmes d&apos;analyse basés sur les données de la Plateforme.</li>
              <li><strong>ProMatch :</strong> mise en relation intelligente entre besoins et artisans/professionnels.</li>
            </ul>
            <p>
              Les décisions significatives prises sur la base de l&apos;IA (validation KYC, détection de fraude) peuvent faire l&apos;objet d&apos;une révision humaine sur demande.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              10. Vos Droits
            </h2>
            <p>Conformément aux législations locales, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes</li>
              <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données, sous réserve des obligations légales de conservation</li>
              <li><strong>Droit à la limitation :</strong> restreindre le traitement de vos données dans certains cas</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et couramment utilisé</li>
              <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement basé sur l&apos;intérêt légitime</li>
              <li><strong>Droit de retirer votre consentement :</strong> pour les traitements basés sur le consentement, sans affecter la licéité du traitement antérieur</li>
              <li><strong>Droit d&apos;introduire une réclamation :</strong> auprès de l&apos;autorité de protection des données compétente dans votre pays</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à <strong>contact@afribayit.com</strong>. Nous répondrons dans un délai maximum de 30 jours. Une pièce d&apos;identité pourra vous être demandée pour vérifier votre identité.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              11. Transferts Internationaux
            </h2>
            <p>
              Vos données peuvent être transférées vers des serveurs situés en dehors de votre pays de résidence, notamment vers l&apos;Union européenne (bases de données Neon en Allemagne) et les États-Unis (services Vercel, Pusher, Stripe). Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types, décisions d&apos;adéquation) et les données restent protégées conformément à la présente politique.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              12. Données des Mineurs
            </h2>
            <p>
              La Plateforme n&apos;est pas destinée aux personnes de moins de 18 ans. Nous ne collectons pas sciemment de données personnelles auprès de mineurs. Si vous êtes un parent ou tuteur et que vous pensez que votre enfant nous a fourni des données, contactez-nous pour les faire supprimer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              13. Modifications
            </h2>
            <p>
              Nous pouvons mettre à jour la présente Politique de Confidentialité périodiquement. Les modifications significatives seront notifiées par e-mail ou via un avis sur la Plateforme. Nous vous encourageons à consulter régulièrement cette page. L&apos;utilisation continue de la Plateforme après la publication des modifications vaut acceptation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              14. Contact
            </h2>
            <p>
              Pour toute question relative à la présente Politique de Confidentialité ou pour exercer vos droits :
            </p>
            <ul className="list-none pl-0 space-y-2">
              <li><strong>E-mail :</strong> contact@afribayit.com</li>
              <li><strong>Téléphone :</strong> +229 97 00 00 00</li>
              <li><strong>Adresse :</strong> Cotonou, Bénin</li>
              <li><strong>Site web :</strong> <a href="https://afri-bayit.vercel.app" className="text-[#003087] underline">https://afri-bayit.vercel.app</a></li>
            </ul>

            <div className="mt-6 p-4 rounded-xl bg-[#003087]/5 border border-[#003087]/10">
              <p className="text-sm text-gray-600">
                <strong>Autorités de protection des données par pays :</strong>
              </p>
              <ul className="list-disc pl-6 text-sm text-gray-600 mt-2 space-y-1">
                <li>Bénin : Autorité de Protection des Données Personnelles (APDP)</li>
                <li>Côte d&apos;Ivoire : Autorité de Régulation des Télécommunications de Côte d&apos;Ivoire (ARTCI)</li>
                <li>Burkina Faso : Commission Nationale de l&apos;Informatique et des Libertés (CNIL-BF)</li>
                <li>Togo : Autorité de Protection des Données à Caractère Personnel (APDCP)</li>
                <li>Sénégal : Commission des Données Personnelles (CDP)</li>
              </ul>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
