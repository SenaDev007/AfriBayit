/**
 * AfriBayit — Embeddings (pgvector)
 * CDC §8.2 — Pipeline RAG pour la recherche sémantique et Rebecca
 *
 * Utilise OpenAI text-embedding-3-small (1536 dims)
 * Stocke dans Property.embedding (vector(1536) Neon)
 */

import { prisma } from "@/lib/prisma";

// ─── Text to embed ────────────────────────────────────────────────────────────

export function buildPropertyText(p: {
  title: string;
  description: string;
  type: string;
  listingType: string;
  city: string;
  country: string;
  district?: string | null;
  price: number;
  currency: string;
  surface?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  hasPool: boolean;
  hasGarage: boolean;
  hasAC: boolean;
  hasSecurity: boolean;
  hasGarden: boolean;
  hasGenerator: boolean;
  hasWifi: boolean;
  hasBalcony: boolean;
}): string {
  const features: string[] = [];
  if (p.hasPool) features.push("piscine");
  if (p.hasGarage) features.push("garage");
  if (p.hasAC) features.push("climatisation");
  if (p.hasSecurity) features.push("sécurité 24h");
  if (p.hasGarden) features.push("jardin");
  if (p.hasGenerator) features.push("groupe électrogène");
  if (p.hasWifi) features.push("wifi");
  if (p.hasBalcony) features.push("balcon");

  const typeLabel: Record<string, string> = {
    APARTMENT: "Appartement",
    HOUSE: "Maison",
    VILLA: "Villa",
    STUDIO: "Studio",
    LAND: "Terrain",
    OFFICE: "Bureau",
    COMMERCIAL: "Local commercial",
  };
  const listingLabel: Record<string, string> = {
    SALE: "à vendre",
    LONG_TERM_RENTAL: "en location longue durée",
    SHORT_TERM_RENTAL: "en location courte durée",
  };
  const countryLabel: Record<string, string> = {
    BJ: "Bénin",
    CI: "Côte d'Ivoire",
    BF: "Burkina Faso",
    TG: "Togo",
  };

  const parts = [
    `${typeLabel[p.type] ?? p.type} ${listingLabel[p.listingType] ?? p.listingType}`,
    `Localisation : ${p.city}${p.district ? ` (${p.district})` : ""}, ${countryLabel[p.country] ?? p.country}`,
    `Prix : ${p.price.toLocaleString("fr-FR")} ${p.currency}`,
    p.surface ? `Surface : ${p.surface} m²` : null,
    p.bedrooms ? `${p.bedrooms} chambre${p.bedrooms > 1 ? "s" : ""}` : null,
    p.bathrooms ? `${p.bathrooms} salle${p.bathrooms > 1 ? "s" : ""} de bain` : null,
    features.length ? `Équipements : ${features.join(", ")}` : null,
    `Description : ${p.description.slice(0, 500)}`,
    p.title,
  ]
    .filter(Boolean)
    .join(". ");

  return parts;
}

// ─── OpenAI embedding ─────────────────────────────────────────────────────────

export async function getEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey });
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000), // max tokens guard
    });
    return response.data[0].embedding;
  } catch (err) {
    console.error("[embeddings] OpenAI error:", err);
    return null;
  }
}

// ─── Store embedding on property ─────────────────────────────────────────────

export async function embedProperty(propertyId: string): Promise<boolean> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true, title: true, description: true, type: true, listingType: true,
      city: true, country: true, district: true, price: true, currency: true,
      surface: true, bedrooms: true, bathrooms: true,
      hasPool: true, hasGarage: true, hasAC: true, hasSecurity: true,
      hasGarden: true, hasGenerator: true, hasWifi: true, hasBalcony: true,
    },
  });

  if (!property) return false;

  const text = buildPropertyText({
    ...property,
    price: Number(property.price),
    currency: property.currency as string,
    type: property.type as string,
    listingType: property.listingType as string,
    country: property.country as string,
  });

  const embedding = await getEmbedding(text);
  if (!embedding) return false;

  // Store as pgvector via $executeRaw
  await prisma.$executeRaw`
    UPDATE properties
    SET embedding = ${`[${embedding.join(",")}]`}::vector
    WHERE id = ${propertyId}
  `;

  return true;
}

// ─── Semantic search ──────────────────────────────────────────────────────────

export interface SemanticResult {
  id: string;
  title: string;
  city: string;
  country: string;
  type: string;
  listingType: string;
  price: number;
  currency: string;
  surface: number | null;
  bedrooms: number | null;
  similarity: number;
}

export async function semanticSearch(
  queryText: string,
  opts: {
    limit?: number;
    country?: string;
    type?: string;
    listingType?: string;
    minPrice?: number;
    maxPrice?: number;
  } = {}
): Promise<SemanticResult[]> {
  const embedding = await getEmbedding(queryText);
  if (!embedding) return [];

  const { limit = 10, country, type, listingType, minPrice, maxPrice } = opts;

  // Build filter clauses
  const filters: string[] = ["status = 'ACTIVE'", "embedding IS NOT NULL"];
  if (country) filters.push(`country = '${country.replace(/'/g, "''")}'`);
  if (type) filters.push(`type = '${type.replace(/'/g, "''")}'`);
  if (listingType) filters.push(`"listingType" = '${listingType.replace(/'/g, "''")}'`);
  if (minPrice) filters.push(`price >= ${minPrice}`);
  if (maxPrice) filters.push(`price <= ${maxPrice}`);

  const whereClause = filters.join(" AND ");
  const vectorLiteral = `[${embedding.join(",")}]`;

  // Cosine similarity — 1 - (embedding <=> query) gives similarity
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      id: string;
      title: string;
      city: string;
      country: string;
      type: string;
      listingType: string;
      price: number;
      currency: string;
      surface: number | null;
      bedrooms: number | null;
      similarity: number;
    }>
  >(`
    SELECT
      id, title, city, country, type, "listingType", price, currency, surface, bedrooms,
      1 - (embedding <=> '${vectorLiteral}'::vector) AS similarity
    FROM properties
    WHERE ${whereClause}
    ORDER BY embedding <=> '${vectorLiteral}'::vector
    LIMIT ${limit}
  `);

  return rows.map((r) => ({ ...r, price: Number(r.price) }));
}
