import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, email, password } = await request.json();

    if (!token || !email || !password || password.length < 8) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    // Find all tokens for this email (identifier)
    const tokens = await prisma.verificationToken.findMany({
      where: {
        identifier: email,
        expires: { gt: new Date() },
      },
    });

    // Check if any token matches
    let validToken = null;
    for (const t of tokens) {
      const matches = await bcrypt.compare(token, t.token);
      if (matches) { validToken = t; break; }
    }

    if (!validToken) {
      return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 400 });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: validToken.identifier, token: validToken.token } },
    });

    return NextResponse.json({ message: "Mot de passe modifié avec succès" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 });
  }
}
