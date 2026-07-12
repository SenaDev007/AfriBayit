import React from 'react';
import type { Metadata } from 'next';
import { FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — AfriBayit",
  description:
    "Conditions Générales d'Utilisation de la plateforme AfriBayit, plateforme immobilière panafricaine.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#003087] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-[#D4AF37]" />
            <h1 className="text-3xl md:text-4xl font-display font-bold">
              Conditions Générales d&apos;Utilisation
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
              1. Objet
            </h2>
            <p>
              Les présentes Conditions Générales d&apos;Utilisation (ci-après &quot;CGU&quot;) régissent l&apos;utilisation de la plateforme AfriBayit (ci-après la &quot;Plateforme&quot;), accessible à l&apos;adresse <a href="https://afri-bayit.vercel.app" className="text-[#003087] underline">https://afri-bayit.vercel.app</a> et ses éventuels sous-domaines pays (bj.afribayit.com, ci.afribayit.com, etc.). AfriBayit est une plateforme immobilière panafricaine de nouvelle génération qui met en relation des vendeurs, acheteurs, locataires, artisans, notaires et autres professionnels de l&apos;immobilier en Afrique de l&apos;Ouest.
            </p>
            <p>
              En accédant à la Plateforme ou en utilisant ses services, vous reconnaissez avoir lu, compris et accepté les présentes CGU sans réserve. Si vous n&apos;acceptez pas ces conditions, vous devez cesser toute utilisation de la Plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              2. Définitions
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>&quot;Plateforme&quot;</strong> désigne l&apos;ensemble des services web et mobiles proposés par AfriBayit, incluant le site internet, l&apos;application progressive (PWA) et les interfaces USSD.</li>
              <li><strong>&quot;Utilisateur&quot;</strong> désigne toute personne physique ou morale qui accède à la Plateforme, qu&apos;elle soit inscrite ou non.</li>
              <li><strong>&quot;Vendeur&quot;</strong> désigne un Utilisateur inscrit qui publie une annonce de vente ou de location de bien immobilier.</li>
              <li><strong>&quot;Acheteur&quot;</strong> désigne un Utilisateur inscrit qui manifeste un intérêt pour l&apos;acquisition ou la location d&apos;un bien.</li>
              <li><strong>&quot;Escrow&quot;</strong> désigne le service de séquestre sécurisé de fonds proposé par AfriBayit pour les transactions immobilières.</li>
              <li><strong>&quot;Rebecca IA&quot;</strong> désigne l&apos;assistant conversationnel intelligent de la Plateforme, alimenté par intelligence artificielle.</li>
              <li><strong>&quot;GeoTrust&quot;</strong> désigne le service de vérification géographique et de détection de conflits fonciers de la Plateforme.</li>
              <li><strong>&quot;ProMatch&quot;</strong> désigne le service de mise en relation avec des artisans et professionnels qualifiés.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              3. Inscription et Compte Utilisateur
            </h2>
            <p>
              L&apos;utilisation de certaines fonctionnalités de la Plateforme nécessite la création d&apos;un compte. L&apos;inscription est ouverte à toute personne physique âgée d&apos;au moins 18 ans et toute personne morale légalement constituée. Lors de l&apos;inscription, l&apos;Utilisateur s&apos;engage à fournir des informations exactes, complètes et à jour. Toute fausse déclaration entraîne la suspension immédiate du compte.
            </p>
            <p>
              L&apos;Utilisateur peut s&apos;inscrire via adresse e-mail et mot de passe, ou par authentification via Google ou Facebook. L&apos;Utilisateur est seul responsable de la confidentialité de ses identifiants de connexion et de toute activité réalisée depuis son compte. En cas d&apos;utilisation non autorisée, l&apos;Utilisateur doit informer AfriBayit sans délai à l&apos;adresse contact@afribayit.com.
            </p>
            <p>
              AfriBayit se réserve le droit de suspendre ou supprimer tout compte en cas de non-respect des présentes CGU, de comportement frauduleux ou de nuisance à la communauté.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              4. Services Proposés
            </h2>
            <p>AfriBayit propose les services suivants :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Publication d&apos;annonces immobilières</strong> : vente, location et investissement immobilier pour les biens résidentiels, commerciaux et terrains.</li>
              <li><strong>Recherche de biens</strong> : moteur de recherche avancé avec filtrage par pays, ville, quartier, type de bien, budget et critères spécifiques.</li>
              <li><strong>Escrow sécurisé</strong> : séquestre de fonds avec suivi transparent du processus transactionnel, conformément aux réglementations locales.</li>
              <li><strong>GeoTrust</strong> : vérification géographique des biens, détection de conflits fonciers et validation des limites de propriété.</li>
              <li><strong>ProMatch</strong> : mise en relation avec des artisans, géomètres et professionnels du bâtiment vérifiés.</li>
              <li><strong>Rebecca IA</strong> : assistant conversationnel pour la recherche de biens, les simulations financières, les conseils juridiques et l&apos;accompagnement escrow.</li>
              <li><strong>Hôtellerie et Séjours</strong> : réservation d&apos;hôtels, maisons d&apos;hôtes et locations courte durée vérifiées.</li>
              <li><strong>Académie</strong> : formations et certifications immobilières en ligne.</li>
              <li><strong>Notariat</strong> : mise en relation avec des notaires agréés par pays.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              5. Règles de Publication
            </h2>
            <p>
              Tout Utilisateur souhaitant publier une annonce s&apos;engage à respecter les règles suivantes :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Les informations publiées doivent être exactes, véridiques et non trompeuses.</li>
              <li>Le bien doit être légalement disponible à la vente ou à la location.</li>
              <li>Les photos doivent représenter le bien réel et non des images génériques ou trompeuses.</li>
              <li>Le prix affiché doit correspondre au prix réel demandé.</li>
              <li>Les documents légaux requis par pays (titre foncier, ACD, permis de construire, etc.) doivent pouvoir être fournis sur demande.</li>
              <li>Toute annonce suspectée de fraude fera l&apos;objet d&apos;une vérification par le système de détection automatique et pourra être rejetée.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              6. Transactions et Escrow
            </h2>
            <p>
              AfriBayit propose un service de séquestre (Escrow) pour sécuriser les transactions immobilières entre vendeur et acheteur. Le fonctionnement est le suivant :
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>L&apos;Acheteur initialise la transaction et les fonds sont déposés sur le compte Escrow.</li>
              <li>Le Vendeur reçoit une notification de dépôt de fonds.</li>
              <li>Les parties procèdent aux vérifications légales et foncières (GeoTrust, notaire).</li>
              <li>Après validation mutuelle et vérification documentaire, les fonds sont libérés au Vendeur.</li>
              <li>En cas de litige, les fonds restent en séquestre jusqu&apos;à résolution.</li>
            </ol>
            <p>
              AfriBayit perçoit une commission sur chaque transaction complétée, dont le taux est affiché sur la Plateforme au moment de la transaction. Les paiements sont traités via FedaPay (Mobile Money, carte bancaire) ou Stripe (transferts bancaires internationaux).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              7. Paiements et Virements
            </h2>
            <p>
              Les paiements sur la Plateforme sont sécurisés par des partenaires de paiement certifiés (FedaPay, Stripe). Les méthodes acceptées varient par pays et incluent : Mobile Money (MTN MoMo, Orange Money, Moov Money, Wave), cartes bancaires (Visa, Mastercard) et virements bancaires.
            </p>
            <p>
              Les virements automatiques (payouts) aux vendeurs sont traités en J+1 ouvré pour Mobile Money et FedaPay, et en J+3 ouvrés pour les virements bancaires, conformément aux réglementations locales. Les week-ends et jours fériés ne sont pas comptabilisés.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              8. Vérification et KYC
            </h2>
            <p>
              Conformément aux réglementations de lutte contre le blanchiment d&apos;argent (LAB/FT) en vigueur dans les pays couverts, AfriBayit procède à la vérification de l&apos;identité de ses Utilisateurs (KYC - Know Your Customer). Cette vérification peut inclure :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Vérification de pièce d&apos;identité (CNI, passeport, permis de conduire)</li>
              <li>Vérification de justificatif de domicile</li>
              <li>Vérification de documents professionnels (registre de commerce, certificat de notaire)</li>
              <li>Analyse documentaire par intelligence artificielle (OCR et authentification)</li>
            </ul>
            <p>
              L&apos;utilisation des services de transaction et d&apos;escrow est conditionnée à la complétude de la vérification KYC.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              9. Propriété Intellectuelle
            </h2>
            <p>
              L&apos;ensemble des éléments composant la Plateforme (textes, images, logos, marques, logiciels, bases de données, design) sont la propriété exclusive d&apos;AfriBayit ou de ses concédants de licence. Toute reproduction, distribution, modification ou utilisation commerciale de ces éléments sans autorisation préalable écrite est strictement interdite.
            </p>
            <p>
              L&apos;Utilisateur conserve la propriété des contenus qu&apos;il publie sur la Plateforme (annonces, photos, descriptions). En publiant du contenu, l&apos;Utilisateur accorde à AfriBayit une licence non exclusive, mondiale et gratuite pour l&apos;affichage, la reproduction et la distribution de ce contenu dans le cadre du fonctionnement de la Plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              10. Responsabilité
            </h2>
            <p>
              AfriBayit agit en tant que plateforme de mise en relation et ne participe pas directement aux transactions entre Utilisateurs. AfriBayit ne saurait être tenu responsable de l&apos;exactitude des annonces publiées, de la qualité des biens ou services proposés, ni des dommages résultant de transactions entre Utilisateurs.
            </p>
            <p>
              AfriBayit met en oeuvre des systèmes de détection de fraude (analyse IA, GeoTrust) et de vérification documentaire pour minimiser les risques. Toutefois, AfriBayit ne garantit pas l&apos;absence totale de contenus frauduleux ou illicites.
            </p>
            <p>
              En aucun cas, AfriBayit ne saurait être tenu responsable des dommages indirects, pertes de profits, de revenus ou de données résultant de l&apos;utilisation de la Plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              11. Signalement et Modération
            </h2>
            <p>
              Tout Utilisateur peut signaler un contenu ou un comportement inapproprié via les outils de signalement intégrés à la Plateforme ou par e-mail à contact@afribayit.com. AfriBayit s&apos;engage à examiner chaque signalement dans un délai raisonnable et à prendre les mesures nécessaires (retrait de contenu, avertissement, suspension de compte).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              12. Disponibilité des Services
            </h2>
            <p>
              AfriBayit s&apos;efforce de maintenir la Plateforme accessible en continu. Toutefois, des interruptions peuvent survenir pour des raisons de maintenance, de mise à jour, ou en cas de force majeure. AfriBayit ne saurait être tenu responsable de ces interruptions.
            </p>
            <p>
              La Plateforme est accessible via navigateur web, application progressive (PWA) et interface USSD pour les zones à faible connectivité.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              13. Résiliation
            </h2>
            <p>
              L&apos;Utilisateur peut résilier son compte à tout moment en contactant AfriBayit ou via les paramètres de son compte. La résiliation entraîne la suppression de ses données personnelles dans les conditions prévues par la politique de confidentialité, sous réserve des obligations légales de conservation.
            </p>
            <p>
              AfriBayit se réserve le droit de résilier ou suspendre un compte en cas de non-respect des CGU, sans préjudice des dommages et intérêts auxquels AfriBayit pourrait prétendre.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              14. Droit Applicable et Juridiction
            </h2>
            <p>
              Les présentes CGU sont régies par le droit béninois. En cas de litige, les parties s&apos;efforceront de trouver une solution amiable. À défaut, les tribunaux de Cotonou, Bénin, seront seuls compétents pour connaître du litige, sans préjudice des droits des consommateurs de porter le litige devant les juridictions de leur lieu de résidence dans les pays couverts.
            </p>
            <p>
              Pour les Utilisateurs résidant en Côte d&apos;Ivoire, au Burkina Faso, au Togo ou au Sénégal, les dispositions légales locales de protection des consommateurs s&apos;appliquent conformément aux législations nationales en vigueur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              15. Modifications
            </h2>
            <p>
              AfriBayit se réserve le droit de modifier les présentes CGU à tout moment. Les Utilisateurs seront informés des modifications significatives par notification sur la Plateforme ou par e-mail. L&apos;utilisation continue de la Plateforme après la publication des modifications vaut acceptation de celles-ci.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              16. Contact
            </h2>
            <p>
              Pour toute question relative aux présentes CGU, vous pouvez contacter AfriBayit :
            </p>
            <ul className="list-none pl-0 space-y-2">
              <li><strong>E-mail :</strong> contact@afribayit.com</li>
              <li><strong>Téléphone :</strong> +229 97 00 00 00</li>
              <li><strong>Adresse :</strong> Cotonou, Bénin</li>
              <li><strong>Site web :</strong> <a href="https://afri-bayit.vercel.app" className="text-[#003087] underline">https://afri-bayit.vercel.app</a></li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
