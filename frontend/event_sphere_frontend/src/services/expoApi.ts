/**
 * Expo API Service
 * API client functions for expo event endpoints
 * Per contracts/expo-api.yaml
 */

import api from './api';
import type {
  CreateExpoRequest,
  UpdateExpoRequest,
  ExpoDetail,
  ExpoListResponse,
} from '../types/expo';

/**
 * List all expos for the authenticated organizer
 */
export async function listExpos(options?: {
  status?: 'draft' | 'upcoming' | 'active' | 'completed' | 'cancelled';
  page?: number;
  limit?: number;
}): Promise<ExpoListResponse> {
  const params = new URLSearchParams();
  if (options?.status) params.append('status', options.status);
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());

  const response = await api.get<{ success: boolean; data: ExpoListResponse }>(
    `/expos${params.toString() ? `?${params.toString()}` : ''}`
  );
  return response.data.data;
}

/**
 * Get expo details by ID
 */
export async function getExpo(expoId: string): Promise<ExpoDetail> {
  const response = await api.get<{ success: boolean; data: ExpoDetail }>(`/expos/${expoId}`);
  return response.data.data;
}

/**
 * Create a new expo event
 */
export async function createExpo(data: CreateExpoRequest): Promise<ExpoDetail> {
  const response = await api.post<{ success: boolean; data: ExpoDetail }>('/expos', data);
  return response.data.data;
}

/**
 * Update an existing expo event
 */
export async function updateExpo(expoId: string, data: UpdateExpoRequest): Promise<ExpoDetail> {
  const response = await api.put<{ success: boolean; data: ExpoDetail }>(`/expos/${expoId}`, data);
  return response.data.data;
}

/**
 * Delete an expo event
 */
export async function deleteExpo(expoId: string): Promise<void> {
  await api.delete(`/expos/${expoId}`);
}


