import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// CDC §11.2.2 — Pricing
const PLAN_CONFIG: Record<string, { amount: number; listingsMax: number; label: string }> = {
  HELM_SEED: { amount: 15000, listingsMax: 10, label: "HELM SEED" },
  HELM_GROW: { amount: 35000, listingsMax: 50, label: "HELM GROW" },
  HELM_LEAD: { amount: 75000, listingsMax: 200, label: "HELM LEAD" },
  HELM_NETWORK: { amount: 0, listingsMax: 9999, label: "HELM NETWORK" },
  PMS_STARTER: { amount: 9900, listingsMax: 10, label: "PMS STARTER" },
  PMS_PRO: { amount: 24900, listingsMax: 50, label: "PMS PRO" },
  PMS_ENTERPRISE: { amount: 0, listingsMax: 9999, label: "PMS ENTERPRISE" },
  ARTISAN_PRO: { amount: 8900, listingsMax: 20, label: "Artisan Pro" },
};

const subscribeSchema = z.object({
  plan: z.enum([
    "HELM_SEED", "HELM_GROW", "HELM_LEAD", "HELM_NETWORK",
    "PMS_STARTER", "PMS_PRO", "PMS_ENTERPRISE",
    "ARTISAN_PRO",
  ]),
  paymentMethod: z.enum(["mobile_money", "card"]).default("mobile_money"),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

// GET /api/subscriptions — get user's active subscription
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["TRIAL", "ACTIVE"] },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ subscription });
}

// POST /api/subscriptions — subscribe to a plan
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const data = subscribeSchema.parse(body);

  const config = PLAN_CONFIG[data.plan];
  if (!config) return NextResponse.json({ error: "Plan invalide" }, { status: 400 });

  // Cancel existing subscription
  await prisma.subscription.updateMany({
    where: { userId: session.user.id, status: { in: ["TRIAL", "ACTIVE"] } },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  // Yearly discount: 2 months free (10 months billed)
  const amount = data.billingCycle === "yearly"
    ? Math.round(config.amount * 10)
    : config.amount;

  const endDate = new Date();
  if (data.billingCycle === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: session.user.id,
      plan: data.plan as any,
      status: "TRIAL", // trial until payment confirmed
      amount,
      currency: "XOF",
      billingCycle: data.billingCycle,
      endDate,
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
      paymentMethod: data.paymentMethod,
      listingsMax: config.listingsMax,
    },
  });

  // Update user premium status
  await prisma.user.update({
    where: { id: session.user.id },
    data: { isPremium: true, premiumUntil: endDate },
  });

  // Notify user
  await prisma.notification.create({
    data: {
      userId: session.user.id,
      type: "system",
      title: `Abonnement ${config.label} activé ! 🎉`,
      message: `Votre abonnement ${config.label} est actif. Profitez de tous vos avantages. Paiement de ${amount.toLocaleString("fr-FR")} FCFA/${data.billingCycle === "yearly" ? "an" : "mois"}.`,
      href: "/dashboard",
    },
  });

  // Award points for subscribing
  await prisma.pointTransaction.create({
    data: { userId: session.user.id, points: 500, reason: "subscription_started", refId: subscription.id },
  });
  await prisma.user.update({
    where: { id: session.user.id },
    data: { loyaltyPoints: { increment: 500 } },
  });

  return NextResponse.json({ subscription }, { status: 201 });
}
