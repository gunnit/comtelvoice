import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client Singleton
 * Ensures only one instance of PrismaClient is created across the application
 * Prevents connection pool exhaustion during development with hot reload
 */

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Gracefully disconnect from database on application shutdown
 */
export async function disconnectDatabase() {
  await prisma.$disconnect();
  console.log('📊 Database disconnected');
}
