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
export {
  detectHeadlessBrowser,
  validateHoneypotFields,
  analyzeRequestPattern,
  checkEndpointRateLimit,
  shouldTriggerCaptcha,
  recordFailedAttempt,
  clearFailedAttempts,
  comprehensiveScrapingCheck,
  DEFAULT_HONEYPOT_FIELDS,
  ENDPOINT_RATE_LIMITS,
} from './anti-scraping';
export {
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  rotateRefreshToken,
  blacklistToken,
  revokeAllUserTokens,
  isTokenBlacklisted,
  generateDeviceFingerprint,
  compareDeviceFingerprints,
  getTokenJti,
  getTokenStats,
  decodeJWTPayload,
  type JWTPayload,
  type TokenPair,
  type TokenVerificationResult,
  type DeviceFingerprint,
} from './jwt-security';
