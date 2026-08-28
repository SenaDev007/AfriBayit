import { NextRequest, NextResponse } from 'next/server';
import { exportToCSV, exportToPDF, type ExportOptions } from '@/lib/analytics/export';
import { authGuard } from '@/lib/auth-guard';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // SECURITY FIX: Add auth check + derive userId from session
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    // Derive userId from session, not query params (IDOR fix)
    const userId = auth.role === 'SUPER_ADMIN' ? (searchParams.get('userId') || auth.userId) : auth.userId;
    const type = searchParams.get('type') || 'listings';

    // REAL DATA: Get last 7 days of analytics from the database
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get real profile views per day
    const profileViews = await db.profileView.findMany({
      where: { viewerId: userId, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }).catch(() => []);

    // Get real transactions per day
    const transactions = await db.transaction.findMany({
      where: { sellerId: userId, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, amount: true, status: true },
      orderBy: { createdAt: 'asc' },
    }).catch(() => []);

    // Get real appointments per day
    const appointments = await db.appointment.findMany({
      where: { agentId: userId, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }).catch(() => []);

    // Build daily aggregation for the last 7 days
    const data: Array<{ date: string; views: number; inquiries: number; conversions: number; revenue: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = day.toISOString().split('T')[0];
      const dayStart = new Date(dayStr);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const views = profileViews.filter(v => v.createdAt >= dayStart && v.createdAt < dayEnd).length;
      const inquiries = appointments.filter(a => a.createdAt >= dayStart && a.createdAt < dayEnd).length;
      const dayTxns = transactions.filter(t => t.createdAt >= dayStart && t.createdAt < dayEnd);
      const conversions = dayTxns.filter(t => t.status === 'RELEASED').length;
      const revenue = dayTxns.filter(t => t.status === 'RELEASED').reduce((sum, t) => sum + Number(t.amount), 0);

      data.push({ date: dayStr, views, inquiries, conversions, revenue });
    }

    const columns = [
      { key: 'date', label: 'Date' },
      { key: 'views', label: 'Vues' },
      { key: 'inquiries', label: 'Demandes' },
      { key: 'conversions', label: 'Conversions' },
      { key: 'revenue', label: 'Revenus (XOF)' },
    ];

    if (format === 'csv') {
      const csv = exportToCSV(data, `afribayit-analytics-${userId}`, columns);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="afribayit-${type}-${userId}.csv"`,
        },
      });
    }

    if (format === 'pdf') {
      const html = exportToPDF({
        format: 'pdf',
        filename: `afribayit-analytics-${userId}`,
        data,
        columns,
        title: `Rapport Analytique — ${type === 'listings' ? 'Annonces' : 'Profil'}`,
      });
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="afribayit-${type}-${userId}.html"`,
        },
      });
    }

    return NextResponse.json({ error: 'Format non supporté. Utilisez csv ou pdf.' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur d\'export';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
