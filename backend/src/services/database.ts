import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

let prisma: PrismaClient | null = null;

/**
 * Initialize and get Prisma client
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Log Prisma queries in development
    (prisma as any).$on('query', (e: any) => {
      logger.debug(`Query: ${e.query}`, {
        duration: `${e.duration}ms`,
      });
    });

    (prisma as any).$on('error', (e: any) => {
      logger.error('Prisma Error:', e);
    });

    (prisma as any).$on('warn', (e: any) => {
      logger.warn('Prisma Warning:', e);
    });
  }

  return prisma;
}

/**
 * Disconnect Prisma client
 */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

/**
 * Health check for database connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await getPrismaClient().$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

export { PrismaClient };
