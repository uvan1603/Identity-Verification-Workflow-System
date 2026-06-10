import { getPrismaClient } from './database.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.js';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
} from '../utils/errors.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const prisma = getPrismaClient();

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Register a new user
 */
export async function registerUser(req: RegisterRequest): Promise<AuthResponse> {
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(req.email)) {
    throw new ValidationError('Invalid email format');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: req.email },
  });

  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // Validate password strength
  const passwordValidation = validatePasswordStrength(req.password);
  if (!passwordValidation.isValid) {
    throw new ValidationError(`Password requirements: ${passwordValidation.errors.join('; ')}`);
  }

  // Hash password
  const passwordHash = await hashPassword(req.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      id: uuidv4(),
      email: req.email,
      passwordHash,
      firstName: req.firstName,
      lastName: req.lastName,
      role: 'CUSTOMER',
    },
  });

  logger.info('User registered successfully', { userId: user.id, email: user.email });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Create session
  await prisma.session.create({
    data: {
      id: uuidv4(),
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  });

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    accessToken,
    refreshToken,
  };
}

/**
 * Login user
 */
export async function loginUser(req: LoginRequest): Promise<AuthResponse> {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: req.email },
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new AuthenticationError('User account is disabled');
  }

  // Compare password
  const isPasswordValid = await comparePassword(req.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  logger.info('User logged in successfully', { userId: user.id, email: user.email });

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Create session
  await prisma.session.create({
    data: {
      id: uuidv4(),
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    },
  });

  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    accessToken,
    refreshToken,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if session exists and is valid
    const session = await prisma.session.findUnique({
      where: { refreshToken },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token is invalid or expired');
    }

    // Verify user is still active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new AuthenticationError('User is not active');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    logger.info('Access token refreshed', { userId: user.id });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw new AuthenticationError('Token refresh failed');
  }
}

/**
 * Logout user
 */
export async function logoutUser(userId: string, token: string): Promise<void> {
  // Delete session
  await prisma.session.deleteMany({
    where: {
      userId,
      token,
    },
  });

  logger.info('User logged out', { userId });
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}
