/**
 * Authentication TypeScript Types
 * Type definitions for authentication per contracts/auth-api.yaml
 */

export type UserRole = 'admin' | 'organizer' | 'exhibitor' | 'attendee';

export interface UserProfile {
  userId: string;
  email: string;
  role: UserRole;
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
    consentDate: string; // ISO 8601
  };
  createdAt: string; // ISO 8601
  lastLogin?: string; // ISO 8601
}

export interface RegisterRequest {
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

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  email: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  token: string;
  expiresAt: string; // ISO 8601
}

export interface RegisterResponse {
  user: UserProfile;
  token: string;
  expiresAt: string; // ISO 8601
}

export interface UpdateProfileRequest {
  profile: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  };
}


