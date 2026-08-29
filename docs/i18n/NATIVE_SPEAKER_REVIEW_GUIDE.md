# AfriBayit — Native Speaker Translation Review Guide

## Overview

This guide is for native speakers who will review and culturally adapt the AfriBayit
platform translations. The translations were machine-generated and cover all UI text,
but they need human review for:

1. **Cultural appropriateness** — terms that make sense in the local context
2. **Legal terminology** — real estate and property law terms vary by country
3. **Financial terminology** — Mobile Money, escrow, and banking terms
4. **Natural language** — machine translations can be awkward or unnatural
5. **Tone and register** — formal vs. informal address per culture

## Target Markets

| Country | Primary Language | Secondary | Mobile Money Providers |
|---|---|---|---|
| **Bénin (BJ)** | Fon (fon), French | Wolof (wo), Yoruba | MTN, Moov, Orange |
| **Côte d'Ivoire (CI)** | French | N'Galo, Baoulé | Orange, MTN, Moov, Wave |
| **Burkina Faso (BF)** | French | Moore, Dioula | Orange, Moov, Telmob |
| **Togo (TG)** | French | Ewe, Kabiye | Moov, Togocel |

## Locale Files to Review

Each file is at `src/lib/i18n/locales/` and has ~2,662 lines matching the French
original (`fr.ts`). The translation structure is:

```typescript
export const ar = {
  common: {
    search: 'بحث',        // ← review this value
    save: 'حفظ',           // ← review this value
    // ...
  },
  property: {
    // real estate terms
  },
  escrow: {
    // financial/legal terms
  },
  // ... 60+ sections
}
```

### How to Review

1. Open the locale file (e.g., `ar.ts`) alongside `fr.ts` (the French original)
2. For each key, compare the translated value with the French value
3. If the translation is:
   - ✅ **Correct and natural** — leave it
   - ⚠️ **Correct but unnatural** — rephrase for native fluency
   - ❌ **Incorrect or missing** — replace with the correct translation
   - 🔄 **French fallback** — the value is still in French; translate it

### What Still Has French Fallback

Many specialized terms (legal procedures, notary acts, escrow states) still have
French values in the locale files. This is **intentional** — in West African legal
and financial contexts, French is the working language for these terms. However,
native speakers should decide:

- Keep the French term (common practice in legal/financial contexts)
- Add a parenthetical translation (e.g., `'Acte de vente (hat ya uuzaji)'`)
- Replace entirely with the local language equivalent

## Country-Specific Legal Terminology

### Bénin (BJ) — Code Foncier 2023

| French Term | English | Notes for Translation |
|---|---|---|
| Titre foncier | Land title | The ANDF (Agence Nationale du Domaine Foncier) issues these. In Fon: "Akpaxwe ɖokpo" |
| ACD | Attestation de Détention Coutumière | Customary land right — no direct translation; keep French or describe functionally |
| Permis de construire | Building permit | In Fon: "Nǔɖɛmɛ ɖò xá ɖo tɛ ji" |
| Acte de vente | Sale deed | Must be notarized per 2023 reform |
| Notaire | Notary | In Fon: "Nuwlane" — but the role is distinctly French civil law |

### Côte d'Ivoire (CI) — Réforme foncière 2025

| French Term | English | Notes |
|---|---|---|
| Lettre d'Attribution | Allocation letter | Government land allocation |
| Arrêté de concession provisoire | Provisional concession decree | |
| Certificat de propriété | Property certificate | |
| Attestation villagioise | Village attestation | Rural land rights |

### Burkina Faso (BF) — RAF 2025

| French Term | English | Notes |
|---|---|---|
| Permis Urbain d'Habiter (PUH) | Urban habitation permit | |
| Titre Foncier | Land title | |
| Acte de cession | Transfer deed | |

### Togo (TG) — Code Foncier 2018

| French Term | English | Notes |
|---|---|---|
| Titre Foncier | Land title | |
| Acte de cession | Transfer deed | |
| Certificat de propriété ANDF | ANDF property certificate | |

## Financial Terminology

### Mobile Money Terms

| French | English | Notes |
|---|---|---|
| Mobile Money | Mobile Money | Keep as-is in all languages (universal term) |
| MTN Mobile Money | MTN Mobile Money | Brand name — keep as-is |
| Orange Money | Orange Money | Brand name — keep as-is |
| Moov Money | Moov Money | Brand name — keep as-is |
| Wave | Wave | Brand name — keep as-is |
| Transfert d'argent | Money transfer | |
| Solde | Balance | |
| Portefeuille | Wallet | In Fon: "Axe" (meaning "money/container") |
| Commission | Commission | Keep as-is or translate locally |
| Remboursement | Refund | |
| Escrow | Escrow (séquestre) | Legal concept — in many languages, keep "escrow" or use the French "séquestre" |

### Real Estate Financial Terms

| French | English | Translation Notes |
|---|---|---|
| Loyer | Rent | |
| Caution | Security deposit | |
| Charges | Utility fees | |
| Frais d'agence | Agency fees | |
| Droits de mutation | Transfer tax | Varies by country (4-5% in UEMOA) |
| Plus-value | Capital gain | |
| Rendement locatif | Rental yield | |

## Cultural Adaptation Guidelines

### Address and Naming

- **Bénin**: Names often include a day-of-birth name (e.g., "Koffi" for Friday-born).
  The registration form should accommodate these without forcing a Western name format.
- **Côte d'Ivoire**: Both family name and given name are required on legal documents.
- **Burkina Faso**: Some ethnic groups use a single name; the form should allow this.
- **Togo**: Similar to Bénin — day names are common.

### Currency

- All amounts are in **FCFA (XOF)** — the West African CFA franc
- Always display as "FCFA" or "XOF" — never "CFA" alone (ambiguous)
- Use spaces as thousand separators: `1 000 000 FCFA`
- The currency symbol should come **after** the number (French convention)

### Date and Time

- Format: `DD/MM/YYYY` (French convention used in all 4 countries)
- Time: 24-hour format `HH:mm`
- Week starts on **Monday** (not Sunday)

### Phone Numbers

- Format: `+229 XX XX XX XX` (Bénin), `+225 XX XX XX XX XX` (CI), etc.
- The `+` prefix is important for Mobile Money

### Tone and Formality

- **French (fr)**: Use "vous" (formal) for all user-facing text. Never "tu".
- **Arabic (ar)**: Use formal Modern Standard Arabic (فصحى). Avoid dialectal Arabic.
- **Wolof (wo)**: Use polite form. Wolof has no formal/informal distinction, but
  avoid overly casual expressions.
- **Fon (fon)**: Use respectful form. Address the user directly.
- **Swahili (sw)**: Use formal Swahili. Avoid slang.
- **Hausa (ha)**: Use formal Hausa. Respectful address is important.
- **Amharic (am)**: Use formal Amharic (አማርኛ). The polite form uses እርስዎ.
- **Lingala (ln)**: Use standard Lingala. Avoid regional dialects.

## Translation Quality Checklist

For each locale file, verify:

- [ ] All keys from `fr.ts` are present (no missing keys)
- [ ] No syntax errors (proper quotes, commas, braces)
- [ ] No untranslated French values that should be translated
- [ ] Legal terms are appropriate for the target country
- [ ] Financial terms use correct local terminology
- [ ] Currency is always "FCFA" (not "CFA" or "XOF" alone in user-facing text)
- [ ] Date format matches local convention (DD/MM/YYYY)
- [ ] Phone number format is correct for the country
- [ ] Tone and formality are appropriate
- [ ] No culturally insensitive content
- [ ] Brand names (MTN, Orange, Moov, Wave, FedaPay) are kept as-is
- [ ] "AfriBayit" and "Rebecca" are kept as-is (brand names)
- [ ] Escrow states (CREATED, FUNDED, etc.) are kept in uppercase (system values)

## Reviewer Assignment

| Locale | Target Country | Suggested Reviewer Profile |
|---|---|---|
| `fr.ts` | All (primary) | Native French speaker, legal/real estate background |
| `en.ts` | Diaspora/international | Bilingual FR/EN, real estate background |
| `ar.ts` | International (Arabic) | Modern Standard Arabic speaker, business background |
| `sw.ts` | East Africa expansion | Swahili speaker, real estate or fintech background |
| `ha.ts` | Nigeria/Ghana expansion | Hausa speaker, business background |
| `am.ts` | Ethiopia expansion | Amharic speaker, business background |
| `ln.ts` | DRC/Congo expansion | Lingala speaker, business background |
| `wo.ts` | Senegal/Bénin | Wolof speaker, West African real estate |
| `fon.ts` | Bénin (primary local) | Fon speaker, Bénin real estate/legal background |

## How to Submit Reviews

1. Fork the repository on GitHub
2. Edit the locale file(s) directly
3. Submit a Pull Request with title: `i18n: native speaker review — [locale code]`
4. In the PR description, note:
   - Which country/market you're reviewing for
   - Any terms you kept in French (and why)
   - Any cultural adaptations you made
5. Tag @SenaDev007 for review

## Questions?

Contact the AfriBayit team at dev@afribayit.com for any translation questions.
