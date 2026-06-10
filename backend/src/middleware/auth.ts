import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    req.userId = decoded.userId;

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      logger.error('Authentication error:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  }
}

/**
 * Authorization middleware - checks if user has required role
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('User not authenticated');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError(
        `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
}

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
      req.userId = decoded.userId;
    }

    next();
  } catch (error) {
    logger.debug('Optional auth failed:', error);
    next();
  }
}
