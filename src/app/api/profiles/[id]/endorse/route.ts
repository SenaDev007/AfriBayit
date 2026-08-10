import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authGuard();
    if (!auth.success) return auth.response;

    const { id } = await params;
    const body = await request.json();
    const { skill } = body;

    if (!skill || typeof skill !== 'string' || skill.trim() === '') {
      return NextResponse.json({ error: 'Skill is required' }, { status: 400 });
    }

    // Verify profile exists
    const profile = await db.professionalProfile.findUnique({ where: { id } });
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Cannot endorse yourself
    if (profile.userId === auth.userId) {
      return NextResponse.json({ error: 'Cannot endorse your own profile' }, { status: 400 });
    }

    // Check if already endorsed this skill
    const existing = await db.skillEndorsement.findUnique({
      where: {
        profileId_endorserId_skill: {
          profileId: id,
          endorserId: auth.userId,
          skill: skill.trim(),
        },
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'Already endorsed this skill' }, { status: 409 });
    }

    // Create endorsement
    const endorsement = await db.skillEndorsement.create({
      data: {
        profileId: id,
        endorserId: auth.userId,
        skill: skill.trim(),
      },
      include: {
        endorser: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({ data: endorsement }, { status: 201 });
  } catch (error) {
    console.error('Skill endorsement error:', error);
    return NextResponse.json({ error: 'Failed to endorse skill' }, { status: 500 });
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
    const body = await request.json();
    const { skill } = body;

    if (!skill || typeof skill !== 'string' || skill.trim() === '') {
      return NextResponse.json({ error: 'Skill is required' }, { status: 400 });
    }

    // Check endorsement exists
    const endorsement = await db.skillEndorsement.findUnique({
      where: {
        profileId_endorserId_skill: {
          profileId: id,
          endorserId: auth.userId,
          skill: skill.trim(),
        },
      },
    });
    if (!endorsement) {
      return NextResponse.json({ error: 'Endorsement not found' }, { status: 404 });
    }

    // Delete endorsement
    await db.skillEndorsement.delete({
      where: {
        profileId_endorserId_skill: {
          profileId: id,
          endorserId: auth.userId,
          skill: skill.trim(),
        },
      },
    });

    return NextResponse.json({ data: null, message: 'Endorsement removed successfully' });
  } catch (error) {
    console.error('Remove endorsement error:', error);
    return NextResponse.json({ error: 'Failed to remove endorsement' }, { status: 500 });
  }
}
