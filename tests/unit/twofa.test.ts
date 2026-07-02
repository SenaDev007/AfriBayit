// AfriBayit — Unit Tests for 2FA TOTP (P4.1)
// Critical module: escrow release + admin login
// Reference: CDC §10 — RFC 6238 TOTP

import { describe, it, expect } from 'vitest';
import { verifyTOTP } from '@/lib/twofa';

describe('2FA TOTP — RFC 6238 (CDC §10)', () => {
  describe('verifyTOTP', () => {
    it('should be a function', () => {
      expect(typeof verifyTOTP).toBe('function');
    });

    it('should reject invalid code format gracefully', () => {
      // A valid base32 secret
      const secret = 'JBSWY3DPEHPK3PXP'; // standard test secret
      // verifyTOTP should not throw on bad input
      expect(() => verifyTOTP(secret, '')).not.toThrow();
      expect(() => verifyTOTP(secret, 'abc')).not.toThrow();
      expect(() => verifyTOTP(secret, '12345')).not.toThrow();
    });

    it('should return boolean for valid format codes', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      const result = verifyTOTP(secret, '123456');
      expect(typeof result).toBe('boolean');
    });

    it('should reject empty codes', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      // An empty code should never verify
      const result = verifyTOTP(secret, '');
      expect(result).toBe(false);
    });
  });

  describe('P1.1 — Escrow 2FA bypass validation', () => {
    // These tests verify that the P1.1 fix is in place:
    // 2FA codes are MANDATORY and there's no confirmationChecked bypass.
    // The actual bypass removal is verified in e2e tests (tests/e2e/auth.spec.ts).

    it('verifyTOTP should not have a confirmationChecked parameter', () => {
      // verifyTOTP(secret, token) — only 2 params, no boolean bypass
      expect(verifyTOTP.length).toBe(2);
    });

    it('verifyTOTP should never accept empty string as valid', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      expect(verifyTOTP(secret, '')).toBe(false);
    });

    it('verifyTOTP should not throw on undefined/null', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      // @ts-expect-error — testing runtime safety
      expect(() => verifyTOTP(secret, undefined)).not.toThrow();
      // @ts-expect-error — testing runtime safety
      expect(() => verifyTOTP(secret, null)).not.toThrow();
    });
  });
});
