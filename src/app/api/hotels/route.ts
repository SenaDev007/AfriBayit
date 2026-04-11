import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const querySchema = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
  stars: z.coerce.number().min(1).max(5).optional(),
  networkType: z.enum(["DIRECT", "OTA"]).optional(),
  limit: z.coerce.number().default(20),
});

// GET /api/hotels
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = querySchema.parse(Object.fromEntries(searchParams));

  const hotels = await prisma.hotel.findMany({
    where: {
      isActive: true,
      ...(query.city ? { city: { contains: query.city, mode: "insensitive" } } : {}),
      ...(query.country ? { country: query.country as any } : {}),
      ...(query.stars ? { stars: query.stars } : {}),
      ...(query.networkType ? { networkType: query.networkType as any } : {}),
    },
    include: {
      images: { orderBy: { order: "asc" }, take: 3 },
      _count: { select: { rooms: true } },
    },
    orderBy: [{ isVerified: "desc" }, { avgRating: "desc" }],
    take: query.limit,
  });

  return NextResponse.json({ hotels });
}
