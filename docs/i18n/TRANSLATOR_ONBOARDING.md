# AfriBayit — Translator Onboarding Guide

Welcome to the AfriBayit translation team! This guide will help you get started
with reviewing and improving translations for the AfriBayit real estate platform.

## Quick Start

### 1. Get the Code

```bash
git clone https://github.com/SenaDev007/AfriBayit.git
cd AfriBayit
```

### 2. Find Your Locale File

All translation files are in `src/lib/i18n/locales/`:

| File | Language | Target Market |
|---|---|---|
| `fr.ts` | French (primary) | All markets — the reference file |
| `en.ts` | English | International/diaspora |
| `ar.ts` | Arabic (RTL) | International Arabic speakers |
| `sw.ts` | Swahili | East Africa expansion |
| `ha.ts` | Hausa | Nigeria/Ghana expansion |
| `am.ts` | Amharic | Ethiopia expansion |
| `ln.ts` | Lingala | DRC/Congo expansion |
| `wo.ts` | Wolof | Senegal/Bénin |
| `fon.ts` | Fon | Bénin (primary local language) |

### 3. Understand the Structure

Each file has the same structure — a JavaScript object with nested sections:

```typescript
export const fon = {
  common: {
    search: 'Mɔn',           // ← your translation
    save: 'Kpɔ́n',            // ← your translation
    cancel: 'Hwɛ́',           // ← your translation
    // ...
  },
  nav: {
    home: 'Axlɔn',            // ← your translation
    // ...
  },
  property: {
    // real estate terms
  },
  escrow: {
    // financial terms
  },
  // ... 60+ sections
} as const;
```

### 4. Compare with French

Open `fr.ts` in one window and your locale file in another. Compare each value:

| French (fr.ts) | Your Translation | Status |
|---|---|---|
| `'Rechercher'` | `'Mɔn'` | ✅ Translated |
| `'Acte de vente signé par les parties'` | `'Acte de vente signé par les parties'` | 🔄 Still French — translate or keep? |

### 5. Edit and Test

After making changes:

```bash
# Check for syntax errors
npx tsc --noEmit

# Run the i18n tests
npx vitest run tests/unit/i18n.test.ts

# Start the dev server and check your language
npm run dev
# Visit http://localhost:3000 and switch to your language
```

### 6. Submit Your Review

```bash
git add src/lib/i18n/locales/fon.ts  # your locale file
git commit -m "i18n: native speaker review — fon (Bénin real estate terms)"
git push
# Create a Pull Request on GitHub
```

## What to Focus On

### Priority 1: Legal and Financial Terms

These are the most important to get right — they affect legal compliance:

- Escrow states (FUNDED, RELEASED, DISPUTED, etc.)
- Notary terms (acte de vente, titre foncier, ANDF)
- Property documents (ACD, PUH, permis de construire)
- Payment terms (commission, remboursement, solde)

**See**: `docs/i18n/TRANSLATION_GLOSSARY.md` for the full list

### Priority 2: User-Facing Messages

These directly affect user experience:

- Error messages ("Échec du check-in", "Aucun résultat")
- Success messages ("Annonce soumise !", "AfriPoints échangés avec succès")
- Form labels and placeholders
- Button text
- Empty states ("Aucun bien trouvé")

### Priority 3: Marketing and Community Text

- Hero section text
- How it works steps
- Module descriptions
- Footer links
- Testimonials

## Translation Decisions

### When to Keep French

In West African legal and financial contexts, French is the working language.
You may choose to keep these terms in French:

- **Legal terms**: "acte de vente", "titre foncier", "notaire" — these have
  specific legal meanings that don't translate cleanly
- **Financial terms**: "escrow", "commission", "FCFA" — universally understood
- **Brand names**: "MTN", "Orange Money", "Wave", "FedaPay" — never translate
- **Technical terms**: "API", "URL", "email" — keep as-is

**Example decision**:
```typescript
// Option A: Keep French (common in legal contexts)
acteDeVente: 'Acte de vente',

// Option B: Translate with French in parentheses
acteDeVente: 'Wéma nú xɔ (Acte de vente)',

// Option C: Full translation
acteDeVente: 'Wéma nú xɔ',
```

All three are valid — choose what's most natural for your target audience.

### When to Translate

Always translate:
- Navigation labels (home, search, profile, settings)
- Common actions (save, cancel, delete, edit)
- Form labels (name, email, phone, address)
- Status labels (pending, approved, rejected)
- Error/success messages
- Descriptions and help text

## Common Mistakes to Avoid

1. **Don't translate brand names** — AfriBayit, Rebecca, AfriPoints, GeoTrust, ProMatch
2. **Don't translate system values** — CREATED, FUNDED, RELEASED (these are code values)
3. **Don't translate currency** — always "FCFA", never "CFA" or local currency names
4. **Don't change the key names** — only translate the values (right side of `:`)
5. **Don't break the syntax** — keep quotes, commas, and braces intact
6. **Don't use dialectal Arabic** — use Modern Standard Arabic (فصحى) for `ar.ts`
7. **Don't mix languages** — each file should be consistently in one language
8. **Don't change the structure** — all keys must match `fr.ts`

## Getting Help

- **Translation questions**: dev@afribayit.com
- **Technical issues**: Create an issue on GitHub
- **Glossary**: See `docs/i18n/TRANSLATION_GLOSSARY.md`
- **Review guide**: See `docs/i18n/NATIVE_SPEAKER_REVIEW_GUIDE.md`

## Time Estimate

| Task | Estimated Time |
|---|---|
| Initial review (all sections) | 4-8 hours per locale |
| Legal/financial terms deep dive | 2-4 hours |
| Cultural adaptation | 2-4 hours |
| Testing and refinement | 1-2 hours |
| **Total per locale** | **9-18 hours** |

## Recognition

Translators will be credited in the AfriBayit platform and documentation.
Thank you for helping make African real estate accessible to everyone! 🏠
