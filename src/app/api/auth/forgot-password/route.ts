import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import bcryptjs from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Aucun compte trouvé avec cet email." },
        { status: 404 }
      );
    }

    const token = crypto.randomBytes(3).toString("hex");
    const hashedToken = await bcryptjs.hash(token, 10);

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: hashedToken,
        expires: new Date(Date.now() + 3600000),
      },
    });

    console.log("Reset link: /reset-password?token=" + token + "&email=" + email);

    return NextResponse.json(
      { message: "Email de réinitialisation envoyé" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
