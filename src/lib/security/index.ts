// AfriBayit — Security Module Index
// Central export for all security utilities

export { rateLimit, withRateLimit, getRateLimitKey, getRateLimitConfigForPath, RATE_LIMIT_CONFIGS } from './rate-limiter';
export { hasPermission, requirePermission, withRBAC, mapDbRole, PERMISSIONS, type Role } from './rbac';
export { getCorsHeaders, handleCorsPreflightRequest, addCorsHeaders } from './cors';
export { getSecurityHeaders, applySecurityHeaders, getDevSecurityHeaders } from './helmet';
export { createTenantContext, getTenantCountryFilter, validateTenantAccess, addTenantFilter, withTenantGuard, getAllowedCountries } from './tenant-guard';
export {
  sanitizeString,
  sanitizeHtml,
  validateEmail,
  validatePhoneNumber,
  validatePrice,
  validateUrl,
  sanitizeObject,
  checkHoneypot,
  validateCountryCode,
  sanitizeSearchQuery,
  validatePagination,
} from './input-validation';
