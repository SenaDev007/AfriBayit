import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Default to current month if not specified
    const now = new Date();
    const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0); // Last day of month

    // Also fetch next month for better calendar view
    const nextMonthStart = new Date(targetYear, targetMonth, 1);
    const nextMonthEnd = new Date(targetYear, targetMonth + 1, 0);

    const [availability, nextMonthAvailability] = await Promise.all([
      db.shortTermRentalAvailability.findMany({
        where: {
          rentalId: id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: 'asc' },
      }),
      db.shortTermRentalAvailability.findMany({
        where: {
          rentalId: id,
          date: {
            gte: nextMonthStart,
            lte: nextMonthEnd,
          },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    // Also check bookings that overlap with the period
    const bookings = await db.shortTermRentalBooking.findMany({
      where: {
        rentalId: id,
        status: { in: ['pending', 'confirmed', 'checked_in'] },
        checkIn: { lte: nextMonthEnd },
        checkOut: { gte: startDate },
      },
      select: { checkIn: true, checkOut: true },
    });

    // Generate booked dates from bookings
    const bookedDates: string[] = [];
    bookings.forEach((booking) => {
      const current = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);
      while (current < end) {
        bookedDates.push(current.toISOString().slice(0, 10));
        current.setDate(current.getDate() + 1);
      }
    });

    return NextResponse.json({
      availability: [...availability, ...nextMonthAvailability],
      bookedDates,
      period: {
        start: startDate.toISOString(),
        end: nextMonthEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error('Short-term rental availability API error:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const rental = await db.shortTermRental.findUnique({ where: { id } });
    if (!rental) {
      return NextResponse.json({ error: 'Location non trouvee' }, { status: 404 });
    }
    if (rental.hostId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    // Batch update availability
    const { dates, status, priceOverride } = body as {
      dates: string[];
      status: string;
      priceOverride?: number;
    };

    if (!dates || !Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json({ error: 'Dates requises' }, { status: 400 });
    }

    const results = await Promise.all(
      dates.map((dateStr: string) =>
        db.shortTermRentalAvailability.upsert({
          where: {
            rentalId_date: { rentalId: id, date: new Date(dateStr) },
          },
          create: {
            rentalId: id,
            date: new Date(dateStr),
            status: status || 'BLOCKED',
            priceOverride: priceOverride || null,
            currency: 'XOF',
            source: 'manual',
          },
          update: {
            status: status || 'BLOCKED',
            priceOverride: priceOverride || null,
          },
        })
      )
    );

    return NextResponse.json({ updated: results.length, availability: results });
  } catch (error) {
    console.error('Short-term rental availability update error:', error);
    return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}
