import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // id here is the geometerId — get reports for all missions of this geometer
    const reports = await db.geometerReport.findMany({
      where: {
        mission: { geometerId: id },
      },
      include: {
        mission: {
          select: {
            id: true,
            serviceCode: true,
            status: true,
            propertyId: true,
            property: { select: { id: true, title: true, city: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Geotrust reports API error:', error);
    return NextResponse.json({ error: 'Failed to fetch geometer reports' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const report = await db.geometerReport.create({
      data: {
        missionId: body.missionId,
        pdfUrl: body.pdfUrl,
        geojsonUrl: body.geojsonUrl,
        validationStatus: body.validationStatus || 'pending',
        aiScore: body.aiScore,
        blockchainHash: body.blockchainHash,
      },
    });

    // Update mission status if report is validated
    if (body.validationStatus === 'validated') {
      await db.geometerMission.update({
        where: { id: body.missionId },
        data: { status: 'completed', completedAt: new Date() },
      });
    }

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('Geotrust report creation error:', error);
    return NextResponse.json({ error: 'Failed to submit geometer report' }, { status: 500 });
  }
}
