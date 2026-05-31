import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const notary = await db.notary.findUnique({
      where: { id },
    });

    if (!notary) {
      return NextResponse.json({ error: 'Notary not found' }, { status: 404 });
    }

    return NextResponse.json(notary);
  } catch (error) {
    console.error('Notary detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch notary' }, { status: 500 });
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

    // Verify the notary exists and user is the owner or admin
    const existingNotary = await db.notary.findUnique({ where: { id } });

    if (!existingNotary) {
      return NextResponse.json({ error: 'Notary not found' }, { status: 404 });
    }

    if (existingNotary.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const notary = await db.notary.update({
      where: { id },
      data: {
        ...(body.chamberName && { chamberName: body.chamberName }),
        ...(body.specialty && { specialty: body.specialty }),
        ...(body.certificationLevel && { certificationLevel: body.certificationLevel }),
        ...(body.zone && { zone: body.zone }),
        ...(body.available !== undefined && { available: body.available }),
        ...(body.subscriptionTier && { subscriptionTier: body.subscriptionTier }),
        ...(body.subscriptionExpiry && { subscriptionExpiry: new Date(body.subscriptionExpiry) }),
        ...(body.conventionSigned !== undefined && { conventionSigned: body.conventionSigned }),
        ...(body.conventionUrl && { conventionUrl: body.conventionUrl }),
        ...(body.certified !== undefined && { certified: body.certified }),
        ...(body.certifiedAt && { certifiedAt: new Date(body.certifiedAt) }),
      },
    });

    return NextResponse.json(notary);
  } catch (error) {
    console.error('Notary update error:', error);
    return NextResponse.json({ error: 'Failed to update notary' }, { status: 500 });
  }
}
