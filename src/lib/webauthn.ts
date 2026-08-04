// AfriBayit — WebAuthn (biometric) helpers (CDC §10)
//
// Implements the 4-endpoint WebAuthn flow against the backend:
//   1. POST /auth/webauthn/register/begin   → server challenge
//   2. POST /auth/webauthn/register/finish  → client attestation
//   3. POST /auth/webauthn/auth/begin       → server challenge
//   4. POST /auth/webauthn/auth/finish      → client assertion
//
// All public functions are SSR-safe (they early-return false / null when
// `window` or `PublicKeyCredential` is unavailable).

import { api } from './api-client';

// ─── Types ────────────────────────────────────────────────────────────────

interface AfribayitUser {
  id: string;
  email: string;
  name?: string;
}

interface WebauthnBeginResponse {
  challenge: string; // base64url
  rp?: { id?: string; name?: string };
  user?: {
    id: string; // base64url
    name?: string;
    displayName?: string;
  };
  pubKeyCredParams?: Array<{ type: 'public-key'; alg: number }>;
  timeout?: number;
  excludeCredentials?: Array<{ type: 'public-key'; id: string; transports?: string[] }>;
  allowCredentials?: Array<{ type: 'public-key'; id: string; transports?: string[] }>;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
}

interface WebauthnFinishResponse {
  verified?: boolean;
  credentialId?: string;
  error?: string;
}

interface AuthenticatorSelectionCriteria {
  authenticatorAttachment?: 'platform' | 'cross-platform';
  residentKey?: 'required' | 'preferred' | 'discouraged';
  userVerification?: 'required' | 'preferred' | 'discouraged';
}

// ─── Base64url helpers ────────────────────────────────────────────────────

/**
 * Decode a base64url string into a Uint8Array. Tolerates missing padding
 * and base64 (with `+` / `/`) input by normalising first.
 */
export function base64urlToBuffer(base64url: string): Uint8Array {
  if (typeof window === 'undefined') {
    // Node fallback for tests
    const normalized = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const binary = Buffer.from(padded, 'base64').toString('binary');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  const normalized = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    '=',
  );
  const binary = window.atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Encode a Uint8Array / ArrayBuffer into a base64url string (no padding).
 */
export function bufferToBase64url(
  buffer: Uint8Array | ArrayBuffer | ArrayLike<number>,
): string {
  const bytes = buffer instanceof Uint8Array
    ? buffer
    : new Uint8Array(buffer as ArrayBuffer);

  if (typeof window === 'undefined') {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return Buffer.from(binary, 'binary')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunkSize)) as unknown as number[],
    );
  }
  return window
    .btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ─── Capability detection ─────────────────────────────────────────────────

/**
 * Returns true if the current browser supports the WebAuthn API and the
 * platform authenticator (Touch ID, Face ID, Windows Hello, …).
 */
export function isBiometricSupported(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('PublicKeyCredential' in window)) return false;
  return typeof window.PublicKeyCredential === 'function';
}

export async function isUserVerifyingPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isBiometricSupported()) return false;
  try {
    // `getUserVerificationPlatformAuthenticatorAvailable` may be missing in
    // older browsers — guard with optional chaining.
    const available =
      await (window.PublicKeyCredential as unknown as {
        isUserVerifyingPlatformAuthenticatorAvailable?: () => Promise<boolean>;
      }).isUserVerifyingPlatformAuthenticatorAvailable?.();
    return available === true;
  } catch {
    return false;
  }
}

// ─── Registration ─────────────────────────────────────────────────────────

/**
 * Register a new biometric credential for `user`. Returns the credentialId
 * on success, or null on failure / user cancellation.
 *
 * Steps:
 *   1. POST /auth/webauthn/register/begin  → server challenge
 *   2. navigator.credentials.create({ publicKey })
 *   3. POST /auth/webauthn/register/finish  → client attestation
 */
export async function registerBiometric(
  user: AfribayitUser,
): Promise<{ credentialId: string } | null> {
  if (!isBiometricSupported()) {
    console.warn('[webauthn] WebAuthn not supported on this device.');
    return null;
  }

  // 1. Begin registration — ask the backend for a challenge.
  let beginResp: WebauthnBeginResponse;
  try {
    beginResp = await api.post<WebauthnBeginResponse>(
      '/auth/webauthn/register/begin',
      {
        userId: user.id,
        email: user.email,
        name: user.name ?? user.email,
      },
    );
  } catch (err) {
    console.error('[webauthn] register/begin failed:', err);
    return null;
  }

  // 2. Ask the browser / OS to create a credential.
  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge: base64urlToBuffer(beginResp.challenge) as unknown as BufferSource,
    rp: {
      id: beginResp.rp?.id,
      name: beginResp.rp?.name ?? 'AfriBayit',
    },
    user: {
      id: base64urlToBuffer(
        beginResp.user?.id ?? user.id,
      ) as unknown as BufferSource,
      name: beginResp.user?.name ?? user.email,
      displayName: beginResp.user?.displayName ?? user.name ?? user.email,
    },
    pubKeyCredParams: beginResp.pubKeyCredParams ?? [
      { type: 'public-key', alg: -7 }, // ES256
      { type: 'public-key', alg: -257 }, // RS256
    ],
    timeout: beginResp.timeout ?? 60_000,
    excludeCredentials: (beginResp.excludeCredentials ?? []).map((c) => ({
      type: c.type,
      id: base64urlToBuffer(c.id) as unknown as BufferSource,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    })),
    authenticatorSelection: beginResp.authenticatorSelection ?? {
      authenticatorAttachment: 'platform',
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    attestation: 'none',
  };

  let credential: PublicKeyCredential | null = null;
  try {
    credential = (await navigator.credentials.create({ publicKey })) as PublicKeyCredential | null;
  } catch (err) {
    // User cancelled or browser failed — not a hard error.
    console.warn('[webauthn] navigator.credentials.create failed:', err);
    return null;
  }
  if (!credential) return null;

  // 3. Send attestation to backend for verification + storage.
  const attestationResponse = credential.response as AuthenticatorAttestationResponse;
  const attestationResponseWithTransports =
    attestationResponse as AuthenticatorAttestationResponse & {
      getTransports?: () => AuthenticatorTransport[];
    };
  const finishPayload = {
    credentialId: credential.id,
    rawId: bufferToBase64url(credential.rawId),
    attestationObject: bufferToBase64url(attestationResponse.attestationObject),
    clientDataJSON: bufferToBase64url(attestationResponse.clientDataJSON),
    type: credential.type,
    transports:
      typeof attestationResponseWithTransports.getTransports === 'function'
        ? attestationResponseWithTransports.getTransports()
        : [],
  };

  try {
    const finishResp = await api.post<WebauthnFinishResponse>(
      '/auth/webauthn/register/finish',
      finishPayload,
    );
    if (finishResp?.verified) {
      return { credentialId: finishResp.credentialId ?? credential.id };
    }
    console.error('[webauthn] register/finish rejected:', finishResp?.error);
    return null;
  } catch (err) {
    console.error('[webauthn] register/finish failed:', err);
    return null;
  }
}

// ─── Authentication ───────────────────────────────────────────────────────

/**
 * Authenticate the user with a previously-registered biometric credential.
 * Returns true on success, false otherwise.
 *
 * Steps:
 *   1. POST /auth/webauthn/auth/begin  → server challenge
 *   2. navigator.credentials.get({ publicKey })
 *   3. POST /auth/webauthn/auth/finish  → client assertion
 */
export async function authenticateBiometric(email: string): Promise<boolean> {
  if (!isBiometricSupported()) {
    console.warn('[webauthn] WebAuthn not supported on this device.');
    return false;
  }

  // 1. Begin auth.
  let beginResp: WebauthnBeginResponse;
  try {
    beginResp = await api.post<WebauthnBeginResponse>(
      '/auth/webauthn/auth/begin',
      { email },
    );
  } catch (err) {
    console.error('[webauthn] auth/begin failed:', err);
    return false;
  }

  // 2. Ask OS for assertion.
  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge: base64urlToBuffer(beginResp.challenge) as unknown as BufferSource,
    rpId: beginResp.rp?.id ?? (typeof window !== 'undefined' ? window.location.hostname : 'afribayit.com'),
    timeout: beginResp.timeout ?? 60_000,
    userVerification: 'preferred',
    allowCredentials: (beginResp.allowCredentials ?? []).map((c) => ({
      type: c.type,
      id: base64urlToBuffer(c.id) as unknown as BufferSource,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    })),
  };

  let assertion: PublicKeyCredential | null = null;
  try {
    assertion = (await navigator.credentials.get({ publicKey })) as PublicKeyCredential | null;
  } catch (err) {
    console.warn('[webauthn] navigator.credentials.get failed:', err);
    return false;
  }
  if (!assertion) return false;

  // 3. Send assertion to backend.
  const assertionResponse = assertion.response as AuthenticatorAssertionResponse;
  const finishPayload = {
    credentialId: assertion.id,
    rawId: bufferToBase64url(assertion.rawId),
    authenticatorData: bufferToBase64url(assertionResponse.authenticatorData),
    clientDataJSON: bufferToBase64url(assertionResponse.clientDataJSON),
    signature: bufferToBase64url(assertionResponse.signature),
    userHandle: assertionResponse.userHandle
      ? bufferToBase64url(assertionResponse.userHandle)
      : null,
  };

  try {
    const finishResp = await api.post<WebauthnFinishResponse>(
      '/auth/webauthn/auth/finish',
      finishPayload,
    );
    return !!finishResp?.verified;
  } catch (err) {
    console.error('[webauthn] auth/finish failed:', err);
    return false;
  }
}

export default {
  isBiometricSupported,
  isUserVerifyingPlatformAuthenticatorAvailable,
  registerBiometric,
  authenticateBiometric,
  base64urlToBuffer,
  bufferToBase64url,
};
