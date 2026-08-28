import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyReport } from '@/lib/reports/weekly';
import { authGuard } from '@/lib/auth-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;

    // Derive userId from session (IDOR fix) — SUPER_ADMIN can query other users
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const isSuperAdmin = auth.role === 'SUPER_ADMIN';
    const userId = isSuperAdmin && requestedUserId ? requestedUserId : auth.userId;

    const report = await generateWeeklyReport(userId);

    return NextResponse.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de génération du rapport';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
