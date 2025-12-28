import jwt from 'jsonwebtoken';
import { logger } from './logger';

/**
 * JWT utility functions for token generation and verification
 * Implements constitutional requirement for secure authentication
 * Per contracts/auth-api.yaml: JWT-based authentication with 7-day expiry
 */

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const JWT_SECRET: string = process.env.JWT_SECRET;
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  role: 'admin' | 'organizer' | 'exhibitor' | 'attendee';
  email: string;
}

/**
 * Generate JWT token for authenticated user
 * @param payload User information to encode in token
 * @returns JWT token string
 */
export function generateToken(payload: TokenPayload): string {
  try {
    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'eventsphere-api',
      audience: 'eventsphere-client',
    } as jwt.SignOptions);

    logger.debug('Token generated', { userId: payload.userId, role: payload.role });
    return token;
  } catch (error) {
    logger.error('Error generating token:', error);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Verify and decode JWT token
 * @param token JWT token string
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): TokenPayload {
  try {
    // Trim token to remove any whitespace
    const trimmedToken = token.trim();
    
    // Log token preview for debugging (first 20 chars only)
    logger.debug('Verifying token', { 
      tokenPreview: trimmedToken.substring(0, 20) + '...',
      tokenLength: trimmedToken.length 
    });
    
    const decoded = jwt.verify(trimmedToken, JWT_SECRET, {
      issuer: 'eventsphere-api',
      audience: 'eventsphere-client',
    });

    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token:', {
        error: error.message,
        errorName: error.name,
        tokenPreview: token.substring(0, 20) + '...',
      });
      throw new Error('Invalid authentication token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired JWT token', {
        tokenPreview: token.substring(0, 20) + '...',
      });
      throw new Error('Authentication token has expired');
    }
    logger.error('Error verifying token:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      tokenPreview: token.substring(0, 20) + '...',
    });
    throw new Error('Failed to verify authentication token');
  }
}

/**
 * Decode JWT token without verification (for debugging/logging only)
 * @param token JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

