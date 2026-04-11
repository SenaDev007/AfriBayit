import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { validateLegalDoc } from "@/lib/legalDocs";
import { embedProperty } from "@/lib/embeddings";

const querySchema = z.object({
  q: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  type: z.string().optional(),
  listingType: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minBedrooms: z.coerce.number().optional(),
  minSurface: z.coerce.number().optional(),
  hasPool: z.coerce.boolean().optional(),
  hasAC: z.coerce.boolean().optional(),
  hasGarage: z.coerce.boolean().optional(),
  hasSecurity: z.coerce.boolean().optional(),
  sort: z.enum(["recent", "price_asc", "price_desc", "score", "views"]).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(12),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      q,
      country,
      city,
      type,
      listingType,
      minPrice,
      maxPrice,
      minBedrooms,
      minSurface,
      hasPool,
      hasAC,
      hasGarage,
      hasSecurity,
      sort = "recent",
      page,
      pageSize,
    } = parsed.data;

    // Build where clause
    const where: Record<string, unknown> = {
      status: "ACTIVE",
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { district: { contains: q, mode: "insensitive" } },
      ];
    }

    if (country) where.country = country;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (type) where.type = type;
    if (listingType) where.listingType = listingType;
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) (where.price as any).gte = minPrice;
      if (maxPrice !== undefined) (where.price as any).lte = maxPrice;
    }
    if (minBedrooms) where.bedrooms = { gte: minBedrooms };
    if (minSurface) where.surface = { gte: minSurface };
    if (hasPool) where.hasPool = true;
    if (hasAC) where.hasAC = true;
    if (hasGarage) where.hasGarage = true;
    if (hasSecurity) where.hasSecurity = true;

    // Build orderBy
    const orderBy: Record<string, string>[] = [];
    switch (sort) {
      case "price_asc":
        orderBy.push({ price: "asc" });
        break;
      case "price_desc":
        orderBy.push({ price: "desc" });
        break;
      case "score":
        orderBy.push({ investmentScore: "desc" });
        break;
      case "views":
        orderBy.push({ viewCount: "desc" });
        break;
      default:
        orderBy.push({ publishedAt: "desc" });
    }

    const skip = (page - 1) * pageSize;

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
              isPremium: true,
            },
          },
          _count: {
            select: { favorites: true },
          },
        },
      }),
      prisma.property.count({ where }),
    ]);

    return NextResponse.json({
      data: properties,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Properties GET error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

const createPropertySchema = z.object({
  title: z.string().min(10).max(200),
  description: z.string().min(50),
  type: z.enum(["APARTMENT", "HOUSE", "VILLA", "STUDIO", "OFFICE", "LAND", "COMMERCIAL", "WAREHOUSE"]),
  listingType: z.enum(["SALE", "LONG_TERM_RENTAL", "SHORT_TERM_RENTAL"]),
  price: z.number().positive(),
  currency: z.string().default("XOF"),
  country: z.string(),
  city: z.string(),
  district: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  surface: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  yearBuilt: z.number().int().optional(),
  hasGarage: z.boolean().optional(),
  hasPool: z.boolean().optional(),
  hasGarden: z.boolean().optional(),
  hasBalcony: z.boolean().optional(),
  hasSecurity: z.boolean().optional(),
  hasGenerator: z.boolean().optional(),
  hasWifi: z.boolean().optional(),
  hasAC: z.boolean().optional(),
  // Legal document §10B
  legalDocType: z.string().optional(),
  legalDocUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = createPropertySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate legal document type against country matrix (§10B CDC)
    let legalDocStatus = "PENDING";
    if (data.legalDocType && data.country) {
      const { found, info } = validateLegalDoc(data.country, data.legalDocType);
      if (found) {
        if (info?.status === "REJECTED") {
          return NextResponse.json(
            {
              error: `Document foncier refusé pour le ${data.country}`,
              reason: info.note,
              docType: data.legalDocType,
            },
            { status: 422 }
          );
        }
        legalDocStatus = info?.status ?? "PENDING";
      }
    }

    // Generate slug
    const slug = `${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

    const property = await prisma.property.create({
      data: {
        ...data,
        slug,
        ownerId: session.user.id!,
        country: data.country as any,
        currency: data.currency as any,
        type: data.type as any,
        listingType: data.listingType as any,
        legalDocStatus,
      },
    });

    // Trigger embedding in background (no await — non-blocking)
    if (process.env.OPENAI_API_KEY) {
      embedProperty(property.id).catch((e) =>
        console.error("[embed] property embed error:", e)
      );
    }

    return NextResponse.json({ data: property }, { status: 201 });
  } catch (error) {
    console.error("Property POST error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
