// AfriBayit — Rate Parity Enforcement
// Vérification et application de la parité des tarifs

import { db } from '@/lib/db';
import { ParityViolation, OTAProvider } from './types';

/** Vérifier la parité des tarifs sur tous les canaux */
export async function validateRates(
  hotelId: string,
  _rates: { roomTypeId: string; rate: number; currency: string }[]
): Promise<{ valid: boolean; violations: ParityViolation[] }> {
  const channelInventory = await db.channelInventory.findMany({
    where: { hotelId },
  });

  const violations: ParityViolation[] = [];

  // Grouper par roomTypeId
  const byRoom: Record<string, typeof channelInventory> = {};
  for (const inv of channelInventory) {
    if (!byRoom[inv.roomId]) byRoom[inv.roomId] = [];
    byRoom[inv.roomId].push(inv);
  }

  // Comparer les tarifs entre canaux pour chaque type de chambre
  for (const [roomTypeId, inventories] of Object.entries(byRoom)) {
    for (let i = 0; i < inventories.length; i++) {
      for (let j = i + 1; j < inventories.length; j++) {
        const a = inventories[i];
        const b = inventories[j];
        const rateA = a.rateXof || 0;
        const rateB = b.rateXof || 0;

        // Tolérance de 5% pour les différences de taux de change
        const maxDiscrepancy = 0.05;
        const discrepancy = Math.abs(rateA - rateB) / Math.max(rateA, rateB, 1);

        if (discrepancy > maxDiscrepancy) {
          violations.push({
            roomTypeId,
            providerA: a.ota as OTAProvider,
            rateA,
            providerB: b.ota as OTAProvider,
            rateB,
            discrepancy: Math.abs(rateA - rateB),
            discrepancyPct: Math.round(discrepancy * 100),
          });
        }
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/** Suggérer des tarifs paritaires par canal */
export function suggestParityRates(
  baseRate: number,
  channels: { ota: OTAProvider | 'direct'; commissionPct: number }[]
): { ota: OTAProvider | 'direct'; suggestedRate: number; commission: number }[] {
  // Le tarif sur chaque canal doit compenser la commission tout en restant
  // cohérent avec le tarif de base
  return channels.map((ch) => {
    // Pour le canal direct, pas de commission → tarif de base
    if (ch.ota === 'direct') {
      return {
        ota: ch.ota,
        suggestedRate: baseRate,
        commission: 0,
      };
    }

    // Pour les OTA, le tarif doit inclure la commission
    // rate = baseRate / (1 - commissionPct/100)
    const suggestedRate = Math.round(baseRate / (1 - ch.commissionPct / 100));
    const commission = Math.round(suggestedRate * (ch.commissionPct / 100));

    return {
      ota: ch.ota,
      suggestedRate,
      commission,
    };
  });
}

/** Identifier les violations de parité pour un hôtel */
export async function flagViolations(hotelId: string): Promise<ParityViolation[]> {
  const result = await validateRates(hotelId, []);
  return result.violations;
}
