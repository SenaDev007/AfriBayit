/**
 * AfriBayit — Argon2id Password Hashing Module
 * CDC §6 — Security: Argon2id with salt ≥ 12 bytes
 *
 * Argon2id is the recommended password hashing algorithm (OWASP 2023).
 * It provides resistance against GPU/ASIC brute-force attacks and side-channel attacks.
 *
 * Parameters (OWASP-recommended):
 * - memoryCost: 65536 KiB (64 MB)
 * - timeCost: 3 iterations
 * - parallelism: 4 threads
 */

import argon2 from 'argon2';

/** Argon2id parameters — OWASP recommended defaults */
const ARGON2ID_OPTIONS: argon2.Options & { type: 0 | 1 | 2 } = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB — high memory makes GPU attacks expensive
  timeCost: 3, // 3 iterations — minimum recommended
  parallelism: 4, // 4 threads — reasonable for server hardware
};

/**
 * Hash a password using Argon2id
 *
 * @param password - The plaintext password to hash
 * @returns A Promise resolving to the Argon2id hash string (includes salt + params)
 *
 * @example
 * ```ts
 * const hash = await hashPassword('mySecureP@ss');
 * // $argon2id$v=19$m=65536,t=3,p=4$<salt>$<hash>
 * ```
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2ID_OPTIONS);
}

/**
 * Verify a password against an Argon2id hash
 *
 * @param password - The plaintext password to verify
 * @param hash - The Argon2id hash to verify against
 * @returns A Promise resolving to true if the password matches
 *
 * @example
 * ```ts
 * const isValid = await verifyPassword('mySecureP@ss', storedHash);
 * if (!isValid) throw new Error('Invalid credentials');
 * ```
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    // If the hash format is invalid or verification fails, return false
    return false;
  }
}

/**
 * Check if a hash needs rehashing (e.g., if parameters have changed)
 * Useful for migrating from older hash parameters to current ones.
 *
 * @param hash - The existing Argon2 hash
 * @returns true if the hash should be regenerated with current parameters
 */
export function needsRehash(hash: string): boolean {
  return argon2.needsRehash(hash, ARGON2ID_OPTIONS);
}
