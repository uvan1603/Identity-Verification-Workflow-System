import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Middleware to attach a unique request ID to each request
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const headerValue = req.headers['x-request-id'];
  req.id = (typeof headerValue === 'string' ? headerValue : undefined) || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
}
