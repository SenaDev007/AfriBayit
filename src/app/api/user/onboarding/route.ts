import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  profileType: z.string(),
  country: z.string().optional(),
  city: z.string().optional(),
  interests: z.array(z.string()).default([]),
  budget: z.string().optional(),
  notifEmail: z.boolean().default(true),
  notifSMS: z.boolean().default(false),
  notifPush: z.boolean().default(true),
  notifNews: z.boolean().default(false),
});

// POST /api/user/onboarding
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = schema.parse(body);

  // Upsert onboarding profile
  const profile = await prisma.onboardingProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...data },
    update: data,
  });

  // Update user type and country based on profile
  const userTypeMap: Record<string, string> = {
    buyer: "BUYER",
    seller: "SELLER",
    investor: "INVESTOR",
    tourist: "TOURIST",
    artisan: "ARTISAN",
    agency: "AGENCY",
    guesthouse: "GUESTHOUSE_OWNER",
  };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      userType: (userTypeMap[data.profileType] ?? "BUYER") as any,
      country: data.country as any,
      city: data.city,
      status: "ACTIVE",
    },
  });

  // Award "Early Adopter" badge for completing onboarding
  try {
    await prisma.userBadge.create({
      data: { userId: session.user.id, badge: "EARLY_ADOPTER" },
    });
    // Award 100 points
    await prisma.pointTransaction.create({
      data: { userId: session.user.id, points: 100, reason: "onboarding_completed" },
    });
    await prisma.user.update({
      where: { id: session.user.id },
      data: { loyaltyPoints: { increment: 100 } },
    });
  } catch {
    // Badge already exists, ignore
  }

  // Create welcome notification
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      type: "system",
      title: "Bienvenue sur AfriBayit ! 🎉",
      message: "Votre profil est configuré. Découvrez les propriétés disponibles dans votre ville.",
      href: "/properties",
    },
  });

  return NextResponse.json({ profile });
}

// GET /api/user/onboarding — check if onboarding is completed
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.onboardingProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ completed: !!profile, profile });
}
