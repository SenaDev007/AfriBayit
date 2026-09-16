import { describe, it, expect } from 'vitest';
import { parseJsonRecord, parseJsonArray, toJsonInput } from '@/lib/db-helpers';

/**
 * Paiements/auth — correctifs colonnes Json (webhooks escrow + payouts).
 *
 * Contexte : /api/payments/initiate écrivait `metadata: JSON.stringify({...})`
 * → Prisma stockait une CHAÎNE dans une colonne Json. Le webhook FedaPay
 * `transaction.approved` lisait ensuite `walletTx.metadata.transactionId`
 * sur cette chaîne castée → undefined → l'escrow n'était JAMAIS financé.
 * Même défaut pour ScheduledPayout.metadata (method/destination perdus) et
 * Notification.channels.
 */
describe('parseJsonRecord — lecture défensive des colonnes Json objet', () => {
  it('objet déjà correct → inchangé', () => {
    const md = { transactionId: 'tx_123', method: 'mobile_money_mtn' };
    expect(parseJsonRecord(md)).toEqual(md);
  });

  it('chaîne JSON objet (lignes legacy) → objet parsé', () => {
    // Ce que la BD contient après un ancien `JSON.stringify` write
    const legacy = JSON.stringify({ transactionId: 'tx_123', propertyId: 'prop_9' });
    const parsed = parseJsonRecord(legacy);
    expect(parsed.transactionId).toBe('tx_123');
    expect(parsed.propertyId).toBe('prop_9');
  });

  it("l'ancien bug du webhook : transactionId reste accessible sur une ligne legacy", () => {
    // Simule exactement le flux initiate (ancien write) → webhook (nouvelle lecture)
    const storedInDb = JSON.stringify({
      paymentId: 'pay_1',
      provider: 'fedapay',
      method: 'mobile_money_mtn',
      reference: 'tx_escrow_1',
      transactionId: 'tx_escrow_1',
      propertyId: 'prop_1',
      redirectUrl: 'https://fedapay.com/c/abc',
      countryCode: 'BJ',
    });
    const existingMetadata = parseJsonRecord(storedInDb);
    const transactionId = (existingMetadata.transactionId as string)
      || (existingMetadata.reference as string | undefined);
    expect(transactionId).toBe('tx_escrow_1'); // avant le fix : undefined → escrow jamais financé
  });

  it('null / undefined → objet vide', () => {
    expect(parseJsonRecord(null)).toEqual({});
    expect(parseJsonRecord(undefined)).toEqual({});
  });

  it('tableau (donnée incohérente) → objet vide, pas de crash', () => {
    expect(parseJsonRecord([1, 2, 3])).toEqual({});
  });

  it('chaîne non-JSON → objet vide', () => {
    expect(parseJsonRecord('bonjour')).toEqual({});
  });

  it('JSON invalide → objet vide', () => {
    expect(parseJsonRecord('{"transactionId": "tx')).toEqual({});
  });

  it('JSON null / primitif → objet vide', () => {
    expect(parseJsonRecord('null')).toEqual({});
    expect(parseJsonRecord('42')).toEqual({});
  });

  it('le spread d une chaîne ne produit plus de clés index', () => {
    // Avant : {...(metadata as Record<string,unknown>)} sur une chaîne
    // produisait {0:'{', 1:'"', ...} → corruption de la colonne à chaque verify
    const legacy = JSON.stringify({ a: 1 });
    const merged = { ...parseJsonRecord(legacy), verificationStatus: 'completed' };
    expect(Object.keys(merged).sort()).toEqual(['a', 'verificationStatus']);
  });
});

describe('Ecritures webhook — objets purs pour colonnes Json', () => {
  it('toJsonInput ne re-stringifie pas un objet', () => {
    const obj = { transactionId: 'tx_1', channels: ['push', 'email'] };
    expect(toJsonInput(obj)).toEqual(obj);
    expect(typeof toJsonInput(obj)).toBe('object');
  });

  it('toJsonInput convertit une chaîne JSON objet en objet (idempotent)', () => {
    const str = JSON.stringify({ transactionId: 'tx_1' });
    expect(toJsonInput(str)).toEqual({ transactionId: 'tx_1' });
  });

  it('channels écrit en tableau, pas en chaîne (escrow-engine)', () => {
    // Pattern corrigé : channels: ['push', 'email']
    const channels: unknown = ['push', 'email'];
    expect(parseJsonArray<string>(channels)).toEqual(['push', 'email']);
    // Lignes legacy : la chaîne '["push","email"]' reste lisible
    expect(parseJsonArray<string>('["push","email"]')).toEqual(['push', 'email']);
  });
});
