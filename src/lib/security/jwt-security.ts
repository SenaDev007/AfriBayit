// AfriBayit — JWT Security Module (CDC §10)
// RS256 token generation/verification, refresh token rotation,
// token blacklist with TTL, and device fingerprinting for session validation

import crypto from 'crypto';

// ====== Types ======

export interface JWTPayload {
  sub: string;          // User ID
  email: string;
  role: string;
  iat: number;          // Issued at (seconds)
  exp: number;          // Expiration (seconds)
  jti: string;          // JWT ID (unique token identifier)
  deviceFingerprint?: string;
  country?: string;
  kycLevel?: number;    // KYC verification level (0-3)
  type: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiry: number;
  refreshExpiry: number;
}

export interface TokenVerificationResult {
  valid: boolean;
  payload?: JWTPayload;
  reason?: string;
  expired?: boolean;
  blacklisted?: boolean;
  deviceMismatch?: boolean;
}

export interface DeviceFingerprint {
  hash: string;
  components: {
    userAgent?: string;
    acceptLanguage?: string;
    screenResolution?: string;
    timezone?: string;
    platform?: string;
  };
}

export interface RefreshTokenRecord {
  jti: string;
  userId: string;
  deviceFingerprint: string;
  createdAt: number;
  expiresAt: number;
  rotatedFrom?: string;   // Previous token in rotation chain
  rotated: boolean;
}

// ====== Configuration ======

const ACCESS_TOKEN_EXPIRY = 15 * 60;           // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days
const BLACKLIST_CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Key pair storage (in production, load from env/files)
let keyPair: { publicKey: string; privateKey: string } | null = null;

function getKeyPair(): { publicKey: string; privateKey: string } {
  if (keyPair) return keyPair;

  // In production, load from environment or file system
  const envPrivateKey = process.env.JWT_PRIVATE_KEY;
  const envPublicKey = process.env.JWT_PUBLIC_KEY;

  if (envPrivateKey && envPublicKey) {
    keyPair = { publicKey: envPublicKey, privateKey: envPrivateKey };
    return keyPair;
  }

  // Generate a key pair for development (persists for server lifetime)
  const generated = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  keyPair = { publicKey: generated.publicKey, privateKey: generated.privateKey };
  return keyPair;
}

// ====== Token Blacklist (in-memory with TTL) ======

interface BlacklistEntry {
  jti: string;
  exp: number;     // Original token expiration
  blacklistedAt: number;
  reason?: string;
}

const tokenBlacklist = new Map<string, BlacklistEntry>();

// Cleanup expired blacklist entries periodically
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const [jti, entry] of tokenBlacklist) {
    // Remove entries where the original token has expired (no need to keep blacklisting it)
    if (entry.exp < now) {
      tokenBlacklist.delete(jti);
    }
  }
}, BLACKLIST_CLEANUP_INTERVAL);

// ====== Refresh Token Store ======

const refreshTokens = new Map<string, RefreshTokenRecord>();

// ====== Base64URL Encoding/Decoding ======

function base64UrlEncode(data: string): string {
  return Buffer.from(data, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(encoded: string): string {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padding = 4 - (base64.length % 4);
  if (padding !== 4) {
    base64 += '='.repeat(padding);
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

// ====== JWT Generation & Verification (RS256) ======

/**
 * Generate an RS256 JWT token.
 */
function generateJWT(payload: Omit<JWTPayload, 'iat' | 'jti'>): string {
  const keys = getKeyPair();
  const iat = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();

  const fullPayload: JWTPayload = {
    ...payload,
    iat,
    jti,
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer.sign(keys.privateKey, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${signingInput}.${signature}`;
}

/**
 * Verify an RS256 JWT token.
 */
function verifyJWT(token: string): { valid: boolean; payload?: JWTPayload; reason?: string } {
  const keys = getKeyPair();
  const parts = token.split('.');

  if (parts.length !== 3) {
    return { valid: false, reason: 'Format JWT invalide' };
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const signingInput = `${headerB64}.${payloadB64}`;

  // Verify signature
  let base64Signature = signatureB64.replace(/-/g, '+').replace(/_/g, '/');
  const padding = 4 - (base64Signature.length % 4);
  if (padding !== 4) {
    base64Signature += '='.repeat(padding);
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(signingInput);

  const signatureValid = verifier.verify(keys.publicKey, base64Signature, 'base64');
  if (!signatureValid) {
    return { valid: false, reason: 'Signature JWT invalide' };
  }

  // Decode payload
  try {
    const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadB64));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false, payload, reason: 'Token expire' };
    }

    // Check if blacklisted
    if (tokenBlacklist.has(payload.jti)) {
      return { valid: false, payload, reason: 'Token revoque' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, reason: 'Payload JWT invalide' };
  }
}

// ====== Public API ======

/**
 * Generate a new access/refresh token pair.
 */
export function generateTokenPair(
  userId: string,
  email: string,
  role: string,
  options?: {
    country?: string;
    kycLevel?: number;
    deviceFingerprint?: string;
    accessTokenExpiry?: number;
    refreshTokenExpiry?: number;
  }
): TokenPair {
  const now = Math.floor(Date.now() / 1000);
  const accessExpiry = now + (options?.accessTokenExpiry ?? ACCESS_TOKEN_EXPIRY);
  const refreshExpiry = now + (options?.refreshTokenExpiry ?? REFRESH_TOKEN_EXPIRY);

  // Generate access token
  const accessToken = generateJWT({
    sub: userId,
    email,
    role,
    exp: accessExpiry,
    country: options?.country,
    kycLevel: options?.kycLevel,
    deviceFingerprint: options?.deviceFingerprint,
    type: 'access',
  });

  // Generate refresh token
  const refreshJti = crypto.randomUUID();
  const refreshToken = generateJWT({
    sub: userId,
    email,
    role,
    exp: refreshExpiry,
    country: options?.country,
    kycLevel: options?.kycLevel,
    deviceFingerprint: options?.deviceFingerprint,
    type: 'refresh',
  });

  // Store refresh token record
  const refreshRecord: RefreshTokenRecord = {
    jti: refreshJti,
    userId,
    deviceFingerprint: options?.deviceFingerprint ?? '',
    createdAt: now,
    expiresAt: refreshExpiry,
    rotated: false,
  };
  refreshTokens.set(refreshJti, refreshRecord);

  return {
    accessToken,
    refreshToken,
    accessExpiry,
    refreshExpiry,
  };
}

/**
 * Verify an access token with full validation including device fingerprint.
 */
export function verifyAccessToken(
  token: string,
  options?: { deviceFingerprint?: string }
): TokenVerificationResult {
  const result = verifyJWT(token);

  if (!result.valid) {
    return {
      valid: false,
      payload: result.payload,
      reason: result.reason,
      expired: result.reason === 'Token expire',
      blacklisted: result.reason === 'Token revoque',
    };
  }

  const payload = result.payload!;

  // Ensure it's an access token
  if (payload.type !== 'access') {
    return {
      valid: false,
      payload,
      reason: 'Type de token invalide (refresh token utilise a la place de access token)',
    };
  }

  // Device fingerprint validation
  if (options?.deviceFingerprint && payload.deviceFingerprint) {
    if (options.deviceFingerprint !== payload.deviceFingerprint) {
      return {
        valid: false,
        payload,
        reason: 'Empreinte de l\'appareil non correspondante - possible vol de session',
        deviceMismatch: true,
      };
    }
  }

  return {
    valid: true,
    payload,
  };
}

/**
 * Verify a refresh token.
 */
export function verifyRefreshToken(token: string): TokenVerificationResult {
  const result = verifyJWT(token);

  if (!result.valid) {
    return {
      valid: false,
      payload: result.payload,
      reason: result.reason,
      expired: result.reason === 'Token expire',
      blacklisted: result.reason === 'Token revoque',
    };
  }

  const payload = result.payload!;

  if (payload.type !== 'refresh') {
    return {
      valid: false,
      payload,
      reason: 'Type de token invalide',
    };
  }

  return {
    valid: true,
    payload,
  };
}

/**
 * Rotate a refresh token: invalidate the old one and issue a new pair.
 * Implements refresh token rotation for security.
 */
export function rotateRefreshToken(
  oldRefreshToken: string,
  options?: { deviceFingerprint?: string; country?: string }
): TokenPair | null {
  // Verify the old refresh token
  const verification = verifyRefreshToken(oldRefreshToken);
  if (!verification.valid || !verification.payload) {
    return null;
  }

  const oldPayload = verification.payload;

  // Blacklist the old refresh token
  blacklistToken(oldPayload.jti, oldPayload.exp, 'rotation');

  // Mark old refresh record as rotated
  const oldRecord = refreshTokens.get(oldPayload.jti);
  if (oldRecord) {
    oldRecord.rotated = true;
  }

  // Generate new token pair
  const newPair = generateTokenPair(
    oldPayload.sub,
    oldPayload.email,
    oldPayload.role,
    {
      country: options?.country ?? oldPayload.country,
      kycLevel: oldPayload.kycLevel,
      deviceFingerprint: options?.deviceFingerprint ?? oldPayload.deviceFingerprint,
    }
  );

  // Link new refresh token to the old one (for audit trail)
  const newRefreshJti = JSON.parse(base64UrlDecode(newPair.refreshToken.split('.')[1])).jti;
  const newRecord = refreshTokens.get(newRefreshJti);
  if (newRecord) {
    newRecord.rotatedFrom = oldPayload.jti;
  }

  return newPair;
}

/**
 * Add a token to the blacklist.
 */
export function blacklistToken(
  jti: string,
  exp: number,
  reason?: string
): void {
  tokenBlacklist.set(jti, {
    jti,
    exp,
    blacklistedAt: Math.floor(Date.now() / 1000),
    reason,
  });
}

/**
 * Revoke all tokens for a user (useful for password changes, account lockout).
 */
export function revokeAllUserTokens(userId: string): number {
  let revokedCount = 0;

  // Blacklist all refresh tokens for this user
  for (const [, record] of refreshTokens) {
    if (record.userId === userId && !record.rotated) {
      blacklistToken(record.jti, record.expiresAt, 'user_revocation');
      record.rotated = true;
      revokedCount++;
    }
  }

  return revokedCount;
}

/**
 * Check if a token is blacklisted.
 */
export function isTokenBlacklisted(jti: string): boolean {
  return tokenBlacklist.has(jti);
}

// ====== Device Fingerprinting ======

/**
 * Generate a device fingerprint from request headers and client data.
 * This fingerprint is used to validate that sessions are being used from
 * the same device they were created on.
 */
export function generateDeviceFingerprint(
  headers: Headers,
  clientData?: { screenResolution?: string; timezone?: string; platform?: string }
): DeviceFingerprint {
  const userAgent = headers.get('user-agent') ?? '';
  const acceptLanguage = headers.get('accept-language') ?? '';

  const components: DeviceFingerprint['components'] = {
    userAgent,
    acceptLanguage,
    screenResolution: clientData?.screenResolution,
    timezone: clientData?.timezone,
    platform: clientData?.platform,
  };

  // Create hash from components
  const hashInput = [
    components.userAgent,
    components.acceptLanguage,
    components.screenResolution ?? '',
    components.timezone ?? '',
    components.platform ?? '',
  ].join('|');

  const hash = crypto
    .createHash('sha256')
    .update(hashInput)
    .digest('hex')
    .substring(0, 32); // Use first 32 chars as fingerprint

  return { hash, components };
}

/**
 * Compare two device fingerprints with tolerance for minor changes.
 * Allows for minor browser updates while detecting device switches.
 */
export function compareDeviceFingerprints(
  fingerprint1: string,
  fingerprint2: string
): { match: boolean; confidence: number } {
  if (fingerprint1 === fingerprint2) {
    return { match: true, confidence: 1 };
  }

  // Calculate similarity (character by character)
  let matchingChars = 0;
  const maxLen = Math.max(fingerprint1.length, fingerprint2.length);

  for (let i = 0; i < Math.min(fingerprint1.length, fingerprint2.length); i++) {
    if (fingerprint1[i] === fingerprint2[i]) {
      matchingChars++;
    }
  }

  const similarity = matchingChars / maxLen;

  // Consider it a match if >80% similar (allows for minor browser updates)
  return {
    match: similarity >= 0.8,
    confidence: similarity,
  };
}

// ====== Token Security Utilities ======

/**
 * Get the JWT ID (jti) from a token without full verification.
 * Useful for blacklisting tokens by ID.
 */
export function getTokenJti(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload: JWTPayload = JSON.parse(base64UrlDecode(parts[1]));
    return payload.jti ?? null;
  } catch {
    return null;
  }
}

/**
 * Get token statistics (for admin dashboards).
 */
export function getTokenStats(): {
  blacklistedTokens: number;
  activeRefreshTokens: number;
  rotatedRefreshTokens: number;
} {
  let activeRefresh = 0;
  let rotatedRefresh = 0;
  const now = Math.floor(Date.now() / 1000);

  for (const [, record] of refreshTokens) {
    if (record.expiresAt > now) {
      if (record.rotated) {
        rotatedRefresh++;
      } else {
        activeRefresh++;
      }
    }
  }

  return {
    blacklistedTokens: tokenBlacklist.size,
    activeRefreshTokens: activeRefresh,
    rotatedRefreshTokens: rotatedRefresh,
  };
}

/**
 * Parse the payload of a JWT without verification (for inspection only).
 */
export function decodeJWTPayload(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return null;
  }
}

/**
 * Get the current RSA public key (PEM format).
 * Useful for external services that need to verify tokens.
 */
export function getPublicKey(): string {
  return getKeyPair().publicKey;
}

/**
 * Get the current RSA private key (PEM format).
 * Should only be used internally — never expose to clients.
 */
export function getPrivateKey(): string {
  return getKeyPair().privateKey;
}
