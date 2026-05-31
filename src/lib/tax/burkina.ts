/**
 * AfriBayit — Burkina Faso Tax Rules
 * Tax calculation for property transactions in Burkina Faso
 * Rates as of 2025 (RAF 2025)
 */

import type { TaxCalculation, TaxCalculatorInput, TaxLineItem } from './types';

// ============ BF Tax Rates ============

const REGISTRATION_RATE = 0.05;           // 5% Droit d'enregistrement
const NOTARY_RATE_LOW = 0.02;             // 2% for properties < 30M XOF
const NOTARY_RATE_HIGH = 0.05;            // 5% for properties >= 30M XOF
const NOTARY_THRESHOLD = 30_000_000;
const REGISTRATION_TAX_RATE = 0.01;       // 1% Taxe d'enregistrement additionnelle
const TRANSFER_TAX_RATE = 0.01;           // 1% Taxe de mutation
const STAMP_DUTY_FIXED = 5_000;
const MORTGAGE_RATE = 0.03;               // 3% Hypothèque
const VAT_RATE = 0.18;
const LAND_TAX_RATE = 0.012;              // 1.2% annuelle

export function calculateBurkinaTax(input: TaxCalculatorInput): TaxCalculation {
  const { propertyValue, transactionType, hasMortgage = false } = input;

  const breakdown: TaxLineItem[] = [];

  // 1. Registration Duty
  const registrationDuty = transactionType === 'achat' ? propertyValue * REGISTRATION_RATE : 0;
  if (registrationDuty > 0) {
    breakdown.push({
      name: 'Droit d\'enregistrement',
      description: 'Droit d\'enregistrement standard BF',
      rate: 5,
      amount: registrationDuty,
      isPercentage: true,
    });
  }

  // 2. Additional Registration Tax
  const registrationTax = transactionType === 'achat' ? propertyValue * REGISTRATION_TAX_RATE : 0;
  if (registrationTax > 0) {
    breakdown.push({
      name: 'Taxe d\'enregistrement additionnelle',
      description: 'Taxe additionnelle d\'enregistrement (RAF 2025)',
      rate: 1,
      amount: registrationTax,
      isPercentage: true,
    });
  }

  // 3. Notary Fees
  const notaryRate = propertyValue >= NOTARY_THRESHOLD ? NOTARY_RATE_HIGH : NOTARY_RATE_LOW;
  const notaryFees = transactionType === 'achat' ? propertyValue * notaryRate : propertyValue * 0.01;
  breakdown.push({
    name: 'Honoraires notariaux',
    description: notaryRate === NOTARY_RATE_HIGH
      ? `Taux de ${notaryRate * 100}% (bien ≥ 30M XOF)`
      : `Taux de ${notaryRate * 100}% (bien < 30M XOF)`,
    rate: notaryRate * 100,
    amount: notaryFees,
    isPercentage: true,
  });

  // 4. Transfer Tax
  const transferTax = transactionType === 'achat' ? propertyValue * TRANSFER_TAX_RATE : 0;
  if (transferTax > 0) {
    breakdown.push({
      name: 'Taxe de mutation',
      description: 'Taxe de mutation de propriété',
      rate: 1,
      amount: transferTax,
      isPercentage: true,
    });
  }

  // 5. Stamp Duty
  breakdown.push({
    name: 'Droit de timbre',
    description: 'Droit de timbre fixe',
    rate: STAMP_DUTY_FIXED,
    amount: STAMP_DUTY_FIXED,
    isPercentage: false,
  });

  // 6. Land Tax
  const landTax = propertyValue * LAND_TAX_RATE;
  breakdown.push({
    name: 'Taxe foncière (annuelle)',
    description: 'Taxe foncière annuelle — Burkina Faso',
    rate: LAND_TAX_RATE * 100,
    amount: landTax,
    isPercentage: true,
  });

  // 7. VAT
  const vat = (input.propertyType === 'commerce' || input.propertyType === 'bureau')
    ? notaryFees * VAT_RATE : 0;
  if (vat > 0) {
    breakdown.push({
      name: 'TVA (sur honoraires)',
      description: 'TVA sur honoraires notariaux',
      rate: 18,
      amount: vat,
      isPercentage: true,
    });
  }

  // 8. Mortgage Fees
  let mortgageFees = 0;
  if (hasMortgage && transactionType === 'achat') {
    mortgageFees = propertyValue * MORTGAGE_RATE;
    breakdown.push({
      name: 'Frais hypothécaires',
      description: 'Frais d\'inscription hypothécaire (3%)',
      rate: 3,
      amount: mortgageFees,
      isPercentage: true,
    });
  }

  const totalTaxes = registrationDuty + registrationTax + transferTax + STAMP_DUTY_FIXED + vat + mortgageFees;
  const totalNotaryFees = notaryFees;
  const grandTotal = propertyValue + totalTaxes + totalNotaryFees;
  const effectiveRate = propertyValue > 0 ? ((totalTaxes + totalNotaryFees) / propertyValue) * 100 : 0;

  return {
    country: 'BF',
    countryName: 'Burkina Faso',
    propertyType: input.propertyType,
    transactionType,
    propertyValue,
    currency: 'XOF',
    registrationDuty: registrationDuty + registrationTax,
    notaryFees,
    landTax,
    transferTax,
    stampDuty: STAMP_DUTY_FIXED,
    vat,
    mortgageFees,
    totalTaxes,
    totalNotaryFees,
    grandTotal,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    breakdown,
  };
}
