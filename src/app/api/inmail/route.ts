import { NextRequest, NextResponse } from 'next/server';
import { getInMailAccount, sendInMail, getRemainingCredits } from '@/lib/inmail';
import { authGuard } from '@/lib/auth-guard';
import { hasPermission } from '@/lib/security/rbac';

export async function GET(request: NextRequest) {
  try {
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');
    const isSuperAdmin = auth.role === 'SUPER_ADMIN';
    const userId = isSuperAdmin && requestedUserId ? requestedUserId : auth.userId;
    const tier = searchParams.get('tier') || 'starter';
    const account = getInMailAccount(userId, tier);
    const remaining = getRemainingCredits(userId);
    return NextResponse.json({ userId, tier: account.tier, creditsRemaining: remaining, creditsUsed: account.creditsUsed, creditsTotal: account.creditsTotal, isUnlimited: account.isUnlimited, periodEnd: account.periodEnd });
  } catch (error) { return NextResponse.json({ error: 'Erreur' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;
    if (!hasPermission(auth.role as never, 'inmail:send')) return NextResponse.json({ error: 'Permission refusée', code: 'INMAIL_PERMISSION_DENIED' }, { status: 403 });
    const body = await request.json();
    const { toUserId, subject, body: messageBody, propertyId } = body;
    if (!toUserId || !subject || !messageBody) return NextResponse.json({ error: 'Champs requis manquants' }, { status: 400 });
    const fromUserId = auth.userId;
    const result = sendInMail(fromUserId, toUserId, subject, messageBody, propertyId);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, message: { id: result.message!.id, fromUserId: result.message!.fromUserId, toUserId: result.message!.toUserId, subject: result.message!.subject, sentAt: result.message!.sentAt }, creditsRemaining: getRemainingCredits(fromUserId) });
  } catch (error) { return NextResponse.json({ error: 'Erreur' }, { status: 500 }); }
}
