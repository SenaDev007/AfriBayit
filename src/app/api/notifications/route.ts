import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

// GET /api/notifications — List user notifications with grouping support
export async function GET(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const read = searchParams.get('read');
    const type = searchParams.get('type');
    const grouped = searchParams.get('grouped') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { userId: auth.userId };
    if (category) where.category = category;
    if (type) where.type = type;
    if (read !== null && read !== '') where.read = read === 'true';

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { userId: auth.userId, read: false },
      }),
    ]);

    if (grouped) {
      // Group notifications by type+referenceId within the last 24h
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const groupedNotifications: Record<string, {
        type: string;
        category: string;
        count: number;
        latestMessage: string;
        latestDate: Date;
        notifications: typeof notifications;
      }> = {};

      const ungrouped: typeof notifications = [];

      for (const notification of notifications) {
        const notifDate = new Date(notification.createdAt);
        const isRecent = notifDate >= twentyFourHoursAgo;

        // Extract referenceId from metadata if available
        let referenceId = '';
        try {
          const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
          referenceId = metadata.referenceId || metadata.propertyId || metadata.transactionId || '';
        } catch {
          referenceId = '';
        }

        if (isRecent && referenceId) {
          // Group by type + referenceId
          const groupKey = `${notification.type}_${referenceId}`;
          if (!groupedNotifications[groupKey]) {
            groupedNotifications[groupKey] = {
              type: notification.type,
              category: notification.category,
              count: 0,
              latestMessage: notification.message,
              latestDate: notifDate,
              notifications: [],
            };
          }
          groupedNotifications[groupKey].count++;
          groupedNotifications[groupKey].notifications.push(notification);
          if (notifDate > groupedNotifications[groupKey].latestDate) {
            groupedNotifications[groupKey].latestMessage = notification.message;
            groupedNotifications[groupKey].latestDate = notifDate;
          }
        } else {
          ungrouped.push(notification);
        }
      }

      // Build grouped response with human-readable summaries
      const groupedItems = Object.entries(groupedNotifications).map(([groupKey, group]) => {
        let summaryMessage = group.latestMessage;
        if (group.count > 1) {
          // Generate grouped summary message
          const typeSummaries: Record<string, (count: number) => string> = {
            transaction: (n) => `${n} mises à jour de transaction`,
            community: (n) => `${n} activités communautaires`,
            alert: (n) => `${n} alertes immobilières`,
            favorite: (n) => `${n} personnes ont ajouté votre bien aux favoris`,
            message: (n) => `${n} nouveaux messages`,
            profile: (n) => `${n} visites de votre profil`,
            system: (n) => `${n} notifications système`,
            certification: (n) => `${n} mises à jour de certification`,
            promotion: (n) => `${n} promotions`,
            premium: (n) => `${n} notifications premium`,
            rebecca: (n) => `${n} messages de Rebecca`,
            security: (n) => `${n} alertes de sécurité`,
          };
          const summarizer = typeSummaries[group.type];
          summaryMessage = summarizer
            ? summarizer(group.count)
            : `${group.count} notifications de type ${group.type}`;
        }
        return {
          groupKey,
          type: group.type,
          category: group.category,
          count: group.count,
          summaryMessage,
          latestDate: group.latestDate,
          notifications: group.notifications,
        };
      });

      // Sort grouped items by latest date
      groupedItems.sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());

      return NextResponse.json({
        notifications: ungrouped,
        grouped: groupedItems,
        unreadCount,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    }

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications — Create a notification (system use)
export async function POST(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json();

    const notification = await db.notification.create({
      data: {
        userId: body.userId,
        type: body.type || 'system',
        category: body.category || 'system',
        country: body.country || null,
        title: body.title,
        message: body.message,
        actionUrl: body.actionUrl || null,
        actorId: body.actorId || null,
        actorName: body.actorName || null,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        channels: body.channels ? JSON.stringify(body.channels) : null,
        sentVia: JSON.stringify([]),
      },
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Notification creation error:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
