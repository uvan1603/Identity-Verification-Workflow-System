import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { AuthenticationError } from './errors.js';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Generate a JWT access token
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret as any, {
    expiresIn: config.jwt.expiry as any,
  } as any);
}

/**
 * Generate a JWT refresh token
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.refreshSecret as any, {
    expiresIn: config.jwt.refreshExpiry as any,
  } as any);
}

/**
 * Verify an access token
 */
export function verifyAccessToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    throw new AuthenticationError('Token verification failed');
  }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): DecodedToken {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Refresh token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid refresh token');
    }
    throw new AuthenticationError('Refresh token verification failed');
  }
}

/**
 * Decode a token without verification (for inspection)
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken | null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  return decoded.exp * 1000 < Date.now();
}
