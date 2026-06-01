import { NextRequest, NextResponse } from 'next/server';
import { exportToCSV, exportToPDF, type ExportOptions } from '@/lib/analytics/export';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'listings';

    if (!userId) {
      return NextResponse.json({ error: 'userId est requis' }, { status: 400 });
    }

    // Demo data for export
    const demoData = [
      { date: '2025-01-13', views: 48, inquiries: 3, conversions: 0, revenue: 0 },
      { date: '2025-01-14', views: 52, inquiries: 4, conversions: 1, revenue: 3500000 },
      { date: '2025-01-15', views: 61, inquiries: 5, conversions: 0, revenue: 0 },
      { date: '2025-01-16', views: 45, inquiries: 2, conversions: 1, revenue: 2800000 },
      { date: '2025-01-17', views: 39, inquiries: 3, conversions: 0, revenue: 0 },
      { date: '2025-01-18', views: 55, inquiries: 4, conversions: 2, revenue: 6300000 },
      { date: '2025-01-19', views: 42, inquiries: 2, conversions: 0, revenue: 0 },
    ];

    const columns = [
      { key: 'date', label: 'Date' },
      { key: 'views', label: 'Vues' },
      { key: 'inquiries', label: 'Demandes' },
      { key: 'conversions', label: 'Conversions' },
      { key: 'revenue', label: 'Revenus (XOF)' },
    ];

    if (format === 'csv') {
      const csv = exportToCSV(demoData, `afribayit-analytics-${userId}`, columns);
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
        data: demoData,
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
