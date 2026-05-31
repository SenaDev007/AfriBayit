/**
 * AfriBayit — Tax Calculator Orchestrator
 * Main entry point for property tax calculations across African countries
 */

export type { TaxCalculation, TaxCalculatorInput, TaxLineItem } from './types';

import type { TaxCalculation, TaxCalculatorInput } from './types';
import { calculateBeninTax } from './benin';
import { calculateCoteIvoireTax } from './cote-ivoire';
import { calculateBurkinaTax } from './burkina';
import { calculateTogoTax } from './togo';

// ============ Country Tax Calculator Map ============

const TAX_CALCULATORS: Record<string, (input: TaxCalculatorInput) => TaxCalculation> = {
  BJ: calculateBeninTax,
  CI: calculateCoteIvoireTax,
  BF: calculateBurkinaTax,
  TG: calculateTogoTax,
};

// ============ Main Calculator ============

/**
 * Calculate taxes for a property transaction in a specific country.
 * Returns a comprehensive TaxCalculation with full breakdown.
 */
export function calculateTax(input: TaxCalculatorInput): TaxCalculation {
  const calculator = TAX_CALCULATORS[input.country];
  if (!calculator) {
    throw new Error(`Pays non supporté pour le calcul fiscal: ${input.country}`);
  }
  return calculator(input);
}

/**
 * Compare tax calculations across multiple countries for the same property.
 */
export function compareTaxAcrossCountries(
  countries: string[],
  propertyType: string,
  transactionType: 'achat' | 'location',
  propertyValue: number,
  hasMortgage = false
): TaxCalculation[] {
  return countries
    .map(country => {
      try {
        return calculateTax({ country, propertyType, transactionType, propertyValue, hasMortgage });
      } catch {
        return null;
      }
    })
    .filter((r): r is TaxCalculation => r !== null);
}

/**
 * Get the supported countries for tax calculation.
 */
export function getSupportedTaxCountries(): string[] {
  return Object.keys(TAX_CALCULATORS);
}
