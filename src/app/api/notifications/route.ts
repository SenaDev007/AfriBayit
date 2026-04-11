import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/notifications — list user notifications
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

// POST /api/notifications — create notification (internal / admin)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { userId, type, title, message, href, data } = body;

  // Only allow creating notification for self or if admin
  const targetId = userId ?? session.user.id;

  const notification = await prisma.notification.create({
    data: { userId: targetId, type, title, message, href, data },
  });

  return NextResponse.json(notification, { status: 201 });
}
