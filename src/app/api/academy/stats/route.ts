// GET /api/academy/stats — Real academy counters for the /academy hero.
//
// Audit Manus (P0): the hero displayed "0+ cours / 0+ apprenants / 95%"
// because no such endpoint existed (frontend fell back to ?? 0). Every
// counter here is computed from the database with a published definition:
//   courseCount        — published courses only (unpublished drafts excluded)
//   enrollmentCount    — distinct enrolled (userId, courseId) pairs
//   certificateCount   — issued certificates
//   satisfactionRate   — share of COMPLETED enrollments (proxy for learner
//                        success); null when no completion yet (the hero then
//                        hides the figure instead of inventing 95%).
// Short public CDN cache: stats move slowly, a 5 min window is safe.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [courseCount, enrollmentCount, certificateCount, completedCount] =
      await Promise.all([
        db.course.count({ where: { published: true } }),
        db.courseEnrollment.count(),
        db.certificate.count(),
        db.courseEnrollment.count({ where: { completed: true } }),
      ]);

    // Satisfaction proxy: completed / total enrollments. Only meaningful
    // once at least one learner finished a course.
    const satisfactionRate =
      enrollmentCount > 0
        ? Math.round((completedCount / enrollmentCount) * 100)
        : null;

    return NextResponse.json(
      {
        courseCount,
        enrollmentCount,
        certificateCount,
        satisfactionRate,
        completedCount,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch (error) {
    console.error('Academy stats API error:', error);
    // Honest error — the hero shows its unavailable state, never fake data.
    return NextResponse.json(
      { error: 'Failed to fetch academy stats' },
      { status: 500 },
    );
  }
}
