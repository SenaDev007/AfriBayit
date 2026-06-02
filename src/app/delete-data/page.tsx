import React from 'react';
import type { Metadata } from 'next';
import { Trash2, Mail, Phone, Clock, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Suppression de vos données — AfriBayit',
  description:
    'Instructions pour demander la suppression de vos données personnelles sur la plateforme AfriBayit.',
};

export default function DeleteDataPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-[#003087] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-8 h-8 text-[#D4AF37]" />
            <h1 className="text-3xl md:text-4xl font-display font-bold">
              Suppression de vos données personnelles
            </h1>
          </div>
          <p className="text-white/70 text-sm">
            Dernière mise à jour : 2 juin 2026
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-8">

          {/* Intro banner */}
          <div className="p-5 rounded-xl bg-[#003087]/5 border border-[#003087]/10">
            <p className="text-gray-700 font-medium">
              Conformément aux législations sur la protection des données en vigueur dans les pays couverts par AfriBayit (Bénin, Côte d&apos;Ivoire, Burkina Faso, Togo, Sénégal), vous disposez du droit de demander la suppression de vos données personnelles. Cette page vous guide à travers le processus.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mt-0 mb-4">
              1. Quelles données pouvez-vous demander à supprimer ?
            </h2>
            <p>
              Vous pouvez demander la suppression de tout ou partie des données personnelles que nous détenons vous concernant, incluant :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Données de profil :</strong> nom, prénom, adresse e-mail, numéro de téléphone, photo de profil</li>
              <li><strong>Données de vérification (KYC) :</strong> copies de pièces d&apos;identité, justificatifs de domicile, documents professionnels</li>
              <li><strong>Données de publication :</strong> annonces immobilières, photos de biens, descriptions</li>
              <li><strong>Données de conversation :</strong> historique des échanges avec Rebecca IA</li>
              <li><strong>Données de localisation :</strong> historique des recherches géolocalisées</li>
              <li><strong>Données de connexion :</strong> adresses IP, logs de connexion, données de navigateur</li>
              <li><strong>Comptes OAuth liés :</strong> association Google ou Facebook à votre compte AfriBayit</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              2. Données pouvant être conservées
            </h2>
            <p>
              Certaines données ne peuvent pas être supprimées immédiatement en raison d&apos;obligations légales :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Données de transaction :</strong> conservées 10 ans conformément aux obligations comptables et fiscales</li>
              <li><strong>Données KYC :</strong> conservées 5 ans après la fin de la relation commerciale, conformément aux obligations anti-blanchiment (AML/LAB)</li>
              <li><strong>Données en cours de litige :</strong> conservées jusqu&apos;à résolution du litige</li>
              <li><strong>Données anonymisées :</strong> les données rendues anonymes (ne permettant plus de vous identifier) peuvent être conservées à des fins statistiques</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              3. Comment demander la suppression de vos données
            </h2>

            <h3 className="text-xl font-display font-semibold text-[#003087] mt-6 mb-3">
              Méthode 1 : Depuis votre compte AfriBayit
            </h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Connectez-vous à votre compte sur <a href="https://afri-bayit.vercel.app" className="text-[#003087] underline">afri-bayit.vercel.app</a></li>
              <li>Accédez à votre page <strong>Profil</strong></li>
              <li>Cliquez sur <strong>Paramètres du compte</strong></li>
              <li>Sélectionnez <strong>Supprimer mon compte et mes données</strong></li>
              <li>Confirmez votre demande en saisissant votre mot de passe</li>
            </ol>

            <h3 className="text-xl font-display font-semibold text-[#003087] mt-6 mb-3">
              Méthode 2 : Par e-mail
            </h3>
            <p>Envoyez un e-mail à <strong>contact@afribayit.com</strong> avec les informations suivantes :</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Objet : <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">Demande de suppression de données personnelles</code></li>
              <li>Votre adresse e-mail associée au compte AfriBayit</li>
              <li>Une copie de votre pièce d&apos;identité (pour vérification)</li>
              <li>La liste des données que vous souhaitez supprimer (ou &quot;toutes mes données&quot;)</li>
            </ul>

            <h3 className="text-xl font-display font-semibold text-[#003087] mt-6 mb-3">
              Méthode 3 : Par téléphone
            </h3>
            <p>
              Appelez le <strong>+229 97 00 00 00</strong> du lundi au vendredi, de 8h à 18h (heure de Cotonou). Un conseiller vous guidera dans le processus de suppression.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              4. Processus de traitement
            </h2>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="p-4 rounded-xl bg-[#003087]/5 text-center">
                <div className="w-10 h-10 rounded-full bg-[#003087] text-white flex items-center justify-center mx-auto mb-2 text-sm font-bold">1</div>
                <p className="text-sm font-semibold text-[#003087]">Réception</p>
                <p className="text-xs text-gray-500 mt-1">Accusé de réception sous 24h</p>
              </div>
              <div className="p-4 rounded-xl bg-[#003087]/5 text-center">
                <div className="w-10 h-10 rounded-full bg-[#003087] text-white flex items-center justify-center mx-auto mb-2 text-sm font-bold">2</div>
                <p className="text-sm font-semibold text-[#003087]">Vérification</p>
                <p className="text-xs text-gray-500 mt-1">Confirmation de votre identité</p>
              </div>
              <div className="p-4 rounded-xl bg-[#003087]/5 text-center">
                <div className="w-10 h-10 rounded-full bg-[#003087] text-white flex items-center justify-center mx-auto mb-2 text-sm font-bold">3</div>
                <p className="text-sm font-semibold text-[#003087]">Traitement</p>
                <p className="text-xs text-gray-500 mt-1">Suppression sous 30 jours</p>
              </div>
              <div className="p-4 rounded-xl bg-[#003087]/5 text-center">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-white flex items-center justify-center mx-auto mb-2 text-sm font-bold">4</div>
                <p className="text-sm font-semibold text-[#003087]">Confirmation</p>
                <p className="text-xs text-gray-500 mt-1">Notification de suppression</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              5. Conséquences de la suppression
            </h2>
            <p>
              La suppression de vos données personnelles entraîne les conséquences suivantes :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Fermeture du compte :</strong> votre compte AfriBayit sera définitivement fermé et ne pourra pas être restauré</li>
              <li><strong>Suppression des annonces :</strong> toutes vos annonces immobilières actives seront supprimées</li>
              <li><strong>Annulation des transactions en cours :</strong> les transactions en cours dans l&apos;escrow seront finalisées ou annulées avant suppression</li>
              <li><strong>Perte de l&apos;historique :</strong> vos conversations avec Rebecca IA et l&apos;historique de recherche seront supprimés</li>
              <li><strong>Déconnexion OAuth :</strong> l&apos;association avec votre compte Google ou Facebook sera rompue</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              6. Délais de traitement
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#003087] text-white">
                    <th className="text-left p-3 rounded-tl-lg">Type de données</th>
                    <th className="text-left p-3">Délai de suppression</th>
                    <th className="text-left p-3 rounded-tr-lg">Conditions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="p-3 font-medium">Données de profil</td>
                    <td className="p-3">30 jours</td>
                    <td className="p-3 text-gray-500">Après vérification d&apos;identité</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="p-3 font-medium">Documents KYC</td>
                    <td className="p-3">30 jours</td>
                    <td className="p-3 text-gray-500">Sauf obligation légale AML (5 ans)</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-3 font-medium">Annonces et photos</td>
                    <td className="p-3">Immédiat</td>
                    <td className="p-3 text-gray-500">À la demande</td>
                  </tr>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <td className="p-3 font-medium">Données de transaction</td>
                    <td className="p-3">Après obligation légale (10 ans)</td>
                    <td className="p-3 text-gray-500">Conservation fiscale obligatoire</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-3 font-medium">Conversations Rebecca IA</td>
                    <td className="p-3">30 jours</td>
                    <td className="p-3 text-gray-500">Suppression complète</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium">Compte OAuth (Google/Facebook)</td>
                    <td className="p-3">Immédiat</td>
                    <td className="p-3 text-gray-500">Dissociation automatique</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              7. Données stockées par des tiers
            </h2>
            <p>
              Certaines de vos données peuvent avoir été partagées avec des partenaires tiers dans le cadre du fonctionnement de la Plateforme. Nous transmettrons votre demande de suppression aux tiers suivants :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google / Facebook :</strong> suppression de l&apos;association OAuth. Vous pouvez également révoquer l&apos;accès directement depuis vos paramètres Google/Facebook.</li>
              <li><strong>FedaPay / Stripe :</strong> les données de paiement sont soumises aux obligations bancaires et ne peuvent être supprimées qu&apos;après la période de conservation légale.</li>
              <li><strong>Vercel / Neon :</strong> les données d&apos;hébergement et de base de données sont supprimées conformément à notre politique de conservation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-display font-bold text-[#003087] mb-4">
              8. Contact
            </h2>
            <p>
              Pour toute question ou demande concernant la suppression de vos données :
            </p>
            <div className="grid gap-4 md:grid-cols-2 mt-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
                <Mail className="w-5 h-5 text-[#D4AF37] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#003087] text-sm">E-mail</p>
                  <a href="mailto:contact@afribayit.com" className="text-sm text-[#003087] underline">
                    contact@afribayit.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
                <Phone className="w-5 h-5 text-[#D4AF37] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#003087] text-sm">Téléphone</p>
                  <p className="text-sm text-gray-600">+229 97 00 00 00</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
                <Clock className="w-5 h-5 text-[#D4AF37] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#003087] text-sm">Horaires</p>
                  <p className="text-sm text-gray-600">Lun-Ven, 8h-18h (GMT+1)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50">
                <ShieldCheck className="w-5 h-5 text-[#D4AF37] mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-[#003087] text-sm">Délai de réponse</p>
                  <p className="text-sm text-gray-600">Maximum 30 jours</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <p className="text-sm text-gray-700">
                <strong>Autorités de protection des données :</strong> Si vous estimez que votre demande n&apos;a pas été traitée correctement, vous pouvez introduire une réclamation auprès de l&apos;autorité compétente dans votre pays : APDP (Bénin), ARTCI (Côte d&apos;Ivoire), CNIL-BF (Burkina Faso), APDCP (Togo), CDP (Sénégal).
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
