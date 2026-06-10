import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/index.js';
import logger from './utils/logger.js';
import { checkDatabaseHealth, disconnectPrisma } from './services/database.js';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { rateLimit } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import verificationRoutes from './routes/verification.js';

const app: Express = express();

// ============================================
// Middleware
// ============================================

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: config.app.corsOrigin.split(','),
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request ID
app.use(requestIdMiddleware);

// Rate limiting (if enabled)
if (config.rateLimit.enabled) {
  app.use(rateLimit());
}

// Request logging
app.use((req, express, next) => {
  logger.http(`${req.method} ${req.path}`, {
    ip: req.ip,
    requestId: req.id,
  });
  next();
});

// ============================================
// Health Check Endpoint
// ============================================

app.get('/health', asyncHandler(async (req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  
  const status = dbHealthy ? 'healthy' : 'degraded';
  const statusCode = dbHealthy ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected',
  });
}));

// ============================================
// API Routes
// ============================================

// API prefix
const apiPrefix = config.app.apiPrefix;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/verifications`, verificationRoutes);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================
// Server Startup
// ============================================

const PORT = config.app.port;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: config.app.env,
    apiPrefix: config.app.apiPrefix,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    await disconnectPrisma();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed');
    await disconnectPrisma();
    process.exit(0);
  });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason,
  });
});

// Uncaught exception handler
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
