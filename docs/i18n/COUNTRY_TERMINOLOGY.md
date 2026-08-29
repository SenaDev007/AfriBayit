# AfriBayit — Country-Specific Legal & Financial Terminology

This document provides country-specific terminology that native speakers should
use when reviewing translations for each target market.

## Bénin (BJ) 🇧🇯

### Legal System
- **Code Foncier 2023** — reformed land law (August 2023)
- **Loi n°2017-20** — digital law governing e-signatures
- **ANDF** — Agence Nationale du Domaine Foncier (land registry)
- **OHADA** — Uniform business law for francophone Africa
- **Language**: French (official), Fon, Yoruba, Bariba, Dendi

### Key Terms for fon.ts

| French | Fon | Notes |
|---|---|---|
| Titre foncier | Akpaxwe ɖokpo | Official land title from ANDF |
| Acte de vente | Wéma nú xɔ | Must be notarized since 2023 reform |
| Notaire | Nuwlane | Must be registered with Chambre Nationale des Notaires |
| Géomètre | Mɛ e ɖo axɔ mɛ | GeoTrust-certified surveyor |
| Permis de construire | Nǔɖɛmɛ ɖò xá ɖo tɛ ji | Building permit |
| ACD (Attestation de Détention Coutumière) | Keep "ACD" | Customary land right — no Fon equivalent |
| Bail | Bail | Keep French — legal term |
| Loyer | Xó axe | Rent payment |
| Caution | Axɛ ɖo | Security deposit |

### Mobile Money
- **MTN MoMo**: Most popular — keep "MTN Mobile Money" as-is
- **Moov Money**: Second largest — keep as-is
- **Orange Money**: Growing — keep as-is
- **FedaPay**: Payment aggregator — keep as-is

### Cultural Notes
- In Fon culture, land is often held collectively by families. The concept of
  individual land title (titre foncier) is relatively new. Translations should
  be clear about the difference between customary rights (ACD) and formal title.
- The notary (nuwlane) plays a central role in property transactions — the
  2023 reform made notarization mandatory for all property sales.

---

## Côte d'Ivoire (CI) 🇨🇮

### Legal System
- **Loi foncière rurale 2025** — rural land reform
- **Direction des Domaines** — land registry
- **Language**: French (official), N'Galo, Baoulé, Bété, Dioula

### Key Terms

| French | Local Context | Notes |
|---|---|---|
| Certificat de propriété | Property certificate | Primary land document |
| Lettre d'Attribution | Allocation letter | Government land allocation |
| Arrêté de concession provisoire | Provisional concession | |
| Attestation villagioise | Village attestation | Rural land rights |
| Droit de mutation | Transfer tax | ~4% of property value |

### Mobile Money
- **Orange Money**: Market leader
- **MTN MoMo**: Strong competitor
- **Moov Money**: Third
- **Wave**: Fast-growing, lower fees

### Cultural Notes
- Abidjan has a mix of formal and informal land markets
- "Attestation villagioise" is unique to Côte d'Ivoire — no direct translation
  in most languages; keep French
- The concept of "commerce" (commercial space) includes both formal shops
  and informal market stalls

---

## Burkina Faso (BF) 🇧🇫

### Legal System
- **RAF 2025** — Réorganisation Agraire et Foncière
- **Direction Générale des Impôts** — tax authority
- **Language**: French (official), Moore, Dioula, Fulfuldé

### Key Terms

| French | Moore | Notes |
|---|---|---|
| Permis Urbain d'Habiter (PUH) | Keep "PUH" | Urban habitation permit |
| Titre Foncier | Keep French | Land title |
| Acte de cession | Keep French | Transfer deed |
| Lotissement | Keep French | Land subdivision |

### Mobile Money
- **Orange Money**: Dominant
- **Moov Money**: Second
- **Telmob (ONATEL)**: State-owned

### Cultural Notes
- Ouagadougou and Bobo-Dioulasso have different land markets
- The RAF (Réorganisation Agraire et Foncière) is the primary land law
- Political instability has affected land registration processes — translations
  should be neutral about the current political situation

---

## Togo (TG) 🇹🇬

### Legal System
- **Code Foncier 2018** — land law
- **ANDF Togo** — land registry (same acronym as Bénin but different agency)
- **Language**: French (official), Ewe, Kabiye, Mina

### Key Terms

| French | Ewe | Notes |
|---|---|---|
| Titre Foncier | Keep French | Land title |
| Acte de cession | Keep French | Transfer deed |
| Certificat de propriété ANDF | Keep French | ANDF property certificate |
| Bail | Keep French | Lease |

### Mobile Money
- **Moov Money**: Market leader
- **Togocel (Money Togo)**: State-owned

### Cultural Notes
- Lomé has a mix of formal and informal land markets
- The ANDF (Agence Nationale du Domaine Foncier) is separate from Bénin's ANDF
  despite the same acronym — translations should not assume they're the same
- Togo's land law is less reformed than Bénin's — some customary land rights
  are still recognized without formal title

---

## Cross-Country Legal Comparison

| Concept | Bénin | Côte d'Ivoire | Burkina Faso | Togo |
|---|---|---|---|---|
| Land title | Titre foncier (ANDF) | Certificat de propriété | Titre foncier | Titre foncier (ANDF) |
| Customary rights | ACD (being phased out) | Attestation villagioise | N/A (RAF covers all) | Customary rights recognized |
| Notary required | Yes (2023 reform) | Yes | Yes | Yes |
| Transfer tax | ~4% | ~4% | ~5% | ~4% |
| Building permit | Permis de construire | Permis de construire | PUH | Permis de construire |
| E-signature legal | Yes (Loi 2017-20) | Yes (OHADA) | Yes (OHADA) | Yes (OHADA) |

## Translation Recommendations by Market

### For Bénin (Fon/Wolof)
- Translate common UI terms to Fon
- Keep legal terms in French (with Fon explanation if helpful)
- Use "FCFA" for currency
- Mobile Money brand names stay as-is

### For Côte d'Ivoire (French primary)
- French is the primary language — minimal translation needed
- Focus on local expressions and Ivonian French variants
- "Attestation villagioise" is unique — keep as-is

### For Burkina Faso (French/Moore)
- French is primary — Moore translations are supplementary
- Keep "PUH" and "RAF" as acronyms
- Political neutrality in all translations

### For Togo (French/Ewe)
- French is primary — Ewe translations are supplementary
- Keep "ANDF" (note: different from Bénin's ANDF)
- "Togocel" is a state-owned brand — keep as-is

## Currency Formatting

All four countries use FCFA (XOF). Format:

```
1 000 FCFA          ← correct (space as separator, FCFA after)
1.000 FCFA          ← incorrect (dot separator)
1000 FCFA           ← acceptable (no separator for small amounts)
1 000 000 FCFA      ← correct (large amounts)
1M FCFA             ← acceptable for UI (abbreviated)
```

## Date Formatting

All four countries use DD/MM/YYYY:

```
15/08/2025          ← correct
08/15/2025          ← incorrect (US format)
2025-08-15          ← acceptable (ISO format in code/API)
```
