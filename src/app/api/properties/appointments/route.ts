import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';
import { generateTimeSlots, DEFAULT_SCHEDULE } from '@/lib/scheduling';

/**
 * POST /api/properties/appointments — demander une visite d'un bien.
 *
 * RETOUR CLIENT 02/10 : « Demander une visite dit de se connecter alors qu'on
 * est déjà connecté » — le bouton redirigeait vers /auth/login sans jamais
 * appeler cette API, et cette API persistait dans un store EN MÉMOIRE
 * (src/lib/scheduling — « demo ») : les visites disparaissaient à chaque
 * cold start serverless.
 *
 * Désormais :
 *   - Persistance réelle via le modèle Prisma `Appointment` (table
 *     appointments, CDC §5.1.3 — gestion calendrier des visites).
 *   - agentId dérivé du bien côté serveur (jamais du client — anti-spoof).
 *   - userId = utilisateur authentifié (cookie session OU Bearer — cf. fix
 *     authGuard : un Bearer périmé ne bloque plus une session valide).
 *
 * Corps accepté : { propertyId, scheduledAt (ISO), durationMinutes?, notes?, location? }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;

    const body = await request.json();
    const { propertyId, scheduledAt, durationMinutes, notes, location } = body as {
      propertyId?: string;
      scheduledAt?: string;
      durationMinutes?: number;
      notes?: string;
      location?: string;
    };

    if (!propertyId || !scheduledAt || Number.isNaN(Date.parse(scheduledAt))) {
      return NextResponse.json(
        { error: 'propertyId et scheduledAt (date ISO valide) sont requis' },
        { status: 400 }
      );
    }

    const when = new Date(scheduledAt);
    if (when.getTime() < Date.now() - 60 * 1000) {
      return NextResponse.json(
        { error: 'La date de visite ne peut pas être dans le passé' },
        { status: 400 }
      );
    }

    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: { id: true, title: true, agentId: true, country: true, status: true },
    });
    if (!property) {
      return NextResponse.json({ error: 'Bien introuvable' }, { status: 404 });
    }
    if (property.status !== 'published') {
      return NextResponse.json(
        { error: 'Ce bien n’est plus disponible à la visite' },
        { status: 409 }
      );
    }
    if (property.agentId === auth.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas demander une visite pour votre propre bien' },
        { status: 400 }
      );
    }

    // Créneau déjà pris pour ce bien ? (même agent, même heure, statut actif)
    const clashStart = new Date(when.getTime() - 30 * 60 * 1000);
    const clashEnd = new Date(when.getTime() + 30 * 60 * 1000);
    const clash = await db.appointment.findFirst({
      where: {
        propertyId,
        agentId: property.agentId,
        scheduledAt: { gte: clashStart, lte: clashEnd },
        status: { in: ['pending', 'confirmed'] },
      },
    });
    if (clash) {
      return NextResponse.json(
        { error: 'Ce créneau vient d’être réservé. Choisissez un autre horaire.' },
        { status: 409 }
      );
    }

    const appointment = await db.appointment.create({
      data: {
        propertyId,
        userId: auth.userId,
        agentId: property.agentId,
        scheduledAt: when,
        duration: Math.min(Math.max(Number(durationMinutes) || 60, 15), 240),
        status: 'pending',
        notes: notes?.slice(0, 500) || null,
        country: property.country,
      },
    });

    return NextResponse.json(
      {
        success: true,
        appointment: {
          id: appointment.id,
          propertyId: appointment.propertyId,
          propertyTitle: property.title,
          agentId: appointment.agentId,
          type: 'visit',
          scheduledAt: appointment.scheduledAt,
          durationMinutes: appointment.duration,
          status: appointment.status,
          notes: appointment.notes,
          location: location || null,
        },
        message: 'Demande de visite envoyée — l’agent confirme sous 24 h.',
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de planification';
    console.error('Appointment creation error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/properties/appointments — mes visites.
 *   ?available=true           → créneaux ouverts (14 prochains jours)
 *   ?role=visitor|agent       → mes demandes (défaut : les deux)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authGuard(request);
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const available = searchParams.get('available');
    const role = searchParams.get('role') || 'all';

    if (available === 'true') {
      // Créneaux ouverts : horaires ouvrés par défaut (8h-18h, lun-ven),
      // 14 prochains jours, passés exclus.
      const now = new Date();
      const slots = generateTimeSlots(
        DEFAULT_SCHEDULE,
        now,
        new Date(now.getTime() + 14 * 24 * 3600 * 1000),
      )
        .filter((s) => new Date(s.start).getTime() > now.getTime() && s.available)
        .slice(0, 50);
      return NextResponse.json({ slots });
    }

    const where =
      role === 'visitor'
        ? { userId: auth.userId }
        : role === 'agent'
          ? { agentId: auth.userId }
          : { OR: [{ userId: auth.userId }, { agentId: auth.userId }] };

    const appointments = await db.appointment.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      take: 50,
      include: {
        property: { select: { id: true, title: true, city: true, country: true, images: true } },
      },
    });

    return NextResponse.json({
      appointments: appointments.map((a) => ({
        id: a.id,
        propertyId: a.propertyId,
        propertyTitle: a.property.title,
        propertyCity: a.property.city,
        agentId: a.agentId,
        role: a.userId === auth.userId ? 'visitor' : 'agent',
        type: 'visit',
        scheduledAt: a.scheduledAt,
        durationMinutes: a.duration,
        status: a.status,
        notes: a.notes,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    console.error('Appointments fetch error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des visites' }, { status: 500 });
  }
}
