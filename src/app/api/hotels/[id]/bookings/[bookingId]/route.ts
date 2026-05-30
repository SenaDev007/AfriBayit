import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; bookingId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, bookingId } = await params;

    const booking = await db.hotelBooking.findUnique({
      where: { id: bookingId },
      include: {
        hotel: {
          select: { id: true, name: true, city: true, country: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify the booking belongs to this hotel
    if (booking.hotelId !== id) {
      return NextResponse.json({ error: 'Booking does not belong to this hotel' }, { status: 400 });
    }

    // Only the booking user, hotel owner, or admin can view
    const hotel = await db.hotel.findUnique({ where: { id } });
    const isHotelOwner = hotel?.ownerId === auth.userId;
    if (booking.userId !== auth.userId && !isHotelOwner && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not authorized' }, { status: 403 });
    }

    return NextResponse.json({ data: booking });
  } catch (error) {
    console.error('Hotel booking detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; bookingId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, bookingId } = await params;
    const body = await request.json();

    const existing = await db.hotelBooking.findUnique({
      where: { id: bookingId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify the booking belongs to this hotel
    if (existing.hotelId !== id) {
      return NextResponse.json({ error: 'Booking does not belong to this hotel' }, { status: 400 });
    }

    // Validate status transitions
    const validStatuses = ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    // Permission checks based on the status change
    const hotel = await db.hotel.findUnique({ where: { id } });
    const isHotelOwner = hotel?.ownerId === auth.userId;
    const isBookingUser = existing.userId === auth.userId;
    const isAdmin = auth.role === 'admin';

    // Booking user can only cancel their own booking
    if (body.status === 'cancelled') {
      if (!isBookingUser && !isHotelOwner && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden: not authorized to cancel this booking' }, { status: 403 });
      }
    } else {
      // Other status changes require hotel owner or admin
      if (!isHotelOwner && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden: only hotel owner or admin can update booking status' }, { status: 403 });
      }
    }

    const updated = await db.hotelBooking.update({
      where: { id: bookingId },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.paymentRef !== undefined && { paymentRef: body.paymentRef }),
        ...(body.paymentProvider !== undefined && { paymentProvider: body.paymentProvider }),
        ...(body.specialRequests !== undefined && { specialRequests: body.specialRequests }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Hotel booking update error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; bookingId: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id, bookingId } = await params;

    const existing = await db.hotelBooking.findUnique({
      where: { id: bookingId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Verify the booking belongs to this hotel
    if (existing.hotelId !== id) {
      return NextResponse.json({ error: 'Booking does not belong to this hotel' }, { status: 400 });
    }

    // Only the booking user, hotel owner, or admin can cancel
    const hotel = await db.hotel.findUnique({ where: { id } });
    const isHotelOwner = hotel?.ownerId === auth.userId;
    const isBookingUser = existing.userId === auth.userId;
    const isAdmin = auth.role === 'admin';

    if (!isBookingUser && !isHotelOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: not authorized to cancel this booking' }, { status: 403 });
    }

    // Soft cancel by setting status to cancelled
    const cancelled = await db.hotelBooking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ data: cancelled, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Hotel booking cancel error:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}
