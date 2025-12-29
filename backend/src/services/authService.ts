/**
 * Authentication Service
 * Implements user registration, login, logout, password management, and profile management
 * Per contracts/auth-api.yaml: FR-001, FR-002, FR-004, FR-007
 */

import { User } from '../models/User';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateToken, TokenPayload } from '../utils/auth';
import { CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import crypto from 'crypto';
import { sendPasswordResetEmail } from './emailService';

export interface RegisterInput {
  email: string;
  password: string;
  role: 'organizer' | 'exhibitor' | 'attendee';
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
  gdprConsent: {
    dataProcessingConsent: boolean;
    marketingConsent?: boolean;
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  token: string;
  expiresAt: Date;
}

export interface UserProfile {
  userId: string;
  email: string;
  role: string;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    avatar?: string;
  };
  isEmailVerified: boolean;
  gdprConsent: {
    marketingConsent: boolean;
    dataProcessingConsent: boolean;
    consentDate: Date;
  };
  createdAt: Date;
  lastLogin?: Date;
}

/**
 * Register a new user account
 * Implements FR-001, FR-002, FR-007
 */
export async function register(input: RegisterInput): Promise<{ user: UserProfile; token: string; expiresAt: Date }> {
  try {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(input.password);
    if (!passwordValidation.isValid) {
      throw new CustomError('Password validation failed', 400, 'VALIDATION_ERROR', {
        password: passwordValidation.errors,
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: input.email.toLowerCase() });
    if (existingUser) {
      throw new CustomError('Email already registered', 409, 'EMAIL_ALREADY_EXISTS');
    }

    // Validate GDPR consent
    if (!input.gdprConsent.dataProcessingConsent) {
      throw new CustomError('Data processing consent is required', 400, 'GDPR_CONSENT_REQUIRED');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user
    const user = new User({
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role,
      profile: {
        firstName: input.profile.firstName,
        lastName: input.profile.lastName,
        phone: input.profile.phone,
      },
      gdprConsent: {
        dataProcessingConsent: input.gdprConsent.dataProcessingConsent,
        marketingConsent: input.gdprConsent.marketingConsent || false,
        consentDate: new Date(),
      },
      isEmailVerified: false,
    });

    await user.save();

    logger.info('User registered successfully', { userId: user._id.toString(), email: user.email, role: user.role });

    // Generate JWT token
    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };
    const token = generateToken(tokenPayload);

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Return user profile (without password hash)
    const userProfile: UserProfile = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        phone: user.profile.phone,
        avatar: user.profile.avatar,
      },
      isEmailVerified: user.isEmailVerified,
      gdprConsent: {
        marketingConsent: user.gdprConsent.marketingConsent,
        dataProcessingConsent: user.gdprConsent.dataProcessingConsent,
        consentDate: user.gdprConsent.consentDate,
      },
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };

    // TODO: Send email verification email (implement in email service)

    return { user: userProfile, token, expiresAt };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in register service:', error);
    throw new CustomError('Registration failed', 500, 'REGISTRATION_ERROR');
  }
}

/**
 * Login user with email and password
 * Implements FR-002, FR-006
 */
export async function login(input: LoginInput): Promise<LoginResponse> {
  try {
    // Find user by email (include password hash for comparison)
    const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      // Security audit logging (T235)
      logger.warn('Login attempt failed: email not found', {
        action: 'login_failed',
        email: input.email.toLowerCase(),
        timestamp: new Date().toISOString(),
      });
      throw new CustomError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Compare password
    const isPasswordValid = await comparePassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      // Security audit logging (T235)
      logger.warn('Login attempt failed: invalid password', {
        action: 'login_failed',
        userId: user._id.toString(),
        email: user.email,
        timestamp: new Date().toISOString(),
      });
      throw new CustomError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Security audit logging (T235)
    logger.info('User logged in successfully', {
      action: 'login_success',
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      timestamp: new Date().toISOString(),
    });

    // Generate JWT token
    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };
    const token = generateToken(tokenPayload);

    // Calculate expiry (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        avatar: user.profile.avatar,
      },
      token,
      expiresAt,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in login service:', error);
    throw new CustomError('Login failed', 500, 'LOGIN_ERROR');
  }
}

/**
 * Logout user (token blacklisting handled by client/JWT expiry)
 * Implements FR-006 (audit logging)
 */
export async function logout(userId: string): Promise<void> {
  try {
    logger.info('User logged out', { userId });
    // JWT tokens are stateless, so logout is handled client-side by removing the token
    // In a production system, you might want to maintain a token blacklist in Redis
    // For now, we just log the logout event for audit purposes
  } catch (error) {
    logger.error('Error in logout service:', error);
    throw new CustomError('Logout failed', 500, 'LOGOUT_ERROR');
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(userId: string): Promise<UserProfile> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
    }

    return {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        phone: user.profile.phone,
        avatar: user.profile.avatar,
      },
      isEmailVerified: user.isEmailVerified,
      gdprConsent: {
        marketingConsent: user.gdprConsent.marketingConsent,
        dataProcessingConsent: user.gdprConsent.dataProcessingConsent,
        consentDate: user.gdprConsent.consentDate,
      },
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in getCurrentUser service:', error);
    throw new CustomError('Failed to get user profile', 500, 'GET_PROFILE_ERROR');
  }
}

/**
 * Update user profile
 */
export async function updateProfile(
  userId: string,
  updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  }
): Promise<UserProfile> {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('User not found', 404, 'USER_NOT_FOUND');
    }

    if (updates.firstName) user.profile.firstName = updates.firstName;
    if (updates.lastName) user.profile.lastName = updates.lastName;
    if (updates.phone !== undefined) user.profile.phone = updates.phone;
    if (updates.avatar !== undefined) user.profile.avatar = updates.avatar;

    await user.save();

    logger.info('User profile updated', { userId: user._id.toString() });

    return {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        phone: user.profile.phone,
        avatar: user.profile.avatar,
      },
      isEmailVerified: user.isEmailVerified,
      gdprConsent: {
        marketingConsent: user.gdprConsent.marketingConsent,
        dataProcessingConsent: user.gdprConsent.dataProcessingConsent,
        consentDate: user.gdprConsent.consentDate,
      },
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in updateProfile service:', error);
    throw new CustomError('Failed to update profile', 500, 'UPDATE_PROFILE_ERROR');
  }
}

/**
 * Request password reset (forgot password)
 * Implements FR-004 (password reset with time-limited token)
 */
export async function forgotPassword(email: string): Promise<void> {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists (security best practice)
      logger.info('Password reset requested for non-existent email', { email: email.toLowerCase() });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpiry;
    await user.save();

    // Security audit logging (T235)
    logger.info('Password reset token generated', {
      action: 'password_reset_requested',
      userId: user._id.toString(),
      email: user.email,
      timestamp: new Date().toISOString(),
    });

    // Send password reset email (non-blocking)
    // Don't await to prevent request timeout - email will be sent in background
    const userName = user.profile?.firstName
      ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim()
      : user.email;
    
    // Send email asynchronously without blocking the response
    sendPasswordResetEmail(user.email, userName, resetToken)
      .then(() => {
        logger.info('Password reset email sent', {
          userId: user._id.toString(),
          email: user.email,
        });
      })
      .catch((emailError) => {
        logger.error('Failed to send password reset email', {
          userId: user._id.toString(),
          email: user.email,
          error: emailError,
        });
        // Don't fail the password reset request if email fails
        // The token is still generated and can be used
      });
  } catch (error) {
    logger.error('Error in forgotPassword service:', error);
    // Don't reveal error details for security
    throw new CustomError('Failed to process password reset request', 500, 'PASSWORD_RESET_ERROR');
  }
}

/**
 * Reset password with token
 * Implements FR-004 (password reset with single-use token)
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  try {
    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      throw new CustomError('Password validation failed', 400, 'VALIDATION_ERROR', {
        password: passwordValidation.errors,
      });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() }, // Token not expired
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      throw new CustomError('Invalid or expired reset token', 400, 'INVALID_TOKEN');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset token
    user.passwordHash = passwordHash;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Security audit logging (T235)
    logger.info('Password reset completed successfully', {
      action: 'password_reset_completed',
      userId: user._id.toString(),
      email: user.email,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error('Error in resetPassword service:', error);
    throw new CustomError('Failed to reset password', 500, 'PASSWORD_RESET_ERROR');
  }
}

/**
 * Verify email address
 * TODO: Implement email verification flow
 */
export async function verifyEmail(_token: string): Promise<void> {
  // TODO: Implement email verification
  // This would validate the verification token and mark the email as verified
  throw new CustomError('Email verification not yet implemented', 501, 'NOT_IMPLEMENTED');
}


