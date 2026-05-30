import { PrismaClient } from '@prisma/client'

// Database connection: uses DATABASE_URL from .env
// Explicitly passes the URL to PrismaClient to ensure it's always available
const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_VPlSR7Z9UiYD@ep-polished-glitter-agic460a-pooler.c-2.eu-central-1.aws.neon.tech/AfriBayit?sslmode=require'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
