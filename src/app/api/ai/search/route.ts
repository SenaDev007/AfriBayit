import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const aiSearchSchema = z.object({
  query: z.string().min(5).max(500),
  language: z.string().default("fr"),
});

// Mapping of French property terms to filter values
const TERM_MAPPINGS = {
  // Property types
  villa: { type: "VILLA" },
  appartement: { type: "APARTMENT" },
  maison: { type: "HOUSE" },
  studio: { type: "STUDIO" },
  terrain: { type: "LAND" },
  bureau: { type: "OFFICE" },

  // Listing types
  acheter: { listingType: "SALE" },
  vendre: { listingType: "SALE" },
  louer: { listingType: "LONG_TERM_RENTAL" },
  location: { listingType: "LONG_TERM_RENTAL" },
  séjour: { listingType: "SHORT_TERM_RENTAL" },
  vacances: { listingType: "SHORT_TERM_RENTAL" },

  // Countries
  bénin: { country: "BJ" },
  "côte d'ivoire": { country: "CI" },
  "burkina faso": { country: "BF" },
  togo: { country: "TG" },
  sénégal: { country: "SN" },
  ghana: { country: "GH" },
  nigeria: { country: "NG" },

  // Cities
  cotonou: { city: "Cotonou", country: "BJ" },
  abidjan: { city: "Abidjan", country: "CI" },
  ouagadougou: { city: "Ouagadougou", country: "BF" },
  lomé: { city: "Lomé", country: "TG" },
  dakar: { city: "Dakar", country: "SN" },
  accra: { city: "Accra", country: "GH" },
  lagos: { city: "Lagos", country: "NG" },

  // Features
  piscine: { hasPool: true },
  garage: { hasGarage: true },
  climatisation: { hasAC: true },
  sécurité: { hasSecurity: true },
  jardin: { hasGarden: true },

  // Bedrooms
  "1 chambre": { minBedrooms: 1 },
  "2 chambres": { minBedrooms: 2 },
  "3 chambres": { minBedrooms: 3 },
  "4 chambres": { minBedrooms: 4 },
  "5 chambres": { minBedrooms: 5 },
};

function parseNaturalLanguage(query: string): Record<string, unknown> {
  const lowerQuery = query.toLowerCase();
  const filters: Record<string, unknown> = {};

  // Apply term mappings
  for (const [term, values] of Object.entries(TERM_MAPPINGS)) {
    if (lowerQuery.includes(term)) {
      Object.assign(filters, values);
    }
  }

  // Extract budget with regex
  const budgetRegex = /(\d+(?:[,.]\d+)?)\s*(m(?:illions?)?|k|mil)?(?:\s*fcfa)?/gi;
  const budgetMatches = [...lowerQuery.matchAll(budgetRegex)];
  if (budgetMatches.length > 0) {
    const match = budgetMatches[0];
    let amount = parseFloat(match[1].replace(",", "."));
    const unit = match[2]?.toLowerCase();

    if (unit === "m" || unit === "mil" || unit === "millions" || unit === "million") {
      amount *= 1_000_000;
    } else if (unit === "k") {
      amount *= 1_000;
    }

    if (amount > 0) {
      filters.maxPrice = amount;
    }
  }

  // Extract bedroom count with regex
  const bedroomRegex = /(\d+)\s*(?:chambres?|pièces?|ch\.?)/i;
  const bedroomMatch = lowerQuery.match(bedroomRegex);
  if (bedroomMatch) {
    filters.minBedrooms = parseInt(bedroomMatch[1]);
  }

  return filters;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = aiSearchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Requête invalide" },
        { status: 400 }
      );
    }

    const { query } = parsed.data;

    // Parse natural language query
    const extractedFilters = parseNaturalLanguage(query);

    // Generate human-readable summary
    const parts: string[] = [];
    if (extractedFilters.type) parts.push(String(extractedFilters.type).toLowerCase());
    if (extractedFilters.listingType === "SALE") parts.push("à vendre");
    else if (extractedFilters.listingType) parts.push("en location");
    if (extractedFilters.city) parts.push(`à ${extractedFilters.city}`);
    else if (extractedFilters.country) parts.push(`en ${extractedFilters.country}`);
    if (extractedFilters.minBedrooms) parts.push(`${extractedFilters.minBedrooms}+ chambres`);
    if (extractedFilters.maxPrice) parts.push(`budget max ${Number(extractedFilters.maxPrice).toLocaleString()} FCFA`);
    if (extractedFilters.hasPool) parts.push("avec piscine");

    const summary = parts.length > 0
      ? `Je recherche : ${parts.join(", ")}`
      : "Recherche de propriétés en Afrique";

    // Build URL params
    const urlParams = new URLSearchParams();
    for (const [key, value] of Object.entries(extractedFilters)) {
      if (value !== undefined) {
        urlParams.set(key, String(value));
      }
    }

    return NextResponse.json({
      data: {
        filters: extractedFilters,
        summary,
        redirectUrl: `/properties?${urlParams.toString()}`,
        suggestions: [
          "Affiner par budget",
          "Chercher par quartier",
          "Voir les propriétés similaires",
          "Consulter le score d'investissement",
        ],
      },
    });
  } catch (error) {
    console.error("AI search error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
