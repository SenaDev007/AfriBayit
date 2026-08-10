import { NextResponse } from 'next/server';
import { authGuard } from '@/lib/auth-guard';
import {
  getUserPreferences,
  updateUserPreferences,
  getDefaultPreferences,
} from '@/lib/notifications/preferences';
import type { UserNotificationPreferences } from '@/lib/notifications/types';

// GET /api/notifications/preferences — Get user notification preferences
export async function GET() {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const preferences = await getUserPreferences(auth.userId);
    return NextResponse.json({ data: preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
  }
}

// PUT /api/notifications/preferences — Update user notification preferences
export async function PUT(request: Request) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const body = await request.json() as Partial<UserNotificationPreferences>;

    const preferences = await updateUserPreferences(auth.userId, body);
    return NextResponse.json({ data: preferences });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
