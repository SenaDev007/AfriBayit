import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/notifications/stream
 * Server-Sent Events — live notification push (CDC §8.x)
 *
 * Streams unread notifications to the connected client every 8 seconds.
 * Falls back gracefully on Vercel (max 25s timeout) by sending early heartbeats.
 *
 * Client usage:
 *   const es = new EventSource("/api/notifications/stream")
 *   es.onmessage = (e) => { const data = JSON.parse(e.data); ... }
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Non autorisé", { status: 401 });
  }

  const userId = session.user.id;

  // Track the last seen notification id to only push new ones
  const lastIdParam = req.nextUrl.searchParams.get("lastId") ?? undefined;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Client disconnected
        }
      }

      // Send initial unread count immediately
      try {
        const [notifications, unreadCount] = await Promise.all([
          prisma.notification.findMany({
            where: {
              userId,
              isRead: false,
              ...(lastIdParam ? { id: { gt: lastIdParam } } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          }),
          prisma.notification.count({ where: { userId, isRead: false } }),
        ]);

        send("init", { notifications, unreadCount });
      } catch {
        send("error", { message: "Erreur de chargement" });
      }

      // Poll for new notifications every 8 seconds
      let lastSeenId = lastIdParam;
      let tick = 0;

      const interval = setInterval(async () => {
        tick++;

        // Heartbeat every tick to keep connection alive
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${tick}\n\n`));
        } catch {
          clearInterval(interval);
          return;
        }

        // Check for new notifications every 8s
        try {
          const newNotifications = await prisma.notification.findMany({
            where: {
              userId,
              isRead: false,
              ...(lastSeenId ? { id: { gt: lastSeenId } } : {}),
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          });

          if (newNotifications.length > 0) {
            lastSeenId = newNotifications[0].id;
            const unreadCount = await prisma.notification.count({
              where: { userId, isRead: false },
            });
            send("notification", { notifications: newNotifications, unreadCount });
          }
        } catch {
          // DB error — keep connection alive, skip this tick
        }

        // Close after ~90s to avoid serverless timeout issues
        if (tick >= 11) {
          try {
            send("close", { reason: "reconnect" });
            controller.close();
          } catch {}
          clearInterval(interval);
        }
      }, 8_000);

      // Handle client disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
