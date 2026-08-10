/**
 * AfriBayit — Deed Templates per Country
 * Modèles d'actes notariés par pays
 * Covers: Bénin (BJ), Côte d'Ivoire (CI), Burkina Faso (BF), Togo (TG)
 */

export interface DeedTemplate {
  id: string;
  country: string;
  deedType: string;
  nameFr: string;
  description: string;
  sections: DeedSection[];
  placeholders: DeedPlaceholder[];
  legalBasis: string;
}

export interface DeedSection {
  id: string;
  title: string;
  content: string;
  required: boolean;
  aiGenerated: boolean;
}

export interface DeedPlaceholder {
  key: string;
  label: string;
  source: 'transaction' | 'property' | 'buyer' | 'seller' | 'notary' | 'manual';
  required: boolean;
}

// ============ BÉNIN (BJ) ============

const beninVenteTF: DeedTemplate = {
  id: 'BJ-ACTE-VENTE-TF',
  country: 'BJ',
  deedType: 'acte_vente_tf',
  nameFr: 'Acte de Vente (Titre Foncier)',
  description: 'Acte de vente immobilière avec Titre Foncier conforme à la réforme foncière 2023 du Bénin',
  legalBasis: 'Loi n° 2017-03 du 16 août 2017 portant régime foncier rural; Réforme foncière 2023; ANDF',
  sections: [
    {
      id: 'bj-vente-entete',
      title: 'En-tête de l\'acte',
      content: `RÉPUBLIQUE DU BÉNIN
Unité - Justice - Travail

ACTE DE VENTE IMMOBILIÈRE
(Titre Foncier)

N° ______ / {{notaryChamber}}

L\'an {{year}}, le {{dateNotation}},
Par-devant Maître {{notaryName}}, Notaire à {{notaryCity}},
{{notaryChamber}},
Exerçant en l\'étude située à {{notaryAddress}},`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bj-vente-parties',
      title: 'Désignation des parties',
      content: `ONT COMPARU :

LE VENDEUR :
Mme/M. {{sellerFullName}}, né(e) le {{sellerBirthDate}} à {{sellerBirthPlace}},
de nationalité {{sellerNationality}}, profession {{sellerProfession}},
demeurant à {{sellerAddress}},
titulaire de la pièce d'identité n° {{sellerIdNumber}},
CI n° {{sellerCINumber}},

ET L'ACQUÉREUR :
Mme/M. {{buyerFullName}}, né(e) le {{buyerBirthDate}} à {{buyerBirthPlace}},
de nationalité {{buyerNationality}}, profession {{buyerProfession}},
demeurant à {{buyerAddress}},
titulaire de la pièce d'identité n° {{buyerIdNumber}},`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bj-vente-objet',
      title: 'Objet de la vente',
      content: `OBJET DE LA VENTE :

Le vendeur vend et cède à l'acquéreur qui achète et accepte, le bien immobilier suivant :

DÉSIGNATION :
{{propertyDescription}}

SITUATION :
Le bien est situé à {{propertyAddress}}, quartier {{propertyQuartier}}, commune de {{propertyCity}}, département de {{propertyDepartment}}, République du Bénin.

TITRE FONCIER :
Titre Foncier n° {{titreFoncierNumber}}, délivré le {{titreFoncierDate}} par l'ANDF (Agence Nationale du Domaine Foncier).

SUPERFICIE :
{{propertySurface}} mètres carrés ({{propertySurfaceLetters}} m²), tels que résultant du titre foncier et du levé topographique.

BÂTI :
{{propertyBuiltDescription}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bj-vente-origine',
      title: 'Origine de propriété',
      content: `ORIGINE DE PROPRIÉTÉ :

Le vendeur justifie de sa propriété par :
{{ownershipOrigin}}

Le titre foncier est inscrit au livre foncier de la Conservation Foncière de {{conservationFonciereCity}} sous le n° {{livreFoncierNumber}}.

Certificat de Propriété ANDF n° {{andfCertificateNumber}}, en date du {{andfCertificateDate}}.`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bj-vente-prix',
      title: 'Prix et conditions',
      content: `PRIX :

Le présent acte est consenti pour le prix de {{priceAmount}} FCFA ({{priceAmountLetters}} Francs CFA).

MODE DE PAIEMENT :
Le prix a été payé par {{paymentMethod}}, conformément aux conditions suivantes :
{{paymentConditions}}

Le notaire soussigné certifie que les fonds ont été reçus sur le compte de séquestre n° {{escrowAccountNumber}}.`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bj-vente-declarations',
      title: 'Déclarations du vendeur',
      content: `DÉCLARATIONS DU VENDEUR :

Le vendeur déclare :
1. Être seul et unique propriétaire du bien vendu, sans aucun droit d'usufruit, servitude ou occupation litigieuse ;
2. Que le bien est libre de toute hypothèque, saisie ou contestation ;
3. Que le Titre Foncier est authentique et conforme au registre ANDF ;
4. Qu'il n'existe aucun litige ni procédure en cours concernant le bien ;
5. Que les impôts fonciers et taxes afférents ont été acquittés jusqu'à ce jour ;
6. Que le bien n'est pas situé en zone inondable ou à risque, à sa connaissance.`,
      required: true,
      aiGenerated: true,
    },
    {
      id: 'bj-vente-garanties',
      title: 'Garanties et charges',
      content: `GARANTIES :

Le vendeur garantit l'acquéreur contre toutes les évictions, troubles ou revendications.

CHARGES ET CONDITIONS :
{{chargesAndConditions}}

SERVITUDES :
Les servitudes apparentes et non apparentes existantes sont :
{{servitudesDescription}}

EMPRUNTES ÉCOLOGIQUES :
Le vendeur déclare que le bien ne fait l'objet d'aucune restriction environnementale, à sa connaissance.`,
      required: true,
      aiGenerated: true,
    },
    {
      id: 'bj-vente-clauses',
      title: 'Clauses spéciales',
      content: `CLAUSES SPÉCIALES :

1. Enregistrement ANDF : L'acquéreur s'engage à faire enregistrer la mutation auprès de l'ANDF dans un délai de 30 jours suivant la signature de l'acte.

2. Attestation de mutation : Le notaire dressera l'attestation de mutation dans les formes légales.

3. Droits d'enregistrement : Les droits d'enregistrement et de mutation s'élèvent à {{registrationFees}} FCFA et sont à la charge de l'{{registrationFeesPayer}}.

4. Publicité foncière : Le présent acte sera publié au service de la publicité foncière de {{conservationFonciereCity}}.

5. Réforme 2023 : Conformément à la réforme foncière de 2023, le présent acte est enregistré dans le registre numérique ANDF sous la référence {{andfDigitalRef}}.`,
      required: true,
      aiGenerated: true,
    },
    {
      id: 'bj-vente-signatures',
      title: 'Signatures',
      content: `Fait à {{notaryCity}}, le {{dateNotation}}

Lecture faite aux parties qui ont signé avec le notaire soussigné.

LE VENDEUR : _______________
                                   {{sellerFullName}}

L'ACQUÉREUR : _______________
                                   {{buyerFullName}}

LE NOTAIRE : _______________
                                   Maître {{notaryName}}
                                   {{notaryChamber}}

Certifié conforme à l'original
Le Notaire,`,
      required: true,
      aiGenerated: false,
    },
  ],
  placeholders: [
    { key: 'notaryName', label: 'Nom du notaire', source: 'notary', required: true },
    { key: 'notaryCity', label: 'Ville du notaire', source: 'notary', required: true },
    { key: 'notaryChamber', label: 'Chambre des notaires', source: 'notary', required: true },
    { key: 'notaryAddress', label: 'Adresse de l\'étude', source: 'notary', required: true },
    { key: 'sellerFullName', label: 'Nom complet du vendeur', source: 'seller', required: true },
    { key: 'sellerBirthDate', label: 'Date de naissance du vendeur', source: 'seller', required: true },
    { key: 'sellerBirthPlace', label: 'Lieu de naissance du vendeur', source: 'seller', required: true },
    { key: 'sellerNationality', label: 'Nationalité du vendeur', source: 'seller', required: true },
    { key: 'sellerProfession', label: 'Profession du vendeur', source: 'seller', required: true },
    { key: 'sellerAddress', label: 'Adresse du vendeur', source: 'seller', required: true },
    { key: 'sellerIdNumber', label: 'N° pièce d\'identité vendeur', source: 'seller', required: true },
    { key: 'sellerCINumber', label: 'N° CI vendeur', source: 'seller', required: false },
    { key: 'buyerFullName', label: 'Nom complet de l\'acquéreur', source: 'buyer', required: true },
    { key: 'buyerBirthDate', label: 'Date de naissance de l\'acquéreur', source: 'buyer', required: true },
    { key: 'buyerBirthPlace', label: 'Lieu de naissance de l\'acquéreur', source: 'buyer', required: true },
    { key: 'buyerNationality', label: 'Nationalité de l\'acquéreur', source: 'buyer', required: true },
    { key: 'buyerProfession', label: 'Profession de l\'acquéreur', source: 'buyer', required: true },
    { key: 'buyerAddress', label: 'Adresse de l\'acquéreur', source: 'buyer', required: true },
    { key: 'buyerIdNumber', label: 'N° pièce d\'identité acquéreur', source: 'buyer', required: true },
    { key: 'propertyDescription', label: 'Description du bien', source: 'property', required: true },
    { key: 'propertyAddress', label: 'Adresse du bien', source: 'property', required: true },
    { key: 'propertyQuartier', label: 'Quartier', source: 'property', required: true },
    { key: 'propertyCity', label: 'Ville', source: 'property', required: true },
    { key: 'propertyDepartment', label: 'Département', source: 'property', required: true },
    { key: 'propertySurface', label: 'Superficie (chiffres)', source: 'property', required: true },
    { key: 'propertySurfaceLetters', label: 'Superficie (lettres)', source: 'property', required: true },
    { key: 'propertyBuiltDescription', label: 'Description du bâti', source: 'property', required: false },
    { key: 'titreFoncierNumber', label: 'N° Titre Foncier', source: 'property', required: true },
    { key: 'titreFoncierDate', label: 'Date du TF', source: 'property', required: true },
    { key: 'priceAmount', label: 'Montant (chiffres)', source: 'transaction', required: true },
    { key: 'priceAmountLetters', label: 'Montant (lettres)', source: 'transaction', required: true },
    { key: 'paymentMethod', label: 'Mode de paiement', source: 'transaction', required: true },
    { key: 'paymentConditions', label: 'Conditions de paiement', source: 'transaction', required: true },
    { key: 'escrowAccountNumber', label: 'N° compte séquestre', source: 'transaction', required: true },
    { key: 'andfDigitalRef', label: 'Référence ANDF numérique', source: 'transaction', required: true },
  ],
};

const beninBail: DeedTemplate = {
  id: 'BJ-BAIL',
  country: 'BJ',
  deedType: 'bail',
  nameFr: 'Contrat de Bail',
  description: 'Contrat de bail conforme au droit béninois',
  legalBasis: 'Loi n° 2002-07 du 29 août 2002 portant régime des baux au Bénin',
  sections: [
    {
      id: 'bj-bail-entete',
      title: 'En-tête du bail',
      content: `CONTRAT DE BAIL
N° ______ / {{notaryChamber}}

L'an {{year}}, le {{dateNotation}},
Par-devant Maître {{notaryName}}, Notaire,`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bj-bail-parties',
      title: 'Désignation des parties',
      content: `LE BAILLEUR : {{sellerFullName}}, demeurant à {{sellerAddress}}
LE PRENEUR : {{buyerFullName}}, demeurant à {{buyerAddress}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bj-bail-objet',
      title: 'Objet du bail',
      content: `Le bailleur donne à bail au preneur qui accepte, le bien suivant :
{{propertyDescription}}
Situé à {{propertyAddress}}, {{propertyQuartier}}, {{propertyCity}}
Superficie : {{propertySurface}} m²`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bj-bail-conditions',
      title: 'Conditions du bail',
      content: `DURÉE : {{bailDuration}}
LOYER : {{priceAmount}} FCFA / mois, payable {{paymentFrequency}}
CAUTION : {{cautionAmount}} FCFA ({{cautionMonths}} mois de loyer)
RÉVISION : Le loyer sera révisé annuellement selon l'indice INSAE.
DESTINATION : {{bailDestination}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bj-bail-clauses',
      title: 'Clauses et conditions',
      content: `Le preneur s'engage à :
1. Payer le loyer aux échéances convenues
2. User paisiblement des lieux
3. Effectuer les réparations locatives
4. Ne pas sous-louer sans autorisation
5. Restituer les lieux en bon état à l'expiration du bail

Le bailleur s'engage à :
1. Garantir la jouissance paisible des lieux
2. Effectuer les grosses réparations
3. Assurer la conformité du bien aux normes d'habitabilité`,
      required: true,
      aiGenerated: true,
    },
    {
      id: 'bj-bail-signatures',
      title: 'Signatures',
      content: `Fait à {{notaryCity}}, le {{dateNotation}}

LE BAILLEUR : _______________    LE PRENEUR : _______________
LE NOTAIRE : _______________`,
      required: true,
      aiGenerated: false,
    },
  ],
  placeholders: [
    { key: 'notaryName', label: 'Nom du notaire', source: 'notary', required: true },
    { key: 'notaryCity', label: 'Ville', source: 'notary', required: true },
    { key: 'notaryChamber', label: 'Chambre des notaires', source: 'notary', required: true },
    { key: 'sellerFullName', label: 'Nom du bailleur', source: 'seller', required: true },
    { key: 'sellerAddress', label: 'Adresse du bailleur', source: 'seller', required: true },
    { key: 'buyerFullName', label: 'Nom du preneur', source: 'buyer', required: true },
    { key: 'buyerAddress', label: 'Adresse du preneur', source: 'buyer', required: true },
    { key: 'propertyDescription', label: 'Description du bien', source: 'property', required: true },
    { key: 'propertyAddress', label: 'Adresse du bien', source: 'property', required: true },
    { key: 'propertyQuartier', label: 'Quartier', source: 'property', required: true },
    { key: 'propertyCity', label: 'Ville', source: 'property', required: true },
    { key: 'propertySurface', label: 'Superficie', source: 'property', required: true },
    { key: 'priceAmount', label: 'Montant du loyer', source: 'transaction', required: true },
    { key: 'bailDuration', label: 'Durée du bail', source: 'transaction', required: true },
    { key: 'paymentFrequency', label: 'Fréquence de paiement', source: 'transaction', required: true },
    { key: 'cautionAmount', label: 'Montant de la caution', source: 'transaction', required: true },
    { key: 'cautionMonths', label: 'Mois de caution', source: 'transaction', required: true },
    { key: 'bailDestination', label: 'Destination des lieux', source: 'transaction', required: true },
  ],
};

const beninDonation: DeedTemplate = {
  id: 'BJ-DONATION',
  country: 'BJ',
  deedType: 'donation',
  nameFr: 'Acte de Donation',
  description: 'Acte de donation immobilière conforme au droit béninois',
  legalBasis: 'Code Civil du Bénin, Titre sur les donations',
  sections: [
    {
      id: 'bj-don-entete',
      title: 'En-tête',
      content: `ACTE DE DONATION IMMOBILIÈRE
N° ______ / {{notaryChamber}}
L'an {{year}}, le {{dateNotation}},
Par-devant Maître {{notaryName}}, Notaire,`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bj-don-parties',
      title: 'Parties',
      content: `LE DONATEUR : {{sellerFullName}}, demeurant à {{sellerAddress}}
LE DONATAIRE : {{buyerFullName}}, demeurant à {{buyerAddress}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bj-don-objet',
      title: 'Objet de la donation',
      content: `Le donateur donne et lègue au donataire le bien immobilier suivant :
{{propertyDescription}}
Situé à {{propertyAddress}}, {{propertyCity}}
Titre Foncier n° {{titreFoncierNumber}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bj-don-conditions',
      title: 'Conditions de la donation',
      content: `La présente donation est faite :
{{donationConditions}}

Le donateur se réserve l'usufruit du bien jusqu'à son décès. (optionnel)`,
      required: true,
      aiGenerated: true,
    },
    {
      id: 'bj-don-signatures',
      title: 'Signatures',
      content: `Fait à {{notaryCity}}, le {{dateNotation}}
LE DONATEUR : _______________    LE DONATAIRE : _______________
LE NOTAIRE : _______________`,
      required: true,
      aiGenerated: false,
    },
  ],
  placeholders: [
    { key: 'notaryName', label: 'Nom du notaire', source: 'notary', required: true },
    { key: 'notaryCity', label: 'Ville', source: 'notary', required: true },
    { key: 'notaryChamber', label: 'Chambre', source: 'notary', required: true },
    { key: 'sellerFullName', label: 'Nom du donateur', source: 'seller', required: true },
    { key: 'sellerAddress', label: 'Adresse du donateur', source: 'seller', required: true },
    { key: 'buyerFullName', label: 'Nom du donataire', source: 'buyer', required: true },
    { key: 'buyerAddress', label: 'Adresse du donataire', source: 'buyer', required: true },
    { key: 'propertyDescription', label: 'Description du bien', source: 'property', required: true },
    { key: 'propertyAddress', label: 'Adresse du bien', source: 'property', required: true },
    { key: 'propertyCity', label: 'Ville', source: 'property', required: true },
    { key: 'titreFoncierNumber', label: 'N° TF', source: 'property', required: true },
    { key: 'donationConditions', label: 'Conditions', source: 'manual', required: false },
  ],
};

// ============ CÔTE D'IVOIRE (CI) ============

const ciVenteACD: DeedTemplate = {
  id: 'CI-ACTE-VENTE-ACD',
  country: 'CI',
  deedType: 'acte_vente_acd',
  nameFr: 'Acte de Vente (ACD)',
  description: 'Acte de vente immobilière avec Attestation de Coutume et de Détention, conforme au droit ivoirien',
  legalBasis: 'Loi n° 2019-569 du 26 juin 2019; Loi ACD/ADU 2025; DGI',
  sections: [
    {
      id: 'ci-vente-entete',
      title: 'En-tête',
      content: `RÉPUBLIQUE DE CÔTE D'IVOIRE
Union - Discipline - Travail

ACTE DE VENTE IMMOBILIÈRE
(Attestation de Coutume et de Détention)

N° ______ / {{notaryChamber}}
L'an {{year}}, le {{dateNotation}},
Par-devant Maître {{notaryName}}, Notaire à {{notaryCity}},`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'ci-vente-parties',
      title: 'Parties',
      content: `LE VENDEUR : {{sellerFullName}}, né(e) le {{sellerBirthDate}} à {{sellerBirthPlace}},
de nationalité {{sellerNationality}}, demeurant à {{sellerAddress}}
Pièce d'identité n° {{sellerIdNumber}}

L'ACQUÉREUR : {{buyerFullName}}, né(e) le {{buyerBirthDate}} à {{buyerBirthPlace}},
de nationalité {{buyerNationality}}, demeurant à {{buyerAddress}}
Pièce d'identité n° {{buyerIdNumber}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'ci-vente-objet',
      title: 'Objet',
      content: `Le vendeur cède à l'acquéreur le bien suivant :
{{propertyDescription}}
Situé à {{propertyAddress}}, {{propertyCity}}
ACD n° {{acdNumber}}, délivrée le {{acdDate}}
Certificat Foncier n° {{certificatFoncierNumber}} (loi 2025)
Superficie : {{propertySurface}} m²`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'ci-vente-prix',
      title: 'Prix',
      content: `PRIX : {{priceAmount}} FCFA ({{priceAmountLetters}} Francs CFA)
PAIEMENT : {{paymentMethod}}
Enregistrement DGI obligatoire (loi 2025)`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'ci-vente-clauses',
      title: 'Clauses spéciales CI',
      content: `1. Enregistrement DGI : Obligatoire selon la loi ACD/ADU 2025
2. Droits de mutation : {{registrationFees}} FCFA
3. Publicité foncière : Publication à la Conservation Foncière de {{conservationFonciereCity}}
4. Certificat foncier : Enregistrement conformément à la loi 2025`,
      required: true,
      aiGenerated: true,
    },
    {
      id: 'ci-vente-signatures',
      title: 'Signatures',
      content: `Fait à {{notaryCity}}, le {{dateNotation}}
LE VENDEUR : _______________    L'ACQUÉREUR : _______________
LE NOTAIRE : _______________`,
      required: true,
      aiGenerated: false,
    },
  ],
  placeholders: [
    { key: 'notaryName', label: 'Nom du notaire', source: 'notary', required: true },
    { key: 'notaryCity', label: 'Ville', source: 'notary', required: true },
    { key: 'notaryChamber', label: 'Chambre', source: 'notary', required: true },
    { key: 'sellerFullName', label: 'Nom du vendeur', source: 'seller', required: true },
    { key: 'sellerBirthDate', label: 'Date de naissance', source: 'seller', required: true },
    { key: 'sellerBirthPlace', label: 'Lieu de naissance', source: 'seller', required: true },
    { key: 'sellerNationality', label: 'Nationalité', source: 'seller', required: true },
    { key: 'sellerAddress', label: 'Adresse', source: 'seller', required: true },
    { key: 'sellerIdNumber', label: 'N° pièce d\'identité', source: 'seller', required: true },
    { key: 'buyerFullName', label: 'Nom de l\'acquéreur', source: 'buyer', required: true },
    { key: 'buyerBirthDate', label: 'Date de naissance', source: 'buyer', required: true },
    { key: 'buyerBirthPlace', label: 'Lieu de naissance', source: 'buyer', required: true },
    { key: 'buyerNationality', label: 'Nationalité', source: 'buyer', required: true },
    { key: 'buyerAddress', label: 'Adresse', source: 'buyer', required: true },
    { key: 'buyerIdNumber', label: 'N° pièce d\'identité', source: 'buyer', required: true },
    { key: 'propertyDescription', label: 'Description', source: 'property', required: true },
    { key: 'propertyAddress', label: 'Adresse', source: 'property', required: true },
    { key: 'propertyCity', label: 'Ville', source: 'property', required: true },
    { key: 'propertySurface', label: 'Superficie', source: 'property', required: true },
    { key: 'acdNumber', label: 'N° ACD', source: 'property', required: true },
    { key: 'acdDate', label: 'Date ACD', source: 'property', required: true },
    { key: 'certificatFoncierNumber', label: 'N° Certificat Foncier', source: 'property', required: true },
    { key: 'priceAmount', label: 'Prix', source: 'transaction', required: true },
    { key: 'priceAmountLetters', label: 'Prix (lettres)', source: 'transaction', required: true },
    { key: 'paymentMethod', label: 'Mode de paiement', source: 'transaction', required: true },
    { key: 'registrationFees', label: 'Droits de mutation', source: 'transaction', required: true },
  ],
};

const ciBailCommercial: DeedTemplate = {
  id: 'CI-BAIL-COMMERCIAL',
  country: 'CI',
  deedType: 'bail_commercial',
  nameFr: 'Bail Commercial',
  description: 'Contrat de bail commercial conforme au droit ivoirien (décret de 1953, statut des baux commerciaux)',
  legalBasis: 'Décret n° 53-960 du 26 septembre 1953; Code de commerce CI',
  sections: [
    {
      id: 'ci-bailc-entete',
      title: 'En-tête',
      content: `CONTRAT DE BAIL COMMERCIAL
N° ______ / {{notaryChamber}}
L'an {{year}}, le {{dateNotation}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'ci-bailc-parties',
      title: 'Parties',
      content: `LE BAILLEUR : {{sellerFullName}}, demeurant à {{sellerAddress}}
LE PRENEUR : {{buyerFullName}}, demeurant à {{buyerAddress}}
Activité : {{buyerBusinessActivity}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'ci-bailc-objet',
      title: 'Objet',
      content: `Local commercial situé à {{propertyAddress}}, {{propertyCity}}
{{propertyDescription}}
Surface : {{propertySurface}} m²`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'ci-bailc-conditions',
      title: 'Conditions',
      content: `DURÉE : 9 ans (conformément au statut des baux commerciaux)
LOYER : {{priceAmount}} FCFA / mois
PAS DE PORTE : {{pasDePorte}} FCFA
RÉVISION : Triennale selon indice INSEE/INS
DROIT AU RENOUVELLEMENT : Conformément à la loi`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'ci-bailc-signatures',
      title: 'Signatures',
      content: `Fait à {{notaryCity}}, le {{dateNotation}}
LE BAILLEUR : _______________    LE PRENEUR : _______________
LE NOTAIRE : _______________`,
      required: true,
      aiGenerated: false,
    },
  ],
  placeholders: [
    { key: 'notaryChamber', label: 'Chambre', source: 'notary', required: true },
    { key: 'notaryCity', label: 'Ville', source: 'notary', required: true },
    { key: 'sellerFullName', label: 'Nom du bailleur', source: 'seller', required: true },
    { key: 'sellerAddress', label: 'Adresse du bailleur', source: 'seller', required: true },
    { key: 'buyerFullName', label: 'Nom du preneur', source: 'buyer', required: true },
    { key: 'buyerAddress', label: 'Adresse du preneur', source: 'buyer', required: true },
    { key: 'buyerBusinessActivity', label: 'Activité commerciale', source: 'buyer', required: true },
    { key: 'propertyDescription', label: 'Description', source: 'property', required: true },
    { key: 'propertyAddress', label: 'Adresse', source: 'property', required: true },
    { key: 'propertyCity', label: 'Ville', source: 'property', required: true },
    { key: 'propertySurface', label: 'Surface', source: 'property', required: true },
    { key: 'priceAmount', label: 'Loyer mensuel', source: 'transaction', required: true },
    { key: 'pasDePorte', label: 'Pas de porte', source: 'transaction', required: false },
  ],
};

// ============ BURKINA FASO (BF) ============

const bfVenteAPFR: DeedTemplate = {
  id: 'BF-ACTE-VENTE-APFR',
  country: 'BF',
  deedType: 'acte_vente_apfr',
  nameFr: 'Acte de Vente (APFR)',
  description: 'Acte de vente immobilière avec APFR conforme au RAF 2025 du Burkina Faso',
  legalBasis: 'RAF 2025 — 214 articles; Code foncier BF; PUH/APFR',
  sections: [
    {
      id: 'bf-vente-entete',
      title: 'En-tête',
      content: `BURKINA FASO
Unité - Progrès - Justice

ACTE DE VENTE IMMOBILIÈRE
(APFR / PUH)

N° ______ / {{notaryChamber}}
L'an {{year}}, le {{dateNotation}},
Par-devant Maître {{notaryName}}, Notaire à {{notaryCity}},`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bf-vente-parties',
      title: 'Parties',
      content: `LE VENDEUR : {{sellerFullName}}, né(e) le {{sellerBirthDate}} à {{sellerBirthPlace}},
de nationalité {{sellerNationality}}, demeurant à {{sellerAddress}}
Pièce d'identité n° {{sellerIdNumber}}

L'ACQUÉREUR : {{buyerFullName}}, né(e) le {{buyerBirthDate}} à {{buyerBirthPlace}},
de nationalité {{buyerNationality}}, demeurant à {{buyerAddress}}
Pièce d'identité n° {{buyerIdNumber}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bf-vente-objet',
      title: 'Objet',
      content: `Le vendeur cède à l'acquéreur :
{{propertyDescription}}
Situé à {{propertyAddress}}, {{propertyCity}}
APFR n° {{apfrNumber}} / PUH n° {{puhNumber}} (RAF 2025)
Titre Foncier n° {{titreFoncierNumber}}
Superficie : {{propertySurface}} m²`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bf-vente-clauses',
      title: 'Clauses RAF 2025',
      content: `Conformément au RAF 2025 (214 articles) :
1. Type de terrain : {{terrainType}} (PUH urbain / APFR rural)
2. Enregistrement au cadastre numérique obligatoire
3. Commission foncière villageoise : {{commissionVillageoise}}
4. Droits de mutation : {{registrationFees}} FCFA`,
      required: true,
      aiGenerated: true,
    },
    {
      id: 'bf-vente-prix',
      title: 'Prix',
      content: `PRIX : {{priceAmount}} FCFA ({{priceAmountLetters}} Francs CFA)
PAIEMENT : {{paymentMethod}}
Compte séquestre n° {{escrowAccountNumber}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bf-vente-signatures',
      title: 'Signatures',
      content: `Fait à {{notaryCity}}, le {{dateNotation}}
LE VENDEUR : _______________    L'ACQUÉREUR : _______________
LE NOTAIRE : _______________`,
      required: true,
      aiGenerated: false,
    },
  ],
  placeholders: [
    { key: 'notaryName', label: 'Nom du notaire', source: 'notary', required: true },
    { key: 'notaryCity', label: 'Ville', source: 'notary', required: true },
    { key: 'notaryChamber', label: 'Chambre', source: 'notary', required: true },
    { key: 'sellerFullName', label: 'Nom du vendeur', source: 'seller', required: true },
    { key: 'sellerBirthDate', label: 'Date de naissance', source: 'seller', required: true },
    { key: 'sellerBirthPlace', label: 'Lieu de naissance', source: 'seller', required: true },
    { key: 'sellerNationality', label: 'Nationalité', source: 'seller', required: true },
    { key: 'sellerAddress', label: 'Adresse', source: 'seller', required: true },
    { key: 'sellerIdNumber', label: 'N° pièce', source: 'seller', required: true },
    { key: 'buyerFullName', label: 'Nom acquéreur', source: 'buyer', required: true },
    { key: 'buyerBirthDate', label: 'Date de naissance', source: 'buyer', required: true },
    { key: 'buyerBirthPlace', label: 'Lieu de naissance', source: 'buyer', required: true },
    { key: 'buyerNationality', label: 'Nationalité', source: 'buyer', required: true },
    { key: 'buyerAddress', label: 'Adresse', source: 'buyer', required: true },
    { key: 'buyerIdNumber', label: 'N° pièce', source: 'buyer', required: true },
    { key: 'propertyDescription', label: 'Description', source: 'property', required: true },
    { key: 'propertyAddress', label: 'Adresse', source: 'property', required: true },
    { key: 'propertyCity', label: 'Ville', source: 'property', required: true },
    { key: 'propertySurface', label: 'Superficie', source: 'property', required: true },
    { key: 'apfrNumber', label: 'N° APFR', source: 'property', required: false },
    { key: 'puhNumber', label: 'N° PUH', source: 'property', required: false },
    { key: 'titreFoncierNumber', label: 'N° TF', source: 'property', required: true },
    { key: 'terrainType', label: 'Type terrain', source: 'property', required: true },
    { key: 'priceAmount', label: 'Prix', source: 'transaction', required: true },
    { key: 'priceAmountLetters', label: 'Prix (lettres)', source: 'transaction', required: true },
    { key: 'paymentMethod', label: 'Mode de paiement', source: 'transaction', required: true },
    { key: 'escrowAccountNumber', label: 'N° séquestre', source: 'transaction', required: true },
    { key: 'registrationFees', label: 'Droits de mutation', source: 'transaction', required: true },
    { key: 'commissionVillageoise', label: 'Commission villageoise', source: 'manual', required: false },
  ],
};

const bfBail: DeedTemplate = {
  id: 'BF-BAIL',
  country: 'BF',
  deedType: 'bail',
  nameFr: 'Contrat de Bail',
  description: 'Contrat de bail conforme au RAF 2025 du Burkina Faso',
  legalBasis: 'RAF 2025; Code civil BF',
  sections: [
    {
      id: 'bf-bail-entete',
      title: 'En-tête',
      content: `CONTRAT DE BAIL
N° ______ / {{notaryChamber}}
L'an {{year}}, le {{dateNotation}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bf-bail-parties',
      title: 'Parties',
      content: `LE BAILLEUR : {{sellerFullName}}, demeurant à {{sellerAddress}}
LE PRENEUR : {{buyerFullName}}, demeurant à {{buyerAddress}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bf-bail-objet',
      title: 'Objet',
      content: `Bien situé à {{propertyAddress}}, {{propertyCity}}
{{propertyDescription}}
Surface : {{propertySurface}} m²`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bf-bail-conditions',
      title: 'Conditions',
      content: `DURÉE : {{bailDuration}}
LOYER : {{priceAmount}} FCFA / mois
CAUTION : {{cautionAmount}} FCFA
Conforme au RAF 2025`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'bf-bail-signatures',
      title: 'Signatures',
      content: `Fait à {{notaryCity}}, le {{dateNotation}}
LE BAILLEUR : _______________    LE PRENEUR : _______________
LE NOTAIRE : _______________`,
      required: true,
      aiGenerated: false,
    },
  ],
  placeholders: [
    { key: 'notaryChamber', label: 'Chambre', source: 'notary', required: true },
    { key: 'notaryCity', label: 'Ville', source: 'notary', required: true },
    { key: 'sellerFullName', label: 'Nom du bailleur', source: 'seller', required: true },
    { key: 'sellerAddress', label: 'Adresse du bailleur', source: 'seller', required: true },
    { key: 'buyerFullName', label: 'Nom du preneur', source: 'buyer', required: true },
    { key: 'buyerAddress', label: 'Adresse du preneur', source: 'buyer', required: true },
    { key: 'propertyDescription', label: 'Description', source: 'property', required: true },
    { key: 'propertyAddress', label: 'Adresse', source: 'property', required: true },
    { key: 'propertyCity', label: 'Ville', source: 'property', required: true },
    { key: 'propertySurface', label: 'Surface', source: 'property', required: true },
    { key: 'priceAmount', label: 'Loyer', source: 'transaction', required: true },
    { key: 'bailDuration', label: 'Durée', source: 'transaction', required: true },
    { key: 'cautionAmount', label: 'Caution', source: 'transaction', required: true },
  ],
};

// ============ TOGO (TG) ============

const tgVenteCFD: DeedTemplate = {
  id: 'TG-ACTE-VENTE-CFD',
  country: 'TG',
  deedType: 'acte_vente_cfd',
  nameFr: 'Acte de Vente (CFD)',
  description: 'Acte de vente immobilière conforme au Code Foncier Domanial 2018 et DCCF 2025 du Togo',
  legalBasis: 'CFD 2018; DCCF 2025; Conservation Foncière',
  sections: [
    {
      id: 'tg-vente-entete',
      title: 'En-tête',
      content: `RÉPUBLIQUE TOGOLAISE
Travail - Liberté - Patrie

ACTE DE VENTE IMMOBILIÈRE
(CFD / DCCF 2025)

N° ______ / {{notaryChamber}}
L'an {{year}}, le {{dateNotation}},
Par-devant Maître {{notaryName}}, Notaire à {{notaryCity}},`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'tg-vente-parties',
      title: 'Parties',
      content: `LE VENDEUR : {{sellerFullName}}, né(e) le {{sellerBirthDate}} à {{sellerBirthPlace}},
de nationalité {{sellerNationality}}, demeurant à {{sellerAddress}}
Pièce d'identité n° {{sellerIdNumber}}

L'ACQUÉREUR : {{buyerFullName}}, né(e) le {{buyerBirthDate}} à {{buyerBirthPlace}},
de nationalité {{buyerNationality}}, demeurant à {{buyerAddress}}
Pièce d'identité n° {{buyerIdNumber}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'tg-vente-objet',
      title: 'Objet',
      content: `Le vendeur cède à l'acquéreur :
{{propertyDescription}}
Situé à {{propertyAddress}}, {{propertyCity}}
Titre Foncier n° {{titreFoncierNumber}}, Conservation Foncière de {{conservationFonciereCity}}
CFD : Acte de cession n° {{acteCessionNumber}}, enregistré le {{acteCessionDate}} (DCCF 2025)
Superficie : {{propertySurface}} m²`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'tg-vente-prix',
      title: 'Prix',
      content: `PRIX : {{priceAmount}} FCFA ({{priceAmountLetters}} Francs CFA)
PAIEMENT : {{paymentMethod}}
Enregistrement obligatoire (DCCF 2025)`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'tg-vente-clauses',
      title: 'Clauses DCCF 2025',
      content: `1. CFD 2018 : TF obligatoire pour toutes transactions
2. DCCF 2025 : Enregistrement obligatoire de l'acte de cession
3. Conservation Foncière : Enregistrement à {{conservationFonciereCity}}
4. Délai d'enregistrement : 30 jours suivant la signature
5. Certificat de propriété ANDF : {{andfCertificateNumber}}`,
      required: true,
      aiGenerated: true,
    },
    {
      id: 'tg-vente-signatures',
      title: 'Signatures',
      content: `Fait à {{notaryCity}}, le {{dateNotation}}
LE VENDEUR : _______________    L'ACQUÉREUR : _______________
LE NOTAIRE : _______________`,
      required: true,
      aiGenerated: false,
    },
  ],
  placeholders: [
    { key: 'notaryName', label: 'Nom du notaire', source: 'notary', required: true },
    { key: 'notaryCity', label: 'Ville', source: 'notary', required: true },
    { key: 'notaryChamber', label: 'Chambre', source: 'notary', required: true },
    { key: 'sellerFullName', label: 'Nom du vendeur', source: 'seller', required: true },
    { key: 'sellerBirthDate', label: 'Date de naissance', source: 'seller', required: true },
    { key: 'sellerBirthPlace', label: 'Lieu de naissance', source: 'seller', required: true },
    { key: 'sellerNationality', label: 'Nationalité', source: 'seller', required: true },
    { key: 'sellerAddress', label: 'Adresse', source: 'seller', required: true },
    { key: 'sellerIdNumber', label: 'N° pièce', source: 'seller', required: true },
    { key: 'buyerFullName', label: 'Nom acquéreur', source: 'buyer', required: true },
    { key: 'buyerBirthDate', label: 'Date de naissance', source: 'buyer', required: true },
    { key: 'buyerBirthPlace', label: 'Lieu de naissance', source: 'buyer', required: true },
    { key: 'buyerNationality', label: 'Nationalité', source: 'buyer', required: true },
    { key: 'buyerAddress', label: 'Adresse', source: 'buyer', required: true },
    { key: 'buyerIdNumber', label: 'N° pièce', source: 'buyer', required: true },
    { key: 'propertyDescription', label: 'Description', source: 'property', required: true },
    { key: 'propertyAddress', label: 'Adresse', source: 'property', required: true },
    { key: 'propertyCity', label: 'Ville', source: 'property', required: true },
    { key: 'propertySurface', label: 'Superficie', source: 'property', required: true },
    { key: 'titreFoncierNumber', label: 'N° TF', source: 'property', required: true },
    { key: 'acteCessionNumber', label: 'N° acte de cession', source: 'property', required: true },
    { key: 'acteCessionDate', label: 'Date acte de cession', source: 'property', required: true },
    { key: 'conservationFonciereCity', label: 'Conservation foncière', source: 'property', required: true },
    { key: 'andfCertificateNumber', label: 'N° cert. ANDF', source: 'property', required: true },
    { key: 'priceAmount', label: 'Prix', source: 'transaction', required: true },
    { key: 'priceAmountLetters', label: 'Prix (lettres)', source: 'transaction', required: true },
    { key: 'paymentMethod', label: 'Mode de paiement', source: 'transaction', required: true },
  ],
};

const tgBail: DeedTemplate = {
  id: 'TG-BAIL',
  country: 'TG',
  deedType: 'bail',
  nameFr: 'Contrat de Bail',
  description: 'Contrat de bail conforme au droit togolais',
  legalBasis: 'Code civil togolais; CFD 2018',
  sections: [
    {
      id: 'tg-bail-entete',
      title: 'En-tête',
      content: `CONTRAT DE BAIL
N° ______ / {{notaryChamber}}
L'an {{year}}, le {{dateNotation}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'tg-bail-parties',
      title: 'Parties',
      content: `LE BAILLEUR : {{sellerFullName}}, demeurant à {{sellerAddress}}
LE PRENEUR : {{buyerFullName}}, demeurant à {{buyerAddress}}`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'tg-bail-objet',
      title: 'Objet',
      content: `Bien situé à {{propertyAddress}}, {{propertyCity}}
{{propertyDescription}}
Surface : {{propertySurface}} m²`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'tg-bail-conditions',
      title: 'Conditions',
      content: `DURÉE : {{bailDuration}}
LOYER : {{priceAmount}} FCFA / mois
CAUTION : {{cautionAmount}} FCFA
Conforme au CFD 2018`,
      required: true,
      aiGenerated: false,
    },
    {
      id: 'tg-bail-signatures',
      title: 'Signatures',
      content: `Fait à {{notaryCity}}, le {{dateNotation}}
LE BAILLEUR : _______________    LE PRENEUR : _______________
LE NOTAIRE : _______________`,
      required: true,
      aiGenerated: false,
    },
  ],
  placeholders: [
    { key: 'notaryChamber', label: 'Chambre', source: 'notary', required: true },
    { key: 'notaryCity', label: 'Ville', source: 'notary', required: true },
    { key: 'sellerFullName', label: 'Nom du bailleur', source: 'seller', required: true },
    { key: 'sellerAddress', label: 'Adresse du bailleur', source: 'seller', required: true },
    { key: 'buyerFullName', label: 'Nom du preneur', source: 'buyer', required: true },
    { key: 'buyerAddress', label: 'Adresse du preneur', source: 'buyer', required: true },
    { key: 'propertyDescription', label: 'Description', source: 'property', required: true },
    { key: 'propertyAddress', label: 'Adresse', source: 'property', required: true },
    { key: 'propertyCity', label: 'Ville', source: 'property', required: true },
    { key: 'propertySurface', label: 'Surface', source: 'property', required: true },
    { key: 'priceAmount', label: 'Loyer', source: 'transaction', required: true },
    { key: 'bailDuration', label: 'Durée', source: 'transaction', required: true },
    { key: 'cautionAmount', label: 'Caution', source: 'transaction', required: true },
  ],
};

// ============ All Templates Registry ============

export const DEED_TEMPLATES: Record<string, DeedTemplate[]> = {
  BJ: [beninVenteTF, beninBail, beninDonation],
  CI: [ciVenteACD, ciBailCommercial],
  BF: [bfVenteAPFR, bfBail],
  TG: [tgVenteCFD, tgBail],
};

export function getTemplatesForCountry(country: string): DeedTemplate[] {
  return DEED_TEMPLATES[country] || [];
}

export function getTemplateById(templateId: string): DeedTemplate | undefined {
  for (const templates of Object.values(DEED_TEMPLATES)) {
    const found = templates.find(t => t.id === templateId);
    if (found) return found;
  }
  return undefined;
}
