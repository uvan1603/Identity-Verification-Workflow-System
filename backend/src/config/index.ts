import dotenv from 'dotenv';

dotenv.config();

export const config = {
  app: {
    name: 'Identity Verification System',
    version: '1.0.0',
    env: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    port: parseInt(process.env.PORT || '3001', 10),
    apiPrefix: process.env.API_PREFIX || '/api/v1',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-me-in-production',
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  verification: {
    maxAttempts: parseInt(process.env.MAX_VERIFICATION_ATTEMPTS || '3', 10),
    expiryDays: parseInt(process.env.VERIFICATION_EXPIRY_DAYS || '30', 10),
    documentExpiryDays: parseInt(process.env.DOCUMENT_EXPIRY_DAYS || '365', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    enabled: process.env.ENABLE_RATE_LIMITING === 'true',
  },
  features: {
    auditLog: process.env.ENABLE_AUDIT_LOG === 'true',
    emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    documentStorage: process.env.ENABLE_DOCUMENT_STORAGE === 'true',
  },
};

// Validation
if (!config.database.url) {
  throw new Error('DATABASE_URL environment variable is not set');
}

if (config.app.env === 'production') {
  if (config.jwt.secret === 'change-me-in-production') {
    throw new Error('JWT_SECRET must be changed in production');
  }
  if (config.jwt.refreshSecret === 'change-me-in-production') {
    throw new Error('JWT_REFRESH_SECRET must be changed in production');
  }
}

export default config;
