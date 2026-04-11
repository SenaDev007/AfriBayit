import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { semanticSearch } from "@/lib/embeddings";

const aiSearchSchema = z.object({
  query: z.string().min(3).max(500),
  language: z.string().default("fr"),
  // Optional structured filters to combine with semantic search
  country: z.string().optional(),
  type: z.string().optional(),
  listingType: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
});

// ─── Natural language keyword parser (fallback + filter extraction) ───────────

const TERM_MAPPINGS: Record<string, Record<string, unknown>> = {
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
  benin: { country: "BJ" },
  "côte d'ivoire": { country: "CI" },
  ivoirien: { country: "CI" },
  abidjan: { city: "Abidjan", country: "CI" },
  "burkina faso": { country: "BF" },
  ouagadougou: { city: "Ouagadougou", country: "BF" },
  togo: { country: "TG" },
  lomé: { city: "Lomé", country: "TG" },
  lome: { city: "Lomé", country: "TG" },
  cotonou: { city: "Cotonou", country: "BJ" },

  // Features
  piscine: { hasPool: true },
  garage: { hasGarage: true },
  climatisation: { hasAC: true },
  "clim ": { hasAC: true },
  sécurité: { hasSecurity: true },
  jardin: { hasGarden: true },
  groupelec: { hasGenerator: true },
  "groupe électrogène": { hasGenerator: true },
};

function parseNaturalLanguage(query: string): Record<string, unknown> {
  const lowerQuery = query.toLowerCase();
  const filters: Record<string, unknown> = {};

  for (const [term, values] of Object.entries(TERM_MAPPINGS)) {
    if (lowerQuery.includes(term)) {
      Object.assign(filters, values);
    }
  }

  // Extract budget with regex
  const budgetRegex = /(\d+(?:[,.]\d+)?)\s*(m(?:illions?)?|k|mil)?(?:\s*(?:fcfa|xof|cfa))?/gi;
  const budgetMatches = [...lowerQuery.matchAll(budgetRegex)];
  if (budgetMatches.length > 0) {
    const match = budgetMatches[0];
    let amount = parseFloat(match[1].replace(",", "."));
    const unit = match[2]?.toLowerCase();
    if (unit === "m" || unit === "mil" || unit?.startsWith("million")) amount *= 1_000_000;
    else if (unit === "k") amount *= 1_000;
    if (amount >= 100) filters.maxPrice = amount;
  }

  // Bedroom count
  const bedroomRegex = /(\d+)\s*(?:chambres?|pièces?|ch\.?)/i;
  const bedroomMatch = lowerQuery.match(bedroomRegex);
  if (bedroomMatch) filters.minBedrooms = parseInt(bedroomMatch[1]);

  return filters;
}

function buildSummary(filters: Record<string, unknown>, query: string): string {
  const parts: string[] = [];
  if (filters.type) parts.push(String(filters.type).toLowerCase());
  if (filters.listingType === "SALE") parts.push("à vendre");
  else if (filters.listingType) parts.push("en location");
  if (filters.city) parts.push(`à ${filters.city}`);
  else if (filters.country) parts.push(`en ${filters.country}`);
  if (filters.minBedrooms) parts.push(`${filters.minBedrooms}+ chambres`);
  if (filters.maxPrice) parts.push(`budget max ${Number(filters.maxPrice).toLocaleString("fr-FR")} FCFA`);
  if (filters.hasPool) parts.push("avec piscine");
  return parts.length > 0 ? `Recherche : ${parts.join(", ")}` : query;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = aiSearchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
    }

    const { query, country, type, listingType, minPrice, maxPrice } = parsed.data;

    // Extract keyword filters from natural language
    const nlFilters = parseNaturalLanguage(query);

    // Merge explicit params over NL-extracted ones
    const mergedFilters: Record<string, unknown> = {
      ...nlFilters,
      ...(country && { country }),
      ...(type && { type }),
      ...(listingType && { listingType }),
      ...(minPrice !== undefined && { minPrice }),
      ...(maxPrice !== undefined && { maxPrice }),
    };

    const summary = buildSummary(mergedFilters, query);

    // ── Semantic search (pgvector) ──────────────────────────────────────────
    let semanticResults: Awaited<ReturnType<typeof semanticSearch>> = [];
    if (process.env.OPENAI_API_KEY) {
      semanticResults = await semanticSearch(query, {
        limit: 6,
        country: (mergedFilters.country as string) ?? undefined,
        type: (mergedFilters.type as string) ?? undefined,
        listingType: (mergedFilters.listingType as string) ?? undefined,
        minPrice: (mergedFilters.minPrice as number) ?? undefined,
        maxPrice: (mergedFilters.maxPrice as number) ?? undefined,
      });
    }

    // ── URL for keyword fallback redirect ─────────────────────────────────
    const urlParams = new URLSearchParams();
    if (mergedFilters.country) urlParams.set("country", String(mergedFilters.country));
    if (mergedFilters.city) urlParams.set("city", String(mergedFilters.city));
    if (mergedFilters.type) urlParams.set("type", String(mergedFilters.type));
    if (mergedFilters.listingType) urlParams.set("listingType", String(mergedFilters.listingType));
    if (mergedFilters.maxPrice) urlParams.set("maxPrice", String(mergedFilters.maxPrice));
    if (mergedFilters.minBedrooms) urlParams.set("bedrooms", String(mergedFilters.minBedrooms));
    if (mergedFilters.hasPool) urlParams.set("hasPool", "true");
    if (!urlParams.toString() && query) urlParams.set("q", query);

    return NextResponse.json({
      data: {
        filters: mergedFilters,
        summary,
        redirectUrl: `/properties?${urlParams.toString()}`,
        semanticResults,
        hasSemanticResults: semanticResults.length > 0,
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
