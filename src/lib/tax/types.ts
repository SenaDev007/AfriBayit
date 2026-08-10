/**
 * AfriBayit — Tax Calculator Types
 * Shared types for the tax calculation engine
 */

export interface TaxLineItem {
  name: string;
  description: string;
  rate: number; // percentage or fixed amount
  amount: number;
  isPercentage: boolean;
}

export interface TaxCalculation {
  country: string;
  countryName: string;
  propertyType: string;
  transactionType: 'achat' | 'location';
  propertyValue: number;
  currency: string;

  // Taxes
  registrationDuty: number;      // Droit d'enregistrement
  notaryFees: number;            // Honoraires notariaux
  landTax: number;               // Taxe foncière
  transferTax: number;           // Taxe de mutation
  stampDuty: number;             // Droit de timbre
  vat: number;                   // TVA (if applicable)
  mortgageFees: number;          // Frais hypothécaires (if applicable)

  // Summary
  totalTaxes: number;
  totalNotaryFees: number;
  grandTotal: number;            // Property value + all costs
  effectiveRate: number;         // Total costs / property value %

  // Breakdown
  breakdown: TaxLineItem[];
}

export interface TaxCalculatorInput {
  country: string;
  propertyType: string;
  transactionType: 'achat' | 'location';
  propertyValue: number;
  hasMortgage?: boolean;
  isPrimaryResidence?: boolean;
  location?: string; // City/district for location-specific rates
}
