import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const SERVICE_PRICES: Record<string, number> = {
  GEO_GPS: 45000,
  SURF: 75000,
  BORN: 120000,
  INSP: 60000,
  TOPO: 150000,
  CONF: 200000,
  DRON: 350000,
  CERT: 180000,
};

const missionSchema = z.object({
  serviceCode: z.enum(["GEO_GPS", "SURF", "BORN", "INSP", "TOPO", "CONF", "DRON", "CERT"]),
  country: z.string(),
  city: z.string(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  propertyId: z.string().optional(),
  packName: z.string().optional(),
  scheduledAt: z.string().optional().transform((s) => (s ? new Date(s) : undefined)),
});

// POST /api/geotrust/missions — create a new GeoTrust mission request
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const data = missionSchema.parse(body);

  const price = SERVICE_PRICES[data.serviceCode] ?? 75000;

  // Find best available geometer in the city
  const geometer = await prisma.geometer.findFirst({
    where: {
      country: data.country as any,
      city: { contains: data.city, mode: "insensitive" },
      isAvailable: true,
      specialties: { has: data.serviceCode as any },
    },
    orderBy: [{ level: "desc" }, { avgRating: "desc" }],
  });

  const mission = await prisma.geoTrustMission.create({
    data: {
      serviceCode: data.serviceCode as any,
      status: geometer ? "ASSIGNED" : "PENDING",
      requesterId: session.user.id,
      geometerId: geometer?.id ?? null,
      country: data.country as any,
      city: data.city,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      propertyId: data.propertyId,
      packName: data.packName,
      price,
      currency: "XOF",
      scheduledAt: data.scheduledAt,
    },
  });

  // Notify user
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      type: "system",
      title: "Mission GeoTrust créée",
      message: geometer
        ? `Votre mission a été assignée à ${geometer.displayName} (${geometer.level}). Vous serez contacté sous 48h.`
        : "Votre demande GeoTrust a été reçue. Un géomètre sera assigné sous 24-48h.",
      href: "/dashboard",
    },
  });

  // Notify geometer if assigned
  if (geometer) {
    await prisma.notification.create({
      data: {
        userId: geometer.userId,
        type: "system",
        title: "Nouvelle mission GeoTrust",
        message: `Nouvelle mission ${data.serviceCode} à ${data.city}. Référence: ${mission.reference}`,
        href: "/dashboard",
      },
    });
  }

  return NextResponse.json({ mission, geometer }, { status: 201 });
}

// GET /api/geotrust/missions — list user missions
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const missions = await prisma.geoTrustMission.findMany({
    where: { requesterId: session.user.id },
    include: {
      geometer: { select: { displayName: true, level: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ missions });
}
