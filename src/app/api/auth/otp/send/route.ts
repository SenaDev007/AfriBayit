import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Numéro de téléphone requis." },
        { status: 400 }
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.verificationToken.deleteMany({
      where: { identifier: phone },
    });

    await prisma.verificationToken.create({
      data: {
        identifier: phone,
        token: otp,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    console.log("OTP for " + phone + ": " + otp);

    return NextResponse.json(
      { message: "Code OTP envoyé" },
      { status: 200 }
    );
  } catch (error) {
    console.error("OTP send error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
