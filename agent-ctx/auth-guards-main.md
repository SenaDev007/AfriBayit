# Task: Add Authentication Guards to API Routes

## Agent: main
## Task ID: auth-guards

## Summary

Added `authGuard` from `@/lib/auth-guard` to 19 previously unprotected API routes. The pattern used throughout the existing codebase is:

```typescript
import { authGuard } from '@/lib/auth-guard';

const auth = await authGuard();
if (!auth.success) return auth.response;
```

## Routes Updated

### CRITICAL Routes (1-3)
1. **`/api/escrow/[id]/ledger/route.ts`** — GET & POST: Auth required + participant/admin check (verifies `account.buyerId`, `account.sellerId`, or admin role)
2. **`/api/kyc/[id]/validate/route.ts`** — POST: Admin-only (`requiredRoles: ['admin']`)
3. **`/api/kyc/route.ts`** — GET: Auth required, users see own docs (admins can see all via userId param); POST: Auth required, uses `auth.userId` instead of `body.userId`

### User-Scoped Routes (4-10)
4. **`/api/notifications/route.ts`** — GET/POST/PATCH: All require auth; users only see/modify own notifications
5. **`/api/notaries/route.ts`** — GET: Public (browse notaries); POST: Auth required, uses `auth.userId`
6. **`/api/notaries/[id]/route.ts`** — GET: Public; PATCH: Auth + owner/admin check
7. **`/api/favorites/route.ts`** — GET/POST/DELETE: All require auth; scoped to `auth.userId`
8. **`/api/subscriptions/route.ts`** — GET/POST: Auth required; scoped to `auth.userId`
9. **`/api/chat/conversations/route.ts`** — GET/POST: Auth required; scoped to `auth.userId`
10. **`/api/chat/conversations/[id]/messages/route.ts`** — GET/POST: Auth + participant check; uses `auth.userId` as senderId

### Community Routes (11-13)
11. **`/api/community/posts/route.ts`** — GET: Public; POST: Auth required, uses `auth.userId` as authorId
12. **`/api/community/events/route.ts`** — GET: Public; POST: Auth required, uses `auth.userId` as organizerId
13. **`/api/community/groups/route.ts`** — GET: Public; POST: Auth required

### Hospitality Routes (14-19)
14. **`/api/hotels/route.ts`** — GET: Public; POST: Auth required, uses `auth.userId` as ownerId
15. **`/api/guesthouses/route.ts`** — GET: Public; POST: Auth required, uses `auth.userId` as ownerId
16. **`/api/hotels/[id]/bookings/route.ts`** — GET: Public; POST: Auth required, uses `auth.userId`
17. **`/api/guesthouses/[id]/bookings/route.ts`** — GET: Public; POST: Auth required, uses `auth.userId`
18. **`/api/hotels/[id]/reviews/route.ts`** — GET: Public; POST: Auth required, uses `auth.userId`
19. **`/api/reviews/route.ts`** — GET: Public; POST: Auth required, uses `auth.userId` as reviewerId

## Key Design Decisions

- **Impersonation prevention**: Where `body.userId` was previously used, replaced with `auth.userId` so users can't act as others
- **Admin bypass**: Admin users get broader access (e.g., see all KYC docs, update any notary profile)
- **Participant checks**: For escrow ledger and chat messages, verify the user is actually a participant before allowing access
- **Public reads preserved**: Browsing/listing endpoints (hotels, guesthouses, notaries, community, reviews) remain publicly accessible
- **French error messages**: Used existing convention (`'Accès non autorisé'`, `'Non authentifié'` from authGuard)

## Verification
- `bun run lint` passes with no errors
- Dev server running cleanly with no compilation errors
