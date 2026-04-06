import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  certified: z.coerce.boolean().optional(),
  emergency: z.coerce.boolean().optional(),
  sort: z.enum(["rating", "jobs", "rate_asc", "rate_desc"]).optional().default("rating"),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(12),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 }
      );
    }

    const { q, category, country, city, certified, emergency, sort, page, pageSize } = parsed.data;

    const where: Record<string, unknown> = { isAvailable: true };

    if (q) {
      where.OR = [
        { businessName: { contains: q, mode: "insensitive" } },
        { specialty: { has: q } },
        { user: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    if (category) where.category = category;
    if (country) where.country = country;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (certified) where.isCertified = true;
    if (emergency) where.emergencyService = true;

    const orderBy: Record<string, string>[] = [];
    switch (sort) {
      case "jobs": orderBy.push({ completedJobs: "desc" }); break;
      case "rate_asc": orderBy.push({ dailyRate: "asc" }); break;
      case "rate_desc": orderBy.push({ dailyRate: "desc" }); break;
      default: orderBy.push({ avgRating: "desc" }); break;
    }

    const skip = (page - 1) * pageSize;

    const [artisans, total] = await Promise.all([
      prisma.artisan.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
          images: { take: 1 },
          services: { take: 3 },
        },
      }),
      prisma.artisan.count({ where }),
    ]);

    return NextResponse.json({
      data: artisans,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("Artisans GET error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
