/**
 * AfriBayit — Côte d'Ivoire Tax Rules
 * Tax calculation for property transactions in Côte d'Ivoire
 * Rates as of 2025
 */

import type { TaxCalculation, TaxCalculatorInput, TaxLineItem } from './types';

// ============ CI Tax Rates ============

const REGISTRATION_RATE = 0.04;           // 4% Droit d'enregistrement
const NOTARY_RATE = 0.025;                // 2.5% Honoraires notariaux
const TRANSFER_TAX_RATE = 0.011;          // 1.1% Taxe de mutation
const STAMP_DUTY_FIXED = 5_000;          // 5,000 XOF
const MORTGAGE_REGISTRATION_RATE = 0.03;  // 3%
const MORTGAGE_CONSERVATION_RATE = 0.0025;// 0.25%
const VAT_RATE = 0.18;                    // 18%
const LAND_TAX_RATE = 0.015;              // 1.5% annuelle

export function calculateCoteIvoireTax(input: TaxCalculatorInput): TaxCalculation {
  const { propertyValue, transactionType, hasMortgage = false } = input;

  const breakdown: TaxLineItem[] = [];

  // 1. Registration Duty
  const registrationDuty = transactionType === 'achat' ? propertyValue * REGISTRATION_RATE : 0;
  if (registrationDuty > 0) {
    breakdown.push({
      name: 'Droit d\'enregistrement',
      description: 'Droit d\'enregistrement — taux standard CI',
      rate: 4,
      amount: registrationDuty,
      isPercentage: true,
    });
  }

  // 2. Notary Fees
  const notaryFees = transactionType === 'achat' ? propertyValue * NOTARY_RATE : propertyValue * 0.01;
  breakdown.push({
    name: 'Honoraires notariaux',
    description: `Taux de ${NOTARY_RATE * 100}% en Côte d'Ivoire`,
    rate: NOTARY_RATE * 100,
    amount: notaryFees,
    isPercentage: true,
  });

  // 3. Transfer Tax
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
  breakdown.push({
    name: 'Droit de timbre',
    description: 'Droit de timbre fixe',
    rate: STAMP_DUTY_FIXED,
    amount: STAMP_DUTY_FIXED,
    isPercentage: false,
  });

  // 5. Land Tax
  const landTax = propertyValue * LAND_TAX_RATE;
  breakdown.push({
    name: 'Taxe foncière (annuelle)',
    description: 'Taxe foncière annuelle — taux standard CI',
    rate: LAND_TAX_RATE * 100,
    amount: landTax,
    isPercentage: true,
  });

  // 6. VAT
  const vat = (input.propertyType === 'commerce' || input.propertyType === 'bureau')
    ? notaryFees * VAT_RATE : 0;
  if (vat > 0) {
    breakdown.push({
      name: 'TVA (sur honoraires)',
      description: 'TVA sur honoraires notariaux (bien commercial)',
      rate: 18,
      amount: vat,
      isPercentage: true,
    });
  }

  // 7. Mortgage Fees
  let mortgageFees = 0;
  if (hasMortgage && transactionType === 'achat') {
    const reg = propertyValue * MORTGAGE_REGISTRATION_RATE;
    const cons = propertyValue * MORTGAGE_CONSERVATION_RATE;
    mortgageFees = reg + cons;
    breakdown.push({
      name: 'Inscription hypothécaire',
      description: 'Frais d\'inscription hypothécaire (3%)',
      rate: 3,
      amount: reg,
      isPercentage: true,
    });
    breakdown.push({
      name: 'Conservation hypothécaire',
      description: 'Frais de conservation hypothécaire (0.25%)',
      rate: 0.25,
      amount: cons,
      isPercentage: true,
    });
  }

  const totalTaxes = registrationDuty + transferTax + STAMP_DUTY_FIXED + vat + mortgageFees;
  const totalNotaryFees = notaryFees;
  const grandTotal = propertyValue + totalTaxes + totalNotaryFees;
  const effectiveRate = propertyValue > 0 ? ((totalTaxes + totalNotaryFees) / propertyValue) * 100 : 0;

  return {
    country: 'CI',
    countryName: "Côte d'Ivoire",
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
