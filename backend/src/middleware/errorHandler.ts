import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

export interface ErrorResponse {
  error: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  requestId?: string;
}

/**
 * Global error handler middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  logger.error('Error caught by error handler:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON payload';
  }

  const response: ErrorResponse = {
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
    requestId: req.id,
  };

  res.status(statusCode).json(response);
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
  const response: ErrorResponse = {
    error: `Route not found: ${req.method} ${req.path}`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  res.status(404).json(response);
}

/**
 * Async error wrapper
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
