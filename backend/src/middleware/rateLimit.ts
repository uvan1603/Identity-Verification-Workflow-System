import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../utils/errors.js';
import config from '../config/index.js';
import NodeCache from 'node-cache';

// Use in-memory cache for simplicity. In production, use Redis.
const cache = new NodeCache({ stdTTL: Math.ceil(config.rateLimit.windowMs / 1000) });

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

/**
 * Rate limiting middleware using in-memory cache
 */
export function rateLimit(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || config.rateLimit.windowMs;
  const maxRequests = options.maxRequests || config.rateLimit.maxRequests;
  const keyGenerator = options.keyGenerator || ((req: Request) => req.ip || 'unknown');
  const skip = options.skip || (() => false);

  return (req: Request, res: Response, next: NextFunction): void => {
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const current = (cache.get(key) as number) || 0;

    if (current >= maxRequests) {
      throw new RateLimitError(
        `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds`
      );
    }

    cache.set(key, current + 1, Math.ceil(windowMs / 1000));

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - current - 1);
    res.setHeader('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());

    next();
  };
}

/**
 * Per-user rate limiting
 */
export function userRateLimit(options: RateLimitOptions = {}) {
  return rateLimit({
    windowMs: options.windowMs || config.rateLimit.windowMs,
    maxRequests: options.maxRequests || config.rateLimit.maxRequests,
    keyGenerator: (req: Request) => req.userId || req.ip || 'unknown',
    skip: options.skip,
  });
}

/**
 * Per-endpoint rate limiting
 */
export function endpointRateLimit(maxRequests: number, windowMs: number = config.rateLimit.windowMs) {
  return rateLimit({
    windowMs,
    maxRequests,
  });
}

/**
 * Strict rate limiting for sensitive endpoints (e.g., authentication)
 */
export function strictRateLimit() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts
  });
}
