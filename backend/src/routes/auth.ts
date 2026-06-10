import { Router, Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { strictRateLimit } from '../middleware/rateLimit.js';
import Joi from 'joi';

const router: Router = Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post(
  '/register',
  strictRateLimit(),
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await authService.registerUser(value);
    res.status(201).json(result);
  })
);

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post(
  '/login',
  strictRateLimit(),
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await authService.loginUser(value);
    res.status(200).json(result);
  })
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { error, value } = refreshSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const result = await authService.refreshAccessToken(value.refreshToken);
    res.status(200).json(result);
  })
);

/**
 * POST /api/v1/auth/logout
 * Logout user (requires authentication)
 */
router.post(
  '/logout',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId || '';
    const token = req.headers.authorization?.substring(7) || '';

    await authService.logoutUser(userId, token);
    res.status(200).json({ message: 'Logged out successfully' });
  })
);

/**
 * GET /api/v1/auth/me
 * Get current user profile (requires authentication)
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId || '';
    const user = await authService.getUserById(userId);
    res.status(200).json(user);
  })
);

export default router;
