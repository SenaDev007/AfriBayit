import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyReport } from '@/lib/reports/weekly';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId est requis' }, { status: 400 });
    }

    const report = generateWeeklyReport(userId);

    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de génération du rapport';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
