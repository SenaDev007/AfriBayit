import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    // Verify event exists
    const event = await db.communityEvent.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if already registered
    const existing = await db.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId: auth.userId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Already registered for this event' }, { status: 409 });
    }

    // Check max attendees
    if (event.maxAttendees && event.attendees >= event.maxAttendees) {
      return NextResponse.json({ error: 'Event is full' }, { status: 400 });
    }

    // Create registration and increment attendee count
    const registration = await db.eventRegistration.create({
      data: {
        eventId: id,
        userId: auth.userId,
      },
    });

    await db.communityEvent.update({
      where: { id },
      data: { attendees: { increment: 1 } },
    });

    return NextResponse.json({ data: registration }, { status: 201 });
  } catch (error) {
    console.error('Event registration error:', error);
    return NextResponse.json({ error: 'Failed to register for event' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;

    // Check registration exists
    const registration = await db.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId: auth.userId } },
    });
    if (!registration) {
      return NextResponse.json({ error: 'Not registered for this event' }, { status: 404 });
    }

    // Delete registration and decrement attendee count
    await db.eventRegistration.delete({
      where: { eventId_userId: { eventId: id, userId: auth.userId } },
    });

    await db.communityEvent.update({
      where: { id },
      data: { attendees: { decrement: 1 } },
    });

    return NextResponse.json({ data: null, message: 'Unregistered from event successfully' });
  } catch (error) {
    console.error('Event unregistration error:', error);
    return NextResponse.json({ error: 'Failed to unregister from event' }, { status: 500 });
  }
}
