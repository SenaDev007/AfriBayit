/**
 * AfriBayit — Togo Tax Rules
 * Tax calculation for property transactions in Togo
 * Rates as of 2025 (CFD 2018 + DCCF 2025)
 */

import type { TaxCalculation, TaxCalculatorInput, TaxLineItem } from './types';

// ============ TG Tax Rates ============

const REGISTRATION_RATE = 0.06;           // 6% Droit d'enregistrement
const NOTARY_RATE = 0.03;                 // 3% Honoraires notariaux
const CONSERVATION_RATE = 0.015;          // 1.5% Conservation foncière
const TRANSFER_TAX_RATE = 0.01;           // 1% Taxe de mutation
const STAMP_DUTY_FIXED = 5_000;
const MORTGAGE_RATE = 0.03;               // 3%
const VAT_RATE = 0.18;
const LAND_TAX_RATE = 0.01;               // 1% annuelle

export function calculateTogoTax(input: TaxCalculatorInput): TaxCalculation {
  const { propertyValue, transactionType, hasMortgage = false } = input;

  const breakdown: TaxLineItem[] = [];

  // 1. Registration Duty
  const registrationDuty = transactionType === 'achat' ? propertyValue * REGISTRATION_RATE : 0;
  if (registrationDuty > 0) {
    breakdown.push({
      name: 'Droit d\'enregistrement',
      description: 'Droit d\'enregistrement — Togo (6%)',
      rate: 6,
      amount: registrationDuty,
      isPercentage: true,
    });
  }

  // 2. Conservation Foncière
  const conservationFees = transactionType === 'achat' ? propertyValue * CONSERVATION_RATE : 0;
  if (conservationFees > 0) {
    breakdown.push({
      name: 'Conservation foncière',
      description: 'Frais de conservation foncière (1.5%)',
      rate: 1.5,
      amount: conservationFees,
      isPercentage: true,
    });
  }

  // 3. Notary Fees
  const notaryFees = transactionType === 'achat' ? propertyValue * NOTARY_RATE : propertyValue * 0.01;
  breakdown.push({
    name: 'Honoraires notariaux',
    description: `Taux de ${NOTARY_RATE * 100}% au Togo`,
    rate: NOTARY_RATE * 100,
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
    description: 'Taxe foncière annuelle — Togo',
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

  const totalTaxes = registrationDuty + conservationFees + transferTax + STAMP_DUTY_FIXED + vat + mortgageFees;
  const totalNotaryFees = notaryFees;
  const grandTotal = propertyValue + totalTaxes + totalNotaryFees;
  const effectiveRate = propertyValue > 0 ? ((totalTaxes + totalNotaryFees) / propertyValue) * 100 : 0;

  return {
    country: 'TG',
    countryName: 'Togo',
    propertyType: input.propertyType,
    transactionType,
    propertyValue,
    currency: 'XOF',
    registrationDuty,
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
