/**
 * AfriBayit — Appointment Scheduler
 * Schedule and manage property visits, deed signings, consultations
 */

export { generateTimeSlots, isSlotAvailable, DEFAULT_SCHEDULE, type TimeSlot, type AvailabilitySchedule } from './availability';

import { type TimeSlot, type AvailabilitySchedule, DEFAULT_SCHEDULE, generateTimeSlots } from './availability';

export interface Appointment {
  id: string;
  propertyId: string;
  agentId: string;
  clientId: string;
  type: 'visit' | 'signing' | 'consultation';
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  location?: string;
  createdAt: string;
}

// In-memory store for demo
const appointments = new Map<string, Appointment>();

/**
 * Schedule an appointment
 */
export function scheduleAppointment(params: {
  propertyId: string;
  agentId: string;
  clientId: string;
  type: 'visit' | 'signing' | 'consultation';
  scheduledAt: string;
  durationMinutes?: number;
  notes?: string;
  location?: string;
}): Appointment {
  const id = `apt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  const appointment: Appointment = {
    id,
    propertyId: params.propertyId,
    agentId: params.agentId,
    clientId: params.clientId,
    type: params.type,
    scheduledAt: params.scheduledAt,
    durationMinutes: params.durationMinutes || 60,
    status: 'scheduled',
    notes: params.notes,
    location: params.location,
    createdAt: new Date().toISOString(),
  };

  appointments.set(id, appointment);
  return appointment;
}

/**
 * Get appointments for an agent
 */
export function getAppointmentsForAgent(agentId: string): Appointment[] {
  const results: Appointment[] = [];
  for (const [, apt] of appointments) {
    if (apt.agentId === agentId) results.push(apt);
  }
  return results.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
}

/**
 * Get appointments for a property
 */
export function getAppointmentsForProperty(propertyId: string): Appointment[] {
  const results: Appointment[] = [];
  for (const [, apt] of appointments) {
    if (apt.propertyId === propertyId) results.push(apt);
  }
  return results;
}

/**
 * Get available slots for the next N days
 */
export function getAvailableSlots(days: number = 14): TimeSlot[] {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + days);

  return generateTimeSlots(DEFAULT_SCHEDULE, start, end);
}
