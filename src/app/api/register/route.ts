import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendWelcomeEmail } from "@/lib/email";

const registerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  userType: z.enum(["BUYER", "SELLER", "INVESTOR", "TOURIST", "ARTISAN", "AGENCY", "GUESTHOUSE_OWNER"]),
  country: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, password, userType, country } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un compte avec cet email ou téléphone existe déjà" },
        { status: 409 }
      );
    }

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        email,
        phone,
        password: hashedPassword,
        userType: userType as any,
        country: country as any,
        status: "PENDING",
      },
      select: {
        id: true,
        name: true,
        email: true,
        userType: true,
      },
    });

    // Email de bienvenue (non-bloquant)
    sendWelcomeEmail(user.email ?? "", user.name ?? user.email ?? "").catch(() => {});

    return NextResponse.json(
      { data: user, message: "Compte créé avec succès" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
