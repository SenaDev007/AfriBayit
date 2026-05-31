/**
 * AfriBayit — Bénin Tax Rules
 * Tax calculation for property transactions in Bénin
 * Rates as of 2025
 */

import type { TaxCalculation, TaxCalculatorInput, TaxLineItem } from './types';

// ============ Bénin Tax Rates ============

const REGISTRATION_RATE = 0.05;           // 5% Droit d'enregistrement
const NOTARY_RATE_LOW = 0.02;             // 2% for properties < 50M XOF
const NOTARY_RATE_HIGH = 0.03;            // 3% for properties >= 50M XOF
const NOTARY_THRESHOLD = 50_000_000;      // 50M XOF
const TRANSFER_TAX_RATE = 0.011;          // 1.1% Taxe de mutation
const STAMP_DUTY_FIXED = 5_000;          // 5,000 XOF Droit de timbre
const MORTGAGE_REGISTRATION_RATE = 0.03;  // 3% Frais d'inscription hypothécaire
const MORTGAGE_CONSERVATION_RATE = 0.002; // 0.2% Conservation hypothécaire
const VAT_RATE = 0.18;                    // 18% TVA (on notary fees for commercial)
const LAND_TAX_ANNUAL_RATE = 0.015;       // 1.5% Taxe foncière annuelle (varies by location)
const LAND_TAX_LOCATION_RATES: Record<string, number> = {
  cotonou: 0.02,
  porto_novo: 0.015,
  parakou: 0.012,
  abomey_calavi: 0.015,
  default: 0.015,
};

export function calculateBeninTax(input: TaxCalculatorInput): TaxCalculation {
  const { propertyValue, transactionType, hasMortgage = false, isPrimaryResidence = true, location = '' } = input;

  const breakdown: TaxLineItem[] = [];

  // 1. Registration Duty (Droit d'enregistrement)
  let registrationDuty = 0;
  if (transactionType === 'achat') {
    if (isPrimaryResidence && propertyValue <= 20_000_000) {
      // Reduced rate for primary residence under 20M XOF
      registrationDuty = propertyValue * 0.02;
      breakdown.push({
        name: 'Droit d\'enregistrement (réduit)',
        description: 'Taux réduit pour résidence principale < 20M XOF',
        rate: 2,
        amount: registrationDuty,
        isPercentage: true,
      });
    } else {
      registrationDuty = propertyValue * REGISTRATION_RATE;
      breakdown.push({
        name: 'Droit d\'enregistrement',
        description: 'Droit d\'enregistrement standard',
        rate: 5,
        amount: registrationDuty,
        isPercentage: true,
      });
    }
  }

  // 2. Notary Fees
  const notaryRate = propertyValue >= NOTARY_THRESHOLD ? NOTARY_RATE_HIGH : NOTARY_RATE_LOW;
  const notaryFees = transactionType === 'achat' ? propertyValue * notaryRate : propertyValue * 0.01;
  breakdown.push({
    name: 'Honoraires notariaux',
    description: notaryRate === NOTARY_RATE_HIGH
      ? `Taux de ${notaryRate * 100}% (bien ≥ 50M XOF)`
      : `Taux de ${notaryRate * 100}% (bien < 50M XOF)`,
    rate: notaryRate * 100,
    amount: notaryFees,
    isPercentage: true,
  });

  // 3. Transfer Tax (Taxe de mutation)
  const transferTax = transactionType === 'achat' ? propertyValue * TRANSFER_TAX_RATE : 0;
  if (transferTax > 0) {
    breakdown.push({
      name: 'Taxe de mutation',
      description: 'Taxe sur la mutation de propriété',
      rate: 1.1,
      amount: transferTax,
      isPercentage: true,
    });
  }

  // 4. Stamp Duty
  const stampDuty = STAMP_DUTY_FIXED;
  breakdown.push({
    name: 'Droit de timbre',
    description: 'Droit de timbre fixe',
    rate: STAMP_DUTY_FIXED,
    amount: stampDuty,
    isPercentage: false,
  });

  // 5. Land Tax (Annual, for reference)
  const locationKey = location.toLowerCase().replace(/[\s-]/g, '_') || 'default';
  const landTaxRate = LAND_TAX_LOCATION_RATES[locationKey] || LAND_TAX_LOCATION_RATES.default;
  const landTax = propertyValue * landTaxRate;
  breakdown.push({
    name: 'Taxe foncière (annuelle)',
    description: `Taxe foncière annuelle — taux ${landTaxRate * 100}% (${location || 'taux standard'})`,
    rate: landTaxRate * 100,
    amount: landTax,
    isPercentage: true,
  });

  // 6. VAT (on notary fees for commercial properties)
  const vat = input.propertyType === 'commerce' || input.propertyType === 'bureau'
    ? notaryFees * VAT_RATE
    : 0;
  if (vat > 0) {
    breakdown.push({
      name: 'TVA (sur honoraires)',
      description: 'TVA de 18% sur les honoraires notariaux (bien commercial/bureau)',
      rate: 18,
      amount: vat,
      isPercentage: true,
    });
  }

  // 7. Mortgage Fees
  let mortgageFees = 0;
  if (hasMortgage && transactionType === 'achat') {
    const mortgageRegistration = propertyValue * MORTGAGE_REGISTRATION_RATE;
    const mortgageConservation = propertyValue * MORTGAGE_CONSERVATION_RATE;
    mortgageFees = mortgageRegistration + mortgageConservation;
    breakdown.push({
      name: 'Inscription hypothécaire',
      description: 'Frais d\'inscription hypothécaire (3%)',
      rate: 3,
      amount: mortgageRegistration,
      isPercentage: true,
    });
    breakdown.push({
      name: 'Conservation hypothécaire',
      description: 'Frais de conservation hypothécaire (0.2%)',
      rate: 0.2,
      amount: mortgageConservation,
      isPercentage: true,
    });
  }

  // Summary
  const totalTaxes = registrationDuty + transferTax + stampDuty + vat + mortgageFees;
  const totalNotaryFees = notaryFees;
  const grandTotal = propertyValue + totalTaxes + totalNotaryFees;
  const effectiveRate = propertyValue > 0 ? ((totalTaxes + totalNotaryFees) / propertyValue) * 100 : 0;

  return {
    country: 'BJ',
    countryName: 'Bénin',
    propertyType: input.propertyType,
    transactionType,
    propertyValue,
    currency: 'XOF',
    registrationDuty,
    notaryFees,
    landTax,
    transferTax,
    stampDuty,
    vat,
    mortgageFees,
    totalTaxes,
    totalNotaryFees,
    grandTotal,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    breakdown,
  };
}
