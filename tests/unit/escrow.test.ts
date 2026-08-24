import { describe, it, expect } from 'vitest';
import { ESCROW_STATES, TERMINAL_STATES, canTransition, getValidTransitions, getTransitionMap, calculateCommissionByType } from '@/lib/payments/escrow-engine';
import type { TransactionState } from '@/lib/payments/types';

describe('Escrow state machine (CDC §7B.3 + §5.0bis.4) — REAL engine', () => {
  it('ESCROW_STATES has 12 canonical states', () => { expect(ESCROW_STATES).toHaveLength(12); });
  it('includes the 3 previously-missing states', () => {
    for (const s of ['DOCS_VALIDATED', 'GEOTRUST_VALIDATED', 'NOTARY_IN_PROGRESS'] as TransactionState[]) expect(ESCROW_STATES).toContain(s);
  });
  it('has 3 terminal states', () => {
    expect(TERMINAL_STATES).toHaveLength(3);
    for (const t of TERMINAL_STATES) expect(getValidTransitions(t)).toHaveLength(0);
  });
  it('CREATED → FUNDED', () => { expect(canTransition('CREATED', 'FUNDED')).toBe(true); });
  it('FUNDED → DOCS_VALIDATED', () => { expect(canTransition('FUNDED', 'DOCS_VALIDATED')).toBe(true); });
  it('DOCS_VALIDATED → GEOTRUST_VALIDATED', () => { expect(canTransition('DOCS_VALIDATED', 'GEOTRUST_VALIDATED')).toBe(true); });
  it('notary chain', () => {
    expect(canTransition('NOTARY_ASSIGNED', 'NOTARY_IN_PROGRESS')).toBe(true);
    expect(canTransition('NOTARY_IN_PROGRESS', 'DEED_SIGNED')).toBe(true);
    expect(canTransition('DEED_SIGNED', 'ANDF_REGISTERED')).toBe(true);
    expect(canTransition('ANDF_REGISTERED', 'RELEASED')).toBe(true);
  });
  it('rejects invalid transitions', () => { expect(canTransition('CREATED', 'RELEASED')).toBe(false); });
  it('any active state → DISPUTED', () => {
    for (const s of ['CREATED','FUNDED','DOCS_VALIDATED','GEOTRUST_VALIDATED','NOTARY_ASSIGNED','NOTARY_IN_PROGRESS','DEED_SIGNED','ANDF_REGISTERED'] as TransactionState[]) expect(canTransition(s, 'DISPUTED')).toBe(true);
  });
  it('GEO_VERIFIED is alias for GEOTRUST_VALIDATED', () => {
    expect(canTransition('GEO_VERIFIED', 'NOTARY_ASSIGNED')).toBe(true);
    expect(canTransition('GEO_VERIFIED', 'DISPUTED')).toBe(true);
    expect(getValidTransitions('GEO_VERIFIED').sort()).toEqual(getValidTransitions('GEOTRUST_VALIDATED').sort());
  });
});

describe('Commission calculation — REAL engine', () => {
  it('property sale 2-5%', () => {
    expect(calculateCommissionByType('vente_immobiliere', 5_000_000).rate).toBe(0.05);
    expect(calculateCommissionByType('vente_immobiliere', 10_000_000).rate).toBe(0.04);
    expect(calculateCommissionByType('vente_immobiliere', 30_000_000).rate).toBe(0.03);
    expect(calculateCommissionByType('vente_immobiliere', 100_000_000).rate).toBe(0.02);
  });
  it('short-term 3%', () => { expect(calculateCommissionByType('location_courte_duree', 100_000).rate).toBe(0.03); });
  it('hotel 12-15%', () => {
    expect(calculateCommissionByType('hotellerie', 100_000, { hotelTier: 1 }).rate).toBe(0.12);
    expect(calculateCommissionByType('hotellerie', 100_000, { hotelTier: 5 }).rate).toBe(0.15);
  });
  it('artisan 5%', () => { expect(calculateCommissionByType('artisan', 100_000).rate).toBe(0.05); });
});
