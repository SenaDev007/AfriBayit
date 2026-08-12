import { NextRequest, NextResponse } from 'next/server';
import { calculateTax, compareTaxAcrossCountries } from '@/lib/tax';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { country, propertyType, transactionType, propertyValue, hasMortgage, isPrimaryResidence, location, compareCountries } = body;

    // Validate required fields
    if (!country || !propertyType || !transactionType || !propertyValue) {
      return NextResponse.json(
        { error: 'Champs requis manquants: country, propertyType, transactionType, propertyValue' },
        { status: 400 }
      );
    }

    if (typeof propertyValue !== 'number' || propertyValue <= 0) {
      return NextResponse.json(
        { error: 'La valeur du bien doit être un nombre positif' },
        { status: 400 }
      );
    }

    if (!['achat', 'location'].includes(transactionType)) {
      return NextResponse.json(
        { error: 'Type de transaction invalide (achat ou location)' },
        { status: 400 }
      );
    }

    // If compare mode
    if (compareCountries && Array.isArray(compareCountries) && compareCountries.length > 0) {
      const comparisons = compareTaxAcrossCountries(
        compareCountries,
        propertyType,
        transactionType,
        propertyValue,
        hasMortgage || false
      );
      return NextResponse.json({ comparisons });
    }

    // Single country calculation
    const result = calculateTax({
      country,
      propertyType,
      transactionType,
      propertyValue,
      hasMortgage: hasMortgage || false,
      isPrimaryResidence: isPrimaryResidence ?? true,
      location: location || '',
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de calcul fiscal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
