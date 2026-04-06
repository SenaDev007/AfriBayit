import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  country: z.string().optional(),
  city: z.string().optional(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.coerce.number().optional(),
  certified: z.coerce.boolean().optional(),
  hasBreakfast: z.coerce.boolean().optional(),
  maxPrice: z.coerce.number().optional(),
  sort: z.enum(["rating", "price_asc", "price_desc", "reviews"]).optional().default("rating"),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(12),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const { country, city, certified, hasBreakfast, sort, page, pageSize } = parsed.data;

    const where: Record<string, unknown> = { isActive: true };
    if (country) where.country = country;
    if (city) where.city = { contains: city, mode: "insensitive" };
    if (certified) where.isCertified = true;
    if (hasBreakfast) where.hasBreakfast = true;

    const orderBy: Record<string, string>[] = [];
    switch (sort) {
      case "reviews": orderBy.push({ totalReviews: "desc" }); break;
      case "price_asc":
      case "price_desc": orderBy.push({ avgRating: "desc" }); break;
      default: orderBy.push({ avgRating: "desc" }); break;
    }

    const skip = (page - 1) * pageSize;

    const [guesthouses, total] = await Promise.all([
      prisma.guesthouse.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          rooms: {
            where: { isAvailable: true },
            select: { id: true, basePrice: true, currency: true, capacity: true },
          },
          owner: {
            select: { id: true, name: true, image: true },
          },
        },
      }),
      prisma.guesthouse.count({ where }),
    ]);

    return NextResponse.json({
      data: guesthouses,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error("Guesthouses GET error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
