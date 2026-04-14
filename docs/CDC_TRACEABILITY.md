# Matrice de tracabilite CDC

Ce document suit l'etat d'implementation des modules CDC entre frontend, backend et data model.

## Statuts

- `FAIT`: couvre le besoin principal en frontend + backend + data.
- `PARTIEL`: implemente mais incomplet, mocke ou non connecte de bout en bout.
- `ABSENT`: non implemente.

## Matrice modules

| Module | Frontend | Backend | Data | Statut | Ecarts critiques |
| --- | --- | --- | --- | --- | --- |
| Landing et navigation | `src/app/page.tsx`, `src/components/layout/Navbar.tsx` | `src/app/api/stats/route.ts`, `src/app/api/testimonials/route.ts` | N/A | PARTIEL | Landing principalement statique, certains liens vers pages non implementees. |
| Recherche et resultats | `src/app/properties/page.tsx`, `src/components/ui/SearchBar.tsx` | `src/app/api/properties/route.ts` | `Property`, `PropertyLocation`, `PropertyImage` | PARTIEL | La page de recherche est majoritairement mockee, raccord API incomplet. |
| Fiche propriete | N/A (`/properties/[id]` absent) | N/A (`/api/properties/[id]` absent) | `Property`, `PropertyImage`, `VirtualTour`, `Review` | ABSENT | Aucun parcours detail propriete end-to-end. |
| Authentification | `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx`, `src/app/auth/forgot-password/page.tsx` | `src/app/api/auth/**` | `User`, `Session`, `VerificationCode`, `TwoFactorAuth` | PARTIEL | Contrats frontend/backend a aligner completement (forgot-password, 2FA). |
| Onboarding | `src/app/onboarding/page.tsx` | partiel via `src/app/api/auth/profile/route.ts` | `UserProfile.onboardingCompleted` | PARTIEL | Workflow et progression d'onboarding non industrialises. |
| KYC | N/A | N/A | N/A | ABSENT | Aucun modele, aucun endpoint, aucun ecran dedie KYC. |
| Dashboard utilisateur | N/A (a creer) | N/A | modeles existants | ABSENT | `/dashboard` manquant. |
| Dashboard agent/pro | N/A (a creer) | N/A | `User.profileType` | ABSENT | Pas d'espace agent operationnel. |
| Rebecca IA et chat | N/A | N/A | `Message` | ABSENT | Aucun flux chat IA/handoff implementes. |
| Escrow et transactions | N/A | N/A | `Transaction`, `EscrowAccount` | PARTIEL | Data presente, APIs et UI absentes. |
| Hotellerie | `src/app/hotels/page.tsx` | `src/app/api/hotels/route.ts` | `Hotel*` | PARTIEL | UI "en developpement", pas de reservation complete. |
| Learning | `src/app/learning/page.tsx` | `src/app/api/courses/route.ts` | `Course*` | PARTIEL | UI principalement vitrine, parcours cours incomplet. |
| Communaute | `src/app/community/page.tsx` | `src/app/api/forum/posts/route.ts` | `Forum*` | PARTIEL | Interactions surtout mockees, CRUD incomplet. |
| Marketplace artisans | N/A | N/A | N/A | ABSENT | Module non demarre. |
| Multitenancy pays | partiel (selection pays registration) | N/A | champs pays existants | ABSENT | Pas d'isolation tenant, pas de routage par pays. |
| Admin, analytics, notifications | `src/app/admin/page.tsx` | `src/app/api/admin/**`, `src/app/api/security/audit/route.ts` | `AuditLog`, `Notification` | PARTIEL | Dashboard admin mock, reset test data incoherent avec schema. |

## Suivi execution roadmap

- Phase 0: en cours
- Phase 1: en attente
- Phase 2: en attente
- Phase 3: en attente
- Phase 4: en attente
