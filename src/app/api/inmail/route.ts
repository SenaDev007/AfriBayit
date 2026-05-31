import { NextRequest, NextResponse } from 'next/server';
import { getInMailAccount, sendInMail, getRemainingCredits } from '@/lib/inmail';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const tier = searchParams.get('tier') || 'starter';

    if (!userId) {
      return NextResponse.json({ error: 'userId est requis' }, { status: 400 });
    }

    const account = getInMailAccount(userId, tier);
    const remaining = getRemainingCredits(userId);

    return NextResponse.json({
      userId,
      tier: account.tier,
      creditsRemaining: remaining,
      creditsUsed: account.creditsUsed,
      creditsTotal: account.creditsTotal,
      isUnlimited: account.isUnlimited,
      periodEnd: account.periodEnd,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromUserId, toUserId, subject, body: messageBody, propertyId } = body;

    if (!fromUserId || !toUserId || !subject || !messageBody) {
      return NextResponse.json(
        { error: 'fromUserId, toUserId, subject et body sont requis' },
        { status: 400 }
      );
    }

    const result = sendInMail(fromUserId, toUserId, subject, messageBody, propertyId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: {
        id: result.message!.id,
        fromUserId: result.message!.fromUserId,
        toUserId: result.message!.toUserId,
        subject: result.message!.subject,
        sentAt: result.message!.sentAt,
      },
      creditsRemaining: getRemainingCredits(fromUserId),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
