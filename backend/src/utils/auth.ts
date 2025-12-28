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
    // Log the expiration setting for debugging
    logger.info('Generating JWT token', {
      userId: payload.userId,
      role: payload.role,
      expiresIn: JWT_EXPIRES_IN,
      expiresInType: typeof JWT_EXPIRES_IN,
    });

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'eventsphere-api',
      audience: 'eventsphere-client',
    } as jwt.SignOptions);

    // Decode the token to verify expiration was set correctly
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      const expirationDate = new Date(decoded.exp * 1000);
      const now = new Date();
      const timeUntilExpiry = expirationDate.getTime() - now.getTime();
      logger.info('Token generated successfully', {
        userId: payload.userId,
        expiresAt: expirationDate.toISOString(),
        expiresInMs: timeUntilExpiry,
        expiresInMinutes: Math.round(timeUntilExpiry / 60000),
      });
    }

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
    
    // First decode without verification to check expiration
    const unverified = jwt.decode(trimmedToken) as any;
    if (unverified) {
      const now = Math.floor(Date.now() / 1000);
      const exp = unverified.exp;
      if (exp) {
        const expirationDate = new Date(exp * 1000);
        const timeUntilExpiry = (exp - now) * 1000;
        logger.debug('Token expiration check', {
          tokenPreview: trimmedToken.substring(0, 20) + '...',
          expiresAt: expirationDate.toISOString(),
          expiresInMs: timeUntilExpiry,
          expiresInSeconds: exp - now,
          currentTime: new Date().toISOString(),
          isExpired: exp < now,
        });
      }
    }
    
    const decoded = jwt.verify(trimmedToken, JWT_SECRET, {
      issuer: 'eventsphere-api',
      audience: 'eventsphere-client',
    }) as TokenPayload;

    return decoded;
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

