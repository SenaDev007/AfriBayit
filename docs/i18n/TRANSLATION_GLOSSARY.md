# AfriBayit — Translation Glossary for Native Speakers

This glossary defines key AfriBayit-specific terms that translators should
understand before reviewing locale files. Each term includes the French
original, English meaning, and translation guidance.

## Platform-Specific Terms

| Term | French | English | Translation Guidance |
|---|---|---|---|
| AfriBayit | AfriBayit | AfriBayit | **Keep as-is** — brand name, never translate |
| Rebecca | Rebecca | Rebecca | **Keep as-is** — AI assistant name |
| AfriPoints | AfriPoints | AfriPoints | **Keep as-is** — platform currency name |
| GeoTrust | GeoTrust | GeoTrust | **Keep as-is** — service name |
| ProMatch | ProMatch | ProMatch | **Keep as-is** — service name |
| Escrow | Escrow (séquestre) | Escrow | Keep "escrow" or use local legal equivalent |
| ANDF | ANDF | National Land Domain Agency | Keep as acronym — Bénin government agency |
| OHADA | OHADA | Organization for Harmonization of Business Law in Africa | Keep as acronym |
| FCFA | FCFA | West African CFA franc | **Always "FCFA"** — never "CFA" alone |
| UEMOA | UEMOA | West African Economic and Monetary Union | Keep as acronym |

## Escrow State Machine Terms

These are **system values** — they appear in the UI as status labels.
The English/French values are uppercase and must be preserved in code.
For the UI display, translate the **description** of each state:

| State (code) | French Description | English Description | Translation Notes |
|---|---|---|---|
| CREATED | Transaction créée | Transaction created | |
| FUNDED | Fonds déposés en escrow | Funds deposited in escrow | |
| DOCS_VALIDATED | Documents légaux vérifiés | Legal documents verified | |
| GEOTRUST_VALIDATED | Validation géomatique GeoTrust | GeoTrust validation confirmed | |
| NOTARY_ASSIGNED | Notaire assigné | Notary assigned | |
| NOTARY_IN_PROGRESS | Rédaction de l'acte en cours | Deed drafting in progress | Max 30 days |
| DEED_SIGNED | Acte de vente signé | Sale deed signed | |
| ANDF_REGISTERED | Enregistré à l'ANDF | Registered at ANDF | |
| RELEASED | Fonds libérés au vendeur | Funds released to seller | Terminal state |
| DISPUTED | Litige signalé | Dispute reported | |
| REFUNDED | Fonds remboursés | Funds refunded | Terminal state |
| CANCELLED | Transaction annulée | Transaction cancelled | Terminal state |

## Property Types

| French | English | Translation Notes |
|---|---|---|
| Villa | Villa | Usually kept as "villa" in all languages |
| Appartement | Apartment | |
| Terrain | Land/plot | In Fon: "Akpaxwe" |
| Maison | House | In Fon: "Axe" (also means "property") |
| Studio | Studio apartment | Usually kept as "studio" |
| Bureau | Office | |
| Commerce | Commercial space | |
| Immeuble | Building | |

## Property Features

| French | English | Translation Notes |
|---|---|---|
| chambres | bedrooms | |
| salles de bain | bathrooms | |
| pièces | rooms | |
| surface | surface area | Usually in m² |
| piscine | pool | |
| garage | garage | |
| jardin | garden | |
| climatisation | air conditioning | |
| eau courante | running water | |
| électricité | electricity | |
| internet | internet | Keep as-is |
| sécurité 24/7 | 24/7 security | |

## User Roles

| French (DB) | English | Translation Notes |
|---|---|---|
| buyer | Buyer | Standard user |
| seller | Seller/Owner | Property owner |
| agent | Real estate agent | Must be certified |
| certified_agent | Certified agent | Passed AfriBayit certification |
| notary | Notary | Legal professional — must be licensed |
| geometer | Surveyor | GeoTrust certified |
| artisan | Tradesperson | BTP (construction) worker |
| hotelier | Hotel/Guesthouse owner | Hospitality operator |
| trainer | Academy instructor | Course creator |
| admin | Administrator | Platform staff |
| country_admin | Country administrator | Per-country admin |

## Subscription Tiers

| French | English | Price (FCFA/month) |
|---|---|---|
| Starter | Starter | 0 (free) |
| Pro Essentiel | Pro Essential | 15,000 |
| Pro Avancé | Pro Advanced | 35,000 |
| Pro Elite | Pro Elite | 75,000 |
| Agence Entreprise | Agency Enterprise | 150,000 |

**Note**: Tier names should be kept in French across all locales — they are
brand/marketing terms, not functional labels.

## Notification Types

| French | English | Translation Notes |
|---|---|---|
| transaction | Transaction | Escrow/payment events |
| annonce | Listing | Property listing events |
| communauté | Community | Forum/group events |
| Rebecca | Rebecca | AI assistant messages |
| alerte | Alert | Price/security alerts |
| sécurité | Security | Account security events |

## Common UI Patterns

### Empty States
French uses "Aucun(e)..." pattern. Translate the "no results" message naturally:
- ar: "لا..." (none)
- sw: "Hakuna..." (there are no)
- ha: "Babu..." (there is no)
- am: "ምንም... የለም" (nothing exists)
- ln: "...ezzwi te" (is not there)
- wo: "...amul wuñ" (is not present)
- fon: "...ɖé mɛ" (none exists)

### Loading States
French: "Chargement..." — translate to the natural equivalent:
- ar: "جار التحميل..."
- sw: "Inapakia..."
- ha: "Ana loda..."
- am: "በመጫን ላይ..."
- ln: "Ezo kaka..."
- wo: "Di yeb..."
- fon: "É ɖo wɛ..."

### Success/Error Messages
These should be warm and clear:
- Success prefix: "Succès" → translate naturally
- Error prefix: "Erreur" → translate naturally
- Always include the specific action that succeeded/failed

## Quality Standards

1. **Consistency**: The same term should be translated the same way throughout the file
2. **Context**: A term may have different translations in different contexts (e.g., "surface" as area vs. "surface" as flooring)
3. **Conciseness**: UI text has limited space — keep translations short
4. **Readability**: The translation should read naturally to a native speaker
5. **Legal accuracy**: Legal terms must match the country's legal system
6. **Financial accuracy**: Financial terms must match local banking/Mobile Money terminology
