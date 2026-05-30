import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const courses = await db.course.findMany({
      where: { published: true },
      orderBy: { students: 'desc' },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error('Courses API error:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
