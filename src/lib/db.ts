import { PrismaClient } from '@prisma/client'

// CRITICAL: Ensure the correct DATABASE_URL is used at runtime
// Next.js may not load .env properly in all contexts, so we set it explicitly
const NEON_DB_URL = 'postgresql://neondb_owner:npg_VPlSR7Z9UiYD@ep-polished-glitter-agic460a-pooler.c-2.eu-central-1.aws.neon.tech/AfriBayit?sslmode=require'

// Set the env variable before Prisma Client is instantiated
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith('postgresql://')) {
  process.env.DATABASE_URL = NEON_DB_URL
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
