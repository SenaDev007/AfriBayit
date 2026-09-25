# Legal Officer Review Pack — Matrices Signature / Notaire (J-2 / J-3)

> **Destinataire** : Legal & Compliance Officer (CDC §13.4 — « Droit foncier OHADA
> multi-pays — contrats agences/hôtels/géomètres — dossier CREPMF — veille
> réglementaire mensuelle — litiges »)
> **Mandat** : CDC §5.0bis.6 — « Valider avec le Legal Officer (Section 13.4) la
> conformité de la signature électronique qualifiée au regard de la Loi béninoise
> n°2017-20 avant déploiement en production. Phase 1 : signature physique possible
> en fallback. »
> **Statut** : EN ATTENTE DE VALIDATION — document de travail préparé pour arbitrage.
> **Source primaire** : AfriBayit_CDC_V4.pdf, sections 5.0bis, 7D, 10B.1-10B.5.

---

## 1. Objet et contexte

Le présent dossier consolide les deux matrices juridiques que le Legal Officer
doit vérifier avant l'ouverture du service escrow notarié aux quatre pays
pilotes (Bénin, Côte d'Ivoire, Burkina Faso, Togo). La matrice **J-2** couvre la
valeur juridique de la signature électronique qualifiée par pays et par type
d'acte ; la matrice **J-3** couvre l'obligation (ou la recommandation) de
passage devant notaire et les documents de propriété acceptés par AfriBayit.
Ces matrices conditionnent directement : l'ordre des états du moteur escrow
(NOTARY_ASSIGNED → NOTARY_IN_PROGRESS → DEED_SIGNED → ANDF_REGISTERED), le
design de la signature qualifiée (voir `docs/QUALIFIED_E_SIGNATURE_DESIGN.md`)
et le contenu des modèles d'actes de l'Espace Notaire Pro.

Trois points d'attention ressortent de la relecture croisée du CDC et des
vérifications web de l'arbitrage V4.0 (registre, décision J-1) : l'ANDF est une
institution **béninoise** (le CDC la mentionnait également à juste titre pour le
Togo sous le libellé OTR/DCCF — la confusion des libellés a été levée) ; la
réforme foncière béninoise d'août 2023 rend le **notaire obligatoire** pour
toute transaction foncière ; et le Togo exige l'**immatriculation préalable**
avant toute cession (art. 161-162 du Code Foncier et Domanial, loi n°2018-005
du 14 juin 2018).

## 2. Matrice J-2 — Signature électronique qualifiée par pays

La grille ci-dessous distingue la **signature simple** (accord de volonté,
valeur probante réduite), la **signature avancée** (certificat X.509,
horodatage) et la **signature qualifiée** (presumption légale d'intégrité et de
lien avec le signataire). Le statut « à vérifier » signifie que le texte de
référence doit être confirmé par le Legal Officer avec le journal officiel du
pays — aucune mise en production ne doit s'appuyer sur une cellule non validée.

| Pays | Cadre électronique cité | Valeur pour AfriBayit (Phase 1) | Statut LO |
|---|---|---|---|
| Bénin | Loi n°2017-20 (transactions électroniques) ; APDP (données personnelles) | Signature qualifiée **admissible** pour actes de vente + baux ; fallback physique requis pour l'acte authentique notarié | **À valider** |
| Côte d'Ivoire | Cadre e-transaction à confirmer ; RGPD-like n°2013-450 (données) | Signature électronique utilisable pour offres, mandats, contrats préliminaires ; acte authentique = voie papier notariée | **À vérifier** |
| Burkina Faso | Cadre e-transaction à confirmer | Idem CI — signature simple/avancée pour documents pré-contractuels | **À vérifier** |
| Togo | Code Foncier et Domanial n°2018-005 ; cadres e-transaction à confirmer | Signature électronique pour mandats et conventions ; mutation foncière = voie DCCF/OTR papier | **À vérifier** |
| Régional (UEMOA/OHADA) | AUDCG (commerce général) — reconnaissance de l'écrit électronique | Socle régional pour les contrats commerciaux (conventions agences, hôtels, géomètres) | **À valider** |

**Questions de validation J-2 (blocking)** :

1. La loi n°2017-20 du Bénin reconnaît-elle la signature qualifiée pour des
   **actes conférant des droits réels immobiliers**, ou uniquement pour des
   obligations contractuelles ? Le CDC suppose que oui — c'est l'hypothèse à
   trancher en premier.
2. L'Acte uniforme OHADA suffit-il, pour les quatre pays, à opposer la
   signature électronique d'une **convention de partenariat AfriBayit-Notaire**
   à un tiers ?
3. Le prestataire retenu pour la signature qualifiée (DocuSign — voir
   `docs/QUALIFIED_E_SIGNATURE_DESIGN.md`) émet des certificats conformes
   eIDAS ; ces certificats ont-ils une reconnaissance légale dans chacun des
   quatre pays, ou faut-il un prestataire local (Notarius, autorité
   nationale) pour certains actes ?
4. L'horodatage RFC 3161 du flux (QSCD + TSA) satisfait-il aux exigences de
   preuve en cas de litige devant les juridictions foncières locales ?
5. Phase 1 fallback : définir la procédure papier (signature physique chez le
   notaire, scan, hash SHA-256 vers le moteur escrow) et le délai maximal
   acceptable avant qu'elle ne devienne un point de friction.

## 3. Matrice J-3 — Notaire et documents de propriété par pays

Cette matrice reprend et consolide les tableaux CDC §10B.1 à §10B.5. Elle
indique, pour chaque pays, le document qui **porte** la transaction, celui
qu'AfriBayit **accepte** en vérification préliminaire, et le passage notarié
requis. La colonne « Escrow → Notaire » décrit le point de bascule où le moteur
escrow attend l'acte (état NOTARY_IN_PROGRESS, timer 30 jours, alertes J+15 et
J+25, escalade admin pays au-delà).

| Pays | Loi foncière pivot | Notaire obligatoire ? | Document roi | Documents acceptés (CDC §10B) | Escrow → Notaire |
|---|---|---|---|---|---|
| Bénin | Réforme 15 août 2023 + modification parlementaire 26 mai 2024 | **Oui** — le maire ne peut plus affirmer une transaction ; seul le notaire | Titre Foncier (TF) — définitif, inattaquable (réforme 2024) | TF (prioritaire) ; ADC (avec enquête) ; Attestation de Recasement (zones lotties) ; Certificat d'inscription ANDF/BCDF ; Décision de justice ; Avis d'imposition (complément) ; Permis d'habiter (transformation en TF) ; **Refusés** : convention notariée sans TF, convention affirmée par le maire | Libération escrow conditionnée à ANDF_REGISTERED (TF émis au nom de l'acheteur) |
| Côte d'Ivoire | Loi n°98-750 ; Réforme RAF 2019-2025 | Recommandé — acte notarié courant ; TF reste le socle | TF urbain / PUH ; APFR rural (RAF 2025) | TF, PUH, APFR (nouveau 2025) ; bail emphytéotique 18-99 ans ; arrêté de morcellement (complément) ; **Refusé** : convention de vente simple | Vérification DGI/Ministère Construction ; contrôle croisé registres avant libération |
| Burkina Faso | CFD 2013, mod. 2017 | Recommandé ; guichets fonciers régionaux | TF urbain ; ADU/AFOR rural | TF, ADU, AFOR selon zone ; **Refusé** : convention simple | Vérification ministère Construction Urbanisme / guichet foncier |
| Togo | CFD 2018 (n°2018-005) + DCCF n°003/2025 (provision) | **Immatriculation préalable obligatoire** (art. 161-162) avant toute cession | TF définitif, intangible sauf fraude/erreur (art. 256) | TF (preuve unique) ; acte de cession notarié **si** immatriculation prouvée ; certificat de propriété ancien régime (validation DCCF, cas par cas) ; décision de justice ; avis de perte publié (provisoire, justificatif OTR) ; **Refusé** : convention de vente seule | Provision DCCF à intégrer aux coûts de transaction depuis le 1er mars 2025 |

**Questions de validation J-3 (blocking)** :

1. Bénin : confirmer auprès de la Chambre Nationale des Notaires que le flux
   « signature électronique de la convention de vente → compulsoire ANDF →
   acte authentique notarié → TF » respecte l'esprit de la réforme d'août 2023
   (l'objectif CDC : 10 notaires certifiés avant le lancement Phase 1, accord
   institutionnel à négocier en Phase 0 — CEO + Legal Officer).
2. Togo : l'immatriculation préalable (art. 161-162 CFD) est-elle compatible
   avec un parcours 100 % digital où l'acheteur réserve en ligne ? Le CDC
   prévoit la vérification avant signature — valider que l'état
   DOCS_VALIDATED du moteur escrow peut porter ce contrôle.
3. Côte d'Ivoire / Burkina Faso : confirmer qu'un acte notarié sans TF peut
   **ouvrir** une transaction AfriBayit (avec engagement d'immatriculation) ou
   si le TF doit exister avant la mise en escrow.
4. Droit de préemption de l'État béninois (art. 10, Décret 2015-009 —
   notification ANDF préalable, réponse 15 jours) : le timer de 30 jours
   NOTARY_IN_PROGRESS absorbe-t-il ce délai ? Sinon, proposer un état
   intermédiaire ou allonger le timer contractuellement.
5. Conformité KYC notaire (CDC §5.0bis.2) : la vérification « Chambre des
   Notaires + appel téléphonique + validation admin pays » est-elle suffisante
   pour l'UEMOA au regard des exigences LAB/BCEAO ?

## 4. Procédure de validation demandée

Le Legal Officer est prié de traiter ce pack comme suit :

1. **Statuer cellule par cellule** sur les deux matrices (valider / corriger /
   compléter la référence officielle). Toute cellule laissée « à vérifier »
   bloque l'ouverture du marché correspondant — c'est un comportement voulu :
   sans texte confirmé, le marché reste en « signature physique + notaire
   papier » (fallback Phase 1 du CDC §5.0bis.6).
2. **Produire les références officielles** (journal officiel, numéro, date) pour
   chaque cadre e-transaction cité, en vue de leur intégration dans la
   révision V4.1 du CDC (section 10B enrichie) et dans les mentions légales
   publiques du site.
3. **Confirmer ou réfuter** les trois constats de l'arbitrage J-1 : ANDF =
   institution béninoise ; Togo = loi n°2018-005 du 14 juin 2018 (Code foncier
   et domanial) ; réforme béninoise d'août 2023 rendant le notaire obligatoire.
4. **Trancher l'option prestataire** signature qualifiée (DocuSign vs
   alternative régionale) au vu des réponses aux questions J-2 n°3 et n°4.
5. **Fixer la date de revue mensuelle** (veille réglementaire, CDC §13.4) et
   désigner le canal de publication des mises à jour de ce document.

Toute décision rendue sera reportée dans le registre d'arbitrage
(décisions J-2 et J-3), verrouillée dans `tests/unit/cdc-business-rules.test.ts`
lorsqu'elle porte sur des valeurs d'implémentation, et intégrée à la prochaine
révision du CDC.

## 5. Rappel des sources internes

- `AfriBayit_CDC_V4.pdf` §5.0bis (notaires), §7B (escrow), §10B.1-10B.5
  (cadres fonciers des quatre pays), §13.4 (rôle Legal Officer)
- `docs/QUALIFIED_E_SIGNATURE_DESIGN.md` — architecture cible DocuSign
  (certificat X.509, QSCD, TSA RFC 3161, LTV) et fallback Phase 1
- `src/lib/payments/escrow-engine.ts` — machine à états 12 états incluant
  NOTARY_ASSIGNED, NOTARY_IN_PROGRESS, DEED_SIGNED, ANDF_REGISTERED
- Registre d'arbitrage CDC V4.0 — décisions J-1 (attributions ANDF/OTR),
  J-2/J-3 (présentes matrices), T-* (grilles tarifaires verrouillées)
