import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/properties/[id]/availability?month=YYYY-MM
 *
 * Returns all booked dates for a property in the requested month window
 * (current month + next 2 months if month param absent).
 *
 * Response: { bookedDates: string[] }  — YYYY-MM-DD format
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const monthParam = request.nextUrl.searchParams.get("month"); // "YYYY-MM"

  // Default: show next 3 months from today
  const now = new Date();
  let rangeStart: Date;
  let rangeEnd: Date;

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    rangeStart = new Date(y, m - 1, 1);
    rangeEnd = new Date(y, m, 0); // last day of month
  } else {
    rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    rangeEnd = new Date(now.getFullYear(), now.getMonth() + 3, 0);
  }

  // Fetch confirmed/pending bookings that overlap the range
  const bookings = await prisma.booking.findMany({
    where: {
      propertyId: id,
      status: { in: ["PENDING", "CONFIRMED"] },
      checkOut: { gte: rangeStart },
      checkIn: { lte: rangeEnd },
    },
    select: { checkIn: true, checkOut: true },
  });

  // Expand each booking into individual dates
  const bookedDates = new Set<string>();
  for (const b of bookings) {
    const cursor = new Date(b.checkIn);
    // Booked from checkIn up to (but not including) checkOut
    while (cursor < b.checkOut) {
      bookedDates.add(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return NextResponse.json({
    propertyId: id,
    bookedDates: Array.from(bookedDates).sort(),
  });
}
