import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await db.communityEvent.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ data: event });
  } catch (error) {
    console.error('Community event detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch event' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    const existing = await db.communityEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only organizer or admin can update
    if (existing.organizerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the event organizer' }, { status: 403 });
    }

    const updated = await db.communityEvent.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.eventType !== undefined && { eventType: body.eventType }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.venue !== undefined && { venue: body.venue }),
        ...(body.eventDate !== undefined && { eventDate: new Date(body.eventDate) }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        ...(body.isVirtual !== undefined && { isVirtual: body.isVirtual }),
        ...(body.meetingUrl !== undefined && { meetingUrl: body.meetingUrl }),
        ...(body.maxAttendees !== undefined && { maxAttendees: body.maxAttendees }),
        ...(body.image !== undefined && { image: body.image }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Community event update error:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    const existing = await db.communityEvent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only organizer or admin can delete
    if (existing.organizerId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the event organizer' }, { status: 403 });
    }

    await db.communityEvent.delete({ where: { id } });

    return NextResponse.json({ data: null, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Community event delete error:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
