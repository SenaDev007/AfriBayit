import { NextRequest, NextResponse } from 'next/server';
import { scheduleAppointment, getAppointmentsForAgent, getAvailableSlots } from '@/lib/scheduling';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, agentId, clientId, type, scheduledAt, durationMinutes, notes, location } = body;

    if (!propertyId || !agentId || !clientId || !scheduledAt) {
      return NextResponse.json(
        { error: 'propertyId, agentId, clientId et scheduledAt sont requis' },
        { status: 400 }
      );
    }

    const appointment = scheduleAppointment({
      propertyId,
      agentId,
      clientId,
      type: type || 'visit',
      scheduledAt,
      durationMinutes,
      notes,
      location,
    });

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        propertyId: appointment.propertyId,
        type: appointment.type,
        scheduledAt: appointment.scheduledAt,
        durationMinutes: appointment.durationMinutes,
        status: appointment.status,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de planification';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const available = searchParams.get('available');

    if (available === 'true') {
      const slots = getAvailableSlots(14);
      return NextResponse.json({ slots: slots.slice(0, 50) });
    }

    if (agentId) {
      const appointments = getAppointmentsForAgent(agentId);
      return NextResponse.json({ appointments });
    }

    return NextResponse.json({ error: 'Spécifiez agentId ou available=true' }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
