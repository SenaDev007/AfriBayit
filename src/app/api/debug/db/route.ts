import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
      nodeEnv: process.env.NODE_ENV,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    },
  };

  try {
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });

    const userCount = await prisma.user.count();
    results.dbConnection = 'SUCCESS';
    results.userCount = userCount;

    const propCount = await prisma.property.count();
    results.propertyCount = propCount;

    await prisma.$disconnect();
  } catch (error: unknown) {
    results.dbConnection = 'FAILED';
    if (error instanceof Error) {
      results.errorName = error.name;
      results.errorMessage = error.message.substring(0, 500);
      results.errorStack = error.stack?.substring(0, 500);
    } else {
      results.error = String(error).substring(0, 500);
    }
  }

  return NextResponse.json(results, { status: 200 });
}
