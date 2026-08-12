/**
 * AfriBayit — AES-256-GCM Field Encryption
 * Provides symmetric encryption/decryption for sensitive data at rest
 * Uses AES-256-GCM with random IV and authentication tag
 */

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Encrypt a plaintext string using AES-256-GCM
 * Output format: iv:authTag:ciphertext (all hex-encoded)
 * 
 * @param plaintext - The string to encrypt
 * @returns Encrypted string in format "iv:authTag:ciphertext"
 */
export function encryptField(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt a ciphertext string using AES-256-GCM
 * Input format: iv:authTag:ciphertext (all hex-encoded)
 * 
 * @param ciphertext - The encrypted string in format "iv:authTag:ciphertext"
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails (tampered data or wrong key)
 */
export function decryptField(ciphertext: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Check if a string appears to be encrypted (matches iv:authTag:ciphertext format)
 */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  const [ivHex, authTagHex, encrypted] = parts;
  return (
    /^[0-9a-f]{32}$/i.test(ivHex) &&      // 16 bytes IV = 32 hex chars
    /^[0-9a-f]{32}$/i.test(authTagHex) &&  // 16 bytes auth tag = 32 hex chars
    /^[0-9a-f]+$/i.test(encrypted)          // Variable length ciphertext
  );
}

/**
 * Generate a new encryption key (for setup/installation)
 * Run once and store in .env as ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}
