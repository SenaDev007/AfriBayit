import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const property = await prisma.property.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        status: "ACTIVE",
      },
      include: {
        images: true,
        owner: {
          select: {
            id: true,
            name: true,
            image: true,
            isPremium: true,
          },
        },
        reviews: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Propriété introuvable." },
        { status: 404 }
      );
    }

    await prisma.property.update({
      where: { id: property.id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json({ data: property });
  } catch (error) {
    console.error("Property GET by id error:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
