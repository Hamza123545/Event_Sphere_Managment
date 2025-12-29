/**
 * Authentication API Service
 * API client functions for authentication endpoints
 * Per contracts/auth-api.yaml
 */

import api from './api';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  UserProfile,
  UpdateProfileRequest,
} from '../types/auth';

/**
 * Register a new user account
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await api.post<{ success: boolean; data: RegisterResponse }>('/auth/register', data);
  return response.data.data;
}

/**
 * Login user with email and password
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<{ success: boolean; data: LoginResponse }>('/auth/login', data);
  return response.data.data;
}

/**
 * Logout user (token blacklisting handled client-side)
 */
export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

/**
 * Get current user profile
 */
export async function getProfile(): Promise<UserProfile> {
  const response = await api.get<{ success: boolean; data: UserProfile }>('/auth/me');
  return response.data.data;
}

/**
 * Update user profile
 */
export async function updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
  const response = await api.put<{ success: boolean; data: UserProfile }>('/auth/me/profile', data);
  return response.data.data;
}

/**
 * Request password reset
 */
export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post<{ success: boolean; message: string }>('/auth/forgot-password', { email });
  return response.data;
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const response = await api.post<{ success: boolean; message: string }>('/auth/reset-password', { token, newPassword });
  return response.data;
}

/**
 * Verify email address
 */
export async function verifyEmail(token: string): Promise<void> {
  await api.post('/auth/verify-email', { token });
}


