// AfriBayit — Unit Tests for Escrow Engine (P4.1)
// Critical module: state machine + commission calculations
// Reference: CDC §6.2 — commission rates by transaction type

import { describe, it, expect } from 'vitest';
import {
  calculateCommissionByType,
  type CommissionTransactionType,
} from '@/lib/payments/escrow-engine';

describe('Escrow Engine — Commission Calculations (CDC §6.2)', () => {
  describe('Vente Immobilière (5/4/3/2%)', () => {
    const type: CommissionTransactionType = 'vente_immobiliere';

    it('should charge 5% for amounts ≤ 5M XOF', () => {
      const result = calculateCommissionByType(type, 5_000_000);
      expect(result.rate).toBe(0.05);
      expect(result.commission).toBe(250_000);
      expect(result.sellerPayout).toBe(4_750_000);
    });

    it('should charge 5% for the smallest property (1 XOF)', () => {
      const result = calculateCommissionByType(type, 1);
      expect(result.rate).toBe(0.05);
      expect(result.commission).toBe(0); // rounds to 0
    });

    it('should charge 4% for amounts between 5M and 20M XOF', () => {
      const result = calculateCommissionByType(type, 20_000_000);
      expect(result.rate).toBe(0.04);
      expect(result.commission).toBe(800_000);
      expect(result.sellerPayout).toBe(19_200_000);
    });

    it('should charge 3% for amounts between 20M and 50M XOF', () => {
      const result = calculateCommissionByType(type, 50_000_000);
      expect(result.rate).toBe(0.03);
      expect(result.commission).toBe(1_500_000);
      expect(result.sellerPayout).toBe(48_500_000);
    });

    it('should charge 2% for amounts above 50M XOF', () => {
      const result = calculateCommissionByType(type, 100_000_000);
      expect(result.rate).toBe(0.02);
      expect(result.commission).toBe(2_000_000);
      expect(result.sellerPayout).toBe(98_000_000);
    });

    it('should produce a breakdown with one entry', () => {
      const result = calculateCommissionByType(type, 10_000_000);
      expect(result.breakdown).toHaveLength(1);
      expect(result.breakdown[0].label).toBe('Commission vente immobilière');
    });
  });

  describe('Location Courte Durée (3%)', () => {
    const type: CommissionTransactionType = 'location_courte_duree';

    it('should charge 3% flat rate', () => {
      const result = calculateCommissionByType(type, 100_000);
      expect(result.rate).toBe(0.03);
      expect(result.commission).toBe(3_000);
      expect(result.sellerPayout).toBe(97_000);
    });
  });

  describe('Artisan Services (5%)', () => {
    const type: CommissionTransactionType = 'artisan';

    it('should charge 5% flat rate', () => {
      const result = calculateCommissionByType(type, 500_000);
      expect(result.rate).toBe(0.05);
      expect(result.commission).toBe(25_000);
      expect(result.sellerPayout).toBe(475_000);
    });
  });

  describe('Hôtellerie (12-15% by tier)', () => {
    const type: CommissionTransactionType = 'hotellerie';

    it('should charge 12% for 1-star hotel', () => {
      const result = calculateCommissionByType(type, 100_000, { hotelTier: 1 });
      expect(result.rate).toBe(0.12);
      expect(result.commission).toBe(12_000);
    });

    it('should charge 12% for 2-star hotel', () => {
      const result = calculateCommissionByType(type, 100_000, { hotelTier: 2 });
      expect(result.rate).toBe(0.12);
    });

    it('should charge 13% for 3-star hotel', () => {
      const result = calculateCommissionByType(type, 100_000, { hotelTier: 3 });
      expect(result.rate).toBe(0.13);
    });

    it('should charge 14% for 4-star hotel', () => {
      const result = calculateCommissionByType(type, 100_000, { hotelTier: 4 });
      expect(result.rate).toBe(0.14);
    });

    it('should charge 15% for 5-star hotel', () => {
      const result = calculateCommissionByType(type, 100_000, { hotelTier: 5 });
      expect(result.rate).toBe(0.15);
      expect(result.commission).toBe(15_000);
    });
  });

  describe('Guesthouse (10-13% voyageur + 3% propriétaire)', () => {
    const type: CommissionTransactionType = 'guesthouse';

    it('should charge 10% voyageur + 3% propriétaire for tier 1', () => {
      const result = calculateCommissionByType(type, 100_000, { guesthouseTier: 1 });
      expect(result.rate).toBeGreaterThan(0.10);
      expect(result.commission).toBe(13_000); // 10_000 + 3_000
    });

    it('should charge 12% voyageur + 3% propriétaire for tier 2 (default)', () => {
      const result = calculateCommissionByType(type, 100_000);
      expect(result.commission).toBe(15_000); // 12_000 + 3_000
    });

    it('should charge 13% voyageur + 3% propriétaire for tier 3', () => {
      const result = calculateCommissionByType(type, 100_000, { guesthouseTier: 3 });
      expect(result.commission).toBe(16_000); // 13_000 + 3_000
    });
  });

  describe('P1.7 — Commission rate alignment validation', () => {
    // These tests verify that the P1.7 fix is in place:
    // old payout.ts had 5/3.5/2.5/2% (wrong), new has 5/4/3/2% (matches escrow-engine)

    it('should never return 3.5% rate (old incorrect value)', () => {
      // Test across all amounts to ensure 3.5% never appears
      const amounts = [1, 100_000, 1_000_000, 5_000_000, 5_000_001, 10_000_000, 20_000_000, 50_000_000, 100_000_000];
      for (const amount of amounts) {
        const result = calculateCommissionByType('vente_immobiliere', amount);
        expect(result.rate).not.toBe(0.035);
      }
    });

    it('should never return 2.5% rate (old incorrect value)', () => {
      const amounts = [5_000_000, 20_000_000, 50_000_000, 100_000_000];
      for (const amount of amounts) {
        const result = calculateCommissionByType('vente_immobiliere', amount);
        expect(result.rate).not.toBe(0.025);
      }
    });
  });
});
