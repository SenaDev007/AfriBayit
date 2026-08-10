import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authGuard } from '@/lib/auth-guard';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const profile = await db.professionalProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            city: true,
            country: true,
            reputation: true,
            role: true,
            verified: true,
          },
        },
        endorsements: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            endorser: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        _count: { select: { endorsements: true } },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ data: profile });
  } catch (error) {
    console.error('Profile detail API error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
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

    const existing = await db.professionalProfile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only the profile owner or admin can update
    if (existing.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the profile owner' }, { status: 403 });
    }

    const updated = await db.professionalProfile.update({
      where: { id },
      data: {
        ...(body.headline !== undefined && { headline: body.headline }),
        ...(body.coverPhoto !== undefined && { coverPhoto: body.coverPhoto }),
        ...(body.bio !== undefined && { bio: body.bio }),
        ...(body.specialities !== undefined && { specialities: JSON.stringify(body.specialities) }),
        ...(body.languages !== undefined && { languages: JSON.stringify(body.languages) }),
        ...(body.availability !== undefined && { availability: body.availability }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.experience !== undefined && { experience: JSON.stringify(body.experience) }),
        ...(body.education !== undefined && { education: JSON.stringify(body.education) }),
        ...(body.certifications !== undefined && { certifications: JSON.stringify(body.certifications) }),
        ...(body.portfolio !== undefined && { portfolio: JSON.stringify(body.portfolio) }),
        ...(body.zone !== undefined && { zone: body.zone }),
        ...(body.agencyName !== undefined && { agencyName: body.agencyName }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
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

    const existing = await db.professionalProfile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Only the profile owner or admin can delete
    if (existing.userId !== auth.userId && auth.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: not the profile owner' }, { status: 403 });
    }

    await db.professionalProfile.delete({ where: { id } });

    return NextResponse.json({ message: 'Profile deleted' });
  } catch (error) {
    console.error('Profile delete error:', error);
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}
