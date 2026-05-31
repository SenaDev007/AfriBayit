/**
 * AfriBayit — Agent/Owner Availability Management
 */

export interface TimeSlot {
  start: string; // ISO datetime
  end: string;
  available: boolean;
  type: 'visit' | 'signing' | 'consultation';
  bookedBy?: string;
  notes?: string;
}

export interface AvailabilitySchedule {
  userId: string;
  timeZone: string;
  workingDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  workingHoursStart: string; // "08:00"
  workingHoursEnd: string; // "18:00"
  slotDurationMinutes: number;
  exceptions: { date: string; available: boolean; reason?: string }[];
}

const DEFAULT_SCHEDULE: AvailabilitySchedule = {
  userId: '',
  timeZone: 'Africa/Lagos',
  workingDays: [1, 2, 3, 4, 5], // Mon-Fri
  workingHoursStart: '08:00',
  workingHoursEnd: '18:00',
  slotDurationMinutes: 60,
  exceptions: [],
};

/**
 * Generate available time slots for a date range
 */
export function generateTimeSlots(
  schedule: AvailabilitySchedule,
  startDate: Date,
  endDate: Date
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();

    if (schedule.workingDays.includes(dayOfWeek)) {
      // Check exceptions
      const dateStr = current.toISOString().substring(0, 10);
      const exception = schedule.exceptions.find(e => e.date === dateStr);
      if (exception && !exception.available) {
        current.setDate(current.getDate() + 1);
        continue;
      }

      // Generate slots for the day
      const [startH, startM] = schedule.workingHoursStart.split(':').map(Number);
      const [endH, endM] = schedule.workingHoursEnd.split(':').map(Number);

      const slotStart = new Date(current);
      slotStart.setHours(startH, startM, 0, 0);

      const dayEnd = new Date(current);
      dayEnd.setHours(endH, endM, 0, 0);

      while (slotStart < dayEnd) {
        const slotEnd = new Date(slotStart.getTime() + schedule.slotDurationMinutes * 60 * 1000);
        if (slotEnd > dayEnd) break;

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: true,
          type: 'visit',
        });

        slotStart.setTime(slotEnd.getTime());
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return slots;
}

/**
 * Check if a specific time slot is available
 */
export function isSlotAvailable(
  schedule: AvailabilitySchedule,
  date: Date,
  time: string
): boolean {
  const dayOfWeek = date.getDay();
  if (!schedule.workingDays.includes(dayOfWeek)) return false;

  const [hours, minutes] = time.split(':').map(Number);
  const slotTime = hours * 60 + minutes;
  const [startH, startM] = schedule.workingHoursStart.split(':').map(Number);
  const [endH, endM] = schedule.workingHoursEnd.split(':').map(Number);
  const startTime = startH * 60 + startM;
  const endTime = endH * 60 + endM;

  if (slotTime < startTime || slotTime >= endTime) return false;

  // Check exceptions
  const dateStr = date.toISOString().substring(0, 10);
  const exception = schedule.exceptions.find(e => e.date === dateStr);
  if (exception && !exception.available) return false;

  return true;
}

export { DEFAULT_SCHEDULE };
