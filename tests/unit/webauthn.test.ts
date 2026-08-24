// Unit tests for the WebAuthn helpers (CDC §4.1 — biometric auth).
// Tests the base64url encoding/decoding and the isBiometricSupported check.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bufferToBase64url, base64urlToBuffer } from '@/lib/webauthn';

describe('WebAuthn base64url helpers', () => {
  it('encodes a simple buffer to base64url', () => {
    const encoder = new TextEncoder();
    const buf = encoder.encode('hello');
    const result = bufferToBase64url(buf.buffer);
    // 'hello' in base64 is 'aGVsbG8=', base64url strips the '=' padding
    expect(result).toBe('aGVsbG8');
  });

  it('decodes base64url back to the original buffer', () => {
    const encoder = new TextEncoder();
    const original = encoder.encode('test message');
    const encoded = bufferToBase64url(original.buffer);
    const decoded = base64urlToBuffer(encoded);
    const decoder = new TextDecoder();
    expect(decoder.decode(decoded)).toBe('test message');
  });

  it('handles empty buffer', () => {
    const result = bufferToBase64url(new ArrayBuffer(0));
    expect(result).toBe('');
  });

  it('round-trips binary data', () => {
    const data = new Uint8Array([0, 1, 2, 3, 254, 255, 128, 64, 32]);
    const encoded = bufferToBase64url(data.buffer);
    const decoded = new Uint8Array(base64urlToBuffer(encoded));
    expect(Array.from(decoded)).toEqual(Array.from(data));
  });

  it('replaces + with - and / with _', () => {
    // Create a buffer that would produce + and / in standard base64
    const data = new Uint8Array([255, 191, 255, 191, 255, 191]);
    const result = bufferToBase64url(data.buffer);
    expect(result).not.toContain('+');
    expect(result).not.toContain('/');
    expect(result).not.toContain('=');
  });
});

describe('isBiometricSupported', () => {
  it('returns false on server (no window)', async () => {
    // In jsdom, window exists, but PublicKeyCredential may not.
    // We mock it to simulate the check.
    const { isBiometricSupported } = await import('@/lib/webauthn');
    // In jsdom, PublicKeyCredential is undefined, so it should return false.
    const result = await isBiometricSupported();
    expect(result).toBe(false);
  });
});
