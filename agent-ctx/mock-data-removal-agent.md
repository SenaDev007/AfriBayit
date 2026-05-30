# Task: Rewrite AfriBayit frontend components to use React Query hooks instead of mock data

## Summary

All 7 specified components have been rewritten to eliminate `@/lib/mockData` imports and use React Query hooks for all dynamic data. The data now flows from: React Query hooks → API routes → Prisma → PostgreSQL.

## Files Created

1. **`src/lib/afribayit-utils.ts`** - Shared utilities and types extracted from mockData:
   - `PropertyData` interface (replaces `Property` from mockData)
   - `PropertiesResponse` and `PropertyDetailResponse` types
   - `COUNTRIES_CONFIG` (static config, not from DB)
   - `formatPrice()`, `getPropertyTypeLabel()`, `getTransactionLabel()` utility functions

2. **`src/app/api/properties/[id]/route.ts`** - New API endpoint for single property fetch:
   - GET handler with owner/agent info join
   - Parses JSON string fields (images, features) into arrays
   - Increments view count asynchronously
   - Returns 404 for not found

## Files Updated

1. **`src/app/api/properties/route.ts`** - Enhanced existing API route:
   - Added `premium` and `sortBy` query params
   - Added owner/agent include with professional profile
   - Parses JSON string fields (images, features) into arrays
   - Supports sort by: recent, price-asc, price-desc, popular

2. **`src/hooks/useProperties.ts`** - Updated with proper TypeScript types:
   - Uses `PropertiesResponse` and `PropertyDetailResponse` from afribayit-utils
   - Added `premium` and `sortBy` filter params
   - Skips 'all' values for type/transaction/city/country filters
   - Re-exports `PropertyData` type for convenience

3. **`src/components/afribayit/FeaturedProperties.tsx`** - Rewritten:
   - Removed `import { properties } from '@/lib/mockData'`
   - Uses `useProperties({ limit: 6 })` hook
   - Filters for premium/verified properties, falls back to first 6
   - Added loading skeleton state (6 cards)
   - Added error state with retry message
   - Added empty state when no properties found

4. **`src/components/afribayit/SearchResults.tsx`** - Rewritten:
   - Removed `import { properties, countries, getPropertyTypeLabel } from '@/lib/mockData'`
   - Uses `useProperties(filterParams)` hook with all filter state
   - Filters are reactive - API is called with updated params on every change
   - Uses `COUNTRIES_CONFIG` from afribayit-utils for country/city dropdowns
   - Uses `getPropertyTypeLabel` from afribayit-utils
   - Added loading skeleton state (6 cards, supports grid/list)
   - Added error state
   - Sort order now handled by API (sortBy param)

5. **`src/components/afribayit/PropertyCard.tsx`** - Rewritten:
   - Removed `import { Property, getPropertyTypeLabel, getTransactionLabel } from '@/lib/mockData'`
   - Accepts `PropertyData` from afribayit-utils as props
   - Uses `formatPrice`, `getPropertyTypeLabel`, `getTransactionLabel` from afribayit-utils
   - Computes `priceLabel` from `property.price` and `property.transaction`
   - Fallback image when no images available
   - No hook needed (parent passes data)

6. **`src/components/afribayit/PropertyDetail.tsx`** - Rewritten:
   - Removed `import { properties, agents, formatPrice } from '@/lib/mockData'`
   - Uses `useProperty(propertyId)` hook for single property fetch
   - Added full-page loading skeleton state
   - Added error state with retry message
   - Added not-found state
   - Agent info comes from property.agent (joined in API)
   - Uses `formatPrice` from afribayit-utils
   - Handles missing images/features with fallbacks

7. **`src/components/afribayit/Navbar.tsx`** - Rewritten:
   - Removed `import { properties, countries } from '@/lib/mockData'`
   - Uses `COUNTRIES_CONFIG` from afribayit-utils for country selector
   - Extracted `NAV_LINKS` and `MOBILE_NAV_ITEMS` as config constants
   - No dynamic data - purely static config

## Files Not Changed (already clean)

- **`HeroSection.tsx`** - No mockData imports. Stats are hardcoded platform config.
- **`TrustSection.tsx`** - No mockData imports. Pillars data is static config.

## Verification

- ✅ `bun run lint` passes with no errors
- ✅ TypeScript compilation: no errors in changed files
- ✅ Dev server running successfully (all GET / requests return 200)
- ✅ No `@/lib/mockData` imports in any of the 7 updated components
