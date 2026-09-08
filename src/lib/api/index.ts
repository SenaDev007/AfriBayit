// AfriBayit — API Layer
// Centralized API utilities, middleware, and response helpers

export {
  composeMiddleware,
  corsMiddleware,
  requestIdMiddleware,
  rateLimitMiddleware,
  authMiddleware,
  loggingMiddleware,
  apiResponse,
  apiError,
  apiPaginatedResponse,
} from './middleware';

export { cache, cacheWrap, buildCacheKey, invalidatePropertyCache, invalidateAvmCache, invalidateStatsCache } from '@/lib/cache';

// Re-export client-side API helpers from the real api-client module
export { apiFetch, apiPost, apiPut, apiPatch, apiDelete } from '@/lib/api-client';
