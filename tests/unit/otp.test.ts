// AfriBayit — Unit Tests for OTP generation (P4.1)
// Critical module: phone/email verification
// Reference: CDC §4 — OTP 6 digits, 5 min expiry, max 3 attempts

import { describe, it, expect } from 'vitest';
import { generateOTP } from '@/lib/otp';

describe('OTP Generation (CDC §4)', () => {
  describe('generateOTP', () => {
    it('should generate a 6-digit code', () => {
      const code = generateOTP();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate different codes on successive calls', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        codes.add(generateOTP());
      }
      // Should generate at least 50 unique codes out of 100 (cryptographic randomness)
      expect(codes.size).toBeGreaterThan(50);
    });

    it('should only contain digits 0-9', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateOTP();
        expect(code).toMatch(/^[0-9]+$/);
      }
    });

    it('should be exactly 6 characters long', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateOTP();
        expect(code).toHaveLength(6);
      }
    });
  });
});
